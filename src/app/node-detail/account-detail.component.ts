import { Component, OnInit } from '@angular/core';
import { AccountNode } from '../app-state/accountNode';
import * as toastr from 'toastr';
import * as moment from 'moment';

@Component({
  selector: 'app-node-detail',
  templateUrl: './node-detail.component.html',
  styleUrls: ['./node-detail.component.css']
})
export class AccountDetailComponent implements OnInit {

  constructor() { }

  private _data:AccountNode;
  cashInfos:any[];

  ngOnInit() {
  }

  onCbSuccess(){
    toastr.success('复制成功')
  }

  set data(value:AccountNode){
    this._data = value;
    if(value.accountInfo && value.accountInfo.cashInfos){
      this.cashInfos = JSON.parse(value.accountInfo.cashInfos)
    }
  }

  get data(){
    return this._data;
  }
}
