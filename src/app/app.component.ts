import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { LawCaseComponent } from './law_case/law-case.component';
import { MessageService } from './service/message.service';

import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as toastr from 'toastr';

import anime from 'animejs/lib/anime.es.js';
import { environment } from 'src/environments/environment';
import { QueryAccountComponent } from './query-account/query-account.component';
import { LocalStorgeService } from './service/local-storge.service';


import { Store } from '@ngrx/store';
import swal from 'sweetalert';
import {
  action_changeNodesLayout,
  action_getConfig,
  action_getCountInfo,
  action_loginFailure,
  action_loginSuccess,
  action_refreshNodes
} from './app-state/app.action';
import {
  selector_countInfo, selector_user
} from './app-state/app.selector';
import { PhpFunctionName } from './app-state/phpFunctionName';
import { CaseState } from './app-state/types';
import { CountInfoComponent } from './count-info/count-info.component';
import { LoginComponent } from './login/login.component';
import { SqlService } from './service/sql.service';
import { WorkTipsComponent } from './work-tips/work-tips.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'fazha';
  caseData$: Observable<any>;

  loginLabel;
  private isLogin: boolean;

  isShowBusyIcon:boolean = true;

  constructor(
    public dialog: MatDialog,
    private messageService: MessageService,
    private store: Store,
    private cdr: ChangeDetectorRef,
    private local: LocalStorgeService,
    private sql:SqlService
  ) {
    console.log(environment.aaa);
  }

  ngOnInit() {
    this.store.dispatch(action_getConfig())

    const user = this.local.getNode('user');

    

    if (user) {
      this.store.dispatch(action_loginSuccess({ user }));
    }

    this.store.select(selector_user).subscribe((user) => {
      // console.log('user login', user);
      if (!user) {
        this.loginLabel = '登录';
        this.isLogin = false;
      } else {
        this.loginLabel = user.realName;
        this.isLogin = true;
      }
      this.cdr.markForCheck();
    });

    this.messageService.isShowBusyIcon$.subscribe(res=>{
      // console.log('is show busy icon',res)
      this.isShowBusyIcon = res
    })

    //统计信息
    this.store.select(selector_countInfo)
      .pipe(
        filter((data) => Boolean(data))
      )
      .subscribe(res => {
        console.log(res)
        let dialogRef = this.dialog.open(CountInfoComponent, {
          width: window.innerWidth + 'px',
          height: window.innerHeight + 'px',
        });
        dialogRef.componentInstance.data = res;
      })
  }

  ngAfterViewInit() { }

  onAddCase() {
    let dialogRef = this.dialog.open(LawCaseComponent, { disableClose: true });
    dialogRef.componentInstance.state = CaseState.ADD;
  }

  //面板开关
  private _isLeftOpen = true;
  onToggleLeft() {
    this.isLeftOpen = !this._isLeftOpen;
  }
  get isLeftOpen() {
    return this._isLeftOpen;
  }
  set isLeftOpen(value) {
    if (value) {
      anime({
        targets: '.leftContainer',
        width: 400,
        duration: 500,
        easing: 'linear',
      });
      anime({
        targets: '#toggleLeft',
        left: 405,
        duration: 500,
        rotate: 0,
        easing: 'linear',
      });
    } else {
      anime({
        targets: '.leftContainer',
        width: 0,
        duration: 500,
      });
      anime({
        targets: '#toggleLeft',
        left: 5,
        rotate: 180,
        duration: 500,
      });
    }
    this._isLeftOpen = !this._isLeftOpen;
  }

  //四个按钮的监听
  //保存图像
  onSaveImage() {
    this.messageService.saveNodeImage();
  }

  //获取统计信息
  onCountPersonInfo() {
    this.store.dispatch(action_getCountInfo())
  }

  //排列类型
  onLayout(e) {
    let value = e.target.innerText == '横向排列';
    e.target.innerText = value ? '纵向排列' : '横向排列';
    this.store.dispatch(action_changeNodesLayout({ isLandscape: value }));
  }

  //重新刷新
  onRefresh() {
    this.store.dispatch(action_refreshNodes());
  }

  //查询账号或人员属于哪个案件
  onQueryAccount() {
    this.dialog.open(QueryAccountComponent);
  }

  onGetWorkTips(){
    this.store.select(selector_user).pipe(take(1)).subscribe(user=>{
      if(user){
        console.log(user)
        this.sql.exec(PhpFunctionName.SELECT_WORK_TIPS,user.id).subscribe(res=>{
          if(res?.length > 0){
            console.log(res)
            let dialogRef = this.dialog.open(WorkTipsComponent, {
              width: window.innerWidth + 'px',
              height: window.innerHeight + 'px',
            });
            dialogRef.componentInstance.data = res;
          }else{
            toastr.info('没有待反馈账号')
          }
        })
      }
    })
    
  }

  onLogin() {
    if (this.isLogin) {
      swal('确定要退出吗？', {
        buttons: ['取消', '确定'],
      }).then((val) => {
        if (val) {
          this.store.dispatch(action_loginFailure());
          this.local.remove('user');
        }
      });
    } else {
      this.dialog.open(LoginComponent);
    }
  }
}
