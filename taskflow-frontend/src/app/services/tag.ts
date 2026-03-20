import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag, CreateTag } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private apiUrl = 'http://localhost:5062/api/tags';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl);
  }

  create(tag: CreateTag): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, tag);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addToTask(tagId: number, taskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tagId}/tasks/${taskId}`, {});
  }

  removeFromTask(tagId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tagId}/tasks/${taskId}`);
  }
}
