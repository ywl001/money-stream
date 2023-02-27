import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import * as toastr from 'toastr';
import { PhpFunctionName } from '../app-state/phpFunctionName';
import { Lawcase } from '../app-state/types';
import { MessageService } from '../service/message.service';
import { SqlService } from '../service/sql.service';

@Component({
  selector: 'app-query-account',
  templateUrl: './query-account.component.html',
  styleUrls: ['./query-account.component.scss'],
})
export class QueryAccountComponent {
  value: string;
  results: any[];
  constructor(
    private sql: SqlService,
    private message: MessageService,
    private dialogRef: MatDialogRef<QueryAccountComponent>
  ) {}

  ngOnInit() {}

  onSubmit() {
    this.sql
      .exec(PhpFunctionName.SELECT_LAWCASE_BY_KEYWORD, this.value)
      .subscribe((res) => {
        console.log(res);
        if (res.length == 0) {
          toastr.info('没有找到结果');
        }
        //按照account_extension 表优先排序
        res.sort((a, b) => a.level - b.level);
        this.results = res;
      });
  }

  onClick(e: Lawcase) {
    console.log(e)
    this.message.filterKeyword(e.caseName);
    this.dialogRef.close();
  }
}
