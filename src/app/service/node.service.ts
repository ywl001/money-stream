import { Injectable } from '@angular/core';
import { SqlService } from './sql.service';
import * as moment from 'moment';
import { AccountNode } from '../app-state/accountNode';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import * as toastr from 'toastr';
import { LocalStorgeService } from './local-storge.service';
import { catchError, EMPTY, filter, forkJoin, iif, map, mergeMap, of, Subject, switchMap, tap } from 'rxjs';
import copy from 'fast-copy';
import {
  // AccountExtension,
  AccountInfo,
  LOCALSTORAGE_NODE_KEY_PRE,
  Person,
  SqlData,
  StartNode,
  TableName,
  TradeRecord,
} from '../app-state/types';
import { Store } from '@ngrx/store';
import {
  selector_accountInfos,
  selector_commonQueryDuration,
  selector_nodes,
  selector_selectedStartAccount,
} from '../app-state/app.selector';

import { action_getAccountInfo, action_updateStartNodeSuccess } from '../app-state/app.action';
import { FilterComponent } from '../filter/filter.component';

// import { action_getAccountExtension } from '../app-state/app.action';

@Injectable({
  providedIn: 'root',
})
export class NodeService {

  private caseID: string;

  nodes: Array<AccountNode> = [];
  // firstNode: AccountNode;
  private startAccount: StartNode;
  private waitQueryAccounts: Array<AccountNode> = [];
  private currentAccount: AccountNode;
  private commonQueryDuration: number;

  accountInfos: any[];

  private nodeFilter: any;

  private ok: Subject<AccountNode[]>;

  private isSaveToLocal: boolean = true;

  /**防止死循环map */
  recordMap: Map<string, TradeRecord> = new Map();

  constructor(
    private sqlService: SqlService,
    private localService: LocalStorgeService,
    private store: Store
  ) {
    // console.log('node services construtor');
    //所有节点
    this.store.select(selector_nodes).subscribe((values) => {
      this.nodes = copy(values);
      this.saveDataToLocal()
    });
    //公共查询时长
    this.store.select(selector_commonQueryDuration).subscribe((duration) => {
      this.commonQueryDuration = parseInt(duration);
    });

    this.store
      .select(selector_selectedStartAccount)
      .subscribe((ac) => (this.startAccount = ac));


    // this.store.select(selector_accountInfos).subscribe((extensions) => {
    //   // console.log('extensions', extensions);
    //   if (extensions && extensions.length > 0) {
    //     this.addAccountInfo(this.nodes, extensions);
    //   }
    //   if (this.ok) {
    //     // console.log(this.nodes);
    //     this.ok.next(this.nodes);
    //   }
    // });
    // this.store.select(selector_accountInfos).pipe(
    //   filter(res => res && res.length > 0),
    //   tap(accountInfos => this.addAccountInfo(this.nodes, accountInfos)),
    //   mergeMap(() => this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_RELATION_RECORDS,))
    // )
  }

  ///////////////////////////////////全部数据库中查询节点///////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////

  //设置初始节点
  set data(value: AccountNode) {
    // console.log('node service set data');
    console.log('node service set data,', value)
    this.nodes = [];
    this.recordMap = new Map();
    // this.caseID = value.caseID;
    this.waitQueryAccounts.push(value);
    this.queryNode(value);
  }

  getNodes(firstNode: AccountNode) {
    this.data = copy(firstNode);
    this.ok = new Subject();
    return this.ok.asObservable();
  }

  //查询节点，得到下级节点
  private queryNode(node: AccountNode) {
    this.currentAccount = node;
    this.nodeFilter = node.filter;
    //查询时间
    let time = this.getQueryTime(node);
    //查询账号,对于第三方，如果对端银行卡存在，说明钱进入银行卡了，直接查询银行卡，否则查账号
    let account = this.getQueryAccount(node);

    if (!account || account == 'null' || account == '') {
      //对于账号不存在的清空下，直接查下一个
      this.nextAccount();
    } else {
      let data = {
        startTime: time.start,
        endTime: time.end,
        // caseID: this.caseID,
        account: account,
      };
      console.log(data);
      this.sqlService
        .exec(PhpFunctionName.SELECT_ACCOUNT_OUT_RECROD, data)
        .subscribe((res) => {
          this.processData(res);
        });
    }
  }

  /**获得查询时间 */
  getQueryTime(node: AccountNode) {
    // 从节点的查询时间中获取最早的时间作为查询开始时间
    let startMoment = this.getMinTime(node.tradeTimes);
    let startTime = startMoment.format('YYYY-MM-DD HH:mm:ss');
    //设置查询时长的结束时间
    //如果节点设置有查询时间，按节点自己的查询时间，否则使用公共查询时间（保存在起始账号中）
    if (this.commonQueryDuration == 0 || this.commonQueryDuration == null) {
      this.commonQueryDuration = 10;
    }
    let endTime =
      node.queryDuration && node.queryDuration != 0
        ? startMoment
          .clone()
          .add(node.queryDuration, 'm')
          .format('YYYY-MM-DD HH:mm:ss')
        : startMoment
          .clone()
          .add(this.commonQueryDuration, 'm')
          .format('YYYY-MM-DD HH:mm:ss');
    // console.log(startTime, endTime);
    return { start: startTime, end: endTime };
  }

  //获取多个交易时间中的最小值
  //reduce第一个参数就是上一次调用回调返回的值，或者是提供的初始值。第二个参数就是遍历数组的值
  private getMinTime(datetimes: any[]) {
    return datetimes.reduce((pre, cur) => {
      if (pre.isSameOrBefore(cur)) return pre;
      return cur;
    });
  }

  /**获得查询的账号 */
  private getQueryAccount(node: AccountNode) {
    if (node?.isThird == '1')
      return node.oppositeBankNumber
        ? node.oppositeBankNumber
        : node.oppositeAccount;
    return node.oppositeAccount;
  }

  /**解析查询数据 */
  private processData(res: TradeRecord[]) {
    // console.timeEnd('query')
    console.log('process data ,data is', res)
    if (res && res.length > 0) {
      let nodeMap = new Map();
      for (let i = 0; i < res.length; i++) {
        const item = res[i];
        //设置过滤
        if (this.isFilter(this.nodeFilter, item)) continue;

        //检查node在节点中的唯一性
        if (this.recordMap.has(item.id)) {
          console.log('record map has exists')
          continue;
        } else {
          this.recordMap.set(item.id, null)
        }

        let node: AccountNode;
        let key =
          item.isThird == '1'
            ? item.oppositeAccount + item.oppositeBankNumber + item.payeeName
            : item['oppositeAccount'] + item['tradeType'] + item.payeeName;
        // console.log('key', key);

        if (key) {
          if (nodeMap.has(key)) {
            node = nodeMap.get(key);
            this.createNode(node, item);
          } else {
            node = this.createNode(null, item);
            nodeMap.set(key, node);
            this.waitQueryAccounts.push(node);
          }
        } else {
          node = this.createNode(null, item);
          this.nodes.push(node);
        }
      }
    }
    this.nextAccount();
  }

  /**查看过滤信息 */
  private isFilter(filter: string, item: TradeRecord): boolean {
    if (filter) {
      const filterData = JSON.parse(filter);
      const keys = Object.keys(filterData);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === FilterComponent.KEY_MONEY) {
          console.log('filter by money', item[key], Math.abs(item[key]) < filterData[key])
          return Math.abs(item[key]) < filterData[key];
        }

        if (key == FilterComponent.KEY_KEEP_ACCOUNT) {
          const keepAccounts = filterData[key];

          if (Array.isArray(keepAccounts)) {
            for (let i = 0; i < keepAccounts.length; i++) {
              const filterAccount = keepAccounts[i];
              if (item.oppositeAccount == filterAccount || item.oppositeBankNumber == filterAccount) {
                return false
              }
            }
            return true;
          }
        }

        if (key == FilterComponent.KEY_PREVENT_ACCOUNT) {
          const perventAccount = filterData[key];

          if (Array.isArray(perventAccount)) {
            for (let i = 0; i < perventAccount.length; i++) {
              const filterAccount = perventAccount[i];
              if (item.oppositeAccount == filterAccount || item.oppositeBankNumber == filterAccount) {
                console.log('filter perventAccount')
                return true
              }
            }
            return false;
          }
        }
      }
    }
    return false;

  }

  //根据查询数据，创建节点
  private createNode(node: AccountNode, item: any) {
    if (!node) {
      node = new AccountNode();
      for (const key in item) {
        if (key == 'queryDuration') {
          node[key] = parseFloat(item[key]);
        } else {
          node[key] = item[key];
        }
      }
      node.level = this.currentAccount.level + 1;
      this.currentAccount.children.push(node);
      node.parentAccount = this.currentAccount;
    }
    node.ids.push(item['id']);
    node.moneys.push(parseFloat(item['money']));
    node.tradeTimes.push(moment(item['tradeTime']));
    node.leftMoneys.push(parseFloat(item['leftMoney']));
    node.tradeNumbers.push(item['tradeNumber']);
    node.isShowChild = item['isShowChild'] == 1;
    return node;
  }

  /**查询下一个 知道waitQueryAccountNode 为0 */
  private nextAccount() {
    toastr.info(`查询了账号:${this.currentAccount.oppositeAccount}`);
    toastr.clear();

    //局部更新时，比如查询时间更改，为了不影响排序，不再删除第一个节点，
    //第一个节点存在this.nodes中，如果待查数组中存在，直接删除，不再push到this.nodes中
    if (this.nodeIsExists(this.waitQueryAccounts[0])) {
      this.waitQueryAccounts.shift();
    } else {
      this.nodes.push(this.waitQueryAccounts.shift());
    }

    if (this.waitQueryAccounts.length > 0) {
      this.queryNode(this.waitQueryAccounts[0]);
    } else {
      //查询完毕了。。。
      console.log('query complete ,record map is ', this.recordMap)
      let str = this.nodes
        .map((node) => `'${this.getQueryAccount(node)}'`)
        .filter(a => a && a.length > 0)
        .join(',');
      console.log('account str:', str);
      //获取节点的accountInfo

      forkJoin([
        this.sqlService.exec(PhpFunctionName.GET_ACCOUNT_INFOS, str).pipe(
          tap(res => this.addAccountInfo(this.nodes, res)),
          //把accountInfo数组中的personId转成字符串
          map(res => res.map(res => res.personID).filter(res => Boolean(res)).join(',')),
          tap(res => console.log('personss', res)),

          //添加账号的人员信息
          switchMap(res => this.sqlService.exec(PhpFunctionName.SELECT_PERSON_BY_IDS, res).pipe(
            tap(res => this.addNodePerson(this.nodes, res))
          )),
          //添加错误处理，防止流中断
          catchError(r => of(r))
        ),

        this.sqlService.exec(PhpFunctionName.SELECT_ACCOUNT_RELATION_RECORDS, str).pipe(
          tap(res => this.addRelationRecords(this.nodes, res)),
        )
      ]).subscribe(res => {
        console.log('this ok')
        if (this.ok) {
          console.log(this.nodes);
          this.ok.next(this.nodes);
        }
      })
    }

  }

  private addAccountInfo(nodes: AccountNode[], accountInfos: AccountInfo[]) {
    console.log('account infos', accountInfos)
    accountInfos.forEach((info) => {
      const node = nodes.find(
        (node) =>
          node.oppositeBankNumber == info.account ||
          node.oppositeAccount == info.account
      );

      if (node) {
        // node.isFreeze = info.isFreeze === '1' ? true : false;
        // node.personID = info.personID;
        node.accountInfo = info;
      }
    });
  }

  // private getPersonById(pid:string){
  //   return this.sqlService.exec(PhpFunctionName.SELECT_PERSON_BY_ID,pid).pipe(
  //     tap(res)
  //   )
  // }

  // private getPersonPhoto(p: Person) {
  //   if(p.photoUrl){
  //     return this.http.get(ServerConfig.photoPath + p.photoUrl, { responseType: 'arraybuffer' }).pipe(
  //       tap(res => p.photo = res),
  //       catchError(error=>EMPTY)
  //       );
  //   }
  //   return EMPTY
  // }

  private addNodePerson(nodes: AccountNode[], persons: Person[]) {
    nodes.forEach((node) => {
      if (node.accountInfo?.personID) {
        persons.forEach(p => {
          if (p.id == node.accountInfo.personID) {
            p.isFromNode = true;
            node.person = p;
          }
        })
      }
    });
  }

  private addRelationRecords(nodes: AccountNode[], records: TradeRecord[]) {
    console.log('add relation records');
    nodes.forEach(node => {
      records.forEach(record => {
        if (node.oppositeBankNumber == record.account ||
          node.oppositeAccount == record.account) {
          node.relationRecords.push(record)
        }
      })
    })
  }

  private nodeIsExists(node) {
    if (this.nodes && node) {
      return this.nodes.findIndex((n) => n.id == node.id) > -1;
    }
  }

  ////////////////////////////////////////单节点数据更改后，局部更改数据///////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////
  /**重新查询节点 */
  private reQueryNode(node: AccountNode, nodes: AccountNode[]) {
    // this.recordMap = new Map()
    // 1、清除该节点及其子节点
    this.clearChildNodeByNode(node, nodes);
    //2、把该节点加入到待查数组中
    //注意要清除node中的children中的儿子对象
    node.children = [];
    this.waitQueryAccounts.push(node);
    console.log('after clear,query node is', node)
    //4、查询
    this.queryNode(node);
  }

  /**更改单节点的查询时长 */
  queryDurationChange(value) {
    //根据更新的id，找到更新的节点
    let node = this.nodes.find((n) => n.id == value.id);
    console.log('after query duration change', node.queryDuration)
    // if (node.isFirstNode) {
    //   console.log('frist node change duration')
    //   this.store.dispatch(action_updateStartNodeSuccess({ data: { id: value.id, changes: value.tableData } }))
    // } else {
    //更改节点的查询时间
    node.queryDuration = value.tableData.queryDuration;
    //重新查询
    this.reQueryNode(node, this.nodes);

    this.ok = new Subject();
    return this.ok.asObservable();
    // }
  }

  /**删除节点 */
  delNode(id: string) {
    const node = this.nodes.find((n) => n.id == id);
    this.clearChildNodeByNode(node, this.nodes, true);
    this.saveDataToLocal();
    return of(this.nodes);
  }

  filterNode(data: SqlData<AccountNode>) {
    const node = this.nodes.find((n) => n.id == data.id);
    node.filter = data.tableData.filter;
    this.reQueryNode(node, this.nodes);
    this.ok = new Subject();
    return this.ok.asObservable();
  }

  setLowerNodeAccount(data: SqlData<AccountNode>) {
    //此data的id并不一定等于node的id
    const node = this.nodes.find((node) => {
      const i = node.ids.findIndex((id) => id == data.id);
      if (i > -1) return node;
    });
    console.log(node);
    const parent = this.nodes.find((n) => n.id == node.parentAccount.id);
    this.reQueryNode(parent, this.nodes);

    this.ok = new Subject();
    return this.ok.asObservable();
  }

  setNodeIsFreeze(data: any) {
    // const node = this.nodes.find((n) => n.id == data.id);
    // node.isFreeze = !node.isFreeze;
    // this.saveData();
    return of(this.nodes);
  }

  /**清除该节点及子节点
   * node:父节点
   * nodes:所有节点
   * isDelSelf:是否清除父节点
   */
  private clearChildNodeByNode(
    node: AccountNode,
    nodes: AccountNode[],
    isDelSelf: boolean = false
  ) {
    if (node) {
      console.log('before clear nodes is ', nodes)
      console.log('before clear recordMap is ', this.recordMap)
      let children = this.getNodeAllChild(node);
      console.log('clear child node ,child nodes is,', children)
      if (isDelSelf) children.push(node);
      children.forEach((c) => {
        const i = nodes.findIndex((node) => node.id == c.id);
        if (i >= 0) {
          //记得要删除recordMap中的id，否则在重新设置查询时间时会造成id存在，不继续查询,
          //对账户合并要删除ids中的所以id
          const ids = nodes[i].ids;
          ids.forEach(id=>{
            this.recordMap.delete(id);
          })
          console.log('record map is ', this.recordMap)
          nodes.splice(i, 1);
        }
      });
      console.log('after clear child node, nodes is ', nodes)
      console.log('after clear child node, record map is ', this.recordMap)
    }
  }

  /**保存节点数据到localStorge */
  private saveDataToLocal() {
    if (this.isSaveToLocal && this.startAccount) {
      const key = `${LOCALSTORAGE_NODE_KEY_PRE}${this.startAccount.id}`;
      console.log('save to local firstnode', this.startAccount);
      this.localService.setNode(key, this.nodes);
    }
  }

  //获取节点下所有子节点，不包括节点本身
  private getNodeAllChild(
    node: AccountNode,
    children: Array<AccountNode> = []
  ) {
    const childs = node.children;
    childs.forEach((node) => {
      this.getNodeAllChild(node, children);
      children.push(node);
    });
    return children;
  }
}
