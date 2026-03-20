import { Tag }     from './tag.model';
import { SubTask } from './subtask.model';

export interface Task {
  id:        number;
  text:      string;
  priority:  'baixa' | 'media' | 'alta';
  done:      boolean;
  createdAt: string;
  dueDate?:  string;
  notes?:    string;
  tags:      Tag[];
  subTasks:  SubTask[];
}

export interface CreateTask {
  text:     string;
  priority: 'baixa' | 'media' | 'alta';
  done?:    boolean;
  dueDate?: string;
  notes?:   string;
}
