import { Component, OnInit } from '@angular/core';
import * as toastr from 'toastr';
import { AccountNode } from '../app-state/accountNode';

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
    toastr.success('ε€εΆζε')
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
