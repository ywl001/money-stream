import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { AccountNode } from '../app-state/accountNode';

declare var CircularJSON;

@Injectable({
  providedIn: 'root',
})
export class LocalStorgeService {
  public localStorage: any;

  constructor() {
    if (!window.localStorage) {
      throw new Error('Current browser does not support Local Storage');
    }
    this.localStorage = window.localStorage;
  }

  public set(key: string, value: string): void {
    this.localStorage[key] = value;
  }

  public get(key: string): string {
    return this.localStorage[key] || null;
  }


  public getObject(key: string) {
    if (this.localStorage[key])
      return JSON.parse(this.localStorage[key]);
    return null
  }

  public setObject(key: string, value: any) {
    this.localStorage[key] = JSON.stringify(value)
  }

  public setNode(key: string, value: any): void {
    // console.log('save', value);
    this.localStorage[key] = CircularJSON.stringify(value);
  }

  /**对时间进行moment包装 */
  public getNode(key: string): any {
    let nodes: Array<AccountNode> = CircularJSON.parse(
      this.localStorage[key] || null
    );
    if (!nodes) return null;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      for (let j = 0; j < node.tradeTimes.length; j++) {
        let time = node.tradeTimes[j];
        node.tradeTimes[j] = moment(time);
      }
    }
    return nodes;
  }

  public remove(key: string): any {
    this.localStorage.removeItem(key);
  }

  /**删除包含关键字的所有键 */
  public remove2(keyword: string) {
    Object.keys(this.localStorage).forEach((item) => {
      // console.log(keyword,item)
      if (item.indexOf(keyword) != -1) this.remove(item);
    });
  }
}
