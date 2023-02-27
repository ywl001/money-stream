import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { action_updateNodeDuration, action_updateStartNode } from '../app-state/app.action';
import { TableName } from '../app-state/types';
import { AccountNode } from '../app-state/accountNode';

@Component({
  selector: 'app-change-duration',
  templateUrl: './change-duration.component.html',
  styleUrls: ['./change-duration.component.scss']
})
export class ChangeDurationComponent implements OnInit {

  private node: AccountNode;
  private isFirstNode: boolean;

  day: number = 0;
  hour: number = 0;
  minute: number = 0;

  constructor(private store:Store) { }

  set data(data: AccountNode) {
    this.node = data;
    this.queryDuration = data.queryDuration;
    this.isFirstNode = data.isFirstNode;
  }

  private get queryDuration() {
    return this.day * 60 * 24 + this.hour * 60 + this.minute;
  }
  private set queryDuration(value) {
    if (!value) {
      this.day = this.hour = this.minute = 0;
    }else{
      this.day = Math.floor(value / (24 * 60));
      this.hour = Math.floor((value - this.day * 24 * 60) / 60);
      this.minute = value - this.day * 24 * 60 - this.hour * 60;
    }
  }

  ngOnInit() {
  }

  onSubmit() {
    if (!this.isChange()) return;
    let tableData = {}
    const tableName = this.isFirstNode ? TableName.START_ACCOUNT : TableName.TRADE_RECORD
    tableData = this.queryDuration == 0 ? { 'queryDuration': null } : { 'queryDuration': this.queryDuration }
    console.log(tableData)
    let data = {
      tableName: tableName,
      tableData: tableData,
      id: this.node.id
    }
    console.log(data);

    //此次也要根据情况发送action
    if(this.isFirstNode){
      console.log('change first node duration')
      this.store.dispatch(action_updateStartNode({data}))
    }else{
      console.log('change other node duration')
      this.store.dispatch(action_updateNodeDuration({data}))
    }
  }

  private isChange() {
    return this.queryDuration != this.node.queryDuration;
  }
}
