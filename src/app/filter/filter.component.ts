import { Component, OnInit } from '@angular/core';
import { AccountNode } from '../app-state/accountNode';
import { TableName } from '../app-state/types';
import { Store } from '@ngrx/store';
import { action_updateNodeFilter } from '../app-state/app.action';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent implements OnInit {
  money: number;
  // tradeType: string;
  // payeeName: string;

  // tradeTypes = ['支付账户消费'];
  // payeeNames = ['手续费', '基金'];

  static KEY_MONEY = 'money';
  static KEY_KEEP_ACCOUNT = 'keepAccount'
  static KEY_PREVENT_ACCOUNT = 'preventAccount'


  preventAccount: string

  keepAccount: string

  private node: AccountNode;

  constructor(private store: Store) { }

  set data(value) {
    this.node = value;
    if (this.node.filter) {
      const filterData = JSON.parse(this.node.filter);
      console.log(filterData);
      if (filterData) {
        this.money = filterData.money;

        if (filterData[FilterComponent.KEY_KEEP_ACCOUNT]) {
          this.keepAccount = filterData.keepAccount.join('|')
        }

        if (filterData[FilterComponent.KEY_PREVENT_ACCOUNT]) {
          this.preventAccount = filterData.preventAccount.join('|')
        }
      }
    }
  }

  ngOnInit() { }

  onSubmit() {
    const tableData: any = {};

    if (this.keepAccount && this.keepAccount.trim() != '')
      tableData[FilterComponent.KEY_KEEP_ACCOUNT] = this.keepAccount.split('|');

    if (this.preventAccount && this.preventAccount.trim() != '')
      tableData[FilterComponent.KEY_PREVENT_ACCOUNT] = this.preventAccount.split('|');

    if (this.money) tableData[FilterComponent.KEY_MONEY] = this.money;

    const data = {
      tableData: { filter: JSON.stringify(tableData) },
      tableName: this.node.isFirstNode
        ? TableName.START_ACCOUNT
        : TableName.TRADE_RECORD,
      id: this.node.id,
    };

    this.store.dispatch(action_updateNodeFilter({ data }));
  }
}
