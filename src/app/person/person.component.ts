import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component
} from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AccountNode } from '../app-state/accountNode';
import { selector_isCreateUser, selector_nodes, selector_selectedLawcaseId } from '../app-state/app.selector';
import {
  // AccountExtension,
  AccountInfo,
  Person,
  SqlData,
  TableName
} from '../app-state/types';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';
import swal from 'sweetalert';
import { iif, mergeMap, of, take } from 'rxjs';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import copy from 'fast-copy';
import { action_refreshNodes, action_updateNodeSuccess } from '../app-state/app.action';
import * as toastr from 'toastr';
import { UpdateStr } from '@ngrx/entity/src/models';
import { AccountComponent } from '../account/account.component';


export enum PersonState {
  display = 'display',
  relation = 'relation',
  edit = 'edit'
}

export interface InsertPersonData {
  personData: SqlData<Person>;
  accountData: SqlData<AccountInfo>;
  node: AccountNode;
}

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * 添加或显示人员
 * 1、如果卡号或账号关联有人员，则直接显示人员
 * 2、如果卡号没有关联人员：
 *    2-1、通过身份证号查询人员是否已经存在，如果存在，和卡号关联
 *    2-2、如果不存在，添加人员--》返回人员id--》关联卡号
 */
export class PersonComponent {

  /**
   * 人员是否存在节点中
   */
  isFromNode;

  /**
   *从节点查询的人员
   */
  nodePerson: Person;

  /**
   * 当前人员
   */
  currentPerson: Person;

  /**
   * 是否是创建者
   */
  isCreateUser: boolean;

  /**
   * 节点的账户信息是否存在
   */
  isAccountInfoExists

  /**
   * get set Node
   */
  private _node: AccountNode;
  public get node() {
    return this._node;
  }

  public set node(value) {
    this._node = value;
    this.isFromNode = true;
    console.log('set node ,isfromNode', this.isFromNode);

    if (value.person) {
      this.nodePerson = copy(value.person);
      // this.nodePerson.isFromNode = true;
      this.currentPerson = this.nodePerson;
      this.state = PersonState.display;
      // this.isPersonExists = true;

      // this.getPersonRelationAccount(this.nodePerson);
      // this.getRelationPersons(value.person)
    } else {
      this.state = this.state = PersonState.relation;
    }
    this.isAccountInfoExists = Boolean(value.accountInfo)
  }

  /**
   * 视图的状态
   */
  private _state: PersonState;
  public get state(): PersonState {
    return this._state;
  }
  public set state(value: PersonState) {
    this._state = value;
    if (value == PersonState.edit) {
      this.dialogRef.disableClose = true;
    } else if (value == PersonState.relation) {
      this.dialogRef.disableClose = true;
    } else if (value == PersonState.display) {
      this.dialogRef.disableClose = false;
    }
  }


  /**
   * 节点人员关联人员的id数组的字符串
   */
  private nodePersonIds: string;

  /**
   * 当前案件id，在新插入account info 时使用
   */
  private caseID: string;

  constructor(
    private cdr: ChangeDetectorRef,
    private store: Store,
    private sqlService: SqlService,
    private dialogRef: MatDialogRef<PersonComponent>,
    private dialog: MatDialog,
    private message: MessageService
  ) {
    this.store.select(selector_isCreateUser).subscribe(res => this.isCreateUser = res)
  }

  ngOnInit() {
    this.store.select(selector_selectedLawcaseId).pipe(take(1)).subscribe(res => this.caseID = res)
  }

  currentPersonChange(p: Person) {
    this.currentPerson = p;
    this.getIsFromNode(p);
  }

  onRelationPerson() {
    this.state = PersonState.relation;
    this.isFromNode = false;
  }

  onEditPerson() {
    this.state = PersonState.edit;
  }

  /**
   * 删除人员
   */
  onDelPerson() {
    let info = '';
    if (this.isFromNode) {
      info = `确定要删除${this.nodePerson.name}和卡号${this.getNodeAccount(this.node)}的关联吗？`
    } else {
      info = `确定要删除${this.currentPerson.name}和${this.nodePerson.name}的关联吗？`
    }
    swal(info, {
      buttons: ['取消', '确定'],
    }).then((val) => {
      if (val) {
        if (this.isFromNode) {
          this.insertOrUpdateAccountInfo(null).subscribe(res => {
            this.refreshNodeView(null)
          })
        } else {
          this.updatePersonFriends(null).subscribe(res => {
            this.refreshPersonView(null)
          })
        }
      }
    });
  }

  onSelectPerson(p: Person) {
    if (this.state == PersonState.relation) {
      if (this.isFromNode) {
        this.insertOrUpdateAccountInfo(p).subscribe(res => {
          this.refreshNodeView(p)
        })
      } else {
        this.updatePersonFriends(p).subscribe(res => {
          this.refreshPersonView(p)
        })
      }
    } else if (this.state == PersonState.edit) {
      this.store.dispatch(action_refreshNodes());
      this.state = PersonState.display;
      // this.dialogRef.close;
    }
  }

  onRelationAccount() {
    let dialogRef = this.dialog.open(AccountComponent, {
      disableClose: true,
    });
    // dialogRef.componentInstance.isInChart = false;
    dialogRef.componentInstance.personID = this.currentPerson.id;
  }

  /**
   * 更新人员所关联的人员，添加或者删除
   * @param p is null 表示删除，否则添加
   * @returns 
   */
  private updatePersonFriends(p: Person) {
    let arr: string[] = this.parseIDs(this.nodePerson.relationPersonIDs);
    if (p) {
      arr.push(p.id);
    } else {
      const i = arr.indexOf(this.currentPerson.id);
      arr.splice(i, 1)
    }
    const ids = JSON.stringify(arr);
    //保存更新的ids，更新人员视图使用
    console.log('ids', ids)
    this.nodePersonIds = ids;
    const data = {
      id: this.nodePerson.id,
      tableName: TableName.PERSON,
      tableData: {
        relationPersonIDs: ids
      }
    }
    console.log('add person friend data', data)
    return this.sqlService.exec(PhpFunctionName.UPDATE, data)
  }

  //   //在账户信息表中插入或更新人员id
  private insertOrUpdateAccountInfo(p: Person) {
    const acc = this.getNodeAccount(this.node)

    const pid = p ? p.id : null;

    const data_update: any = {
      tableName: TableName.ACCOUNT_INFO,
      tableData: { personID: pid },
      id: this.node?.accountInfo?.id
    };

    const data_insert = {
      tableName: TableName.ACCOUNT_INFO,
      tableData: { personID: pid, account: acc, caseID: this.caseID }
    };

    return this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_INFO_BY_ACCOUNT, acc).pipe(

      mergeMap(res => iif(
        () => res.length > 0,
        this.sqlService.exec(PhpFunctionName.UPDATE, data_update),
        this.sqlService.exec(PhpFunctionName.INSERT, data_insert)
      ))
    )
  }

  //更新视图数据
  /**
   * 
   * @param p 人员
   * @param isUpdateAccountInfo 是否更新accountInfo信息
   */
  private refreshNodeView(p: Person, isUpdateAccountInfo = true) {
    toastr.success('设置人员成功');

    const data = this.getRefreshNodeData(p, this.node);
    this.store.dispatch(action_updateNodeSuccess({ data: data }));
    this.dialogRef.close();
  }

  private getRefreshNodeData(p: Person, node: AccountNode) {
    const pid = p ? p.id : null
    const accountInfo = Object.assign({}, node.account, { personID: pid })
    const data: UpdateStr<AccountNode> = {
      id: this.node.id,
      changes: {
        accountInfo: accountInfo,
        person: p
      }
    }
    return data;
  }

  /**
     * 当添加或删除人员后，更新personFriends
     * 人员为空，是删除，
     * @param p 添加后返回的人员
     */
  private refreshPersonView(p: Person) {
    //删除关联人员
    if (this.isFromNode) {
      // 删除节点人员时，直接关闭
      this.dialogRef.close();
    } else {
      //删除后将当前人员设为nodePerson
      this.nodePerson = Object.assign({}, this.nodePerson, { relationPersonIDs: this.nodePersonIds });
      this.currentPerson = this.nodePerson;

      this.state = PersonState.display;
      this.cdr.markForCheck()
    }
    //更新人员的关系人后，人员属性发生变化，要更新节点，重新获取人员信息。
    this.store.dispatch(action_refreshNodes());
  }



  private getNodeAccount(node: AccountNode) {
    return node.oppositeBankNumber ? node.oppositeBankNumber : node.oppositeAccount;
  }
  private parseIDs(ids: string) {
    return Boolean(ids) ? JSON.parse(ids) : [];
  }

  //查询人员是否是节点中的人员
  private getIsFromNode(p: Person) {
    this.store.select(selector_nodes).pipe(take(1)).subscribe(nodes => {
      this.isFromNode = nodes.some(node => node.person?.id == p.id)
    })
  }
}
