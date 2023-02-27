import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CellEvent, ColumnApi, GridApi } from 'ag-grid-community';
import copy from 'fast-copy';
import { ClipboardService } from 'ngx-clipboard';
import * as toastr from 'toastr';
import { MessageService } from '../service/message.service';

@Component({
  selector: 'app-work-tips',
  templateUrl: './work-tips.component.html',
  styleUrls: ['./work-tips.component.scss']
})
export class WorkTipsComponent implements OnInit {

  columnDefs=[
    { field: 'account', headerName: '查询账号', filter: true, resizable: true },
    { field: 'caseName', headerName: '案件名称', filter: true, resizable: true, sortable: true },
    { field: 'type', headerName: '类型', filter: true, resizable: true, sortable: true }
  ]

  private columnApi: ColumnApi;
  private gridApi: GridApi;

  gridData: any[];
  private allRecord: any[];

  constructor(private cbs: ClipboardService,private message:MessageService,public dialogRef:MatDialogRef<WorkTipsComponent>) { }

  private _data;

  set data(value: any) {
    console.log('set data')
    let newValue = copy(value);
    // this.fromatCashInfo(newValue);
    this._data = newValue;
    this.allRecord = newValue;
  }

  get data() {
    return this._data
  }

  ngOnInit(): void {
  }

  onGridReady(params) {
    console.log('on grid ready')
    this.columnApi = params.columnApi;
    this.gridApi = params.api;
    this.gridData = this.allRecord;
    this.gridApi.sizeColumnsToFit()
    console.log(this.gridData)
    // this.autoSizeAll();
  }

  onRowDataChange() {
    console.log('on row data change')
    // this.autoSizeAll();
  }

  //自动设置列宽度
  private autoSizeAll() {
    let allColumnIds = [];
    this.columnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.getColId());
    });
    this.columnApi.autoSizeColumns(allColumnIds);
  }

  onDoubleClick(e:CellEvent){
    console.log('double click')
    //避免双击造成触发单击事件

    if(e.colDef.field == 'account'){
      this.cbs.copy(e.value)
      toastr.success('已复制')
    }else if(e.colDef.field == 'caseName'){
      this.message.filterKeyword(e.value);
      this.dialogRef.close();
    }
    console.log(e)

   
  }
}
