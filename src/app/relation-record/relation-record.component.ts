
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, take } from 'rxjs';
import { action_relationRecord } from '../app-state/app.action';
import { selector_isCreateUser, selector_selectedLawcase, selector_selectedLawcaseId } from '../app-state/app.selector';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { CaseState, Lawcase, SqlData, TableName, TradeRecord } from '../app-state/types';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';
import * as toastr from 'toastr';


@Component({
  selector: 'app-relation-record',
  templateUrl: './relation-record.component.html',
  styleUrls: ['./relation-record.component.scss']
})
export class AddRecordCaseComponent implements OnInit {

  lawcaseState: CaseState = CaseState.RELATION;
  currentCase: Lawcase;
  recordId: string;

  /**
   * 是否已经关联了案件
   */
  isRelationedCase: boolean;

  /**
   * 是否入账记录
   */
  isInRecord: boolean;

  /**
   * 是否出账记录
   */
  isOutRecord: boolean;

  /**
   * 关联的案件
   */
  relationCase: Lawcase;


  private _data: TradeRecord;

  isCreateUser: boolean;

  // isCashRecord:boolean;

  /**
   * 返现的标志，
   * 0没有
   * 1取现
   * 2可返还
   * 3已返还
   */
  markMoney: number;

  isNextNode:number;





  private selectCaseComplete: Subscription;

  constructor(private store: Store, private message: MessageService, private sql: SqlService, private cdr: ChangeDetectorRef) { }

  set data(value: TradeRecord) {
    this._data = value;
    console.log('relation record set data',value)
    this.recordId = value.id;
    this.isOutRecord = value.inOrOut == '借'
    this.isInRecord = value.inOrOut == '贷'
    this.isRelationedCase = parseInt(value.relationCaseID) > 0;
    this.markMoney = Boolean(value.markMoney) ? value.markMoney : 0;
    console.log('mark money',this.markMoney)
    this.isNextNode = value.isNextNode;

    if (value?.relationCaseID && value?.relationCaseID != '') {
      this.sql.exec(PhpFunctionName.SELECT_CASE_BY_ID, value.relationCaseID).subscribe(res => {
        console.log(res)
        if (res && res.length > 0) {
          this.relationCase = res[0];
          this.cdr.markForCheck()
        }
      })
    }
  }
  get data(){
    return this._data
  }

  ngOnInit(): void {
    /**
     * 关联其他案件,监听返回的id对多次init后会产生多次订阅，onDestroy要注意取消订阅
     */
    this.selectCaseComplete = this.message.selectCaseComplete$.pipe(take(1)).subscribe(res => {
      const data: SqlData<TradeRecord> = {
        id: this.recordId,
        tableData: {
          relationCaseID: res.id
        },
        tableName: TableName.TRADE_RECORD
      }
      console.log('relation other case', data, res)
      this.store.dispatch(action_relationRecord({ data: data}))
    });

    this.store.select(selector_isCreateUser).pipe(take(1)).subscribe(res => this.isCreateUser = res)
  }

  /**
   * 关联当前案件
   */
  onRelationCurrentCase() {
    this.store.select(selector_selectedLawcase).pipe(take(1)).
      subscribe(res => {
        const data: SqlData<TradeRecord> = {
          id: this.recordId,
          tableData: {
            relationCaseID: res.id
          },
          tableName: TableName.TRADE_RECORD
        }
        console.log('relation current case', data)
        this.store.dispatch(action_relationRecord({ data: data}));
      })
  }

  onDelRelation() {
    const data: SqlData<TradeRecord> = {
      id: this.recordId,
      tableData: {
        relationCaseID: null
      },
      tableName: TableName.TRADE_RECORD
    }
    this.store.dispatch(action_relationRecord({ data: data}));
  }

  onMarkMoney(type: number) {
    this.markMoney = type;
    const data: SqlData<TradeRecord> = {
      id: this.recordId,
      tableData: {
        markMoney: this.markMoney
      },
      tableName: TableName.TRADE_RECORD
    }
    console.log('mark cash record')
    this.store.dispatch(action_relationRecord({ data: data }));
  }

  // onDelMarkMoney() {
  //   const data: SqlData<TradeRecord> = {
  //     id: this.recordId,
  //     tableData: {
  //       markMoney: 0
  //     },
  //     tableName: TableName.TRADE_RECORD
  //   }
  //   this.store.dispatch(action_relationRecord({ data: data}));
  // }

  onSetNextNode(value:number|null){
    this.isNextNode = value;
    const data: SqlData<TradeRecord> = {
      id: this.recordId,
      tableData: {
        isNextNode: value
      },
      tableName: TableName.TRADE_RECORD
    }
    this.store.dispatch(action_relationRecord({ data: data}));

    toastr.info('更改下级节点后，要点击刷新图表')
  }

  ngOnDestroy() {
    console.log('relation record destroy');
    setTimeout(() => {
      this.selectCaseComplete.unsubscribe();
    }, 1000);
  }
}
