import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { CellEvent, ColDef, ColumnApi, GridApi } from 'ag-grid-community';
import copy from 'fast-copy';
import * as moment from 'moment';
import { Moment } from 'moment';
import { ClipboardService } from 'ngx-clipboard';
import { filter, skip, Subscription, take } from 'rxjs';
import * as toastr from 'toastr';
import { AccountNode } from '../app-state/accountNode';
import { action_getAccountRecord, action_updateNodeSuccess } from '../app-state/app.action';
import { selector_accountRecord, selector_isCreateUser, selector_nodes, selector_selectedLawcase, selector_selectedNode } from '../app-state/app.selector';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { Lawcase, TradeRecord } from '../app-state/types';
import { RelationRecordComponent } from '../relation-record/relation-record.component';
import { SqlService } from '../service/sql.service';
import { ButtonRendererComponent } from './button-renderer/button-renderer.component';

interface AccoutnCount {
  account: string;
  name: string;
  count: number;
  totalMoney: number;
  inOrOUt: string;
}

enum GridState {
  record, count
}

@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss']
})
export class DataGridComponent implements OnInit {

  /**
   * 表格的状态，显示记录或统计数据
   */
  private _state: GridState;
  public get state(): GridState {
    return this._state;
  }
  public set state(value: GridState) {
    this._state = value;
    if (value == GridState.record)
      this.getRowClass(value);
    this.gridApi.setColumnDefs(this.getColDefs(value));
  }

  /**
   * record模式列定义
   */
  columnDefs: ColDef[] = [
    { field: 'account', headerName: '查询账号', filter: true, resizable: true },
    { field: 'oppositeAccount', headerName: '对方账号', filter: true, resizable: true, sortable: true },
    { field: 'oppositeName', headerName: '对方账号姓名', filter: true, resizable: true },
    { field: 'money', headerName: '金额', resizable: true },
    { field: 'leftMoney', headerName: '余额', resizable: true },
    { field: 'inOrOut', headerName: '借贷', sortable: true, resizable: true },
    { field: 'tradeTime', headerName: '交易时间', sortable: true, resizable: true, filter: true, },
    { field: 'tradeType', headerName: '交易类型', resizable: true },
    { field: 'oppositeBankNumber', headerName: '对方银行卡号', resizable: true },
    { field: 'payeeName', headerName: '收款方的商户名称', resizable: true },
    // { field: 'caseID', headerName: '案件id' },
    // { field: 'relationCaseID', headerName: '案件id2' },
    // {
    //   headerName: '删除',
    //   cellRendererFramework: ButtonRendererComponent,
    // }
  ];

  /**
   * count模式列定义
   */
  columnDefs_count = [
    { field: 'account', headerName: '对方账号', filter: true, resizable: true, sortable: true },
    { field: 'name', headerName: '对方姓名', filter: true, resizable: true },
    { field: 'count', headerName: '次数', filter: true, resizable: true },
    { field: 'totalMoney', headerName: '总金额', filter: true, resizable: true },
    { field: 'inOrOUt', headerName: '出入', filter: true, resizable: true },
  ]

  /**
   * grid api
   */
  private columnApi: ColumnApi;
  private gridApi: GridApi;


  public node: AccountNode;
  private currentCase: Lawcase;

  gridData: any[];
  private allRecord: TradeRecord[];

  public account: string;

  private isRelationCurrentCase: boolean;

  isInChart:boolean

  private clickedRowIndex:number;


  frameworkComponents: any;

  // private _data;
  // set data(value: any) {
  //   this._data = value;
  //   this.node = value.node;
  //   this.allRecord = value.data;
  // }

  // get data() {
  //   return this._data
  // }

  @ViewChild('agGrid', { static: false }) agGrid;

  private isCreateUser: boolean;

  constructor(private cbs: ClipboardService,
    public dialog: MatDialog,
    private store: Store,
    private sql: SqlService,
    public dialogRef: MatDialogRef<DataGridComponent>) {
    this.frameworkComponents = {
      buttonRenderer: ButtonRendererComponent
    }

    this.store.select(selector_isCreateUser).pipe(take(1)).subscribe(res => this.isCreateUser = res);
    if (this.isCreateUser) {
      this.columnDefs.push({
        headerName: '删除',
        cellRendererFramework: ButtonRendererComponent,
      })
    }
  }

  private selector_accountRecord: Subscription

  ngOnInit() {

    this.getAccountIsInChart(this.account);

    this.selector_accountRecord = this.store
      .select(selector_accountRecord)
      .pipe(skip(1), filter(res => res != undefined))
      .subscribe(res => {
        console.log('aaaa', res)
        if (res && res.length > 0) {
          this.gridData = res;
          this.allRecord = res;
          this.autoSizeAll();
          // if (this.gridApi)
          //   this.gridApi.redrawRows()

          setTimeout(() => {
            if(this.clickedRowIndex > 20){
              this.gridApi.ensureIndexVisible(this.clickedRowIndex,'middle');
            }
          }, 300);

        } else {
          // this.dialogRef.close()
          toastr.info('没有数据')
          setTimeout(() => {
            this.dialogRef.close();
          }, 100);
        }
      })

    this.store.select(selector_selectedLawcase).pipe(
      take(1)
    ).subscribe(
      res => this.currentCase = res
    )

    this.store.select(selector_selectedNode).pipe(take(1)).subscribe(
      res => this.node = res
    )
    console.log(this.currentCase.id)
  }

  ngOnDestroy() {
    console.log('data grid destroy')
    if (this.isInChart && this.isRelattionRecordChange()) {
      console.log('data grid relation record is change')
      this.sql.exec(PhpFunctionName.SELECT_ACCOUNT_RELATION_RECORDS, this.account).subscribe(res => {
        const data = { id: this.node.id, changes: { relationRecords: res } };
        this.store.dispatch(action_updateNodeSuccess({ data: data }))
      })
    }

    this.selector_accountRecord.unsubscribe();
  }

  /**判断两个数组是否相同 */
  private isRelattionRecordChange() {
    // console.log('record is not change,',JSON.stringify(this.getNodeRelationRecords()) == JSON.stringify(this.getRelationRecords()));

    return JSON.stringify(this.getNodeRelationRecords()) != JSON.stringify(this.getRelationRecords())
  }

  private getRelationRecords() {
    const a = copy(this.allRecord)?.sort((a,b)=>parseInt(a.id)-parseInt(b.id));
    return a?.filter(r => parseInt(r.relationCaseID) > 0 || r.markMoney > 0).map(r=>({id:r.id,relationCaseID:r.relationCaseID,markMoney:r.markMoney}))
  }

  private getNodeRelationRecords(){
    const a = copy(this.node.relationRecords)?.sort((a,b)=>parseInt(a.id)-parseInt(b.id));
    return a.map(r=>({id:r.id,relationCaseID:r.relationCaseID,markMoney:r.markMoney}))
  }

  onGridReady(params) {
    console.log('on grid ready')
    this.columnApi = params.columnApi;
    this.gridApi = params.api;
    this.state = GridState.record;
    this.store.dispatch(action_getAccountRecord({ account: this.account }));
  }


  onRowDataChange() {
    // console.log('on row data change')
    this.autoSizeAll();
  }

  //自动设置列宽度
  private autoSizeAll() {
    let allColumnIds = [];
    if (Boolean(this.columnApi)) {
      this.columnApi.getAllColumns()?.forEach(function (column) {
        allColumnIds.push(column.getColId());
      });
      this.columnApi.autoSizeColumns(allColumnIds);
    }
  }



  /**设置行样式，类在全局style.css 中定义*/
  private getRowClass(state: GridState) {

    if (state != GridState.record) return;
    this.agGrid.gridOptions.getRowClass = (params) => {
      //焦点交易记录
      //1、账号和金额一致
      // if (params.data.oppositeAccount == this.node.account && this.getIsTradeMoney(params.data, this.node.moneys))
      //   return 'highLight'
      //2、交易时间和交易金额一致
      // console.log('get row class')

      if (params.data.isNextNode == 1){
       
        return 'highLight_nextNode'
      }

      if (params.data.relationCaseID == this.currentCase.id)
        return 'highLight_main_case'
      
      if (params.data.relationCaseID > 0)
        return 'highLight_other_case'
      if (params.data.markMoney == 1){
        return 'highLight_cash'
      }

      // if (params.data.markMoney == 2)
      //   return 'highLight_return_money'
      // if (params.data.markMoney == 3)
      //   return 'highLight_returned_money'


      if (this.getIsTradeMoneyAndTradeTime(params, this.node.moneys, this.node.tradeTimes, 100))
        return 'highLight_main_case'
      // if (this.getIsTradeMoneyAndTradeTime(params, this.node.moneys, this.node.tradeTimes) &&
      //   (params.data.oppositeAccount === this.node.account || params.data.accountBankNumber === this.node.account || params.data.oppositeAccount === ''))
      //   return 'highLight_main_case'
      //出账样式
      if (params.data.inOrOut == '借') return 'row1'
     
      // this.node.account == params.data.
      return null;
    };
  }

  private getColDefs(state: GridState) {
    if (state == GridState.count)
      return this.columnDefs_count;
    else {
      return this.columnDefs;
    }
  }

  private getIsTradeMoneyAndTradeTime(params: any, moneys: number[], tradeTimes: Moment[], timeDiff = 300) {
    let result: boolean;
    for (let i = 0; i < moneys.length; i++) {
      const money = moneys[i];
      const tradeTime = tradeTimes[i];
      const a = Math.abs(parseFloat(params.data.money) - Math.abs(money)) < 0.001
      const b = Math.abs(moment(params.data.tradeTime).diff(tradeTime, 'second')) <= timeDiff
      result = result || (a && b)
    }
    return result;
  }

  private getIsTradeMoney(data: TradeRecord, moneys: number[]) {
    let result: boolean;
    for (let i = 0; i < moneys.length; i++) {
      const money = moneys[i];
      const a = Math.abs(data.money - Math.abs(money)) < 0.001
      return result || a;
    }
  }

  onOut() {
    this.state = GridState.count;
    this.gridData = this.getCountData('借')
  }

  onIn() {
    this.state = GridState.count;
    this.gridData = this.getCountData('贷')
  }

  onAll() {
    this.state = GridState.record;
    this.gridData = this.allRecord
  }

  onClearFilter() {
    this.gridApi.setFilterModel(null);
    this.gridApi.onFilterChanged();
  }

  onDelRow() {

  }

  ////////////////////////////////表格事件//////////////////////////////
  private isClick: boolean;
  private isPress: boolean;
  private isDoubleClick: boolean;

  onCellMouseDown(e: CellEvent) {
    this.isClick = false;
    this.isPress = false;
    this.isDoubleClick = false;
    setTimeout(() => {
      if (!this.isClick && !this.isDoubleClick) {
        this.isPress = true;
        console.log('press')
      }
    }, 1000);
  }

  //click
  onClick(e: CellEvent) {
    this.isClick = true;
    setTimeout(() => {
      if (this.isClick && !this.isPress) {
        // console.log('click', e.data);
        // console.log(e.column, e.colDef,e.rowIndex)
        this.clickedRowIndex = e.rowIndex;
        this.clickFn(e);
      }
    }, 500);
  }

  private clickFn(e: CellEvent) {
    if (this.state == GridState.count) {
      const rowData = e.data;
      this.state = GridState.record;
      this.gridData = this.getRecordsByAccount(rowData.account)
    } else if (this.state == GridState.record) {

      this.store.select(selector_isCreateUser).pipe(take(1)).subscribe(res => {
        if (res || e.data.relationCaseID) {
          let ref = this.dialog.open(RelationRecordComponent);
          ref.componentInstance.data = e.data;
          ref.componentInstance.parentDialogRef = this.dialogRef;
        }
      })
    }
  }

  onDoubleClick(e: CellEvent) {
    console.log('double click')
    //避免双击造成触发单击事件
    this.isClick = false;
    this.isDoubleClick = true;

    this.cbs.copy(e.value)
    toastr.success('已复制')
  }

  private getCountData(type: string): AccoutnCount[] {
    let map = new Map<string, AccoutnCount>();
    this.allRecord.forEach(item => {
      if (item.inOrOut == type) {
        let key;
        if (item.oppositeAccount) key = item.oppositeAccount;
        else if (item.oppositeBankNumber) key = item.oppositeBankNumber;
        else if (item.payeeName) key = item.payeeName;
        else if (item.tradeType) key = item.tradeType;

        if (key && key != '') {
          if (!map.has(key)) {
            let name = item.oppositeName ? item.oppositeName : item.payeeName;
            map.set(key,
              {
                account: key,
                name: name,
                count: 1,
                totalMoney: +item.money,
                inOrOUt: item.inOrOut
              }
            )
          } else {
            let v = map.get(key);
            v.count++;
            v.totalMoney += +item.money;
          }
        }
      }
    })
    const arr = Array.from(map.values());
    return arr.sort((a, b) => {
      return Math.abs(b.totalMoney) - Math.abs(a.totalMoney)
    })
  }

  private getRecordsByAccount(account: string) {
    return this.allRecord.filter(item => item.oppositeAccount == account)
  }

  private getAccountIsInChart(account: string) {
    this.isInChart = false;
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
