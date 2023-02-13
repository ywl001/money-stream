import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import * as toastr from 'toastr'
import { select, Store } from '@ngrx/store';
import { action_insertLawase, action_updateLawcase } from '../app-state/app.action';
import { CaseState, Lawcase, TableName, User } from '../app-state/types';

import { SqlService } from '../service/sql.service';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { MessageService } from '../service/message.service';
import { selector_user } from '../app-state/app.selector';
import { skip, take } from 'rxjs';
import * as moment from 'moment';


@Component({
  selector: 'app-law-case',
  templateUrl: './law-case.component.html',
  styleUrls: ['./law-case.component.scss']
})

/**添加，修改案件 */
export class LawCaseComponent {

  private _state: CaseState = CaseState.ADD;

  private currentLawcase: Lawcase;

  public get state(): CaseState {
    return this._state;
  }

  @Input()
  public set state(value: CaseState) {
    this._state = value;
    if (this.state == CaseState.ADD) {
      this.title = '添加案件';
    } else if (this.state == CaseState.EDIT) {
      this.title = '编辑案件信息';
    } else if (this.state == CaseState.RELATION) {
      this.title = '关联案件';
    }
  }

  /**
   * 组件标题
   */
  @Input()
  title: string;

  /**
   * 案件id
   */
  lawCaseID: string;

  @Output()
  getCaseID = new EventEmitter();

  /**
 * 案件编号
 */
  private _caseNumber: string;
  public get caseNumber(): string {
    return this._caseNumber;
  }
  public set caseNumber(value: string) {
    this._caseNumber = value;
    if (this.state != CaseState.EDIT && value?.length == 23) {
      this.getCaseByNumber(value).subscribe(res => {
        if (res && res.length > 0) {
          console.log('case exits', res)
          this.currentLawcase = res[0];
          this.caseName = res[0].caseName;
          this.caseContent = res[0].caseContent;
          this.lawCaseID = res[0].id;
          this.isExists = true;
          toastr.info('案件已经存在，直接点确定即可');
          console.log(this.state)
        } else {
          toastr.info('请继续输入案件其他信息');
          this.isDisabled = false;
          this.isExists = false;
          this.cdr.markForCheck();
        }
      })
    }
  }

  /**
   * 案件名称
   */
  caseName: string;

  /**
 * 案件简介
 */
  caseContent: string;

  /**
   * 是否本地案件
   */
  @Input()
  isLocalCase: boolean = true;

  /**
   * 组件的禁用状态
   */
  isDisabled: boolean = true;

  /**
   * 案件是否已经存在
   */
  isExists: boolean

  currentUser: User;

  constructor(private store: Store,
    private sqlService: SqlService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,) {
    this.store.select(selector_user).pipe(take(1)).subscribe(res => this.currentUser = res)
  }

  set data(value) {
    console.log(value);
    this.state = CaseState.EDIT;
    this.currentLawcase = value;
    this.isDisabled = false;
    this.lawCaseID = value.id;
    this.caseName = value.caseName;
    this.caseNumber = value.caseNumber;
    this.caseContent = value.caseContent;
  }

  onSubmit() {
    if (!this.validate()) {
      return;
    }
    if (this.state == CaseState.EDIT) {
      let data = {
        tableName: TableName.LAW_CASE,
        tableData: this.sqlData,
        id: this.lawCaseID
      }
      this.store.dispatch(action_updateLawcase({ data: data, state: CaseState.EDIT }))
      toastr.info('更新案件成功')
    } else if (this.state == CaseState.ADD) {
      let data = {
        tableName: TableName.LAW_CASE,
        tableData: this.sqlData
      }
      this.store.dispatch(action_insertLawase({ data: data, state: CaseState.ADD }));
      toastr.info('添加案件成功')
    } else if (this.state == CaseState.RELATION) {

      if (this.isExists) {
        this.messageService.selectCaseComplete(this.currentLawcase)
      } else {
        let data = {
          tableName: TableName.LAW_CASE,
          tableData: this.sqlData
        }
        this.store.dispatch(action_insertLawase({ data: data, state: CaseState.RELATION }));
      }
    }
  }

  onCreateRandomCaseNumber() {
    this.caseNumber = 'B41032200' + moment().format('YYYYMMDDhhmmss')
  }

  get sqlData() {
    return {
      caseName: this.caseName,
      caseNumber: this.caseNumber,
      caseContent: this.caseContent,
      isLocal: this.isLocalCase ? 1 : 0,
      userID: this.currentUser.id
      // isLocal:this.isLocalCase
    }
  }

  private getCaseByNumber(caseNumber: string) {
    return this.sqlService.exec(
      PhpFunctionName.SELECT_CASE_BY_NUMBER,
      caseNumber
    );
  }

  private validate() {
    // if (!this.caseName) {
    //   toastr.warning("请填写案件名称")
    //   return false;
    // }
    if (!this.caseNumber) {
      toastr.warning("请填写案件编号")
      return false;
    }
    return true;
  }

}
