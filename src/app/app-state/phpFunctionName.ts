export class PhpFunctionName {
  /**null */
  static SELECT_ALL_CASE = 'selectAllCase';
  static SELECT_USER_CASE = 'selectUserCase';

  /** caseID */
  static SELECT_START_ACCOUNT = 'selectStartAccount';

  /**{account,startTime,endTime} */
  static SELECT_ACCOUNT_OUT_RECROD = 'selectAccountOutRecord';

  /**insert {tableName,tableData} 返回插入的数据加上插入后的id*/
  static INSERT = 'insert';

  static INSERT_ARRAY = 'insertArray';

  /**update {tableName,tableData,id} */
  static UPDATE = 'update';

  /**del {tableName,id} 返回影响的行数*/
  static DEL = 'del';

  /**{tableName,ids} */
  static DEL_BY_IDS = 'delByIds';

  /**data:账号组成的字符串 */
  static GET_ACCOUNT_INFOS = 'selectAccountExtension';

  static GET_ACCOUNT_RECORD = 'selectAccountRecord';

  static SELECT_PERSON_BY_ID = 'selectPersonById';
  static SELECT_PERSON_BY_IDS = 'selectPersonByIds';

  static SELECT_PERSON_BY_NUMBER = 'selectPersonByNumber';

  /**通过关键字查询所属案件 */
  static SELECT_LAWCASE_BY_KEYWORD = 'selectCaseByKeyword';
  
  static SELECT_COUNT_INFO = 'selectCountInfo';

  static SELECT_CASE_BY_NUMBER = 'selectCaseByCaseNumber';
  static SELECT_CASE_BY_ID = 'selectCaseByCaseID';
  
  /**选择人员名下的涉案账号 */
  static SELECT_ACCOUNT_BY_PERSON = 'selectAccountByPerson';

  static SELECT_PERSON_BY_CASE = 'selectPersonByCase';

  static SELECT_LAWCASE_BY_ACCOUNT = 'selectLawcaseByAccount';
  
  static SELECT_ACCOUNT_LIUSHUI_COUNT = 'selectLiushuiCount';

  static SELECT_ACCOUNT_INFO_BY_ACCOUNT = 'selectAccountInfoByAccont';

  /**
   * 查询账号有关联案件或取现的记录，带account参数
   * data =>string;
   */
  static SELECT_ACCOUNT_RELATION_RECORDS = 'selectAccountRelationRecords';


  static LOGIN = 'login';

  static SELECT_USER = 'selectUser';
  static GET_CREATE_USER = 'selectCreateUser';




  static DEL_RECORD_BY_ACCOUNT = 'delRecordByAccount';
  static SELECT_BY_SQL = 'getSelectResult';
  static SELECT_FOLLOW_CASE = 'selectFollowCase';
  static EDIT_BY_SQL = 'editBySql';
  
  static INSERT_OR_UPDATE = 'insertOrUpdate';
  static SELECT_CASH_RECORDS = 'selectCashRecords';
}
