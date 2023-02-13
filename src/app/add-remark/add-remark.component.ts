import { Component } from '@angular/core';
import { AccountNode } from '../app-state/accountNode';
import { TableName } from '../app-state/types';
import { Store } from '@ngrx/store';
import { action_updateNodeRemark } from '../app-state/app.action';

@Component({
  selector: 'app-add-remark',
  templateUrl: './add-remark.component.html',
})
export class AddRemarkComponent {
  /**input的值 */
  value: string;

  // private tableData: any;
  private id;
  private tableName: string;
  private node: AccountNode;

  placeholder: string;

  constructor(private store: Store) {}

  set data(value) {
    console.log(value);
    this.node = value;
    this.id = this.node.id;
    // this.tableName = this.node.isFirstNode
    //   ? TableName.START_ACCOUNT
    //   : TableName.TRADE_RECORD;
    // this.value = this.node.remark;
  }

  onSubmit() {
    // let data = {
    //   tableName: this.tableName,
    //   tableData: { remark: this.value },
    //   id: this.id,
    // };
    // this.store.dispatch(action_updateNodeRemark({ data }));
  }
}
