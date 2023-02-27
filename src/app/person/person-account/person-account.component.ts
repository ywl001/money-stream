import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { map, mergeMap, Subscription, tap } from 'rxjs';
import { AccountComponent } from 'src/app/account/account.component';
import { action_downloadNodeRaw } from 'src/app/app-state/app.action';
import { selector_isCreateUser, selector_nodes } from 'src/app/app-state/app.selector';
import { PhpFunctionName } from 'src/app/app-state/phpFunctionName';
import { AccountInfo, Person, TableName, TradeRecord } from 'src/app/app-state/types';
import { DataGridComponent } from 'src/app/data-grid/data-grid.component';
import { MessageService } from 'src/app/service/message.service';
import { SqlService } from 'src/app/service/sql.service';
import swal from 'sweetalert';

@Component({
  selector: 'app-person-account',
  templateUrl: './person-account.component.html',
  styleUrls: ['./person-account.component.scss']
})
export class PersonAccountComponent implements OnInit {

  @Input()
  person: Person;

  iocnSize = 25;

  // @Output() 

  isFromNode: boolean;

  //人员名下账号
  personAccounts

  relationAccountComplete: Subscription

  isCreateUser: boolean;

  constructor(private sqlService: SqlService,
    private store: Store,
    private dialog: MatDialog,
    private message: MessageService,
    private cdr: ChangeDetectorRef,) { }

  ngOnInit(): void {
    console.log('person accounts init')
    this.store.select(selector_isCreateUser).subscribe(res => this.isCreateUser = res)

    //获取人员名下的卡列表
    this.relationAccountComplete = this.message.relationAccountComplete$.subscribe(res => {
      this.getPersonRelationAccount(this.person)
    })

  }

  ngOnChanges() {
    console.log('person accounts changes', this.person);
    this.getPersonRelationAccount(this.person);
  }

  ngOndestroy() {
    console.log('person account list on destroy');
    this.relationAccountComplete.unsubscribe();
  }

  /**
   * 删除人和账号的关联
   */
  onDelRelationAccount(item) {
    swal('确定要取消人员下的这个账号吗？', {
      buttons: ['取消', '确定'],
    }).then((val) => {
      if (val) {
        const data = {
          id: item.id,
          tableName: TableName.ACCOUNT_INFO,
          tableData: {
            personID: null
          }
        }
        this.sqlService.exec(PhpFunctionName.UPDATE, data).subscribe(res => {
          if (res > 0) {
            this.getPersonRelationAccount(this.person);
          }
        })
      }
    });
  }

  /**
   * 下载账号原数据
   */
  onDownloadRaw(item: AccountInfo) {
    let acc = item.account;
    this.store.dispatch(action_downloadNodeRaw({ account: acc }));
  }

  /**
   * 点击账号，显示交易记录
   */
  onClickShowAccountRecord(accountInfo: AccountInfo) {
    console.log(accountInfo)
    if (Boolean(accountInfo.account)) {
      let dialogRef = this.dialog.open(DataGridComponent, {
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px',
      });
      dialogRef.componentInstance.account = accountInfo.account;
    }
  }

  onClickEditAccount(accountInfo: AccountInfo) {
    console.log('edit account', accountInfo)
    if (this.isCreateUser) {
      let dialogRef = this.dialog.open(AccountComponent, {
        disableClose: true,
      });
      dialogRef.componentInstance.data = accountInfo;
    }
  }

  private getPersonRelationAccount(p: Person) {
    // this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_BY_PERSON, p.id).subscribe(res => {
    //   console.log(res);
    //   if (res && res.length > 0) {
    //     this.personAccounts = res;
    //   } else {
    //     this.personAccounts = []
    //   }
    //   this.cdr.markForCheck();
    // })

    this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_BY_PERSON, p.id).pipe(
      tap((res: AccountInfo[]) => {
        if (res.length == 0) {
          this.personAccounts = []
        } else {
          this.personAccounts = res;
        }
      }),
      tap(x => console.log(x)),
      map(res => res.map(a => a.account).filter(a => a && a.length > 0).join(',')),
      tap(x => console.log(x)),
      mergeMap(res => this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_RELATION_RECORDS, res)),
      tap(x => console.log(x)),
    ).subscribe(res => {
      this.addRelationRecords(this.personAccounts, res);
      this.cdr.markForCheck();
    })
  }

  private addRelationRecords(infos: AccountInfo[], records: TradeRecord[]) {
    console.log('add relation records');
    infos.forEach(a => {
      a.relationRecords = [];
      records.forEach(record => {
        if (a.account == record.account) {
          a.relationRecords.push(record)
        }
      })
    })
  }

  // isHasRelationCase(a:AccountInfo){
  //   if(a.relationRecords?.length == 0){
  //     return false;
  //   }
  //   a.relationRecords.
  // }

  isHas(a: AccountInfo, type: string): boolean {
    for (let i = 0; i < a.relationRecords?.length; i++) {
      const r = a.relationRecords[i];
      if (parseInt(r[type]) > 0) {
        return true;
      }
    }
    return false;
  }

  getRelationCaseTooltip(a: AccountInfo) {
    let str = '';
    let caseNameMap = new Map()
    a.relationRecords.forEach(r => {
      if (parseInt(r.relationCaseID) > 0) {
        caseNameMap.set(r.caseName, r.caseName)
      }
    })

    caseNameMap.forEach((v) => {
      str += v + '\n'
    })
    return str;
  }

  getQuxianTooltip(a: AccountInfo) {
    let cash = 0;
    a.relationRecords.forEach(r => {
      if (r.markMoney == 1) {
        cash += parseInt(r.money + '')
      }
    })
    return `取现${(Math.abs(cash / 10000)).toFixed(2)}万元`
  }

  isNodeAccount(a: string) {
    return this.store.select(selector_nodes).pipe(
      map(nodes => {
        return nodes.some(node => node.oppositeAccount == a || node.oppositeBankNumber == a)
      })
    )
  }

}
