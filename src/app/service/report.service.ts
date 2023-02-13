import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, mergeMap, Observable, of, tap, concat, catchError, throwError, EmptyError, EMPTY, take } from 'rxjs';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { Lawcase, Person, AccountInfo } from '../app-state/types';
import { ServerConfig } from '../server.config';
import { SqlService } from './sql.service';
import * as toastr from 'toastr';
import { Store } from '@ngrx/store';
import { selector_startAccounts } from '../app-state/app.selector';

/**
 * 给一个案件，按照反诈报告生成，填充案件的数据
 * data是模拟数据
 * 数据模型：树状模型，rxjs的递归获取
 * 案件--》多个嫌疑人--》多个嫌疑账号--》多个关联案件
 */

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient, private sql: SqlService,private store:Store) { }

  getReportData(lawcase: Lawcase) {
    return this.sql.exec(PhpFunctionName.SELECT_PERSON_BY_CASE, lawcase.id).pipe(
      tap((res: Person[]) => {
        if (res.length == 0) {
          toastr.info('案件无可打击人员')
        }
        lawcase.relationPersons = res
      }),
      mergeMap(res => {
        const o = res.map(p => {
          console.log('可打击人员' + p.name)
          return concat(this.getPersonPhoto(p), this.getPersonAccount(p))
        });
        return forkJoin(o)
      }),
      map(res => lawcase),
      mergeMap(lawcase=>this.getCreator(lawcase)),
      map(lawcase => this.checkResult(lawcase))
    )
  }

  private getPersonPhoto(p: Person) {
    if (p.photoUrl) {
      return this.http.get(ServerConfig.photoPath + p.photoUrl, { responseType: 'arraybuffer' }).pipe(
        tap(res => p.photo = res),
        catchError(error => EMPTY)
      );
    }
    return EMPTY
  }

  /**
   * 
   * @param p 人员
   * @returns 人员关联的账号
   */
  private getPersonAccount(p: Person): Observable<any> {
    return this.sql.exec(PhpFunctionName.SELECT_ACCOUNT_BY_PERSON, p.id).pipe(
      tap((res: AccountInfo[]) => p.relationAccounts = res),
      mergeMap(res => {
        const o = res.map(a => {
          return concat(this.getAccountLawcase(a), this.getLiushuiCount(a), this.getCashRecords(a))
        });
        return forkJoin(o)
      })
    )
  }

  /**
   * 
   * @param a 账号
   * @returns 账号关联的案件
   */
  private getAccountLawcase(a: AccountInfo): Observable<Lawcase[]> {
    return this.sql.exec(PhpFunctionName.SELECT_LAWCASE_BY_ACCOUNT, a.account).pipe(
      tap((res: Lawcase[]) => a.relationLawcases = res),
    )
  }

  private getLiushuiCount(a: AccountInfo) {
    return this.sql.exec(PhpFunctionName.SELECT_ACCOUNT_LIUSHUI_COUNT, a.account).pipe(
      tap(res => {
        let liushuiTotal = res[0].total;
        a.liushuiCount = (parseInt(liushuiTotal) / 10000).toFixed(2) + '万'
      })
    )
  }

  private getCashRecords(a: AccountInfo) {
    return this.sql.exec(PhpFunctionName.SELECT_CASH_RECORDS, a.account).pipe(
      tap(res => {
        a.cashRecords = res
      })
    )
  }

  // 对人员分组
  private checkResult(lawcase: Lawcase): Lawcase {
    let persons = lawcase.relationPersons;
    lawcase.personMap = new Map();
    let personMap = lawcase.personMap;
    personMap.set('other', []);
    personMap.set('daji', []);
    personMap.set('luodi', []);
    for (let i = 0; i < persons.length; i++) {
      const p = persons[i];
      if (p.relationPersonIDs == null || p.relationPersonIDs == '[]' || p.relationPersonIDs == '') {
      } else {
        let rp = JSON.parse(p.relationPersonIDs);
        console.log('other',rp)
        if (rp && rp.length > 0) {
          rp.forEach(pid => {
            const otherPerson = persons.find((p) => p.id == pid);
            console.log('other person',otherPerson)
            if (otherPerson) {
              personMap.get('other').push(otherPerson)
            }
          })
        }
      }
    }

    for (let i = 0; i < persons.length; i++) {
      const p = persons[i];
      if (p.isDaji == 1 && personMap.get('other').indexOf(p) == -1) {
        personMap.get('daji').push(p);
      }
    }

    for (let i = 0; i < persons.length; i++) {
      const p = persons[i];
      if (p.isLuodi == 1 && personMap.get('other').indexOf(p) == -1) {
        personMap.get('luodi').push(p);
      }
    }

    return lawcase;
  }

  private getCreator(lawCase:Lawcase){
    return this.store.select(selector_startAccounts).pipe(take(1),
      map(startNodes=>startNodes.map(startNode=>startNode.userID)),
      tap(x=>console.log(x)),
      map(ids=>Array.from(new Set(ids))),
      map(ids=>ids.join(',')),
      tap(x=>console.log(x)),
      mergeMap(ids=>this.sql.exec(PhpFunctionName.GET_CREATE_USER,ids)),
      map(res=>res.map(u=>u.realName)),
      map(res=>res.join('　')),
      tap(x=>console.log(x)),
      tap(res=>lawCase.reportCreator = res),
      map(res=>lawCase)
    )
  }

}
