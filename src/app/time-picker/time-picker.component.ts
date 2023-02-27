import { Component, OnInit, ViewChild } from '@angular/core';
import { NumberPickerComponent } from './number-picker/number-picker.component';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {

  @ViewChild('day', { static: true }) day: NumberPickerComponent
  @ViewChild('hour', { static: true }) hour: NumberPickerComponent
  @ViewChild('minute', { static: true }) minute: NumberPickerComponent

  set time(value) {
    this.day.value = Math.ceil(value / 60 / 24);
    this.hour.value = Math.ceil((value - this.day.value * 60 * 24) / 60);
    this.minute.value = value - this.day.value * 60 * 24 - this.hour.value * 60
  }

  get time() {
    return this.day.value * 24 * 60 + this.hour.value * 60 + this.minute.value;
  }
  constructor() { }

  ngOnInit() {
  }

}
