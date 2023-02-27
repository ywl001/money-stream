import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import copy from 'fast-copy';
import { take } from 'rxjs';
import { AccountComponent } from 'src/app/account/account.component';
import { AddRecordComponent } from 'src/app/add-record/add-record.component';
import { AccountNode } from 'src/app/app-state/accountNode';
import { action_delNode, action_downloadNodeRaw, action_updateNodeSuccess } from 'src/app/app-state/app.action';
import { selector_isCreateUser, selector_selectedLawcase } from 'src/app/app-state/app.selector';
import { PhpFunctionName } from 'src/app/app-state/phpFunctionName';
import { TableName } from 'src/app/app-state/types';
import { ChangeDurationComponent } from 'src/app/change-duration/change-duration.component';
import { LowerNodeComponent } from 'src/app/lower-node/lower-node.component';
import { PersonComponent } from 'src/app/person/person.component';
import { MessageService } from 'src/app/service/message.service';
import { SqlService } from 'src/app/service/sql.service';
import { UploadAttachmentComponent } from 'src/app/upload-attachment/upload-attachment.component';
import swal from 'sweetalert';
import { FilterComponent } from '../../filter/filter.component';

@Component({
  selector: 'app-node-menu',
  templateUrl: './node-menu.component.html',
  styleUrls: ['./node-menu.component.scss']
})
export class NodeMenuComponent implements OnInit {

  isFirstNode:boolean = false

  isHasAccount:boolean = false;

  isCreateUser$ = this.store.select(selector_isCreateUser);


  constructor(
    public dialog: MatDialog,
    private store: Store,
    private sql: SqlService,
    private message: MessageService,
  ) { }

  @Input()
  data: AccountNode

  private caseID: string;
  private userID: string;

  ngOnInit(): void {

  }

  ngOnChanges(){
    this.isFirstNode = this.data.isFirstNode;
    this.isHasAccount = Boolean(this.data.oppositeAccount) || Boolean(this.data.oppositeBankNumber)
  }

  onDeleteNode() {
    swal('确定要删除该节点吗？', {
      buttons: ['取消', '确定'],
    }).then((val) => {
      if (val) {
        let data = {
          tableName: TableName.TRADE_RECORD,
          ids: this.data.ids.join(','),
          id: this.data.id,
        };
        this.store.dispatch(action_delNode({ data }));
      }
    });
  }

  onSetAccountInfo() {
    let dialogRef = this.dialog.open(AccountComponent, {
      disableClose: true,
    });

    if (this.data.accountInfo) {
      dialogRef.componentInstance.data = copy(this.data.accountInfo);
    } else {
      dialogRef.componentInstance.data = this.data.oppositeBankName ? { account: this.data.oppositeBankName } : { account: this.data.oppositeAccount };
    }
    // if(!this.data.accountInfo)
    //   dialogRef.componentInstance.account = this.data.oppositeBankName ? this.data.oppositeBankName : this.data.oppositeAccount;
    // dialogRef.componentInstance.isInChart = true;
  }

  /**第三方账号 修改 */
  onEditNodeAccount() {
    let dialogRef = this.dialog.open(LowerNodeComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.data = this.data;
  }

    /**设置节点的人员关联 */
    onSetPerson() {
      let disableClose = this.data.personID ? false : true;
      let dialogRef = this.dialog.open(PersonComponent, {
        disableClose: disableClose,
      });
      dialogRef.componentInstance.node = this.data
    }

  onChangNodeDuration() {
    let dialogRef = this.dialog.open(ChangeDurationComponent, {
      disableClose: true,
    });
    dialogRef.componentInstance.data = this.data;
  }

  onDownloadNode() {
    let acc =
      this.data.oppositeBankNumber && this.data.oppositeBankNumber != ''
        ? this.data.oppositeBankNumber
        : this.data.oppositeAccount;

    this.store.dispatch(action_downloadNodeRaw({ account: acc }));

  }

  onUploadAttachment() {
    let dialogRef = this.dialog.open(UploadAttachmentComponent, {
      disableClose: true,
    });
  }

  onMarkTips() {
    if (this.data.accountInfo) {
      const workTips = this.data.accountInfo.workTips;
      const tableData = {
        workTips: workTips == 1 ? 0 : 1
      }
      const data = {
        tableName: TableName.ACCOUNT_INFO,
        tableData: tableData,
        id: this.data.accountInfo.id
      }
      this.sql.exec(PhpFunctionName.UPDATE, data).subscribe(res => {
        if (res) {
          const acc = Object.assign({}, this.data.accountInfo, tableData);
          this.store.dispatch(action_updateNodeSuccess({ data: { id: this.data.id, changes: { accountInfo: acc } } }))
        } else {
          toastr.error('更新失败')
        }
      })
    } else {
      let acc = this.data.oppositeBankNumber
        ? this.data.oppositeBankNumber
        : this.data.oppositeAccount;
      const tableData = {
        workTips: 1,
        account: acc,
        caseID: this.caseID,
        userID: this.userID
      }
      const data = {
        tableName: TableName.ACCOUNT_INFO,
        tableData: tableData
      }
      console.log('insert worktips data', data)
      this.sql.exec(PhpFunctionName.INSERT, data).subscribe(res => {
        if (res && res.length > 0) {
          this.store.dispatch(action_updateNodeSuccess({ data: { id: this.data.id, changes: { accountInfo: res[0] } } }))
        } else {
          toastr.error('更新失败')
        }
      })
    }
  }

  onFilterNode() {
    let dialogRef = this.dialog.open(FilterComponent, { disableClose: true });
    dialogRef.componentInstance.data = this.data;
  }

  onAddrecord() {
    this.store.select(selector_selectedLawcase).pipe(take(1)).subscribe(res => {
      let dialogRef = this.dialog.open(AddRecordComponent, { disableClose: true });
      dialogRef.componentInstance.account = this.data.oppositeAccount;
      dialogRef.componentInstance.caseId = res.id;
    })
  }

}
