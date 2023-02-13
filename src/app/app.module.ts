import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop'

import {
  NgxMatDateAdapter,
  NgxMatDateFormats,
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NGX_MAT_DATE_FORMATS,
} from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule, NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular-material-components/moment-adapter';
import { FileUploadModule } from 'ng2-file-upload';

import { AppComponent } from './app.component';
import { NodeComponent } from './node/node.component';
import { LawCaseComponent } from './law_case/law-case.component';
import { RecordsComponent } from './records/records.component';
import { StartNodeComponent } from './start-node/start-node.component';
import { AccountDetailComponent } from './node-detail/account-detail.component';
import { ChartComponent } from './chart/chart.component';
import { AddRemarkComponent } from './add-remark/add-remark.component';
import { TimePickerComponent } from './time-picker/time-picker.component';
import { NumberPickerComponent } from './time-picker/number-picker/number-picker.component';
import { ChangeDurationComponent } from './change-duration/change-duration.component';
import { LowerNodeComponent } from './lower-node/lower-node.component';
import { DataGridComponent } from './data-grid/data-grid.component';

import { AgGridModule } from 'ag-grid-angular';
import { ClipboardModule } from 'ngx-clipboard';
import { PersonComponent } from './person/person.component';
import { FilterComponent } from './filter/filter.component';
import { QueryAccountComponent } from './query-account/query-account.component';
import { AngularResizeEventModule } from 'angular-resize-event';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AppEffects } from './app-state/app.effects';
import {
  lawcaseReducer,
  nodeReducer,
  otherDataReducer,
  startAccountReducer,
} from './app-state/app.reducer';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomNgxDatetimeAdapter } from './start-node/customDateAdapter';
import { LoginComponent } from './login/login.component';
import { RemarkComponent } from './remark/remark.component';
import { LineBreakPipe } from './pips/line-break.pipe';
import { AccountComponent } from './account/account.component';

import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_FORMATS,
} from '@angular/material-moment-adapter';
import { CountInfoComponent } from './count-info/count-info.component';
import { AddRecordComponent } from './add-record/add-record.component';
import { ButtonRendererComponent } from './data-grid/button-renderer/button-renderer.component';
import { AddRecordCaseComponent } from './relation-record/relation-record.component';
import { AppInjector } from './app-injector';
import { PersonAccountComponent } from './person/person-account/person-account.component';
import { PersonEditComponent } from './person/person-edit/person-edit.component';
import { PersonDisplayComponent } from './person/person-display/person-display.component';
import { DelWhitespaceDirective } from './del-whitespace.directive';
import { UploadAttachmentComponent } from './upload-attachment/upload-attachment.component';
import { LoadingInterceptor } from './loading.interceptor';


export const MY_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'YYYY-MM-DD HH:mm:ss',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

@NgModule({
  declarations: [
    AppComponent,
    NodeComponent,
    LawCaseComponent,
    RecordsComponent,
    StartNodeComponent,
    AccountDetailComponent,
    ChartComponent,
    AddRemarkComponent,
    TimePickerComponent,
    NumberPickerComponent,
    ChangeDurationComponent,
    LowerNodeComponent,
    DataGridComponent,
    PersonComponent,
    FilterComponent,
    QueryAccountComponent,
    LoginComponent,
    RemarkComponent,
    LineBreakPipe,
    AccountComponent,
    CountInfoComponent,
    AddRecordComponent,
    ButtonRendererComponent,
    AddRecordCaseComponent,
    PersonAccountComponent,
    PersonEditComponent,
    PersonDisplayComponent,
    DelWhitespaceDirective,
    UploadAttachmentComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatRadioModule,
    MatDialogModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatListModule,
    DragDropModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatMomentModule,
    FileUploadModule,
    MatIconModule,
    ClipboardModule,
    AngularResizeEventModule,
    AgGridModule.withComponents([]),

    StoreModule.forRoot({
      lawcase: lawcaseReducer,
      startAccount: startAccountReducer,
      nodes: nodeReducer,
      other: otherDataReducer
    }),
    EffectsModule.forRoot([AppEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 10, // Retains last 25 states
      // logOnly: environment.production, // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
    }),
  ],
  providers: [
    {
      provide: NgxMatDateAdapter,
      useClass: CustomNgxDatetimeAdapter,
      deps: [MAT_DATE_LOCALE, NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: NGX_MAT_DATE_FORMATS, useValue: MY_FORMATS },

    { provide: MAT_DATE_LOCALE, useValue: 'zh-CN' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },

    {provide:HTTP_INTERCEPTORS,useClass:LoadingInterceptor,multi:true}


  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(injector: Injector) {
    AppInjector.setInjector(injector);
  }
}
