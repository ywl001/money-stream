import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AccountInfo, Lawcase } from '../app-state/types';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor() {}

  /**保存图片 */
  private _saveNodeImage = new Subject();
  saveNodeImage$ = this._saveNodeImage.asObservable();
  saveNodeImage() {
    this._saveNodeImage.next(null);
  }

  private _reLayoutChart = new Subject();
  reLayoutChart$ = this._reLayoutChart.asObservable();
  reLayoutChart() {
    this._reLayoutChart.next(null);
  }

  private _filterKeyword = new Subject<string>();
  filterKeyword$ = this._filterKeyword.asObservable();
  filterKeyword(keyword:string) {
    this._filterKeyword.next(keyword);
  }

  private _selectCaseComplete = new Subject<Lawcase>();
  selectCaseComplete$ = this._selectCaseComplete.asObservable();
  selectCaseComplete(lawcase:Lawcase) {
    this._selectCaseComplete.next(lawcase);
  }

  private _relationAccountComplete = new Subject<AccountInfo>();
  relationAccountComplete$ = this._relationAccountComplete.asObservable();
  relationAccountComplete(accountInfo:AccountInfo) {
    this._relationAccountComplete.next(accountInfo);
  }

  private _isShowBusyIcon = new Subject<boolean>();
  isShowBusyIcon$ = this._isShowBusyIcon.asObservable();
  isShowBusyIcon(isShow:boolean) {
    this._isShowBusyIcon.next(isShow);
  }



}

