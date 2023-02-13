import { Component, OnInit } from '@angular/core';
import { ColumnApi, GridApi } from 'ag-grid-community';
import copy from 'fast-copy';
import * as moment from 'moment';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-count-info',
  templateUrl: './count-info.component.html',
  styleUrls: ['./count-info.component.scss']
})
export class CountInfoComponent implements OnInit {

  columnDefs = [
    { field: 'account', headerName: '查询账号', filter: true, resizable: true },
    { field: 'caseName', headerName: '案件名称', filter: true, resizable: true, sortable: true },
    { field: 'returnMoney', headerName: '可返现', filter: true, resizable: true },
    { field: 'returnedMoney', headerName: '已返现', resizable: true, filter: true, },
    { field: 'cashInfos', headerName: '取现', resizable: true, filter: true},
    { field: 'isFreeze', headerName: '冻结', sortable: true, resizable: true },
    { field: 'name', headerName: '姓名', sortable: true, resizable: true, filter: true, },
    { field: 'isDaji', headerName: '可打击', resizable: true, filter: true, },
    { field: 'isLuodi', headerName: '需落地', resizable: true, filter: true, },
    { field: 'personNumber', headerName: '身份证号', resizable: true },
    { field: 'currentAddress', headerName: '居住地', resizable: true },
    { field: 'address', headerName: '户籍地', resizable: true },
  ];

  personDefs = [
    { field: 'name', headerName: '姓名', sortable: true, resizable: true, filter: true, },
    { field: 'personNumber', headerName: '身份证号', resizable: true },
    { field: 'currentAddress', headerName: '居住地', resizable: true },
    { field: 'address', headerName: '户籍地', resizable: true },
    { field: 'caseName', headerName: '案件名称', filter: true, resizable: true, sortable: true },
    { field: 'personType', headerName: '人员类型', resizable: true, filter: true, },
  ]

  private columnApi: ColumnApi;
  private gridApi: GridApi;

  gridData: any[];
  private allRecord: any[];

  constructor() { }

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
    console.log(this.gridData)
    // this.autoSizeAll();
  }

  onRowDataChange() {
    console.log('on row data change')
    this.autoSizeAll();
  }

  //自动设置列宽度
  private autoSizeAll() {
    let allColumnIds = [];
    this.columnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.getColId());
    });
    this.columnApi.autoSizeColumns(allColumnIds);
  }

  private fromatCashInfo(data: any[]) {
    // for (let i = 0; i < data.length; i++) {
    //   let item = data[i];
    //   if (StringUtils.isNotEmpty(item.cashInfos)) {
    //     let ci;
    //     let infos: string = item.cashInfos;
    //     infos = infos.replace('	', '')
    //     try {
    //       ci = JSON.parse(infos);
    //       let info = '';
    //       ci.forEach(item => {
    //         info += `${moment(item.cashDate).format('YYYY-MM-DD')}在${item.cashLocation}取现${item.cash}元\r\n`
    //       });
    //       item.cashInfos = info;
    //     } catch (error) {
    //       console.log(error)
    //       console.log(item.cashInfos)
    //     }
    //     console.log(ci)
    //   }
    // }
  }

  onDownloadExcel() {
    let count = this.gridApi.getDisplayedRowCount();
    let data = [];
    for (var i = 0; i < count; i++) {
      var rowNode = this.gridApi.getDisplayedRowAtIndex(i);
      data.push(rowNode.data);
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = '统计信息';
    XLSX.writeFile(wb, fileName + ".xlsx");
  }

}
