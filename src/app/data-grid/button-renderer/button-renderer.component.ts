import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import { action_delAccountRecord } from 'src/app/app-state/app.action';
import { TableName } from 'src/app/app-state/types';
import swal from 'sweetalert';

@Component({
  selector: 'app-button-renderer',
  templateUrl: './button-renderer.component.html',
  styleUrls: ['./button-renderer.component.scss']
})
export class ButtonRendererComponent implements OnInit,ICellRendererAngularComp {

  params:ICellRendererParams;

  constructor(private store:Store) { }
  refresh(params: ICellRendererParams): boolean {
    console.log(params);
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params
  }

  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
  }

  onClick(e){
    console.log(this.params);
    if(this.params.data?.id){
      swal('确定要删除该记录吗？', {
        buttons: ['取消', '确定'],
      }).then((val) => {
        this.store.dispatch(action_delAccountRecord({id:this.params.data.id,rowIndex:this.params.rowIndex}))
      });
    }
  }
}
