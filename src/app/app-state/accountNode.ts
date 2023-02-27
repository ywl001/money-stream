import { AccountInfo, Person, TradeRecord } from "./types";

export class AccountNode {
  id?: string;
  caseID?: string;
  account?: string;
  accountName?: string;
  parentAccount?: AccountNode;
  ids?: string[] = [];
  children?: AccountNode[] = [];
  moneys?: number[] = [];
  tradeTimes?: any[] = [];
  leftMoneys?: number[] = [];
  tradeNumbers?: number[] = [];

  tradeDesc?: string;
  accountBankName?: string;
  accountBankNumber?: string;
  oppositeAccount?: string;
  oppositeName?: string;
  oppositeBankNumber?: string;
  oppositeBankName?: string;
  inOrOut?: string;
  tradeType?: string;
  tradeResult?: string;
  payeeName?: string;
  payeeNumber?: string;
  tradeBankStationName?: string;
  tradeBankName?: string;
  
  level?: number;
  isFirstNode?: boolean;
  commonQueryDuration?: number;
  queryDuration?: number;
  isThird?: string;
  isLowerNode?: string;
  isShowChild?:boolean;

  // remark?: string;
  // isFreeze?: boolean;
  personID?: string;
  person?:Person;
  filter?: any;

  accountInfo?:AccountInfo

  relationRecords?:TradeRecord[] = [];
  // person?:Person;

  /**获取节点下的所有子节点 */
  static getAllChild(node: AccountNode, children: Array<AccountNode> = []) {
    const childs = node.children;
    childs?.forEach((node) => {
      this.getAllChild(node, children);
      children.push(node);
    });
    return children;
  }
  
}
