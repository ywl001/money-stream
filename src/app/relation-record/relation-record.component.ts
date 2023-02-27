
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, take } from 'rxjs';
import * as toastr from 'toastr';
import { AccountNode } from '../app-state/accountNode';
import { action_insertStartNodeSuccess, action_refreshNodes, action_relationRecord, action_relationRecordSuccess } from '../app-state/app.action';
import { selector_isCreateUser, selector_selectedLawcase, selector_selectedLawcaseId, selector_user } from '../app-state/app.selector';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { CaseState, Lawcase, SqlData, StartNode, TableName, TradeRecord } from '../app-state/types';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';
import * as moment from 'moment';
import { MatDialogRef } from '@angular/material/dialog';
import { DataGridComponent } from '../data-grid/data-grid.component';


@Component({
  selector: 'app-relation-record',
  templateUrl: './relation-record.component.html',
  styleUrls: ['./relation-record.component.scss']
})
export class RelationRecordComponent implements OnInit {

  lawcaseState: CaseState = CaseState.RELATION;
  currentCase: Lawcase;
  recordId: string;

  parentDialogRef: MatDialogRef<DataGridComponent>;

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

  isNextNode: number;

  private caseID: string;
  private userID: string;





  private selectCaseComplete: Subscription;

  constructor(private store: Store,
    private message: MessageService,
    private sql: SqlService,
    private cdr: ChangeDetectorRef) {
  }

  set data(value: TradeRecord) {
    this._data = value;
    console.log('relation record set data', value)
    this.recordId = value.id;
    this.isOutRecord = value.inOrOut == '借'
    this.isInRecord = value.inOrOut == '贷'
    this.isRelationedCase = parseInt(value.relationCaseID) > 0;
    this.markMoney = Boolean(value.markMoney) ? value.markMoney : 0;
    console.log('mark money', this.markMoney)
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
  get data() {
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
      this.store.dispatch(action_relationRecord({ data: data }))
    });

    this.store.select(selector_isCreateUser).pipe(take(1)).subscribe(res => this.isCreateUser = res);

    this.store.select(selector_selectedLawcaseId).pipe(take(1)).subscribe(res => this.caseID = res);
    this.store.select(selector_user).pipe(take(1)).subscribe(res => this.userID = res.id);
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
        this.store.dispatch(action_relationRecord({ data: data }));
      })
  }

  onSetStartAccount() {
    const tradeTime = moment(this.data.tradeTime).clone().subtract(1, 'm').format('YYYY-MM-DD HH:mm:ss')
    const data: SqlData<StartNode> = {
      tableData: {
        account: this.getAccount(this.data),
        accountName: this.data.oppositeName,
        tradeTime: tradeTime,
        money: this.data.money,
        caseID: this.caseID,
        userID: this.userID
      },
      tableName: TableName.START_ACCOUNT
    }

    this.sql.exec(PhpFunctionName.INSERT, data).subscribe(res => {
      if (res?.length > 0) {
        this.store.dispatch(action_insertStartNodeSuccess({ data: res[0] }))
        toastr.success('设置成功')
      } else {
        toastr.success('设置失败')
      }
      this.parentDialogRef.close();
    })
  }

  private getAccount(tradeRecord: TradeRecord) {
    return tradeRecord.oppositeBankNumber ? tradeRecord.oppositeBankNumber : tradeRecord.oppositeAccount
  }

  onDelRelation() {
    const data: SqlData<TradeRecord> = {
      id: this.recordId,
      tableData: {
        relationCaseID: null
      },
      tableName: TableName.TRADE_RECORD
    }
    this.store.dispatch(action_relationRecord({ data: data }));
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

  onSetNextNode(value: number | null) {
    this.isNextNode = value;
    const data: SqlData<TradeRecord> = {
      id: this.recordId,
      tableData: {
        isNextNode: value
      },
      tableName: TableName.TRADE_RECORD
    }
    this.store.dispatch(action_relationRecord({ data: data }));

    this.sql.exec(PhpFunctionName.UPDATE,data).subscribe(res=>{
      if(res){
        this.store.dispatch(action_relationRecordSuccess({data:{id:this.recordId,changes:{isNextNode:value}}}));
        this.store.dispatch(action_refreshNodes())
      }
    })

    // toastr.info('更改下级节点后，要点击刷新图表')
  }



  ngOnDestroy() {
    console.log('relation record destroy');
    setTimeout(() => {
      this.selectCaseComplete.unsubscribe();
    }, 1000);
  }
}
