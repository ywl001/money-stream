import { Observable } from "rxjs";

export interface Lawcase {
  id?: string;
  caseName?: string;
  caseNumber?: string;
  caseContent?: string;
  isLocal?:number;
  relationPersons?:Person[];
  money?:string;
  userID?:string;

  /**仅仅是为报告 */
  personMap?:Map<string,Person[]>;
  reportCreator?:string;
}

//案件组件的三张状态
export enum CaseState{
  ADD = 1,
  EDIT = 2,
  RELATION = 3
}

export interface StartNode {
  id?: string;
  caseID?: string;
  userID?: string;
  victimAccount?:string;
  account?: string;
  tradeTime?: string;
  accountName?: string;
  money?: string;
  queryDuration?: string;
  remark?: string;
  commonQueryDuration?: string;
  filter?: string;
}

export interface TradeRecord {
  id?:string;
  account?:string;
  accountBankName?:string;
  accountBankNumber?:string;
  oppositeAccount?:string;
  oppositeBankName?:string;
  oppositeBankNumber?:string;
  oppositeName?:string;
  money?:number;
  leftMoney?:number;
  inOrOut?:string;
  tradeType?:string;
  tradeTime?:string;
  tradeNumber?:string;
  tradeDesc?:string;
  tradeResult?:string;
  caseID?:string;
  payeeName?:string;
  payeeNumber?:string;
  isThird?:string;
  lowerAccount?:string;
  queryDuration?:number;
  tradeBankStationName?:string;
  tradeBankName?:string;
  relationCaseID?:string;
  markMoney?:number;
  isNextNode?:number;

  caseName?:string;
}

export interface filterData{
  money:string;
  
}

export enum TableName {
  TRADE_RECORD = 'trade_record',
  START_ACCOUNT = 'start_account',
  CASE_FOLLOW = 'case_follow',
  USER = 'user',
  LAW_CASE = 'law_case',
  ACCOUNT_INFO = 'account_extension',
  PERSON = 'person',
}

export interface SqlData<T> {
  id?: string;
  tableName?: string;
  tableData?: T;
  idKey?: string;
}

// export interface AccountExtension {
//   id?: string;
//   account?: string;
//   company?: string;
//   isFreeze?: string;
//   personID?: string;
//   caseID?: string;
// }

export interface Person {
  id?: string;
  name?: string;
  gender?:string;
  nation?:string;
  marriage?:string;
  personNumber?: string;
  phoneNumber?: string;
  address?: string;
  currentAddress?:string;
  workplace?:string;
  photoUrl?: string;
  remark?: string;
  isLuodi?: number;
  isDaji?: number;
  relationAccounts?:AccountInfo[]
  photo?:ArrayBuffer ;
  /**
   * 前科情况
   */
  criminalRecord?:string;
  /**
   * 涉嫌罪名
   */
  sue?:string;

  relationPersonIDs?:string

  relationPersons?:Person[];
  isFromNode?:boolean;

  isLawPerson?:number;
}

/**
 * 账户信息
 */
export interface AccountInfo {
  id?: string;
  /**
   * 账户 
   */
  account?: string;
  /**
   * 是否被冻结 
   */
  isFreeze?: number;
  /**
   * 可返现金额 
   */
  returnMoney?: number;
  /**
   * 已返现金额 
   */
  returnedMoney?: number;
  /**
   * 账户所属机构
   */
  company?: string;

  /**
   * 账户所属机构
   */
  createDate?: string;

  /**
   * 取现信息
   */
  cashInfos?: string;
  /**
   * 备注
   */
  remark?: string;

  personID?: string;
  caseID?: string;

  level?: string;

  /**
   * 是否在图表中
   */
  isInChart?:number;

  relationLawcases?:Lawcase[];

  relationRecords?:TradeRecord[];

  cashRecords?:TradeRecord[];

  /**
   * 流水合计
   */
  liushuiCount?:string;

  //对公信息
  isDuigong?:number;

  gongsi?:string;
  gongsiDizhi?:string;
  zhengzhao?:string;
  gongshang?:string;
  dishui?:string;
  guoshui?:string;
}


export interface PersonTable {
  id?: string;
  name?: string;
  person_number?: string;
  phone_number?: string;
  address?: string;
  photo_url?: string;
  remark?: string;
  current_address?: string;
}


export enum PersonViewState {
  display, edit
}

export const LOCALSTORAGE_NODE_KEY_PRE = 'node->>'
export const LOCALSTORAGE_START_NODE_KEY_PRE = 'caseId->>'
export const LOCALSTORAGE_ALL_CASE = 'allCase->>'



export interface User {
  id?: string
  userName: string;
  password?: string;
  unit?: string;
  realName?: string;
  userType?: string;
}
