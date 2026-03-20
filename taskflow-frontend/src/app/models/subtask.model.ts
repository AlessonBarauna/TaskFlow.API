export interface SubTask {
  id:         number;
  text:       string;
  done:       boolean;
  taskItemId: number;
}

export interface CreateSubTask {
  text: string;
}

export interface UpdateSubTask {
  text: string;
  done: boolean;
}
