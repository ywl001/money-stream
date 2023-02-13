import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[del-whitespace]'
})
export class DelWhitespaceDirective {

  constructor(private elr:ElementRef,private control:NgControl) { }

  @HostListener('keydown',['$event'])
  onKeyDown(event){
    if(event.key.trim() === ''){
      event.preventDefault();
    }
  }

  @HostListener('keyup',['$event','$event.target'])
  onKeyUp(event,target){
    if(target.value){
      this.control.control.setValue(target.value.replace(/[^\S\r\n]/g,''))
    }
  }
}
