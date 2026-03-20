import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubTask, CreateSubTask, UpdateSubTask } from '../models/subtask.model';

@Injectable({ providedIn: 'root' })
export class SubTaskService {
  private base = 'http://localhost:5062/api/tasks';

  constructor(private http: HttpClient) {}

  create(taskId: number, dto: CreateSubTask): Observable<SubTask> {
    return this.http.post<SubTask>(`${this.base}/${taskId}/subtasks`, dto);
  }

  update(taskId: number, id: number, dto: UpdateSubTask): Observable<SubTask> {
    return this.http.put<SubTask>(`${this.base}/${taskId}/subtasks/${id}`, dto);
  }

  delete(taskId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${taskId}/subtasks/${id}`);
  }
}
