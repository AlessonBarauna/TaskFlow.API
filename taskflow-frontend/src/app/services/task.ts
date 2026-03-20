import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTask } from '../models/task.model';

export interface TaskQueryParams {
  page?:     number;
  limit?:    number;
  priority?: string;
  done?:     boolean;
  search?:   string;
  deleted?:  boolean;
}

export interface PagedResult<T> {
  items:      T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://localhost:5062/api/tasks';

  constructor(private http: HttpClient) {}

  getAll(q: TaskQueryParams = {}): Observable<PagedResult<Task>> {
    let params = new HttpParams();
    if (q.page     != null) params = params.set('page',     q.page);
    if (q.limit    != null) params = params.set('limit',    q.limit);
    if (q.priority != null) params = params.set('priority', q.priority);
    if (q.done     != null) params = params.set('done',     q.done);
    if (q.search   != null && q.search !== '') params = params.set('search', q.search);
    if (q.deleted  != null) params = params.set('deleted',  q.deleted);
    return this.http.get<PagedResult<Task>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  create(task: CreateTask): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  update(id: number, task: CreateTask): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/restore`, {});
  }
}
