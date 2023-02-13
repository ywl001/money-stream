import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerConfig } from '../server.config';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(private http: HttpClient) { }

  exec(phpFunc,data){
    return this.http.post<any>(ServerConfig.sqlPath, { 'func': phpFunc, 'data': data })
  }
}
