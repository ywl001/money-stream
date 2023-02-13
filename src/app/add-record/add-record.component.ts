import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { action_addNode } from '../app-state/app.action';
import { TableName, TradeRecord } from '../app-state/types';

@Component({
  selector: 'app-add-record',
  templateUrl: './add-record.component.html',
  styleUrls: ['./add-record.component.scss']
})
export class AddRecordComponent implements OnInit {

  tradeTime:moment.Moment;
  inOrOut = '借';
  money;
  oppositeName;
  oppositeAccount;
  account;
  caseId;

  constructor(private store: Store) { }

  ngOnInit(): void {
  }

  onSubmit() {
    if(this.validate()){
      const data = {
        tableName: TableName.TRADE_RECORD,
        tableData: this.getTableData()
      }
      this.store.dispatch(action_addNode({data:data}))
    }
  }

  private getTableData():TradeRecord {
    return {
      account: this.account,
      tradeTime: this.tradeTime.format('YYYY-MM-DD HH:mm:ss'),
      inOrOut:this.inOrOut,
      money:this.money,
      oppositeName:this.oppositeName,
      oppositeAccount:this.oppositeAccount,
      caseID:this.caseId
    }
  }

  private validate() {
    console.log(this.tradeTime)
    if (this.account == '' || !this.tradeTime) {
      toastr.warning('账号或时间必须填写');
      return false;
    }
    return true;
  }

}
