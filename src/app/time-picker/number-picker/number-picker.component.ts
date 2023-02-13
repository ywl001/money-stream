import { Component, OnInit, Output,EventEmitter, Input} from '@angular/core';

@Component({
  selector: 'app-number-picker',
  templateUrl: './number-picker.component.html',
  styleUrls: ['./number-picker.component.scss']
})
export class NumberPickerComponent implements OnInit {

  @Input() value: number = 0;
  
  @Input() unit:string;
  @Output() valueChange: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  onIncrease() {
    this.value++;
    this.valueChange.emit({value:this.value,unit:this.unit})
  }

  onDecrease() {
    this.value--;
    if (this.value < 0) this.value = 0;
    this.valueChange.emit({value:this.value,unit:this.unit})
  }
}
