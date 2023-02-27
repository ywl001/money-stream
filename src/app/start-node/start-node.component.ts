import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import * as toastr from 'toastr';
import { StartNode, TableName } from '../app-state/types';
import { Store } from '@ngrx/store';
import {
  action_insertStartNode,
  action_updateStartNode,
} from '../app-state/app.action';
import { selector_user } from '../app-state/app.selector';

@Component({
  selector: 'app-start-node',
  templateUrl: './start-node.component.html',
  styleUrls: ['./start-node.component.css'],
})

/**
 * 添加，修改起始节点
 */
export class StartNodeComponent implements OnInit {
  private id: string;
  //控件的状态，添加还是编辑，在dialog创建时给定
  state: string;

  caseID: string;

  /////////////////////////////////////////////////////////和html绑定的变量//////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //账号
  account: string;
  // 姓名
  accountName: string;
  //转账金额
  money: number;

  //交易时间
  tradeTime: moment.Moment;
  //公共查询时间
  day: number = 0;
  hour: number = 0;
  minute: number = 10;

  public get commonQueryTime() {
    return this.day * 60 * 24 + this.hour * 60 + this.minute;
  }
  public set commonQueryTime(value) {
    this.day = Math.floor(value / (24 * 60));
    console.log(this.day);
    this.hour = Math.floor((value - this.day * 24 * 60) / 60);
    this.minute = value - this.day * 24 * 60 - this.hour * 60;
  }

  constructor(private store: Store) { }

  set data(value: StartNode) {
    console.log(value);
    if (value) {
      this.account = value.account;
      this.accountName = value.accountName;
      this.tradeTime = moment(value.tradeTime);
      this.money = value.money;
      this.commonQueryTime = parseInt(value.commonQueryDuration);
      this.id = value.id;
    }
  }

  ngOnInit() { }

  onSubmit() {
    if (!this.validate()) return;
    let data: any = {
      tableName: TableName.START_ACCOUNT,
      tableData: this.tableData,
    };
    if (this.state == 'add') {
      this.store.dispatch(action_insertStartNode({ data }));
    } else {
      data.id = this.id;
      this.store.dispatch(action_updateStartNode({ data }));
    }
  }

  //获取提交到服务器的数据
  get tableData() {
    let userId;
    this.store.select(selector_user).subscribe(
      u => {
        userId = u.id
      }
    )
    const o: StartNode = {
      accountName: this.accountName,
      account: this.account,
      money: this.money,
      tradeTime: this.tradeTime.format('YYYY-MM-DD HH:mm:ss'),
      commonQueryDuration: this.commonQueryTime + '',
      userID: userId
    };
    if (this.state == 'add') o.caseID = this.caseID;
    console.log(o);
    return o;
  }

  private validate() {
    console.log(this.tradeTime)
    if (this.account == '' || !this.tradeTime) {
      toastr.warning('账号或时间必须填写');
      return false;
    }
    return true;
  }

  onTradeTimeInputChange(e) {
    let value: string = e.target.value;
    if (moment(value).isValid()) {
      this.tradeTime = moment(value)
    } else if (value.length == 14) {
      this.tradeTime = moment(value, 'YYYYMMDDHHmmss');
    }else{
      toastr.error("请查看交易时间格式")
    }
  }
}
