import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SqlService } from './sql.service';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import * as toastr from 'toastr';
import { FileUploader } from 'ng2-file-upload';
import { Store } from '@ngrx/store';
import { action_refreshNodes } from '../app-state/app.action';
import { TradeRecord } from '../app-state/types';
import swal from 'sweetalert';

@Injectable({
  providedIn: 'root',
})

/**
 * 电诈数据上传到数据库，并且电诈原excel表保存到数据库
 * 步骤：
 * 1、读取excel数据，转换成标准格式，中间为上传数据准备文件名
 * 2、把转换后的数据插入数据库，
 * 3、上传原数据到服务器
 * 4、下一个文件继续
 */
export class InsertExcelDataService {
  private fields: any;
  constructor(
    private http: HttpClient,
    private sql: SqlService,
    private store: Store
  ) {
    this.http.get('assets/field.json').subscribe((data) => {
      this.fields = data;
      console.log(this.fields);
    });
  }

  private index = 0;
  private caseID: string;
  private files: File[];
  private uploader: FileUploader;

  private sub: Subscription;

  private errorRecords = [];

  insertData(files: FileList, caseID: string, uploader: FileUploader) {
    this.index = 0;
    this.caseID = caseID;
    this.files = this.fileListToArray(files);
    this.uploader = uploader;

    this.sub = uploader.response.subscribe((res) => {
      this.nexFile();
    });

    this.run(this.files[this.index]);
  }

  private fileListToArray(files: FileList): File[] {
    let arr = [];
    for (let i = 0; i < files.length; i++) {
      arr.push(files[i]);
    }
    return arr;
  }

  private run(file: File) {
    console.log('run');
    this.errorRecords = [];
    this.getExcelData(file)
      .pipe(map((data) => this.getRecords(data)))
      .subscribe((records) => {
        this.insert(records);
      });
  }

  //获取excel数据
  private getExcelData(file: File): Observable<any[]> {
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    return fromEvent(fileReader, 'load').pipe(
      map((event) => {
        const binary: string = (<any>event.target).result;
        const workbook = XLSX.read(binary, { type: 'binary' });
        const wsname: string = workbook.SheetNames[0];
        const ws: XLSX.WorkSheet = workbook.Sheets[wsname];
        return XLSX.utils.sheet_to_json(ws, {
          raw: false,
          defval: null,
          blankrows: false,
        });
      })
    );
  }

  
  //excel数据清洗成标准格式
  private getRecords(excelData: any[]): TradeRecord[] {
    console.log(excelData);
    let records: TradeRecord[] = [];

    const isThird = this.isThirdPay(excelData[0]);
    console.log('excel data length:', excelData.length);
    // excelData.forEach((item,index) => {
    //   let o = this.getTradeRecord(item, isThird,index);
    //   if(o){
    //     records.push(o)
    //   }
    // });
    for (let i = 0; i < excelData.length; i++) {
      const item = excelData[i];
      const o = this.getTradeRecord(item,isThird,i)
      if(o){
        records.push(o)
      }
    }

    console.log('recordLength:', records.length);
    //设置上传excel数据的名字
    if (records[0]) {
      this.uploader.options.additionalParameter['fileName'] =
        records[0].account + '.xlsx';
    } else {
      this.uploader.options.additionalParameter['fileName'] =
        'no_insert' + this.files[this.index].name + '.xlsx';
    }
    console.log(records);
    return records;
  }

  private insert(records: TradeRecord[]) {
    this.sql.exec(PhpFunctionName.INSERT_ARRAY, records).subscribe(
      (res) => {
        console.log(this.uploader);
        this.uploadRaw();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // 下一个文件
  private nexFile() {
    toastr.clear();
    toastr.info(`成功导入${this.files[this.index].name}`);
    this.index++;
    //此处用filelist 会出现一个空值的filelist ，比较诡异，数组没有问题
    if (this.index < this.files.length) {
      this.run(this.files[this.index]);
    } else {
      toastr.info(`数据上传完毕`);
      if(this.errorRecords.length > 0){
        swal({title:'错误数据',text:this.errorRecords.join('\n')})
      }
      //数据上传完毕后解除订阅，否则可能造成多次订阅
      this.sub.unsubscribe();
      this.uploader.queue = [];
      this.index = 0;
      this.store.dispatch(action_refreshNodes())
    }
  }

  private uploadRaw() {
    this.uploader.uploadItem(this.uploader.queue[this.index]);
  }

  private getTradeRecord(data: any, isThird: boolean,index:number): TradeRecord {
    let o: TradeRecord = {};
    for (const key in data) {
      let newkey = this.fields[key];
      if (newkey) {
        let value = data[key];
        if (value === '-' || value === 'null') value = '';
        o[newkey] = value;
      }
    }
    if (isThird) {
      if (
        (o.inOrOut == '入' || o.inOrOut == '入账') &&
        o.oppositeAccount != ''
      ) {
        this.swipValue(o, 'account', 'oppositeAccount');
        this.swipValue(o, 'accountBankName', 'oppositeBankName');
        this.swipValue(o, 'accountBankNumber', 'oppositeBankNumber');
      }
      o.isThird = '1';
    }
    if (o.inOrOut == '出' || o.inOrOut == '出账' || o.inOrOut?.toUpperCase() == 'D') o.inOrOut = '借';
    if (o.inOrOut == '入' || o.inOrOut == '入账' || o.inOrOut?.toUpperCase() == 'C') o.inOrOut = '贷';

    if(!this.validateData(o,index)){
      return null
    }
    //加上案件id
    o.caseID = this.caseID;

    return o;
  }

  private isThirdPay(item: any): boolean {
    return (
      item.hasOwnProperty('付款支付帐号') ||
      item.hasOwnProperty('付款方的支付帐号')
    );
  }

  private swipValue(o: TradeRecord, p1: string, p2: string) {
    if (o.hasOwnProperty(p1) && o.hasOwnProperty(p2)) {
      let temp = o[p1];
      o[p1] = o[p2];
      o[p2] = temp;
    }
  }
  private isRightTime(record) {
    if (record?.tradeTime && record.tradeTime?.length != 14) {
      toastr.warning('交易时间格式不对');
      return false;
    }
    return true;
  }

  private validateData(r:TradeRecord,index:number){
    if (r.tradeTime && r.tradeTime.length != 14) {
      this.errorRecords.push(`第${index+2}行，交易时间格式不对，${r.tradeTime}`);
      return false;
    }
    if(!(r.inOrOut =='借' || r.inOrOut == '贷')){
      toastr.warning('借贷标志错误，请将借贷标志，修改成借或贷');
      this.errorRecords.push(`第${index+2}行，借贷标志错误，${r.inOrOut}`);
      return false;
    }
    if(!r.money){
      toastr.warning('没有交易金额');
      this.errorRecords.push(`第${index+2}行，没有交易金额,${r.money}`);
      return false;
    }
    return true;
  }
}
