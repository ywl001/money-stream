import { UpdateStr } from '@ngrx/entity/src/models';
import { createAction, props } from '@ngrx/store';
import { AccountNode } from './accountNode';
import { InsertPersonData } from '../person/person.component';
import {
  Lawcase,
  StartNode,
  SqlData,
  Person,
  TradeRecord,
  CaseState,
  User,
  AccountInfo,
  TableName,
} from './types';

export enum ActionType {
  //案件
  GET_ALL_LAWCASE = 'getAllCase',
  GET_ALL_LAWCASE_SUCCESS = 'getAllCaseSuccess',
  GET_USER_LAWCASE = 'getUserCase',
  GET_USER_LAWCASE_SUCCESS = 'getUserCaseSuccess',
  INSERT_LAWCASE = 'insertLawcase',
  INSERT_LAWCASE_SUCCESS = 'insertLawcaseSuccess',
  UPDATE_LAWCASE = 'updateLawcase',
  UPDATE_LAWCASE_SUCCESS = 'updateLawcaseSuccess',
  SELECT_LAWCASE = 'selectLawcase',

  //起始节点
  GET_START_ACCOUNTS = 'getLawcaseStartNode',
  GET_START_ACCOUNTS_SUCCESS = 'getLawcaseStartNodeSuccess',
  INSERT_STARTACCOUNT = 'insertstartAccount',
  INSERT_STARTACCOUNT_SUCCESS = 'insertstartAccountSuccess',
  DEL_STARTACCOUNT = 'delstartAccount',
  DEL_STARTACCOUNT_SUCCESS = 'delstartAccountSuccess',
  UPDATE_STARTACCOUNT = 'updateStartNode',
  UPDATE_STARTACCOUNT_SUCCESS = 'updateStartNodeSuccess',
  SELECT_STARTACCOUNT = 'selectStartNode',

  //节点
  GET_NODES = 'getNodes',
  GET_NODES_SUCCESS = 'getNodesSuccess',
  UPDATE_NODE_REMARK = 'updateNodeRemark',
  UPDATE_NODE_REMARK_SUCCESS = 'updateNodeRemarkSuccess',
  UPDATE_NODE_QUERY_DURATION = 'updateNodeQueryDuration',
  UPDATE_NODE_QUERY_DURATION_SUCCESS = 'updateNodeQueryDurationSuccess',
  DEL_NODE = 'delNode',
  DEL_NODE_SUCCESS = 'delNodeSuccess',
  UPDATE_NODE_FREEZE_STATE = 'updateNodeFreezeState',
  UPDATE_LOWER_ACCOUNT = 'updateLowerAccount',
  UPDATE_NODE_FILTER = 'updateNodeFilter',
  SELECT_NODE = 'selectNode',
  REFRESH_NODES = 'refreshNodes',
  ADD_NODE = 'addNode',
  ADD_NODE_SUCCESS = 'addNodeSuccess',

  // GET_ACCOUNT_EXTENTION = 'getAccountExtention',
  // GET_ACCOUNT_EXTENTION_SUCCESS = 'getAccountExtentionSuccess',

  //账户信息
  GET_ACCOUNT_INFO = 'getAccountInfo',
  GET_ACCOUNT_INFO_SUCCESS = 'getAccountInfoSuccess',
  INSERT_ACCOUNT_INFO = 'insertAccountInfo',
  INSERT_ACCOUNT_INFO_SUCCESS = 'insertAccountInfoSuccess',
  UPDATE_ACCOUNT_INFO = 'updateAccountInfo',
  UPDATE_ACCOUNT_INFO_SUCCESS = 'updateAccountInfoSuccess',

  GET_PERSON_BY_ID = 'getPersonInfo',
  GET_PERSON_BY_NUMBER = 'getPersonInfo2',
  GET_PERSON_SUCESS = 'getPersonSuccess',
  UPDATE_PERSON = 'updatePerson',
  UPDATE_PERSON_SUCCESS = 'updatePersonSuccess',
  IS_PERSON_EXISTS = 'isPersonExists',
  CLEAR_PERSONList = 'clearPersons',

  GET_RELATION_RECORD = 'getRelationRecord',
  GET_RELATION_RECORD_SUCCESS = 'getRelationRecordSuccess',

  //账号的交易记录
  GET_ACCOUNT_RECORD = 'getAccountRecord',
  GET_ACCOUNT_RECORD_SUCCESS = 'getAccountRecordSuccess',
  DEL_ACCOUNT_RECORD = 'delAccountRecord',
  DEL_ACCOUNT_RECORD_SUCCESS = 'delAccountRecordSuccess',

  INSERT_PERSON = 'insertPerson',
  DOWNLOAD_NODE_RAW = 'downloadNodeRaw',
  CHANG_NODES_LAYOUT = 'changeNodesLayout',
  SAVE_CHART_IMAGE = 'saveChartImage',
  LOGIN = 'login',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'loginFailure',
  REGISTER_USER = 'registerUser',
  REGISTER_USER_SUCCESS = 'registerUserSuccess',
  IS_CREATE_USER = 'isCreateUser',

  GET_COUNT_INFO = 'getCountInfo',
  GET_COUNT_INFO_SUCCESS = 'getCountInfoSuccess',

  RELATION_RECORD_CASE = 'relationRecordCase',
  RELATION_RECORD_CASE_SUCCESS = 'relationRecordCaseSuccess',

  RELATION_RECORD_MONEY = 'relationRecordMoney',
  RELATION_RECORD_MONEY_SUCCESS = 'relationRecordMoneySuccess',

  GET_APP_CONFIG = 'getAppConfig',
  GET_APP_CONFIG_SUCCESS = 'getAppConfigSuccess',

}
export const action_test = createAction('testaaa');

////////////////////////////////////////////////案件action////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//获取案件列表
export const action_getAllCase = createAction(ActionType.GET_ALL_LAWCASE);
export const action_getAllCaseSuccess = createAction(
  ActionType.GET_ALL_LAWCASE_SUCCESS,
  props<{ lawcases: Lawcase[] }>()
);

export const action_getUserCase = createAction(
  ActionType.GET_USER_LAWCASE,
  props<{ userId: string }>()
);

export const action_getUserCaseSuccess = createAction(
  ActionType.GET_USER_LAWCASE_SUCCESS,
  props<{ lawcases: Lawcase[] }>()
);

//插入案件
export const action_insertLawase = createAction(
  ActionType.INSERT_LAWCASE,
  props<{ data: SqlData<Lawcase> ,state:CaseState }>()
);
export const action_insertCaseSuccess = createAction(
  ActionType.INSERT_LAWCASE_SUCCESS,
  props<{ data: Lawcase }>()
);
/**更新案件信息*/
export const action_updateLawcase = createAction(
  ActionType.UPDATE_LAWCASE,
  props<{ data: SqlData<Lawcase>,state:CaseState }>()
);
export const action_updateLawcaseSuccess = createAction(
  ActionType.UPDATE_LAWCASE_SUCCESS,
  props<{ data: UpdateStr<Lawcase> }>()
);

export const action_selectLawcase = createAction(
  ActionType.SELECT_LAWCASE,
  props<{ id: string }>()
);

////////////////////////////////////////////////起始账号action////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const action_getStartNode = createAction(
  ActionType.GET_START_ACCOUNTS,
  props<{ lawcaseID: string }>()
);
export const action_getStartNodeSuccess = createAction(
  ActionType.GET_START_ACCOUNTS_SUCCESS,
  props<{ data: StartNode[] }>()
);

export const action_insertStartNode = createAction(
  ActionType.INSERT_STARTACCOUNT,
  props<{ data: SqlData<StartNode> }>()
);

export const action_insertStartNodeSuccess = createAction(
  ActionType.INSERT_STARTACCOUNT_SUCCESS,
  props<{ data: StartNode }>()
);

export const action_updateStartNode = createAction(
  ActionType.UPDATE_STARTACCOUNT,
  props<{ data: SqlData<StartNode> }>()
);

export const action_updateStartNodeSuccess = createAction(
  ActionType.UPDATE_STARTACCOUNT_SUCCESS,
  props<{ data: UpdateStr<StartNode> }>()
);

export const action_delStartNode = createAction(
  ActionType.DEL_STARTACCOUNT,
  props<{ data: SqlData<StartNode> }>()
);

export const action_delStartNodeSuccess = createAction(
  ActionType.DEL_STARTACCOUNT_SUCCESS,
  props<{ id: string }>()
);

export const action_selectStartAccount = createAction(
  ActionType.SELECT_STARTACCOUNT,
  props<{ id: string }>()
);

//////////////////////////////////////node action///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const action_getNodes = createAction(
  ActionType.GET_NODES,
  props<{ firstNode: AccountNode }>()
);

export const action_getNodesSuccess = createAction(
  ActionType.GET_NODES_SUCCESS,
  props<{ nodes: AccountNode[] }>()
);

export const action_updateNodeRemark = createAction(
  ActionType.UPDATE_NODE_REMARK,
  props<{ data: SqlData<AccountNode> }>()
);
export const action_updateNodeSuccess = createAction(
  ActionType.UPDATE_NODE_REMARK_SUCCESS,
  props<{ data: UpdateStr<AccountNode> }>()
);
export const action_updateNodeDuration = createAction(
  ActionType.UPDATE_NODE_QUERY_DURATION,
  props<{ data: SqlData<AccountNode> }>()
);
export const action_updateNodeDurationSuccess = createAction(
  ActionType.UPDATE_NODE_QUERY_DURATION_SUCCESS,
  props<{ node: AccountNode }>()
);
export const action_delNode = createAction(
  ActionType.DEL_NODE,
  props<{ data: SqlData<AccountNode> }>()
);

export const action_delNodeSuccess = createAction(
  ActionType.DEL_NODE_SUCCESS,
  props<{ id: string }>()
);

export const action_updateNodeFreezeState = createAction(
  ActionType.UPDATE_NODE_FREEZE_STATE,
  props<{ data: any }>()
);

export const action_updateLowerAccount = createAction(
  ActionType.UPDATE_LOWER_ACCOUNT,
  props<{ data: SqlData<AccountNode> }>()
);

export const action_updateNodeFilter = createAction(
  ActionType.UPDATE_NODE_FILTER,
  props<{ data: SqlData<AccountNode> }>()
);

export const action_selectNode = createAction(
  ActionType.SELECT_NODE,
  props<{ id: string }>()
);

export const action_refreshNodes = createAction(ActionType.REFRESH_NODES);

//////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////other action////////////////////////////////////////////////////
// export const action_getAccountExtension = createAction(
//   ActionType.GET_ACCOUNT_EXTENTION,
//   props<{ data: string }>()
// );

// export const action_getAccountExtensionSuccess = createAction(
//   ActionType.GET_ACCOUNT_EXTENTION_SUCCESS,
//   props<{ data: AccountInfo[] }>()
// );

//账户信息操作action
export const action_getAccountInfo = createAction(
  ActionType.GET_ACCOUNT_INFO,
  props<{ data: string }>()
);

export const action_getAccountInfoSuccess = createAction(
  ActionType.GET_ACCOUNT_INFO_SUCCESS,
  props<{ data: AccountInfo[] }>()
);

/**
 * 插入节点账号信息，带节点数据，插入后要更新节点数据，accountInfo是accountNode的属性
 */
export const action_insertAccountInfo = createAction(
  ActionType.INSERT_ACCOUNT_INFO,
  props<{ data: SqlData<AccountInfo>}>()
);

export const action_insertAccountInfoSuccess = createAction(
  ActionType.INSERT_ACCOUNT_INFO_SUCCESS,
  props<{ data: AccountInfo }>()
);

export const action_updateAccountInfo = createAction(
  ActionType.UPDATE_ACCOUNT_INFO,
  props<{ data: SqlData<AccountInfo> }>()
);

export const action_udateAccountInfoSuccess = createAction(
  ActionType.UPDATE_ACCOUNT_INFO_SUCCESS,
  props<{ data: AccountInfo }>()
);

export const action_getConfig = createAction(
  ActionType.GET_APP_CONFIG
);

export const action_getConfigSuccess = createAction(
  ActionType.GET_APP_CONFIG_SUCCESS,
  props<{ appConfig: any }>()
);



//人员action
// export const action_getPersonById = createAction(
//   ActionType.GET_PERSON_BY_ID,
//   props<{ id: string }>()
// );

// export const action_getPersonByNumber = createAction(
//   ActionType.GET_PERSON_BY_NUMBER,
//   props<{ pnumber: string }>()
// );

// export const action_getPersonInfoSuccess = createAction(
//   ActionType.GET_PERSON_SUCESS,
//   props<{ person: Person }>()
// );

// export const action_updatePerson = createAction(
//   ActionType.UPDATE_PERSON,
//   props<{ data: SqlData<Person> }>()
// );

export const action_updatePersonSuccess = createAction(
  ActionType.UPDATE_PERSON_SUCCESS,
  props<{ data: UpdateStr<Person> }>()
);

export const action_isPersonExists = createAction(
  ActionType.IS_PERSON_EXISTS,
  props<{ isExists: boolean }>()
);

export const action_clearPersons = createAction(ActionType.CLEAR_PERSONList);

//获取账号在数据库中的记录
export const action_getAccountRecord = createAction(
  ActionType.GET_ACCOUNT_RECORD,
  props<{ account: string }>()
);

export const action_getAccountRecordSuccess = createAction(
  ActionType.GET_ACCOUNT_RECORD_SUCCESS,
  props<{ data: TradeRecord[] }>()
);

export const action_delAccountRecord = createAction(
  ActionType.DEL_ACCOUNT_RECORD,
  props<{ id:number,rowIndex:number }>()
);

export const action_delAccountRecordSuccess = createAction(
  ActionType.DEL_ACCOUNT_RECORD_SUCCESS,
  props<{rowIndex:number}>()
);

export const action_insertPerson = createAction(
  ActionType.INSERT_PERSON,
  props<{ data: InsertPersonData }>()
);

export const action_downloadNodeRaw = createAction(
  ActionType.DOWNLOAD_NODE_RAW,
  props<{ account: string }>()
);

export const action_changeNodesLayout = createAction(
  ActionType.CHANG_NODES_LAYOUT,
  props<{ isLandscape: boolean }>()
);

export const action_saveChartImage = createAction(ActionType.SAVE_CHART_IMAGE);

export const action_login = createAction(
  ActionType.LOGIN,
  props<{ user: User }>()
);

export const action_loginSuccess = createAction(
  ActionType.LOGIN_SUCCESS,
  props<{ user: User }>()
);

export const action_loginFailure = createAction(ActionType.LOGIN_FAILURE);

export const action_registerUser = createAction(
  ActionType.REGISTER_USER,
  props<{ data: SqlData<User> }>()
);

export const action_registerUseSuccess = createAction(
  ActionType.REGISTER_USER_SUCCESS,
  props<{ user: User }>()
);

export const action_isCreateUser = createAction(
  ActionType.IS_CREATE_USER,
  props<{ isCreateUser: boolean }>()
);

export const action_getCountInfo = createAction(
  ActionType.GET_COUNT_INFO,
);

export const action_getCountInfoSuccess = createAction(
  ActionType.GET_COUNT_INFO_SUCCESS,
  props<{ countInfo: any }>()
);

export const action_addNode = createAction(
  ActionType.ADD_NODE,
  props<{ data: SqlData<TradeRecord> }>()
);

export const action_addNodeSuccess = createAction(
  ActionType.ADD_NODE_SUCCESS,
  props<{ data: TradeRecord }>()
);

export const action_relationRecord = createAction(
  ActionType.RELATION_RECORD_CASE,
  props<{ data: SqlData<TradeRecord>}>()
);

export const action_relationRecordSuccess = createAction(
  ActionType.RELATION_RECORD_CASE_SUCCESS,
  props<{ data:UpdateStr<TradeRecord> }>()
);

// export const action_relationRecordMoney = createAction(
//   ActionType.RELATION_RECORD_MONEY,
//   props<{ data: SqlData<TradeRecord> }>()
// );

// export const action_relationRecordMoneySuccess = createAction(
//   ActionType.RELATION_RECORD_MONEY_SUCCESS,
//   props<{ data:UpdateStr<TradeRecord> }>()
// );

export const action_getAccountRelationRecord = createAction(
  ActionType.GET_RELATION_RECORD,
  props<{account:string}>()
);

export const action_getAccountRelationRecordSuccess = createAction(
  ActionType.GET_RELATION_RECORD_SUCCESS,
  props<{account:string,records:TradeRecord[]}>()
);


export const action_null = createAction(
  'null',
);
