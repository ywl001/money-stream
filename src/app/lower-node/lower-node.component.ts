import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { AccountNode } from '../app-state/accountNode';
import * as toastr from 'toastr';
import { TableName } from '../app-state/types';
import { Store } from '@ngrx/store';
import { action_updateLowerAccount } from '../app-state/app.action';

@Component({
  selector: 'app-add-lower-account',
  templateUrl: './lower-node.component.html',
  styleUrls: ['./lower-node.component.scss'],
})
export class LowerNodeComponent implements OnInit {
  id: string;
  account: string;
  placeholder: string;

  tradeTimes: any[];
  moneys: any[];

  moneyControl = new FormControl();
  timeControl = new FormControl();

  get isDisabled(){
    return !Boolean(this.id)
  }
  constructor(private store: Store) {}

  ngOnInit() {
    toastr.info('请选择具体的交易后，然后填写账号')
    this.moneyControl.valueChanges
      .pipe(map((val) => this.moneys.findIndex((value) => val == value)))
      .subscribe((index) => {
        this.timeControl.setValue(this.tradeTimes[index]);
        this.id = this.data.ids[index];
        this.placeholder = this.data.oppositeAccount;
        console.log(this.id);
      });

    this.timeControl.valueChanges
      .pipe(map((val) => this.tradeTimes.findIndex((value) => val == value)))
      .subscribe((index) => {
        this.id = this.data.ids[index];
        this.placeholder = this.data.oppositeAccount;
        console.log(this.id);
      });
  }

  private _data: AccountNode;
  set data(value: AccountNode) {
    console.log('low set data');
    if (value && this._data != value) {
      this._data = value;
      this.moneys = value.moneys;
      this.tradeTimes = value.tradeTimes.map((val) =>
        val.format('YYYY-MM-DD HH:mm:ss')
      );
    }
  }

  get data() {
    return this._data;
  }

  onSubmit() {
    if (!this.id) {
      toastr.warning('请选择金额或交易时间');
      return;
    }
    let tableData = {
      oppositeAccount: this.account,
      isLowerAccount: '1',
    };
    const data = {
      tableName: TableName.TRADE_RECORD,
      tableData: tableData,
      id: this.id,
    };
    this.store.dispatch(action_updateLowerAccount({ data }));
  }
}
