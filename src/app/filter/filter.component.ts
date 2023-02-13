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


  preventAccount:string

  keepAccount:string

  private node: AccountNode;

  constructor(private store: Store) { }

  set data(value) {
    this.node = value;
    if (this.node.filter) {
      const filterData = JSON.parse(this.node.filter);
      console.log(filterData);
      if (filterData) {
        this.money = filterData.money;
        // if (filterData.tradeType) {
        //   this.tradeType = filterData.tradeType.join('|');
        // }
        // if (filterData.payeeName) {
        //   this.payeeName = filterData.payeeName.join('|');
        // }
        if (filterData.keepAccount) {
          this.keepAccount = filterData.keepAccount.join('|')
        }

        if (filterData.preventAccount) {
          this.preventAccount = filterData.preventAccount.join('|')
        }
      }
    }
  }

  ngOnInit() { }

  onSubmit() {
    const tableData: any = {};

    // if (this.tradeType && this.tradeType.trim() != '')
    //   tableData.tradeType = this.tradeType.split('|');

    // if (this.payeeName && this.payeeName.trim() != '')
    //   tableData.payeeName = this.payeeName.split('|');

    if (this.keepAccount && this.keepAccount.trim() != '')
      tableData.keepAccount = this.keepAccount.split('|');

    if (this.preventAccount && this.preventAccount.trim() != '')
      tableData.preventAccount = this.preventAccount.split('|');

    if (this.money) tableData.money = this.money;

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
