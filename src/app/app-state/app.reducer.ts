import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import copy from 'fast-copy';
import state from 'sweetalert/typings/modules/state';
import { AccountNode } from './accountNode';
import {
  action_changeNodesLayout,
  action_clearPersons,
  action_delAccountRecordSuccess,
  action_delStartNodeSuccess,
  action_getAccountInfoSuccess,
  // action_getAccountExtensionSuccess,
  action_getAccountRecordSuccess,
  action_getAccountRelationRecordSuccess,
  action_getAllCaseSuccess,
  action_getConfigSuccess,
  action_getCountInfoSuccess,
  action_getNodesSuccess,
  // action_getPersonInfoSuccess,
  action_getStartNodeSuccess,
  action_insertAccountInfoSuccess,
  action_insertCaseSuccess,
  action_insertStartNodeSuccess,
  action_isCreateUser,
  action_loginFailure,
  action_loginSuccess,
  action_relationRecordSuccess,
  action_selectLawcase,
  action_selectNode,
  action_selectStartAccount,
  action_udateAccountInfoSuccess,
  action_updateAccountInfo,
  action_updateLawcaseSuccess,
  action_updateNodeSuccess,
  action_updatePersonSuccess,
  action_updateStartNodeSuccess,
} from './app.action';
import {
  // AccountExtension,
  AccountInfo,
  Lawcase,
  Person,
  StartNode,
  TradeRecord,
  User,
} from './types';

export interface LawcaseState extends EntityState<Lawcase> {
  selectedId?: string | null;
}

export const lawcaseAdapter: EntityAdapter<Lawcase> =
  createEntityAdapter<Lawcase>({});

export const initLawcaseState: LawcaseState = lawcaseAdapter.getInitialState(
  {}
);

export const lawcaseReducer = createReducer(
  initLawcaseState,
  on(action_getAllCaseSuccess, (state, action) =>
    lawcaseAdapter.setAll(action.lawcases, state)
  ),
  on(action_updateLawcaseSuccess, (state, { data }) =>
    lawcaseAdapter.updateOne(data, state)
  ),
  on(action_insertCaseSuccess, (state, action) => {
    return lawcaseAdapter.addOne(action.data, state);
  }),
  on(action_selectLawcase, (state, { id }) => ({
    ...state,
    selectedId: id,
  }))
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface StartAccountState extends EntityState<StartNode> {
  selectedId?: string | null;
}

export const startAccountAdapter: EntityAdapter<StartNode> =
  createEntityAdapter<StartNode>({});

export const initStartAccountState: StartAccountState =
  startAccountAdapter.getInitialState({});

export const startAccountReducer = createReducer(
  initStartAccountState,

  on(action_getStartNodeSuccess, (state, action) =>
    startAccountAdapter.setAll(action.data, { ...state, selectedId: null })
  ),

  on(action_delStartNodeSuccess, (state, action) =>
    startAccountAdapter.removeOne(action.id, { ...state, selectedId: null })
  ),

  on(action_insertStartNodeSuccess, (state, { data }) =>
    startAccountAdapter.addOne(data, {
      ...state,
      selectedId: data.id,
    })
  ),

  on(action_updateStartNodeSuccess, (state, { data }) =>
    startAccountAdapter.updateOne(data, { ...state, selectedId: data.id })
  ),

  on(action_selectStartAccount, (state, action) => ({
    ...state,
    selectedId: action.id,
  }))
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////accountNode///////////////////////////////////////////////////////////

export interface NodeState extends EntityState<AccountNode> {
  selectedId?: string | null;
}

export const nodeAdapter: EntityAdapter<AccountNode> =
  createEntityAdapter<AccountNode>({});

export const initNodeState: NodeState = nodeAdapter.getInitialState({});

export const nodeReducer = createReducer(
  initNodeState,
  on(action_getNodesSuccess, (state, action) =>
    nodeAdapter.setAll(action.nodes, state)
  ),
  on(action_updateNodeSuccess, (state, action) => {
    return nodeAdapter.updateOne(action.data, state);
  }),
  on(action_selectNode, (state, { id }) => ({ ...state, selectedId: id }))
);

// /////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////

export interface OtherDataState {

  /**节点的账户信息  */
  accountInfos?: AccountInfo[];

  currentAccountInfo?: AccountInfo;

  // persons?: Person[];

  relationRecordMap?: Map<string,Array<TradeRecord>>;
  /**
   * 交易记录，双击显示 
   * */
  record?:TradeRecord[];


  isPersonExists?: boolean;

  /**
   * 布局改变，横向，竖向
   */
  isLandscape?: boolean;
  user?: User;
  isCreateUser?: boolean;

  countInfo?: any;

  appConfig?:any;
}

const initOtherState: OtherDataState = {relationRecordMap:new Map() };

export const otherDataReducer = createReducer(
  initOtherState,
  on(action_getAccountInfoSuccess, (state, action) => {
    return { ...state, accountInfos: action.data };
  }),

  on(action_insertAccountInfoSuccess, (state, action) => {
    return { ...state, currentAccountInfo: action.data };
  }),

  on(action_udateAccountInfoSuccess, (state, action) => {
    return { ...state, currentAccountInfo: action.data };
  }),

  on(action_getAccountRecordSuccess, (state, action) => {
    return { ...state, record: action.data };
  }),

  on(action_delAccountRecordSuccess, (state, action) => {
    let r = state.record.slice();
    r.splice(action.rowIndex, 1);
    return { ...state, record: r };
  }),

  on(action_relationRecordSuccess, (state, action) => {
    let r = state.record.slice();
    const i = r.findIndex((p) => p.id == action.data.id);
    r[i] = Object.assign({}, r[i], action.data.changes);
    
    return { ...state, record: r };
  }),

  // on(action_getPersonInfoSuccess, (state, action) => {
  //   let arr = state.persons.slice();
  //   if (action.person && !arr.find((p) => p.id == action.person.id))
  //     arr.push(action.person);
  //   return { ...state, persons: arr };
  // }),

  // on(action_updatePersonSuccess, (state, action) => {
  //   let arr = state.persons.slice();
  //   const i = arr.findIndex((p) => p.id == action.data.id);
  //   arr[i] = Object.assign({}, arr[i], action.data.changes);
  //   console.log('reducer update person', arr);
  //   return { ...state, persons: arr };
  // }),

  on(action_clearPersons, (state, action) => {
    return { ...state, persons: [] };
  }),

  on(action_changeNodesLayout, (state, action) => {
    return { ...state, isLandscape: action.isLandscape };
  }),

  on(action_loginSuccess, (state, action) => {
    return { ...state, user: action.user };
  }),

  on(action_loginFailure, (state, action) => {
    return { ...state, user: null };
  }),

  on(action_isCreateUser, (state, action) => {
    return { ...state, isCreateUser: action.isCreateUser };
  }),

  on(action_getCountInfoSuccess, (state, action) => {
    return { ...state, countInfo: action.countInfo };
  }),

  on(action_getAccountRelationRecordSuccess, (state, action) => {
    let map = copy(state.relationRecordMap);
    if(action.records?.length > 0){
      map.set(action.account,action.records)
    }
    return { ...state, relationRecordMap: map };
  }),

  on(action_getConfigSuccess, (state, action) => {
    return { ...state, appConfig: action.appConfig };
  }),
);
