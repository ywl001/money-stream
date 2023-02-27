import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as fileSaver from 'file-saver';
import * as moment from 'moment';
import {
  catchError, EMPTY, filter,
  map,
  mergeMap, switchMap,
  take,
  tap
} from 'rxjs';
import * as toastr from 'toastr';
import { ServerConfig } from '../server.config';
import { FileService } from '../service/file.service';
import { LocalStorgeService } from '../service/local-storge.service';
import { MessageService } from '../service/message.service';
import { NodeService } from '../service/node.service';
import { SqlService } from '../service/sql.service';
import { AccountNode } from './accountNode';
import {
  action_addNode, action_delAccountRecord,
  action_delAccountRecordSuccess,
  action_delNode,
  action_delStartNode,
  action_delStartNodeSuccess,
  action_downloadNodeRaw,
  action_getAccountInfo,
  action_getAccountInfoSuccess,
  // action_getAccountExtension,
  // action_getAccountExtensionSuccess,
  action_getAccountRecord,
  action_getAccountRecordSuccess,
  action_getAccountRelationRecord,
  action_getAccountRelationRecordSuccess,
  action_getAllCase,
  action_getAllCaseSuccess,
  action_getConfig,
  action_getConfigSuccess,
  action_getCountInfo,
  action_getCountInfoSuccess,
  action_getNodes,
  action_getNodesSuccess,
  // action_getPersonById,
  // action_getPersonByNumber,
  // action_getPersonInfoSuccess,
  action_getStartNode,
  action_getStartNodeSuccess,
  action_getUserCase, action_insertCaseSuccess,
  action_insertLawase,
  action_insertStartNode,
  action_insertStartNodeSuccess,
  action_login,
  action_loginFailure,
  action_loginSuccess,
  action_null,
  action_refreshNodes,
  action_registerUser,
  action_relationRecord,
  action_relationRecordSuccess,

  action_test, action_updateLawcase,
  action_updateLawcaseSuccess,
  action_updateLowerAccount,
  action_updateNodeDuration,
  action_updateNodeFilter,
  action_updateNodeFreezeState,
  action_updateNodeRemark,
  action_updateNodeSuccess,
  // action_updatePerson,
  // action_updatePersonSuccess,
  action_updateStartNode,
  action_updateStartNodeSuccess
} from './app.action';
import {
  selector_selectedLawcase, selector_selectedStartAccount
} from './app.selector';
import { PhpFunctionName } from './phpFunctionName';
import { CaseState, LOCALSTORAGE_NODE_KEY_PRE, StartNode, TableName } from './types';

@Injectable()
export class AppEffects {
  constructor(
    private actions$: Actions,
    private sqlService: SqlService,
    private nodeService: NodeService,
    private store: Store,
    private fileService: FileService,
    private localStorge: LocalStorgeService,
    private message: MessageService,
    private http: HttpClient
  ) { }

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_login),
      tap((action) => console.log(action)),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.LOGIN, action.user).pipe(
          tap((a) => console.log(a)),
          map((res) => {
            if (res.length > 0) {
              toastr.success('登录成功');
              this.localStorge.setNode('user', res[0])
              console.log(res[0])
              return action_loginSuccess({ user: res[0] });
            } else {
              toastr.warning('用户名或密码错误');
              return action_loginFailure()
            }
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );

  registerUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_registerUser),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.SELECT_USER, action.data.tableData.userName).pipe(
          tap(res => {
            if (res.length > 0) {
              toastr.warning('用户名已经存在')
            }
          }),
          filter((res) => res.length == 0),
          map(() => action.data)
        )
      ),
      mergeMap((user) =>
        this.sqlService.exec(PhpFunctionName.INSERT, user).pipe(
          tap((res) => {
            if (res.length > 0) {
              toastr.success('注册成功,请登录');
            }
          }),
          map(() => action_test())
        )
      )
    )
  );

  /**获取案件 */
  getAppConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getConfig),
      mergeMap(() =>
        this.http.get('assets/data.json').pipe(
          tap((res) => console.log(res)),
          map((res) => action_getConfigSuccess({ appConfig: res }))
        )
      )
    )
  );

  /**获取案件 */
  getAllcase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getAllCase),
      mergeMap(() =>
        this.sqlService.exec(PhpFunctionName.SELECT_ALL_CASE, null).pipe(
          tap((res) => console.log(res)),
          map((res) => action_getAllCaseSuccess({ lawcases: res }))
        )
      )
    )
  );

  getUserCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getUserCase),
      map(action => action.userId),
      mergeMap((id) =>
        this.sqlService.exec(PhpFunctionName.SELECT_USER_CASE, id).pipe(
          tap((res) => console.log(res)),
          map((res) => action_getAllCaseSuccess({ lawcases: res }))
        )
      )
    )
  );
  /**插入案件 */
  insertCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_insertLawase),
      switchMap((action) =>
        this.sqlService.exec(PhpFunctionName.INSERT, action.data).pipe(
          map((res) => {
            if (action.state == CaseState.ADD) {
              return action_insertCaseSuccess({ data: res[0] })
            } else if (action.state == CaseState.RELATION) {
              console.log('relation lawcase,insert complete')
              this.message.selectCaseComplete(res[0]);
              return action_null();
            }
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );
  /**更新案件 */
  updateLawcase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateLawcase),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, action.data).pipe(
          map((res) => {
            //服务器端返回影响的行数
            if (res) {
              return action_updateLawcaseSuccess({
                data: { id: action.data.id, changes: action.data.tableData },
              });
            }
            return null;
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );

  ///////////////////////////////////////////////////////////起始账号//////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**获取案件起始账号 */
  getStartAccounts = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getStartNode),
      map((action) => action.lawcaseID),
      mergeMap((id) =>
        this.sqlService.exec(PhpFunctionName.SELECT_START_ACCOUNT, id).pipe(
          tap((res) => console.log(res)),
          map((res) => action_getStartNodeSuccess({ data: res }))
        )
      )
    )
  );
  /**删除案件起始账号 */
  delStartAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_delStartNode),
      map((action) => action.data),
      //删除本地缓存中的数据
      tap((data) =>
        this.localStorge.remove(`${LOCALSTORAGE_NODE_KEY_PRE}${data.id}`)
      ),
      mergeMap((data) =>
        this.sqlService
          .exec(PhpFunctionName.DEL, data)
          .pipe(
            map((res) => action_delStartNodeSuccess({ id: data.id }))
          )
      )
    )
  );
  /**插入案件起始账号 */
  insertStartAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_insertStartNode),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService
          .exec(PhpFunctionName.INSERT, data)
          .pipe(
            map((res) => action_insertStartNodeSuccess({ data: res[0] }))
          )
      )
    )
  );
  /**修改起始账号 */
  updateStartAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateStartNode),
      map((action) => action.data),
      //修改起始节点后清理缓存中的节点，重新查询
      tap((data) => {
        this.localStorge.remove(`${LOCALSTORAGE_NODE_KEY_PRE}${data.id}`);
      }),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(
          map(() =>
            action_updateStartNodeSuccess({
              data: { id: data.id, changes: data.tableData },
            })
          )
        )
      )
    )
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////账号节点////////////////////////////////////////////////////////

  /**获取节点 */
  getNodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getNodes),
      map((action) => action.firstNode),
      mergeMap((node) =>
        this.nodeService.getNodes(node).pipe(
          take(1),
          map((res) => action_getNodesSuccess({ nodes: res }))
        )
      )
    )
  );
  /**更新节点备注内容 */
  updateNodeRemark$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateNodeRemark),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(
          map((res) =>
            action_updateNodeSuccess({
              data: { id: data.id, changes: data.tableData },
            })
          )
        )
      )
    )
  );
  /**更新节点查询时长 */
  updateNodeDuration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateNodeDuration),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(map(() => data))
      ),
      tap(data => console.log('update query duration complete return,', data)),
      mergeMap((data) =>
        this.nodeService
          .queryDurationChange(data)
          .pipe(map((nodes) => action_getNodesSuccess({ nodes })))
      )
    )
  );
  /**删除节点 */
  delNode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_delNode),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService
          .exec(PhpFunctionName.DEL_BY_IDS, data)
          .pipe(map(() => data.id))
      ),
      mergeMap((id) =>
        this.nodeService
          .delNode(id)
          .pipe(map((nodes) => action_getNodesSuccess({ nodes })))
      )
    )
  );


  /**更新节点冻结状态 */
  updateFreezeState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateNodeFreezeState),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService
          .exec(PhpFunctionName.INSERT_OR_UPDATE, data)
          .pipe(map(() => data))
      ),
      mergeMap((data) =>
        this.nodeService
          .setNodeIsFreeze(data)
          .pipe(map((nodes) => action_getNodesSuccess({ nodes })))
      )
    )
  );
  /**更改节点的账号 */
  updateNodeAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateLowerAccount),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(map(() => data))
      ),
      mergeMap((data) =>
        this.nodeService
          .setLowerNodeAccount(data)
          .pipe(map((nodes) => action_getNodesSuccess({ nodes })))
      )
    )
  );
  /**更新节点过滤规则 */
  updateNodeFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_updateNodeFilter),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(map(() => data))
      ),
      mergeMap((data) =>
        this.nodeService
          .filterNode(data)
          .pipe(map((nodes) => action_getNodesSuccess({ nodes })))
      )
    )
  );


  /**获取节点所有账号的扩展内容 冻结 人员 */
  // getAccountExtension$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_getAccountExtension),
  //     map((action) => action.data),
  //     mergeMap((data) =>
  //       this.sqlService.exec(PhpFunctionName.GET_ACCOUNT_EXTENSION, data).pipe(
  //         map((res) => {
  //           return action_getAccountExtensionSuccess({ data: res });
  //         })
  //       )
  //     )
  //   )
  // );

  //账号信息
  getAccountInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getAccountInfo),
      map((action) => action.data),
      mergeMap((data) =>
        this.sqlService.exec(PhpFunctionName.GET_ACCOUNT_INFOS, data).pipe(
          map((res) => {
            return action_getAccountInfoSuccess({ data: res });
          })
        )
      )
    )
  );

  // insertAccountInfo$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_insertAccountInfo),
  //     mergeMap(action =>
  //       this.sqlService.exec(PhpFunctionName.INSERT, action.data)
  //         .pipe(
  //           // filter(res => Boolean(action.nodeId)),
  //           // map(res => {
  //           //   return { id: action.nodeId, changes: { accountInfo: res[0] } }
  //           // }),
  //           // map(res => action_updateNodeSuccess({ data: res })
  //           // ))

  //           tap((res) => {
  //             toastr.success('设置账户信息成功')
  //             this.message.relationAccountComplete(res[0])
  //           }),
  //           map(() => action_null())
  //         ))
  //   ));

  // updateAccountInfo$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_updateAccountInfo),
  //     mergeMap((action) =>
  //       this.sqlService.exec(PhpFunctionName.UPDATE, action.data).pipe(
  //         map((res) => {
  //           //生成更新节点的数据，tableData没有id
  //           // let a = copy(action.data.tableData);
  //           let a = Object.assign({}, action.data.tableData, { id: action.data.id })
  //           a.id = action.data.id;
  //           // const updateData: UpdateStr<AccountNode> = { id: action.nodeId, changes: { accountInfo: a } }
  //           // return action_updateNodeSuccess({ data: updateData });
  //           // return action_refreshNodes();
  //           toastr.success('设置账户信息成功')
  //           this.message.relationAccountComplete(res[0])
  //           return action_null();
  //         })
  //       )
  //     )
  //   )
  // );

  getCountInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getCountInfo),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.SELECT_PERSON_INFO, null).pipe(
          map((res) => {
            return action_getCountInfoSuccess({ countInfo: res });
          })
        )
      )
    )
  );

  addRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_addNode),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.INSERT, action.data).pipe(
          map((res) => {
            return action_refreshNodes();
          })
        )
      )
    )
  );

  /**获取账号的出入帐记录 */
  getAccountRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getAccountRecord),
      map((action) => action.account),
      mergeMap((acc) =>
        this.sqlService.exec(PhpFunctionName.GET_ACCOUNT_RECORD, acc).pipe(
          map((res) => {
            console.log(res);
            return action_getAccountRecordSuccess({ data: res });
          })
        )
      )
    )
  );

  delAccountRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_delAccountRecord),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.DEL, { tableName: TableName.TRADE_RECORD, id: action.id }).pipe(
          map((res) => {
            console.log(res);
            return action_delAccountRecordSuccess({ rowIndex: action.rowIndex });
          })
        )
      )
    )
  );

  /**身份证号获取人员 */
  // getPersonByNumber$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_getPersonByNumber),
  //     map((action) => action.pnumber),
  //     mergeMap((pn) =>
  //       this.sqlService.exec(PhpFunctionName.SELECT_PERSON_BY_NUMBER, pn).pipe(
  //         map((res) => {
  //           if (res && res.length > 0) {
  //             return action_getPersonInfoSuccess({ person: res[0] });
  //           } else {
  //             return action_getPersonInfoSuccess({ person: null });
  //           }
  //         })
  //       )
  //     )
  //   )
  // );

  /**人员id获取人员 */
  // getPersonById$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_getPersonById),
  //     map((action) => action.id),
  //     mergeMap((id) =>
  //       this.sqlService.exec(PhpFunctionName.SELECT_PERSON_BY_ID, id).pipe(
  //         map((res) => {
  //           if (res && res.length > 0) {
  //             return action_getPersonInfoSuccess({ person: res[0] });
  //           } else {
  //             return action_getPersonInfoSuccess({ person: null });
  //           }
  //         })
  //       )
  //     )
  //   )
  // );

  /**更新人员 */
  // updatePerson$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_updatePerson),
  //     map((action) => action.data),
  //     mergeMap((data) =>
  //       this.sqlService.exec(PhpFunctionName.UPDATE, data).pipe(
  //         map((res) => {
  //           return action_updatePersonSuccess({
  //             data: {
  //               id: data.id,
  //               changes: data.tableData,
  //             },
  //           });
  //         })
  //       )
  //     )
  //   )
  // );

  /**下载账号元数据 */
  downloadNodeRaw$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(action_downloadNodeRaw),
        map((action) => action.account),
        concatLatestFrom(() => this.store.select(selector_selectedLawcase).pipe(take(1))),
        map(([account, lawcase]) => [
          `${ServerConfig.exclePath}${lawcase.caseNumber}/${account}.xlsx`,
          account,
        ]),
        tap((x) => console.log(x)),
        tap(([url, acc]) =>
          this.fileService.downloadFile(url).subscribe({
            next: (res) => {
              console.log(res);
              fileSaver.saveAs(res, acc + '.xlsx');
            },
            error: (error) => {
              toastr.info('该账户没有原数据');
            },
            complete: () => console.log('complete'),
          })
        )
      ),
    {
      dispatch: false,
    }
  );

  /**全部刷新节点 */
  refreshNodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_refreshNodes),
      mergeMap(() =>
        this.store.select(selector_selectedStartAccount).pipe(
          filter((ac) => Boolean(ac)),
          map((ac) => this.accountToNode(ac)),
          take(1)
        )
      ),
      map((node) => action_getNodes({ firstNode: node }))
    )
  );


  relationRecordCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_relationRecord),
      tap(res => console.log(res.data)),
      mergeMap((action) => this.sqlService.exec(PhpFunctionName.UPDATE, action.data).pipe(
        map(res => action_relationRecordSuccess({ data: { id: action.data.id, changes: action.data.tableData } }))
      ))
    )
  );

  // relationRecordMoney$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(action_relationRecordMoney),
  //     mergeMap((action) =>
  //       this.sqlService.exec(PhpFunctionName.UPDATE, action.data).pipe(
  //         //成功后更新账号ag grid记录数据
  //         map(res => action_relationRecordCaseSuccess({ data: { id: action.data.id, changes: action.data.tableData } })),

  //         // map(()=>{
  //         //   const updateData: UpdateStr<AccountNode> = { id: action.nodeId, changes: { accountInfo: a } }
  //         //     return action_updateNodeSuccess({ data: updateData });
  //         // })

  //       )
  //     )
  //   )
  // );

  getRelationRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(action_getAccountRelationRecord),
      mergeMap((action) =>
        this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_RELATION_RECORDS, action.account).pipe(
          //成功后更新账号ag grid记录数据
          map(res => action_getAccountRelationRecordSuccess({ account: action.account, records: res }))
        )
      )
    )
  );

  private accountToNode(item: StartNode) {
    let startNode: AccountNode = new AccountNode();
    startNode.id = item.id;
    startNode.filter = item.filter;
    startNode.accountName = item.accountName;
    startNode.oppositeAccount = item.account;
    // startNode.caseID = item.caseID;
    startNode.isFirstNode = true;
    startNode.queryDuration = parseInt(item.queryDuration);
    startNode.level = 0;
    startNode.tradeTimes.push(moment(item.tradeTime));
    startNode.ids.push(item.id);
    startNode.moneys.push(item.money);
    startNode.commonQueryDuration = parseInt(item.commonQueryDuration);
    // startNode.remark = item.remark;
    return startNode;
  }

  // private getChangeRelationRecords(node:AccountNode,sqlData:SqlData<TradeRecord>){
  //   const records = node.relationRecords;

  // }
}
