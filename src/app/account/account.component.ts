import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import copy from 'fast-copy';
import * as moment from 'moment';
import { map, take } from 'rxjs';
import * as toastr from 'toastr';
import { action_updateNodeSuccess } from '../app-state/app.action';
import { selector_nodes, selector_selectedLawcaseId, selector_selectedNode } from '../app-state/app.selector';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { AccountInfo, SqlData, TableName } from '../app-state/types';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],

})

/**
 * 添加或修改账号信息,该信息作为node的accountInfo属性，对应account_info表
 * 1、从节点按钮点击弹出-->新增或修改，需要将节点账号给账号表单赋值 走set data
 * 2、从人员点击添加账号弹出-->新增或修改，通过粘贴账号后，查询账号是否存在,走set personID
 * 3、从人员账号点击时弹出编辑账号-->修改，走set data
 * 对账号信息存在添加、修改，不存在删除
 * 如果账号信息不存在，插入时要带上caseid
 */
export class AccountComponent implements OnInit {

  isAccountDisabled = false;



  /**
   * 和表单关联的accountinfo
   */
  accountInfo: AccountInfo = {};

  /**
   * 刚进入节目时的accountInfo，编辑时提交修改数据时的比较参照物
   */
  private accountInfo_old: AccountInfo

  /**
   * 开户日期，表单对象的值时moment
   */
  createDate: moment.Moment;

  /**
   * 是否冻结
   */
  isFreeze: boolean;

  /**
   * 是否是对公账户
   */
  isDuigong: boolean;


  //是否存在图表中，嫌疑人的其他账号，从人员处添加的其他账号信息
  isInChart: boolean = false;

  private isAccountExists: boolean = false;

  constructor(private store: Store, private sql: SqlService, private message: MessageService, private cdr: ChangeDetectorRef) {
  }

  /**
   * 人员节目编辑账户信息时set data,从节点点击编辑账号信息时，set data
   * 无论从哪里set data 都不是空值，node时会添加account信息
   * set data 时带着account过来的，因此account不能被更改
   */
  set data(value: AccountInfo) {
    console.log('account set data:', value)
    if (value.id) {
      this.setFormData(value)
    } else {
      this.account = value.account
      this.isAccountDisabled = true;
    }
    this.isAccountExists = Boolean(value.id)
    
  }

  private _account: string = '';
  public get account(): string {
    return this._account;
  }
  public set account(value: string) {
    this._account = value;
    console.log('account info is exists?', this.accountInfo.id)
    // 如果账户信息不存在，重新查询一下
    if (!this.accountInfo.id) {
      this.sql.exec(PhpFunctionName.SELECT_ACCOUNT_INFO_BY_ACCOUNT, value).subscribe(res => {
        if (res.length == 0) {
          this.isAccountExists = false;
        } else {
          this.isAccountExists = true;
          this.setFormData(res[0], false)
        }
      })
    }
  }

  /**
   * 设置账户人员信息时，从人员窗口的添加账户提交
   */
  set personID(value: string) {
    this.accountInfo.personID = value;
  }

  ngOnInit(): void {
    this.store.select(selector_selectedLawcaseId).pipe(take(1)).subscribe(res => this.accountInfo.caseID = res);
  }


  onSubmit() {
    console.log('is account exists:', this.isAccountExists)

    this.getAccountIsInChart(this.accountInfo.account)

    if (this.createDate)
      this.accountInfo.createDate = this.createDate.format('YYYYMMDD');

    this.accountInfo.isFreeze = this.isFreeze ? 1 : 0;
    this.accountInfo.isDuigong = this.isDuigong ? 1 : 0;
    this.accountInfo.account = this.account;

    if (!this.accountInfo.account) {
      toastr.warning("账户不能为空")
      return;
    }

    //账号在图表中,插入或更新账号信息后，要更新流程图视图

    let sqlData: SqlData<AccountInfo> = {
      tableName: TableName.ACCOUNT_INFO
    }

    if (!this.isAccountExists) {
      this.accountInfo.isFreeze = this.isFreeze ? 1 : 0;
      this.accountInfo.isDuigong = this.isDuigong ? 1 : 0;
      sqlData.tableData = this.accountInfo;
      console.log('insert new account', sqlData)
      this.sql.exec(PhpFunctionName.INSERT, sqlData).subscribe(res => {
        if (res.length > 0) {
          toastr.success('账号信息设置成功')
          this.accountInfo = res[0];
          this.editComplete()
        } else {
          toastr.success('账号信息设置失败')
        }
      })
    } else {
      
      let data = this.getUpdateData(this.accountInfo_old, this.accountInfo)
      sqlData.tableData = data
      sqlData.id = this.accountInfo.id;
      console.log('update account', sqlData)
      this.sql.exec(PhpFunctionName.UPDATE, sqlData).subscribe(res => {
        if (res) {
          this.editComplete()
          toastr.success('账号信息设置成功')
        } else {
          toastr.success('账号信息设置失败')
        }
      })
    }
  }

  //编辑完成后刷新视图
  private editComplete() {
    if (this.isInChart) {
      this.refreshNodeAccountInfo(this.accountInfo)
    }
    this.message.relationAccountComplete(this.accountInfo);
    toastr.success('账号信息设置成功')
  }

  /**
   * 设置表单的值
   * @param value 
   */
  private setFormData(value: AccountInfo, isSetAccountValue: boolean = true) {
    this.accountInfo_old = copy(value);
    this.accountInfo = Object.assign({}, value, this.accountInfo)
    console.log('set form data this.accountInfo', this.accountInfo)
    if (isSetAccountValue)
      this.account = value.account;
    if (value.createDate)
      this.createDate = moment(value.createDate);
    this.isFreeze = value.isFreeze == 1;
    this.isDuigong = value.isDuigong == 1;
    this.cdr.markForCheck();
  }

  /**
   * 获取账号是否在节点中
   * @param account 
   */
  private getAccountIsInChart(account: string) {
    if (account) {
      this.store.select(selector_nodes).pipe(take(1)).subscribe(nodes => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.oppositeAccount == account || node.oppositeBankNumber == account) {
            this.isInChart = true;
          }
        }
        console.log('account is in chart.', this.isInChart)
      })
    }
  }

  private refreshNodeAccountInfo(ai: AccountInfo) {
    //更新视图
    this.store.select(selector_selectedNode)
      .pipe(
        take(1),
        map(node => ({
          id: node.id,
          changes: {
            accountInfo: ai
          }
        }))
      ).subscribe(res => {
        console.log(res);
        this.store.dispatch(action_updateNodeSuccess({ data: res }))
      })
  }

  /**
   * 获取表单修改的数据
   * @param oldData 
   * @param newData 
   * @returns 
   */
  private getUpdateData(oldData: AccountInfo, newData: AccountInfo) {
    console.log('get data change', newData, oldData)
    let a: any = {}
    console.log('keys:',Object.keys(newData))

    let compareKey = [
    'account',
    'company',
    'createDate',
    'isFreeze',
    'personID',
    'caseID',
    'returnMoney',
    'returnedMoney',
    'outCash',
    'outCashLocation',
    'remark',
    'cashInfos',
    'isInChart',
    'isDuigong',
    'gongsi',
    'gongsiDizhi',
    'zhengzhao',
    'gongshang',
    'dishui',
    'guoshui'
    ]

    for(let key of compareKey){
      if(oldData[key] != newData[key]){
        a[key] = newData[key]
      }
    }
    // for (let key in newData) {
    //   if (oldData[key] != newData[key]) {
    //     a[key] = newData[key]
    //   }
    // }
    console.log(a)
    return a;
  }
}
