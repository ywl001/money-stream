import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import copy from 'fast-copy';
import * as IDValidator from 'id-validator';
import { FileUploader } from 'ng2-file-upload';
import { map } from 'rxjs';
import { selector_sues } from 'src/app/app-state/app.selector';
import { PhpFunctionName } from 'src/app/app-state/phpFunctionName';
import { Person, TableName } from 'src/app/app-state/types';
import { ServerConfig } from 'src/app/server.config';
import { SqlService } from 'src/app/service/sql.service';
import * as toastr from 'toastr';
import { PersonState } from '../person.component';


@Component({
  selector: 'app-person-edit',
  templateUrl: './person-edit.component.html',
  styleUrls: ['./person-edit.component.scss']
})
export class PersonEditComponent implements OnInit {

  //人员是否已经在数据库
  private isPersonExists: boolean = false;

  private person_old:Person;

  private _person: Person;
  public get person(): Person {
    this._person.isDaji = this.isDaji ? 1 : 0;
    this._person.isLuodi = this.isLuodi ? 1 : 0;
    this._person.isLawPerson = this.isLawPerson ? 1 : 0;
    return this._person;
  }

  @Input()
  public set person(value: Person) {
    if (value) {
      this._person = value;
      this.isDaji = this._person.isDaji == 1;
      this.isLuodi = this._person.isLuodi == 1;
      this.isLawPerson = this._person.isLawPerson == 1
    } else {
      this._person = {}
    }

    this.person_old = copy(value)

    console.log('set person............',value)
  }

  @Input()
  state: PersonState;

  @Input()
  isFromNode: boolean;

  @Output()
  selectPersonComplete: EventEmitter<Person> = new EventEmitter()

  // @Input()
  // isEditPerson: boolean;

  //身份证验证
  private validator = new IDValidator();

  uploader: FileUploader = new FileUploader({
    url: ServerConfig.uploadImagePath,
    itemAlias: 'fileData',
  });

  //人员没有照片时，默认的照片
  noPhoto: string = 'assets/photo.png';

  //提交数据库的photoUrl
  // submitPhotoUrl: string;

  isLawPerson;

  /**
 * 如果人员有照片，该值为服务器目录+地址，如果没有为noPhoto,
 * 表单中绑定的
 */
  get photoUrl() {
    if (this.person?.photoUrl)
      return ServerConfig.photoPath + this.person.photoUrl
    return this.noPhoto;
  }

  // //罪名的列表，从配置获取
  sues$ = this.store.select(selector_sues)
  // //从自动完成选项获取的值
  getSueValue(r: string) {
    if (this.person.sue) {
      return this.person.sue + '、' + r;
    }
    return r;
  }


  //隐藏的文件选择表单
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  //确定按钮的禁用
  btnDisabled: boolean = false;

  //人员除了身份证号其他的可用状态
  formDisabled: boolean = true;

  //可打击人员
  isLuodi: boolean = false;

  //需落地人员
  isDaji: boolean = false;



  ////////////////////////////////////////和表单直接绑定的变量//////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor(private store: Store,
    private sqlService: SqlService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    //文件上传完成后的回调
    this.uploader.response.subscribe((res: string) => {
      this.btnDisabled = false;
      this.person.photoUrl = res;
      const time = new Date().getTime();
      console.log(this.photoUrl);

      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isDaji = this.person.isDaji == 1;
    this.isLuodi = this.person.isLuodi == 1;
    this.isLawPerson = this.person.isLawPerson == 1;

    if (this.state == PersonState.edit) {
      this.formDisabled = false;
    } else if (this.state == PersonState.relation) {
      this.person = {}
      this.formDisabled = true;
    }
  }

  /**
   * 身份证号输入的监听
   * @param value 
   */
  onPersonNumberChange(value: string) {
    // console.log(value)
    if (this.state == PersonState.relation && this.validator.isValid(value)) {
      // console.log('身份证验证通过')
      this.getPersonByNumber(value).subscribe(res => {
        if (res.length > 0) {
          this.person = res[0];
          this.isPersonExists = true;
        } else {
          toastr.info('请继续填写人员信息');
          this.isPersonExists = false;
          this.person.gender = (parseInt(value.substring(16, 17)) % 2 == 0) ? '女' : '男'
          this.person.personNumber = value;
          this.person.nation = '汉族'
          this.formDisabled = false;
        }
        this.cdr.markForCheck();
      })
    } else {
      // console.log('身份证号错误');
      this.formDisabled = true;
      this.cdr.markForCheck();
      toastr.options.preventDuplicates = true;
    }
  }

  onUpload() {
    console.log('upload photo');
    this.fileInput.nativeElement.click();
  }

  onFileSelected(files: any) {
    console.log(this.person.personNumber);
    if (!this.validator.isValid(this.person.personNumber)) {
      toastr.warning('请先输入正确的身份证号,然后才能上传照片');
      return;
    }
    this.btnDisabled = true;
    const extensionName = files[0].name.substr(-4, 4);

    const fileName = this.person.personNumber;
    this.uploader.options.additionalParameter = {
      fileName: fileName + extensionName,
    };
    this.uploader.uploadAll();
  }


  onImgError() {
    console.log('img error');
    // this.photoUrl = 'assets/no_photo.png';
  }

  //提交数据
  onSubmit() {
    if (this.validatePerson()) {
      console.log('isfromNode,', this.isFromNode, '---is person exists', this.isPersonExists, '---state,', this.state, this.person)
      if (this.state == PersonState.relation) {
        if (this.isPersonExists) {
          this.selectPersonComplete.emit(this.person)
        } else {
          this.insertNewPerson().subscribe(res => {
            console.log('insert return person,', res)
            this.selectPersonComplete.emit(res)
          })
        }
      } else if (this.state == PersonState.edit) {
        // this.selectPersonComplete.emit(this.person)
        this.updatePerson()
          .subscribe(r => {
            console.log(r)
            if(r){
              this.selectPersonComplete.emit(this.person)
            }else{
              toastr.warning('更新人员失败');
            }
          })
      }
    }
  }

  private validatePerson() {
    if (!this.validator.isValid(this.person.personNumber)) {
      toastr.warning('请输入正确的身份证号');
      return false;
    }

    if (!this.person.name || this.person.name == '') {
      toastr.warning('请输入人员姓名');
      return false;
    }
    return true;
  }

  private getPersonByNumber(personNumber: string) {
    return this.sqlService.exec(
      PhpFunctionName.SELECT_PERSON_BY_NUMBER,
      personNumber
    );
  }

  //插入新人员，返回插入的人员信息
  private insertNewPerson() {
    const data = {
      tableName: TableName.PERSON,
      tableData: this.person,
    };
    return this.sqlService.exec(PhpFunctionName.INSERT, data).pipe(
      // 插入新人员后为保存数据
      map(res => res[0]),
    );
  }

  //更新人员
  private updatePerson() {
    //保存提交后的人员数据
    const p = this.getPersonChanges(this.person_old,this.person)
 
    const data = {
      tableName: TableName.PERSON,
      tableData: p,
      id: this.person.id,
    };
    console.log(data)

    return this.sqlService.exec(PhpFunctionName.UPDATE, data)
  }

  private getPersonChanges(oldPerson:Person,newPerson:Person){
    let p:Person = {}
    const compareKey = ['id','name','personNumber','gender','phoneNumber','address','photoUrl','remark','currentAddress','isDaji','isLuodi','marriage','nation','sue','criminalRecord','workplace','relationPersonIDs','isLawPerson']
    for(let key of compareKey){
      if(oldPerson[key] != newPerson[key]){
        p[key] = newPerson[key]
      }
    }
    console.log(p)
    return p;
  }
}
