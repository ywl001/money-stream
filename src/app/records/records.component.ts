import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, ElementRef, ViewChild
} from '@angular/core';
import copy from 'fast-copy';
import { AccountNode } from '../app-state/accountNode';
import { LawCaseComponent } from '../law_case/law-case.component';
import { InsertExcelDataService } from '../service/insert-excel-data.service';
import { LocalStorgeService } from '../service/local-storge.service';
import { StartNodeComponent } from '../start-node/start-node.component';

import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { FileUploader } from 'ng2-file-upload';
import * as pinyin from 'pinyin';
import { STYLE_FIRST_LETTER, STYLE_NORMAL } from 'pinyin';
import { filter, map, startWith } from 'rxjs';
import swal from 'sweetalert';
import {
  action_delStartNode,
  action_getAllCase, action_getNodes,
  action_getNodesSuccess,
  action_getStartNode,
  action_getStartNodeSuccess,
  action_getUserCase, action_selectLawcase,
  action_selectStartAccount
} from '../app-state/app.action';
import {
  selector_lawcases,
  selector_selectedStartAccount,
  selector_startAccounts,
  selector_user
} from '../app-state/app.selector';
import {
  Lawcase,
  LOCALSTORAGE_ALL_CASE,
  LOCALSTORAGE_NODE_KEY_PRE,
  LOCALSTORAGE_START_NODE_KEY_PRE,
  StartNode,
  TableName,
  User
} from '../app-state/types';
import { ServerConfig } from '../server.config';
import { MessageService } from '../service/message.service';

import { ReportService } from '../service/report.service';
import { ReportCreate } from '../service/reportCreate';

/**svg 保存按钮 */
const saveIcon = `<svg t="1641522936113" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4144" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><defs><style type="text/css"></style></defs><path d="M700.864 240v168.144a25.6 25.6 0 0 1-25.6 25.6h-320.96a25.6 25.6 0 0 1-25.6-25.6V240H256v549.568h517.568V240h-72.704z m-48 0h-276.16v145.744h276.16V240zM224 192h581.568a16 16 0 0 1 16 16v613.568a16 16 0 0 1-16 16H224a16 16 0 0 1-16-16V208a16 16 0 0 1 16-16z m346.432 89.04h16a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16z" p-id="4145" fill="#0"></path></svg>`;
const userIcon = `<svg t="1644367823298" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2037" width="200" height="200"><path d="M858.5 763.6c-18.9-44.8-46.1-85-80.6-119.5s-74.7-61.6-119.5-80.6c-0.4-0.2-0.8-0.3-1.2-0.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362C264 444.7 304.5 518 366.8 563.1c-0.4 0.2-0.8 0.3-1.2 0.5-44.8 18.9-85 46-119.5 80.6-34.5 34.5-61.6 74.7-80.6 119.5-18.6 43.8-28.5 90.3-29.5 138.1-0.1 4.5 3.5 8.2 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3C356.5 641.2 431.8 610 512 610s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c0.1 4.4 3.6 7.8 8 7.8h60c4.5 0 8.1-3.7 8-8.2-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362s17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362s-17.9 89.1-50.4 121.6S557.9 534 512 534z" p-id="2038" fill="#8a8a8a"></path></svg>`;
const userIcon2 = `<svg t="1644367823298" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2037" width="200" height="200"><path d="M858.5 763.6c-18.9-44.8-46.1-85-80.6-119.5s-74.7-61.6-119.5-80.6c-0.4-0.2-0.8-0.3-1.2-0.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362C264 444.7 304.5 518 366.8 563.1c-0.4 0.2-0.8 0.3-1.2 0.5-44.8 18.9-85 46-119.5 80.6-34.5 34.5-61.6 74.7-80.6 119.5-18.6 43.8-28.5 90.3-29.5 138.1-0.1 4.5 3.5 8.2 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3C356.5 641.2 431.8 610 512 610s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c0.1 4.4 3.6 7.8 8 7.8h60c4.5 0 8.1-3.7 8-8.2-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362s17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362s-17.9 89.1-50.4 121.6S557.9 534 512 534z" p-id="2038" fill="#d4237a"></path></svg>`;

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsComponent {

  isUserCase: boolean = true;

  /**
   * 用户图标
   */
  userIcon = 'userIcon';

  /**案件列表 */
  caseList$;

  /**起始账号列表 */
  accountList;

  private allCase: Lawcase[] = [];

  /**当前案件的id，excel导入数据库时添加上 */
  // private caseID: any;

  /**当前显示的流程图的账号，当流程数据修改时，刷新视图使用 */
  // currentNode: AccountNode;
  currentItem: StartNode;

  //过滤案件关键字
  caseFilterControl = new FormControl('');

  /**html中input的引用 */
  @ViewChild('inputFile', { static: false }) inputFile: ElementRef;

  uploader: FileUploader = new FileUploader({
    url: ServerConfig.uploadPath,
    itemAlias: 'fileData',
  });

  user: User;

  panelColor: string = ''

  //当前案件
  private currentCase: Lawcase;

  constructor(
    private cdr: ChangeDetectorRef,
    private dataService: InsertExcelDataService,
    public dialog: MatDialog,
    private localStorage: LocalStorgeService,
    private store: Store,
    private reportService: ReportService,
    private message: MessageService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    iconRegistry.addSvgIconLiteral(
      'saveIcon',
      sanitizer.bypassSecurityTrustHtml(saveIcon)
    );

    iconRegistry.addSvgIconLiteral(
      'userIcon',
      sanitizer.bypassSecurityTrustHtml(userIcon)
    );

    iconRegistry.addSvgIconLiteral(
      'userIcon2',
      sanitizer.bypassSecurityTrustHtml(userIcon2)
    );
  }

  ngOnInit() {
    //获取所有案件信息 action_getAllCase->effect:getAllcase$->action_getAllCaseSuccess->reducer:lawcaseAdapter.setAll ->selector:selector_lawcases

    this.store.select(selector_user).subscribe((user) => {
      this.user = user;
      this.getLawcase();
      this.cdr.markForCheck();

      //如果退出登录，则显示全部案件，初始化usericon按钮
      if (!user && this.isUserCase) {
        this.store.dispatch(action_getAllCase())
        this.isUserCase = false;
        this.userIcon = 'userIcon'
      }else{
        this.userIcon = 'userIcon2'
      }
    });

    //先取缓存，再从后台取数据
    const localCase = this.localStorage.getObject(LOCALSTORAGE_ALL_CASE);
    if (localCase && localCase.length > 0) {
      this.setAllCase(localCase);
    }
    this.getLawcase();

    this.store.select(selector_lawcases).subscribe(res => {
      this.localStorage.setObject(LOCALSTORAGE_ALL_CASE, res);
      this.setAllCase(res)
      this.cdr.markForCheck();
    })

    //过滤案件信息
    let filterValue = this.localStorage.get('filterValue');
    if (filterValue == 'null') filterValue = ''
    this.caseFilterControl.setValue(filterValue);
    this.caseList$ = this.caseFilterControl.valueChanges.pipe(
      startWith(filterValue),
      map((val) => this.keywordFilter(this.allCase, val))
    );

    //查询账号中选择案件后的过滤
    this.message.filterKeyword$.subscribe((val) => {
      console.log(val);
      this.caseFilterControl.setValue(val);
    });

    this.store
      .select(selector_startAccounts)
      .pipe(filter((v) => Boolean(v)))
      .subscribe((accountList) => {
        if (this.currentCase)
          this.localStorage.setObject(LOCALSTORAGE_START_NODE_KEY_PRE + this.currentCase.id, accountList)

        this.accountList = accountList;
        this.cdr.markForCheck();
      });

    //当前选择的起始账号更改时
    this.store
      .select(selector_selectedStartAccount)
      .pipe(filter((v) => Boolean(v)))
      .subscribe((acc) => {
        this.currentItem = acc;
        if (this.currentItem) {
          console.log('start node change')
          //如果浏览器缓存中存有节点数据，直接显示，否则查询。
          const key = `${LOCALSTORAGE_NODE_KEY_PRE}${acc.id}`;
          const nodes = this.localStorage.getNode(key);
          if (nodes && nodes.length > 1) {
            console.log('缓存中节点');
            this.store.dispatch(action_getNodesSuccess({ nodes: nodes }));
          } else {
            //查询节点
            console.log('数据库节点');
            const node = this.accountToNode(acc);
            this.store.dispatch(action_getNodes({ firstNode: node }));
          }
        }
      });


  }

  private getLawcase() {
    console.log(this.user)
    if (this.user) {
      this.store.dispatch(action_getUserCase({ userId: this.user.id }))
    } else {
      this.store.dispatch(action_getAllCase())
    }
  }

  private setAllCase(res:Lawcase[]) {
    res.sort((a,b)=>parseInt(b.id)-parseInt(a.id))
    this.allCase = res;
    this.getFilterCase()
  }

  private getFilterCase() {
    let filterValue = this.localStorage.get('filterValue');
    if (filterValue == 'null') filterValue = ''
    this.caseFilterControl.setValue(filterValue);
    this.caseList$ = this.caseFilterControl.valueChanges.pipe(
      startWith(filterValue),
      map((val) => this.keywordFilter(this.allCase, val))
    );
  }

  onClickPanel(lawCase) {
    // console.log('click panel',lawCase)
    this.currentCase = lawCase;
    const key = LOCALSTORAGE_START_NODE_KEY_PRE + this.currentCase.id;
    const startNodes = this.localStorage.getObject(key);
    console.log(startNodes)
    if (startNodes) {
      console.log('缓存中的start node')
      this.accountList = startNodes;
      //先取缓存，再发请求，更新用户体验
      //更新store中的
      this.store.dispatch(action_getStartNodeSuccess({ data: startNodes }));
      //检查是否有数据更新
      this.store.dispatch(action_getStartNode({ lawcaseID: lawCase.id }));
    } else {
      this.store.dispatch(action_getStartNode({ lawcaseID: lawCase.id }));
    }
    this.store.dispatch(action_selectLawcase({ id: lawCase.id }));
  }

  getIsSelfCase(lawcase: Lawcase) {
    return this.user?.id && this.user?.id == lawcase.userID
  }

  getIsSelectedCase(lawcase: Lawcase) {
    return this.currentCase?.id == lawcase.id
  }

  /**增加起始账号 */
  onAddAccount(lawCase) {
    let dialogRef = this.dialog.open(StartNodeComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.state = 'add';
    dialogRef.componentInstance.caseID = lawCase.id;
  }

  /**修改案件信息，双击案件时 */
  onEditCase(lawCase) {
    let dialogRef = this.dialog.open(LawCaseComponent, { disableClose: true });
    // console.log(lawCase);
    dialogRef.componentInstance.data = lawCase;
  }

  onItemClick(item: StartNode) {
    console.log('record start node,', item)
    const node = this.accountToNode(item);
    this.store.dispatch(action_selectStartAccount({ id: item.id }));
    // this.store.dispatch(action_clearPersons());
  }

  /**删除记录 */
  onDelete(item: AccountNode) {
    swal('确定要删除该起始账号吗？', {
      buttons: ['取消', '确定'],
    }).then((val) => {
      if (val) {
        let data = {
          tableName: TableName.START_ACCOUNT,
          id: item.id,
        };
        this.store.dispatch(action_delStartNode({ data }));
      }
    });
  }

  onEditStartAccount(item: StartNode) {
    let dialogRef = this.dialog.open(StartNodeComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.state = 'edit';
    dialogRef.componentInstance.data = item;
  }

  saveFilterValue() {
    this.localStorage.set('filterValue', this.caseFilterControl.value);
  }

  onShowUserCase() {
    if (this.isUserCase) {
      this.userIcon = 'userIcon'
      this.store.dispatch(action_getAllCase())
    } else {
      this.userIcon = 'userIcon2'
      this.store.dispatch(action_getUserCase({ userId: this.user.id }))
    }
    this.cdr.markForCheck()
    this.isUserCase = !this.isUserCase
  }

  private keywordFilter(arr: any[], val: string): any[] {
    if (!val || val == '') return arr;
    return arr.filter((item) => {
      if (!item['caseName']) return false;

      const vals = val.split(' ');

      const hanzi = item.caseName;
      const py_first = pinyin(item['caseName'], {
        style: STYLE_FIRST_LETTER,
      }).join('');

      const py = pinyin(item['caseName'], { style: STYLE_NORMAL }).join('');

      let res: boolean;
      for (let i = 0; i < vals.length; i++) {
        const val = vals[i];
        res =
          res ||
          hanzi.indexOf(val) >= 0 ||
          py_first.indexOf(val) >= 0 ||
          py.indexOf(val) >= 0;
      }

      return res;
    });
  }

  private accountToNode(item: StartNode) {
    let startNode: AccountNode = new AccountNode();
    startNode.id = item.id;
    startNode.filter = item.filter;
    startNode.accountName = item.accountName;
    startNode.account = item.victimAccount;
    startNode.oppositeAccount = item.account;
    // startNode.caseID = item.caseID;
    startNode.isFirstNode = true;
    if (parseInt(item.queryDuration))
      startNode.queryDuration = parseInt(item.queryDuration);
    startNode.level = 0;
    startNode.tradeTimes.push(moment(item.tradeTime));
    startNode.ids.push(item.id);
    startNode.moneys.push(item.money);
    startNode.commonQueryDuration = parseInt(item.commonQueryDuration);
    startNode.isShowChild = true;
    // startNode.remark = item.remark;
    return startNode;
  }

  onCreateReport(lawCase: Lawcase) {
    let l = copy(lawCase)

    this.reportService.getReportData(l).subscribe(
      res => {
        console.log(res)
        const reportDoc = new ReportCreate(res);

        Packer.toBlob(reportDoc.getReportDoc()).then(blob => {
          saveAs(blob, lawCase.caseName + '研判报告.docx');
          console.log("Document created successfully");
        });
      }
    )

  }

  /////////////////////////////////////////////下面是导入excel数据/////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  onAddFile() {
    this.inputFile.nativeElement.click();
  }

  onFileSelected(files: any): void {
    //上传原始文件
    this.uploader.options.additionalParameter = {
      //上传文件时携带案件编号作为参数，构建目录
      fileDir: this.currentCase.caseNumber.trim(),
    };
    console.log(this.uploader.queue);
    // this.uploader.uploadAll();
    //上传数据到数据库
    this.dataService.insertData(files, this.currentCase?.id, this.uploader);
  }
}

