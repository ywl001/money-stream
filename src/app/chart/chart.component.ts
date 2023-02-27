import {
  Component,
  OnInit,
  ComponentFactoryResolver,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MessageService } from '../service/message.service';
import { NodeComponent } from '../node/node.component';
import { AccountNode } from '../app-state/accountNode';
import copy from 'fast-copy';

import domtoimage from 'dom-to-image';
import * as download from 'downloadjs';
import { Store } from '@ngrx/store';
import {
  selector_layoutType,
  selector_nodes,
  selector_selectedLawcase,
  selector_selectedStartAccountId,
} from '../app-state/app.selector';
import { filter, Subscription } from 'rxjs';
import { Lawcase } from '../app-state/types';
import { LocalStorgeService } from '../service/local-storge.service';
import { CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit {
  //垂直布局时，node之间的间距
  private gap_w_v: number = 30;
  private gap_h_v: number = 50;

  //水平布局时的间距
  private gap_w_h: number = 50;
  private gap_h_h: number = 30;

  //流向图和页面顶端的距离，避免和按钮重合
  private margin_top = 60;
  //是否布局
  private isLayout: boolean;
  //是否绘制连接线
  // private isDraw: boolean;

  private accountMap: Map<number, Array<NodeComponent>>;
  private nodeViews: Array<NodeComponent>;

  // private lawcaseName: string;
  private isLandscape: boolean = false;

  // private imgCount: number;


  position;

  private isSetPosition: boolean;

  private prevNodeLength: number = 0;

  @ViewChild('chartDiv', { static: false, read: ViewContainerRef })
  chartDiv: ViewContainerRef;
  @ViewChild('bgCanvas', { static: false }) bgCanvas: ElementRef;

  constructor(
    private messageService: MessageService,
    private store: Store,
    private resolver: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef,
    private local: LocalStorgeService
  ) { }

  ngOnInit() {
    console.log('chart init');
    // this.chartDiv.element.nativeElement

    this.messageService.saveNodeImage$.subscribe((res) => {
      this.saveImage();
    });

    // this.messageService.clickCase$.subscribe((lawCase) => {
    //   this.lawcaseName = lawCase.caseName;
    // });

    this.store
      .select(selector_layoutType)
      .pipe(filter((v) => v != undefined))
      .subscribe((isLandscape) => {
        if (this.nodeViews) {
          this.isLandscape = isLandscape;
          this.isLayout = true;
        }
      });

    this.messageService.reLayoutChart$.subscribe((res) => {
      this.isLayout = true;
    });

    this.store.select(selector_nodes).subscribe((nodes) => {
      if (!nodes || nodes.length == 0) return;

      console.log('relayout chart',nodes)

      this.showNodes(copy(nodes));
    });
  }

  ngAfterViewInit() {
    this.store.select(selector_selectedStartAccountId).subscribe((id) => {
      if (!id) this.clear();
    });
  }

  private showNodes(nodes) {
    console.log('show nodes')
    if (this.prevNodeLength == 0) {
      this.prevNodeLength = nodes.length;
    }

    this.isSetPosition = nodes.length != this.prevNodeLength;

    this.isLayout = true;
    // this.imgCount = this.getImgCount(nodes);
    // console.log('image count', this.imgCount);
    this.clear();
    this.processData(nodes);
    this.cdr.markForCheck();

    this.prevNodeLength = nodes.length;
  }

  private layoutNodes() {
    console.log('layout nodes')
    let layoutTimes = 10;
    if (this.isLandscape) {
      this.firstLayoutH();
      for (let i = 0; i < layoutTimes; i++) {
        this.layoutH(this.nodeViews);
      }
      this.drawLineH();
    } else {
      this.firstLayout();
      for (let i = 0; i < layoutTimes; i++) {
        this.layout(this.nodeViews);
      }
      this.drawLine();
    }
  }

  //通过node生成account，并加入数组和map
  private processData(nodes: AccountNode[]) {
    this.nodeViews = [];
    this.accountMap = new Map();
    nodes = this.filterData(nodes);
    console.log('chart after filter nodes is', nodes)
    const sortNodes = this.sortNodes(nodes);
    sortNodes.forEach((node) => {
      const nodeView = this.createAccountView(node);
      this.nodeViews.push(nodeView);
      this.nodeViews.forEach((view) => {
        if (view.data.children.findIndex((c) => c.id == node.id) > -1) {
          view.children.push(nodeView);
          nodeView.parent = view;
        }
      });
      let l = nodeView.level;
      this.accountMap.has(l)
        ? this.accountMap.get(l).push(nodeView)
        : this.accountMap.set(l, [nodeView]);
    });
  }

  //根据数据创建AccountComponent
  private createAccountView(node: AccountNode) {
    const factory = this.resolver.resolveComponentFactory(NodeComponent);
    const componentRef = this.chartDiv.createComponent(factory);
    // const componentRef = this.chartDiv.createComponent(NodeComponent)
    let account = <NodeComponent>componentRef.instance;
    account.data = node;
    return account;
  }

  private filterData(nodes: Array<AccountNode>) {
    // nodes.forEach(node => {
    //   if (!node.isShowChild) {
    //     this.clearChildNodeByNode(node, nodes)
    //   }
    // })

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.isFirstNode && !node.isShowChild) {
        this.clearChildNodeByNode(node, nodes)
      }
    }
    return nodes;
  }

  /**清除该节点及子节点
 * node:父节点
 * nodes:所有节点
 * isDelSelf:是否清除父节点
 */
  private clearChildNodeByNode(
    node: AccountNode,
    nodes: AccountNode[],
    isDelSelf: boolean = false
  ) {
    if (node) {
      let children = this.getNodeAllChild(node);
      if (isDelSelf) children.push(node);
      children.forEach((c) => {
        const i = nodes.findIndex((node) => node.id == c.id);
        if (i >= 0) {
          //记得要删除recordMap中的id，否则在重新设置查询时间时会造成id存在，不继续查询,
          //对账户合并要删除ids中的所以id
          nodes.splice(i, 1);
        }
      });
    }
  }

  //获取节点下所有子节点，不包括节点本身
  private getNodeAllChild(
    node: AccountNode,
    children: Array<AccountNode> = []
  ) {
    const childs = node.children;
    childs.forEach((node) => {
      this.getNodeAllChild(node, children);
      children.push(node);
    });
    return children;
  }


  //对传递过来的节点排序
  private sortNodes(nodes: Array<AccountNode>) {
    let newNodes = [];
    newNodes.push(nodes.find((node) => node.level === 0));
    for (let i = 0; i < newNodes.length; i++) {
      let parent = newNodes[i];
      for (let j = 0; j < nodes.length; j++) {
        const child = nodes[j];
        if (parent.children.findIndex((c) => c.id == child.id) > -1) {
          newNodes.push(child);
        }
      }
    }

    return newNodes;
  }

  // private getImgCount(nodes: Array<AccountNode>) {
  //   let count = 0;
  //   nodes.forEach((node) => {
  //     if (node.personID) {
  //       count++;
  //       // console.log(node.account + ':' + node.personID);
  //     }
  //   });
  //   return count;
  // }

  private clear() {
    console.log('clear');
    //拖动回复到初始位置
    if (this.isSetPosition)
      this.position = { x: 0, y: 0 };

    this.chartDiv.clear();
    const context = this.bgCanvas.nativeElement.getContext('2d');
    this.bgCanvas.nativeElement.width = this.bgCanvas.nativeElement.height = 0;
  }

  ngAfterViewChecked() {
    // console.log('chart view checked',this.isLayout);
    if (this.isLayout) {
      // console.log('nodes layout');
      this.isLayout = false;
      this.layoutNodes();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    console.log('chart destory')
  }

  dragEnd(e) {
    console.log('aaaaaa')
    console.log(e.source)
  }

  //第一次排列
  private firstLayout() {
    this.accountMap.forEach((accounts, level) => {
      let preWidth = 0;
      let y = this.getYByLevel(level) + this.margin_top;
      accounts.forEach((account) => {
        let x = preWidth;
        account.x = x;
        account.y = y;
        preWidth += account.w + this.gap_w_v;
      });
    });
  }

  //第一次排列
  private firstLayoutH() {
    this.accountMap.forEach((arr, level) => {
      let preHeight = this.margin_top;
      let x = this.getXByLevel(level);
      arr.forEach((account) => {
        let y = preHeight;
        account.x = x;
        account.y = y;
        preHeight += account.h + this.gap_h_h;
      });
    });
  }

  //排列
  //第一次先按级别排列，然后如果父元素中心小于到子元素的中心，移动父元素，反之移动子元素
  private layout(nodeViews: NodeComponent[]) {
    for (let i = 0; i < nodeViews.length; i++) {
      const nodeView = nodeViews[i];
      if (nodeView.children && nodeView.children.length > 0) {
        let childCenterX = this.getChildrenCenterX(nodeView);
        let parentCenterX = nodeView.x + nodeView.w / 2;
        let dx = childCenterX - parentCenterX;
        // console.log(dx)
        if (dx > 0) {
          this.moveX(nodeView, dx);
        } else {
          this.moveX(nodeView.children[0], -dx);
        }
      }
    }
    // console.log('----------------------')
  }

  private layoutH(items) {
    for (let i = 0; i < items.length; i++) {
      const parent = items[i];
      if (parent.children && parent.children.length > 0) {
        let childCenterY = this.getChildrenCenterY(parent);
        let parentCenterY = parent.y + parent.h / 2;
        let dy = childCenterY - parentCenterY;
        if (dy > 0) {
          this.moveY(parent, dy);
        } else {
          this.moveY(parent.children[0], -dy);
        }
      }
    }
  }

  // 移动元素x，dx移动的距离,基本原则是向右侧移动，右侧的元素也要移动
  private moveX(acc: NodeComponent, dx: number) {
    //同级别的所有account
    let accounts_level = this.accountMap.get(acc.level);
    acc.x = acc.x + dx;
    //item后面的元素跟随移动
    let acc_index = accounts_level.indexOf(acc);
    let prevItem = acc;
    for (let i = acc_index + 1; i < accounts_level.length; i++) {
      const element = accounts_level[i];
      element.x =
        element.x > prevItem.x + prevItem.w + this.gap_w_v
          ? element.x
          : prevItem.x + prevItem.w + this.gap_w_v;
      prevItem = element;
      // console.log('跟随移动了' + dx)
    }
  }

  private moveY(item: NodeComponent, dy: number) {
    let items_level = this.accountMap.get(item.level);
    // item设置位置
    // item.position = { x: item.x + dx, y: item.y };
    item.y = item.y + dy;
    //item后面的元素跟随移动
    let index = items_level.indexOf(item);
    let prevItem = item;
    for (let i = index + 1; i < items_level.length; i++) {
      const item_after = items_level[i];
      item_after.y =
        item_after.y > prevItem.y + prevItem.h + this.gap_h_h
          ? item_after.y
          : prevItem.y + prevItem.h + this.gap_h_h;
      prevItem = item_after;
      // console.log('跟随移动了' + dy)
    }
  }

  //获取级别的y
  private getYByLevel(level) {
    let y = 0;
    for (let i = 0; i < level; i++) {
      y += this.levelMaxHeightMap.get(i) + this.gap_h_v;
    }
    return y;
  }

  private getXByLevel(level) {
    let x = 0;
    for (let i = 0; i < level; i++) {
      x += this.levelMaxWidthMap.get(i) + this.gap_w_h;
    }
    return x;
  }

  //获取下级对象的中点位置
  private getChildrenCenterX(parent) {
    let children: Array<NodeComponent> = parent.children;
    // children.sort((a, b) => a.x - b.x);
    let lastChild = children[children.length - 1];
    let firstChild = children[0];

    return firstChild.x + (lastChild.x + lastChild.w - firstChild.x) / 2;
  }

  private getChildrenCenterY(parent) {
    let children: Array<NodeComponent> = parent.children;
    // children.sort((a, b) => a.x - b.x);
    let lastChild = children[children.length - 1];
    let firstChild = children[0];

    return firstChild.y + (lastChild.y + lastChild.h - firstChild.y) / 2;
  }

  //获取同级别中的最大高度
  private get levelMaxHeightMap() {
    let map = new Map();
    this.accountMap.forEach((arr, level) => {
      map.set(level, 0);
      arr.forEach((item) => {
        if (item.h > map.get(level)) map.set(level, item.h);
      });
    });
    return map;
  }

  private get levelMaxWidthMap() {
    let map = new Map();
    this.accountMap.forEach((arr, level) => {
      map.set(level, 0);
      arr.forEach((item) => {
        if (item.w > map.get(level)) map.set(level, item.w);
      });
    });
    return map;
  }

  private drawLine() {
    let canvasSize = this.getCanvasSize();
    // console.log(canvasSize)
    this.bgCanvas.nativeElement.width = canvasSize.w;
    this.bgCanvas.nativeElement.height = canvasSize.h;

    let cxt = this.bgCanvas.nativeElement.getContext('2d');

    for (let i = 0; i < this.nodeViews.length; i++) {
      let parent = this.nodeViews[i];
      for (let j = 0; j < this.nodeViews.length; j++) {
        let child = this.nodeViews[j];
        if (parent.children.includes(child)) {
          cxt.beginPath();
          cxt.moveTo(parent.x + parent.w / 2, parent.y + parent.h); //移动到父元素下边缘中点
          let maxHeight_level = this.levelMaxHeightMap.get(parent.level);
          cxt.lineTo(
            parent.x + parent.w / 2,
            parent.y + maxHeight_level + this.gap_h_v / 2
          ); //画父元素中点向下gap/2
          cxt.lineTo(
            child.x + child.w / 2,
            parent.y + maxHeight_level + this.gap_h_v / 2
          );
          cxt.lineTo(child.x + child.w / 2, child.y);
          cxt.lineTo(child.x + child.w / 2 + 5, child.y - 5);
          cxt.moveTo(child.x + child.w / 2, child.y);
          cxt.lineTo(child.x + child.w / 2 - 5, child.y - 5);
          cxt.stroke();
        }
      }
    }
  }

  private drawLineH() {
    let canvasSize = this.getCanvasSizeH();
    // console.log(canvasSize)
    this.bgCanvas.nativeElement.width = canvasSize.w;
    this.bgCanvas.nativeElement.height = canvasSize.h;

    let cxt = this.bgCanvas.nativeElement.getContext('2d');

    for (let i = 0; i < this.nodeViews.length; i++) {
      let parent = this.nodeViews[i];
      for (let j = 0; j < this.nodeViews.length; j++) {
        let child = this.nodeViews[j];
        if (parent.children.includes(child)) {
          cxt.beginPath();
          cxt.moveTo(parent.x + parent.w, parent.y + parent.h / 2); //移动到父元素下边缘中点
          cxt.lineTo(
            parent.x + parent.w + this.gap_w_h / 2,
            parent.y + parent.h / 2
          ); //画父元素中点向下gap/2
          let maxWidth_level = this.levelMaxWidthMap.get(parent.level);
          cxt.lineTo(
            parent.x + maxWidth_level + this.gap_w_h / 2,
            parent.y + parent.h / 2
          ); //画父元素中点向下gap/2

          cxt.lineTo(
            parent.x + maxWidth_level + this.gap_w_h / 2,
            child.y + child.h / 2
          );
          cxt.lineTo(child.x, child.y + child.h / 2);
          cxt.lineTo(child.x - 5, child.y + child.h / 2 - 5);
          cxt.moveTo(child.x, child.y + child.h / 2);
          cxt.lineTo(child.x - 5, child.y + child.h / 2 + 5);
          cxt.stroke();
        }
      }
    }
  }

  /**获取最大宽和高 */
  private getCanvasSize() {
    let total_w = 0;
    let total_h = 0;
    for (let i = 0; i < this.nodeViews.length; i++) {
      const item = this.nodeViews[i];
      if (item.x + item.w > total_w) total_w = item.x + item.w;
    }
    let maxLevel = this.accountMap.size - 1;
    total_h = this.getYByLevel(maxLevel) + this.levelMaxHeightMap.get(maxLevel);
    return { w: total_w, h: total_h };
  }

  private getCanvasSizeH() {
    let total_w = 0;
    let total_h = 0;
    for (let i = 0; i < this.nodeViews.length; i++) {
      const item = this.nodeViews[i];
      if (item.y + item.h > total_h) total_h = item.y + item.h;
    }
    let maxLevel = this.accountMap.size - 1;
    total_w = this.getXByLevel(maxLevel) + this.levelMaxWidthMap.get(maxLevel);
    return { w: total_w, h: total_h };
  }

  private saveImage() {
    let lawcase: Lawcase;
    this.store.select(selector_selectedLawcase).subscribe((lc) => {
      lawcase = lc;
    });
    if (!lawcase) return;
    domtoimage
      .toPng(document.getElementById('root'), { bgcolor: 'white' })
      .then((dataUrl) => {
        download(dataUrl, `${lawcase.caseName}.jpg`);
      });
  }
}
