import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { AccountNode } from 'src/app/app-state/accountNode';
import { selector_isCreateUser } from 'src/app/app-state/app.selector';
import { PhpFunctionName } from 'src/app/app-state/phpFunctionName';
import { Person } from 'src/app/app-state/types';
import { ServerConfig } from 'src/app/server.config';
import { SqlService } from 'src/app/service/sql.service';

@Component({
  selector: 'app-person-display',
  templateUrl: './person-display.component.html',
  styleUrls: ['./person-display.component.scss']
})
export class PersonDisplayComponent implements OnInit {

  @Input()
  nodePerson: Person;

  person: Person;

  //人员没有照片时，默认的照片
  noPhoto: string = 'assets/photo.png';


  public get photoUrl(): string {
    if (this.person.photoUrl)
      return ServerConfig.photoPath + this.person.photoUrl
    return this.noPhoto;
  }

  btnDisabled: boolean;

  personFriends: Person[];

  isCreateUser: boolean;


  @Output()
  personChange: EventEmitter<Person> = new EventEmitter();

  @Output()
  removeRelationPerson: EventEmitter<null> = new EventEmitter();

  @Output()
  relationPerson: EventEmitter<null> = new EventEmitter();

  @Output()
  editPerson: EventEmitter<null> = new EventEmitter();

  @Output()
  relationAccount:EventEmitter<null> = new EventEmitter();

  friendIconTooltip(p: Person) {
    return p.name
  }

  constructor(private store: Store,
    private cdr: ChangeDetectorRef,
    private sqlService: SqlService) {
    this.store.select(selector_isCreateUser).subscribe(res => this.isCreateUser = res)
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('person display changes', changes);
    this.person = this.nodePerson;
    this.getPersonFriends(this.nodePerson);
  }

  //点击按钮编辑
  onEditPeople() {
    // console.log('edit person isfromnode:', this.isFromNode)
    // this.state = PersonState.edit;
    // this.formDisabled = false;
    // console.log(this.personPhotoUrl)
    // this.isEditPeople = true;
    this.editPerson.emit()
  }

  /**取消人员和账户的关联 */
  onDelPeople() {
    this.removeRelationPerson.emit()
  }

  /**
* 关联其他账号
*/
  onRelationAccount() {
    console.log('show relation account')
    this.relationAccount.emit()
  }


  onRelationPerson() {
    // this.state = PersonState.relation;
    // this.clearForm();
    // this.isFromNode = false;
    // this.personPhotoUrl = null;
    this.relationPerson.emit();
  }

  //点击关联的人员小图标
  onClickPersonFriend(p: Person) {
    // this.isFromNode = p.isFromNode;
    // this.setCurrentPerson(p, PersonState.display);
    this.person = p;


    this.personChange.emit(p);
  }

  onImgError() {
    console.log('img error');

  }


  onImgError2(p) {
    if (p.isFromNode) {
      return 'assets/mainPerson.png'
    }
    if (p.gender == '男') {
      return 'assets/man.png'
    } else {
      return 'assets/woman.png'
    }
  }

  getPersonIcon(p: Person) {
    if (p.photoUrl) {
      return ServerConfig.photoPath + p.photoUrl
    }
    if (p.isFromNode) {
      return 'assets/mainPerson.png'
    }
    if (p.gender == '男') {
      return 'assets/man.png'
    } else {
      return 'assets/woman.png'
    }
  }

  private getPersonFriends(p: Person) {
    const arr = this.parseIDs(p.relationPersonIDs)
    if (arr?.length > 0) {
      const ids = arr.join(',')
      this.sqlService.exec(PhpFunctionName.SELECT_PERSON_BY_IDS, ids).subscribe(res => {
        console.log('get relation persons ', res)
        if (res.length > 0) {
          this.personFriends = [];
          this.personFriends.push(this.nodePerson);
          this.personFriends = this.personFriends.concat(res);
          this.cdr.markForCheck();
        }
      })
    } else {
      this.personFriends = [];
      this.cdr.markForCheck();
    }
  }



  private parseIDs(ids: string) {
    if (ids) {
      return JSON.parse(ids);
    }
    return [];
  }

  private getNodeAccount(node: AccountNode) {
    return node.oppositeBankNumber ? node.oppositeBankNumber : node.oppositeAccount;
  }

}
