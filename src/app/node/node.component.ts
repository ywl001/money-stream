import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  Input, OnInit,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { ResizedEvent } from 'angular-resize-event';
import copy from 'fast-copy';
import { take } from 'rxjs';
import swal from 'sweetalert';
import * as toastr from 'toastr';
import { AccountComponent } from '../account/account.component';
import { AddRecordComponent } from '../add-record/add-record.component';
import { AccountNode } from '../app-state/accountNode';
import {
  action_delNode,
  action_downloadNodeRaw, action_refreshNodes, action_selectNode,
  action_updateNodeSuccess
} from '../app-state/app.action';
import {
  selector_isCreateUser, selector_layoutType, selector_selectedLawcase,
  selector_selectedLawcaseId,
  selector_selectedNodeId,
  selector_user
} from '../app-state/app.selector';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { Person, TableName, TradeRecord } from '../app-state/types';
import { ChangeDurationComponent } from '../change-duration/change-duration.component';
import { DataGridComponent } from '../data-grid/data-grid.component';
import { FilterComponent } from '../filter/filter.component';
import { LowerNodeComponent } from '../lower-node/lower-node.component';
import { AccountDetailComponent } from '../node-detail/account-detail.component';
import { PersonComponent } from '../person/person.component';
import { ServerConfig } from '../server.config';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';
import { UploadAttachmentComponent } from '../upload-attachment/upload-attachment.component';
import anime from 'animejs/lib/anime.es.js';

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeComponent implements OnInit {

  @ViewChild('root', { static: false }) rootDiv!: ElementRef;

  //单击和双击的判断
  private isClick = false;

  constructor(
    public dialog: MatDialog,
    private store: Store,
    private sql: SqlService,
    private message: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  isCreateUser$ = this.store.select(selector_isCreateUser);

  //宽高
  w: number = 0;
  h: number = 0;

  private _x: number = 0;
  public get x(): number {
    return this._x;
  }
  public set x(value: number) {
    this._x = value;
    this.cdr.markForCheck();
  }
  private _y: number = 0;
  public get y(): number {
    return this._y;
  }
  public set y(value: number) {
    this._y = value;
    this.cdr.markForCheck();
  }

  isSelected: boolean;

  level: number = 0;
  //是否是第一个节点
  isFirstNode: boolean = false;

  children: Array<NodeComponent> = [];
  parent: NodeComponent;

  get isShowBtnDownload(): boolean {
    return this.data.children.length > 0;
  }

  private _data: AccountNode;

  personName: string;
  photoUrl: string;

  isLuodi_person: boolean;
  isDaji_person: boolean;
  isQuanzhanghu: boolean;

  moneyRecord: TradeRecord[];

  person: Person;

  btnFoldRotate: string;

  isLandspace: boolean;

  isShowBtnFold: boolean = false;

  // personRemark: string;

  private zhixiashi = ['北京市', '上海市', '天津市', '重庆市'];
  private _address: string;
  public get address(): string {
    if (this._address) {
      let addr = this._address.match(/.*省.*市/g);
      if (addr && addr.length > 0) return addr[0];

      addr = this._address.match(/.*省.*县/g);
      if (addr && addr.length > 0) return addr[0];

      addr = this._address.match(/.*自治区.*州/g);
      if (addr && addr.length > 0) return addr[0];

      addr = this._address.match(/.*自治区.*县/g);
      if (addr && addr.length > 0) return addr[0];

      addr = this._address.match(/.*自治区.*市/g);
      if (addr && addr.length > 0) return addr[0];

      for (let i = 0; i < this.zhixiashi.length; i++) {
        const zxs = this.zhixiashi[i];
        let re = new RegExp(`.*${zxs}.*区`);
        addr = this._address.match(re);
        if (addr && addr.length > 0) return addr[0];
      }
    }
  }
  public set address(value: string) {
    this._address = value;
  }

  set data(value: AccountNode) {
    // console.log(value)
    this._data = value;
    this.level = value.level;
    this.isFirstNode = value.isFirstNode;
    if (value.person) {
      this.setPerson(value.person)
    }
    if (this.isLandspace)
      this.btnFoldRotate = value.isShowChild ? '-90deg' : '0deg'
    else
      this.btnFoldRotate = value.isShowChild ? '0deg' : '-90deg'
  }

  get data(): AccountNode {
    return this._data;
  }

  get isFanxian() {
    return this.data.accountInfo?.returnMoney > 0;
  }

  get isQuxian() {
    return this.isOutCash(this.data.relationRecords);
  }

  get isHasRemark() {
    return this.data.accountInfo?.remark
  }

  get isHasRelationCase() {
    return this.isHasCase(this.data.relationRecords)
  }

  get totalMoney() {
    let t = 0;
    this.data.moneys.forEach((item) => {
      t += item;
    });
    return t;
  }

  get count() {
    if (this.data.moneys && this.data.moneys.length > 1)
      return this.data.moneys.length + '次';
    return '';
  }

  get tradeTime() {
    if (this.data.tradeTimes && this.data.tradeTimes.length > 0)
      return this.getMinTime(this.data.tradeTimes).format('Y-M-D HH:mm');
    return '';
  }



  //获取最近的时间
  private getMinTime(datetimes) {
    let a = datetimes[0];
    for (let i = 0; i < datetimes.length; i++) {
      const time = datetimes[i];
      if (time.isSameOrBefore(a)) a = time;
    }
    return a;
  }

  get bgColor() {
    if (this.data.accountInfo?.workTips > 0) return '#FFE081';
    // if (this.data.isLowerNode) return 'lightGray';
    // if (this.data.accountInfo?.returnMoney > 0) return 'url(assets/money.jpg)'
    // if (this.data.accountInfo?.isFreeze == 1) return 'url(assets/freeze.jpg)';
    // if (this.isOutCash(this.data.accountInfo)) return 'orange';
    // if (this.data.accountInfo?.remark) return 'lightPink';
    return '#d5f3f4';
  }

  get quxianTooltip() {
    let cash = 0;
    this.data.relationRecords.forEach(r => {
      if (r.markMoney == 1) {
        cash += parseInt(r.money + '')
      }
    })
    return `取现${(Math.abs(cash / 10000)).toFixed(2)}万元`
  }

  get remarkTooltip() {
    // return JSON.stringify(this.data.accountInfo.remark)
    return this.data.accountInfo.remark
  }

  get relationCaseTooltip() {
    let str = '';
    let caseNameMap = new Map()
    this.data.relationRecords.forEach(r => {
      if (parseInt(r.relationCaseID) > 0) {
        caseNameMap.set(r.caseName, r.caseName)
      }
    })

    caseNameMap.forEach((v) => {
      str += v + '\n'
    })
    return str;
  }

  private isOutCash(records: TradeRecord[]): boolean {
    for (let i = 0; i < records?.length; i++) {
      const r = records[i];
      if (r.markMoney == 1) {
        return true;
      }
    }
    return false;
  }

  private isHasCase(records: any): boolean {
    for (let i = 0; i < records?.length; i++) {
      const r = records[i];
      if (parseInt(r.relationCaseID) > 0) {
        return true;
      }
    }
    return false;
  }

  /**第二行显示的内容 */
  get secondLineContent() {
    let str = '';
    if (this.data.tradeDesc && this.data.tradeDesc.indexOf('ATM') != -1)
      str = this.data.tradeDesc + '---' + this.data.tradeBankStationName;
    else if (this.data.tradeType && this.data.tradeType.indexOf('ATM') != -1)
      str = this.data.tradeType + '---' + this.data.tradeBankStationName;
    else if (this.data.isLowerNode === '1')
      str = this.data.oppositeAccount;
    else if (this.data.oppositeName)
      str = this.data.oppositeName + '-->' + this.data.oppositeAccount;
    else if (this.data.oppositeBankNumber) str = this.data.oppositeBankNumber;
    else if (this.data.oppositeAccount) str = this.data.oppositeAccount;
    else if (this.data.payeeName) str = this.data.payeeName;
    else if (this.data.tradeType) str = this.data.tradeType;
    else if (this.data.tradeBankStationName)
      str = this.data.tradeBankStationName;
    return str;
  }

  get isHasAccount() {
    return this.data.oppositeAccount || this.data.oppositeBankNumber;
  }

  private caseID: string;
  private userID: string;
  ngOnInit() {
    this.store.select(selector_selectedNodeId).subscribe((id) => {
      this.isSelected = this.data.id === id ? true : false;
      // console.log(this.isSelected);
      this.cdr.markForCheck();
    });

    this.store.select(selector_selectedLawcaseId).subscribe(id => {
      this.caseID = id;
    })

    this.store.select(selector_user).subscribe(user => {
      this.userID = user?.id;
    })

    this.store.select(selector_layoutType).subscribe(res => {
      this.isLandspace = res;
      this.isShowBtnFold = !this.data.isShowChild
      if (this.isLandspace)
        this.btnFoldRotate = this.data.isShowChild ? '-90deg' : '0deg'
      else
        this.btnFoldRotate = this.data.isShowChild ? '0deg' : '-90deg'
    })
  }

  get btnFoldClass() {
    if (!this.isLandspace) {
      return 'btn-fold-v'
    }
    return 'btn-fold-h'
  }

  private setPerson(p: Person) {
    this.personName = p.name;
    if (p.photoUrl) {
      this.photoUrl = ServerConfig.photoPath + p.photoUrl;
    }
    this.address = p.address;
    this.isLuodi_person = p.isLuodi == 1;
    this.isDaji_person = p.isDaji == 1;
    this.isQuanzhanghu = p.workTips == 1;
    this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    this.h = this.rootDiv.nativeElement.clientHeight;
    this.w = this.rootDiv.nativeElement.clientWidth;

    // tippy(this.rootDiv.nativeElement,{
    //   content:'aaaaaaaaa',
    //   arrow:true,
    //   showOnCreate:true,
    //   placement:'right-start',
    //   trigger:'manual',
    //   offset:[-20,0]
    // })
  }

  onResized(event: ResizedEvent) {
    // console.log('resize',event.newRect);
    this.h = this.rootDiv.nativeElement.clientHeight;
    this.w = this.rootDiv.nativeElement.clientWidth;
    this.message.reLayoutChart();
  }

  ngOnDestroy() { }

  onRootClick() {
    this.store.dispatch(action_selectNode({ id: this.data.id }));
  }

  onClick() {
    this.isClick = true;

    setTimeout(() => {
      if (this.isClick) {
        console.log('click', this.data);
        let dialogRef = this.dialog.open(AccountDetailComponent);
        dialogRef.componentInstance.data = this.data;
      }
    }, 500);
  }

  dblClick() {
    this.isClick = false;
    let acc =
      this.data.oppositeBankNumber && this.data.oppositeBankNumber != ''
        ? this.data.oppositeBankNumber
        : this.data.oppositeAccount;
    console.log(acc);
    if (acc && acc != '') {
      let dialogRef = this.dialog.open(DataGridComponent, {
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px',
      });
      dialogRef.componentInstance.account = acc;
    } else {
      toastr.clear();
      toastr.info('没有数据');
    }
  }

  btnWorkTips
  onMouseEnter() {
    console.log('mouse over')
    this.btnWorkTips = true;
    this.isShowBtnFold = true;
  }

  onMouseLeave() {
    console.log('mouse out')
    this.btnWorkTips = false;
    this.isShowBtnFold = !this.data.isShowChild;
  }

  // showRemark() {
  //   // console.log('show remark')
  //   // let dialogRef = this.dialog.open(RemarkComponent);
  //   // dialogRef.componentInstance.data = this.data;


  // }

  onDeleteNode() {
    swal('确定要删除该节点吗？', {
      buttons: ['取消', '确定'],
    }).then((val) => {
      if (val) {
        let data = {
          tableName: TableName.TRADE_RECORD,
          ids: this.data.ids.join(','),
          id: this.data.id,
        };
        this.store.dispatch(action_delNode({ data }));
      }
    });
  }



  // get relationCaseTooltip(){
  //   let str = ''
  //   this.data.relationRecords.forEach(r => {
  //     if (parseInt(r.relationCaseID) >0) {

  //     }
  //   })
  // }

  // onSetNodeRemark() {
  //   let dialogRef = this.dialog.open(AddRemarkComponent, {
  //     disableClose: true,
  //   });
  //   dialogRef.componentInstance.data = this.data;
  // }

  onSetAccountInfo() {
    let dialogRef = this.dialog.open(AccountComponent, {
      disableClose: true,
    });

    if (this.data.accountInfo) {
      dialogRef.componentInstance.data = copy(this.data.accountInfo);
    } else {
      dialogRef.componentInstance.data = this.data.oppositeBankName ? { account: this.data.oppositeBankName } : { account: this.data.oppositeAccount };
    }
    // if(!this.data.accountInfo)
    //   dialogRef.componentInstance.account = this.data.oppositeBankName ? this.data.oppositeBankName : this.data.oppositeAccount;
    // dialogRef.componentInstance.isInChart = true;
  }

  /**第三方账号 修改 */
  onEditNodeAccount() {
    let dialogRef = this.dialog.open(LowerNodeComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.data = this.data;
  }

  onChangNodeDuration() {
    let dialogRef = this.dialog.open(ChangeDurationComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.data = this.data;
  }

  onDownloadNode() {
    let acc =
      this.data.oppositeBankNumber && this.data.oppositeBankNumber != ''
        ? this.data.oppositeBankNumber
        : this.data.oppositeAccount;

    this.store.dispatch(action_downloadNodeRaw({ account: acc }));

  }

  onUploadAttachment() {
    let dialogRef = this.dialog.open(UploadAttachmentComponent, {
      disableClose: true,
    });
  }

  onMarkTips() {
    if (this.data.accountInfo) {
      const workTips = this.data.accountInfo.workTips;
      const tableData = {
        workTips: workTips == 1 ? 0 : 1
      }
      const data = {
        tableName: TableName.ACCOUNT_INFO,
        tableData: tableData,
        id: this.data.accountInfo.id
      }
      this.sql.exec(PhpFunctionName.UPDATE, data).subscribe(res => {
        if (res) {
          const acc = Object.assign({}, this.data.accountInfo, tableData);
          this.store.dispatch(action_updateNodeSuccess({ data: { id: this.data.id, changes: { accountInfo: acc } } }))
        } else {
          toastr.error('更新失败')
        }
      })
    } else {
      let acc = this.data.oppositeBankNumber
        ? this.data.oppositeBankNumber
        : this.data.oppositeAccount;
      const tableData = {
        workTips: 1,
        account: acc,
        caseID: this.caseID,
        userID: this.userID
      }
      const data = {
        tableName: TableName.ACCOUNT_INFO,
        tableData: tableData
      }
      console.log('insert worktips data', data)
      this.sql.exec(PhpFunctionName.INSERT, data).subscribe(res => {
        if (res && res.length > 0) {
          this.store.dispatch(action_updateNodeSuccess({ data: { id: this.data.id, changes: { accountInfo: res[0] } } }))
        } else {
          toastr.error('更新失败')
        }
      })
    }

    // let acc = this.data.oppositeBankNumber
    //   ? this.data.oppositeBankNumber
    //   : this.data.oppositeAccount;
    // if (acc && acc != '') {
    //   let isFreeze = this.data.isFreeze ? 0 : 1;
    //   const tableData = {
    //     account: acc,
    //     isFreeze: isFreeze,
    //     caseID: this.data.caseID,
    //   };
    //   const data = {
    //     //后端数据
    //     tableName: TableName.ACCOUNT_INFO,
    //     tableData: tableData,
    //     //前端数据
    //     id: this.data.id,
    //     isFreeze: !this.data.isFreeze,
    //   };

    //   this.store.dispatch(action_updateNodeFreezeState({ data }));
    // } else {
    //   toastr.warning('账号不存在');
    // }
  }

  onMarkTips2(p: Person) {
    const tableData = {
      workTips: p.workTips == 1 ? 0 : 1
    }
    const data = {
      tableName: TableName.PERSON,
      tableData: tableData,
      id: p.id
    }

    this.sql.exec(PhpFunctionName.UPDATE, data).subscribe(res => {
      if (res) {
        this.store.dispatch(action_refreshNodes())
      } else {
        toastr.error('更新失败')
      }
    })
  }

  /**设置节点的人员关联 */
  onSetPerson() {
    let disableClose = this.data.personID ? false : true;
    let dialogRef = this.dialog.open(PersonComponent, {
      disableClose: disableClose,
    });
    dialogRef.componentInstance.node = this.data
  }

  onImgError() {
    // console.log('img error')
    this.photoUrl = 'assets/no_photo.png';
  }

  onFilterNode() {
    let dialogRef = this.dialog.open(FilterComponent, { disableClose: true });
    dialogRef.componentInstance.data = this.data;
  }

  onAddrecord() {
    this.store.select(selector_selectedLawcase).pipe(take(1)).subscribe(res => {
      let dialogRef = this.dialog.open(AddRecordComponent, { disableClose: true });
      dialogRef.componentInstance.account = this.data.oppositeAccount;
      dialogRef.componentInstance.caseId = res.id;
    })
  }

  // private isFold: boolean;

  onClickBtnFold() {
    // this.btnFoldRotate = this.data.isShowChild ? 0 : -90;
    // anime({
    //   targets: '.btn-fold',
    //   rotate: this.btnFoldRotate,
    //   duration: 500,
    // });

    const data = {
      tableName: TableName.TRADE_RECORD,
      tableData: {
        isShowChild: this.data.isShowChild ? 0 : 1
      },
      id: this.data.id
    }

    this.sql.exec(PhpFunctionName.UPDATE, data).subscribe(res => {
      if (res) {
        this.store.dispatch(action_updateNodeSuccess({
          data: {
            id: this.data.id,
            changes: {
              isShowChild: !this.data.isShowChild
            }
          }
        }))
      }
    })
  }
}
