import { Component, OnInit, signal, computed, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService, TaskQueryParams } from '../../services/task';
import { TagService }     from '../../services/tag';
import { SubTaskService } from '../../services/subtask';
import { Task, CreateTask }             from '../../models/task.model';
import { Tag, CreateTag }               from '../../models/tag.model';
import { SubTask, CreateSubTask }       from '../../models/subtask.model';

const FILTERS         = ['todas', 'alta', 'média', 'baixa', 'concluídas'];
const CONFETTI_COLORS = ['#00ff88', '#00c4ff', '#ffa502', '#ff4757', '#a29bfe', '#fd79a8'];

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskList implements OnInit {
  @ViewChild('taskInputRef')   taskInputRef!:   ElementRef;
  @ViewChild('searchInputRef') searchInputRef!: ElementRef;

  tasks            = signal<Task[]>([]);
  filter           = signal(localStorage.getItem('tf_filter') || 'todas');
  sortBy           = signal<'priority' | 'date' | 'dueDate' | 'custom'>((localStorage.getItem('tf_sort') as any) || 'date');
  customOrder      = signal<number[]>(JSON.parse(localStorage.getItem('tf_order') || '[]'));
  search           = signal('');
  confirmDeleteId  = signal<number | null>(null);
  editingId        = signal<number | null>(null);
  editingDueDateId = signal<number | null>(null);
  completingId     = signal<number | null>(null);
  draggedTaskId    = signal<number | null>(null);
  focusMode        = signal(false);
  toast            = signal<string | null>(null);
  soundEnabled     = signal(localStorage.getItem('tf_sound') === 'true');
  themeMode        = signal<'dark' | 'light'>((localStorage.getItem('tf_theme') as any) || 'dark');
  notifPermission  = signal<NotificationPermission>('default');
  undoToast        = signal(false);
  confettiPieces   = signal<{ id: number; color: string; left: number; delay: number; dur: number; size: number }[]>([]);
  completionLog    = signal<{ id: number; date: string }[]>(
    JSON.parse(localStorage.getItem('tf_completion_log') || '[]')
  );
  tags             = signal<Tag[]>([]);
  filterTag        = signal<number | null>(null);
  showTagManager   = signal(false);
  tagPickerTaskId  = signal<number | null>(null);
  expandedTaskId   = signal<number | null>(null);
  editingNotesId   = signal<number | null>(null);
  showTrash        = signal(false);
  // Paginação
  currentPage      = signal(1);
  pageSize         = signal(20);
  totalItems       = signal(0);
  totalPages       = signal(1);
  newTag: CreateTag = { name: '', color: '#00ff88' };
  editingNotes      = '';
  newSubTaskText: Record<number, string> = {};

  editingText    = '';
  editingDueDate = '';
  filters        = FILTERS;
  year           = new Date().getFullYear();
  newTask: CreateTask = { text: '', priority: 'media' };

  private priorityOrder: Record<string, number>                      = { alta: 3, media: 2, baixa: 1 };
  private priorityCycle: Record<string, 'baixa' | 'media' | 'alta'> = { alta: 'baixa', media: 'alta', baixa: 'media' };
  private undoPendingTask: Task | null                               = null;
  private undoTimer: ReturnType<typeof setTimeout> | null           = null;
  private searchTimer: ReturnType<typeof setTimeout> | null         = null;
  private prevProgress                                               = 0;
  private notifChecked                                               = false;

  // ── Computeds ────────────────────────────────────────────────────────────

  counts = computed(() => ({
    total: this.tasks().length,
    done:  this.tasks().filter(t => t.done).length,
    high:  this.tasks().filter(t => t.priority === 'alta' && !t.done).length,
  }));

  progress = computed(() => {
    const t = this.counts().total;
    return t > 0 ? Math.round((this.counts().done / t) * 100) : 0;
  });

  streakDays = computed(() => {
    const log   = this.completionLog();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const hasOn = (offset: number): boolean => {
      const start = today.getTime() - offset * 86400000;
      return log.some(c => { const d = new Date(c.date).getTime(); return d >= start && d < start + 86400000; });
    };

    let streak     = 0;
    const startOff = hasOn(0) ? 0 : 1;
    for (let i = startOff; i < 366; i++) {
      if (hasOn(i)) streak++; else break;
    }
    return streak;
  });

  weeklyDone = computed(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.completionLog().filter(c => new Date(c.date).getTime() > weekAgo).length;
  });

  weeklyChart = computed(() => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day  = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      days.push(this.completionLog().filter(c => {
        const d = new Date(c.date).getTime();
        return d >= day.getTime() && d < next.getTime();
      }).length);
    }
    return days;
  });

  maxWeeklyChart = computed(() => Math.max(...this.weeklyChart(), 1));

  // Filtros de prioridade/done/search agora são enviados à API;
  // aqui só fazemos sort local + filtro de tag (não paginado pelo back)
  filteredTasks = computed(() => {
    const tagId = this.filterTag();
    let result = tagId
      ? this.tasks().filter(t => t.tags.some(tg => tg.id === tagId))
      : [...this.tasks()];

    const sort = this.sortBy();
    if (sort === 'custom') {
      const order = this.customOrder();
      if (order.length > 0)
        result = [...result].sort((a, b) => {
          const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
          if (ai === -1) return 1; if (bi === -1) return -1; return ai - bi;
        });
    } else if (sort === 'priority') {
      result = [...result].sort((a, b) =>
        (this.priorityOrder[b.priority] || 0) - (this.priorityOrder[a.priority] || 0));
    } else if (sort === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  });

  focusTask = computed(() =>
    [...this.tasks().filter(t => !t.done)]
      .sort((a, b) => (this.priorityOrder[b.priority] || 0) - (this.priorityOrder[a.priority] || 0))[0] || null
  );

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor(
    private taskService:    TaskService,
    private tagService:     TagService,
    private subTaskService: SubTaskService
  ) {
    effect(() => {
      const p = this.progress();
      if (p === 100 && this.prevProgress < 100 && this.tasks().length > 0) {
        this.triggerConfetti();
        this.showToast('🎉 Todas as tarefas concluídas!');
      }
      this.prevProgress = p;
    }, { allowSignalWrites: true });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.applyTheme(this.themeMode());
    if (typeof Notification !== 'undefined') {
      this.notifPermission.set(Notification.permission);
    }
    this.loadTasks();
    this.loadTags();
  }

  loadTags(): void {
    this.tagService.getAll().subscribe(tags => this.tags.set(tags));
  }

  createTag(): void {
    if (!this.newTag.name.trim()) return;
    this.tagService.create(this.newTag).subscribe(() => {
      this.newTag = { name: '', color: '#00ff88' };
      this.showToast('Tag criada!');
      this.loadTags();
    });
  }

  deleteTag(id: number): void {
    this.tagService.delete(id).subscribe(() => {
      if (this.filterTag() === id) this.filterTag.set(null);
      this.showToast('Tag removida!');
      this.loadTags();
      this.loadTasks();
    });
  }

  addTagToTask(tagId: number, taskId: number): void {
    this.tagService.addToTask(tagId, taskId).subscribe(() => {
      this.tagPickerTaskId.set(null);
      this.loadTasks();
    });
  }

  removeTagFromTask(tagId: number, taskId: number): void {
    this.tagService.removeFromTask(tagId, taskId).subscribe(() => this.loadTasks());
  }

  toggleTagPicker(taskId: number): void {
    this.tagPickerTaskId.update(id => id === taskId ? null : taskId);
  }

  availableTagsForTask(task: Task): Tag[] {
    return this.tags().filter(t => !task.tags.some(tt => tt.id === t.id));
  }

  setFilterTag(id: number | null): void { this.filterTag.set(id); }

  // ── Expand / Notes ────────────────────────────────────────────────────────

  toggleExpand(taskId: number): void {
    this.expandedTaskId.update(id => id === taskId ? null : taskId);
    this.editingNotesId.set(null);
    this.tagPickerTaskId.set(null);
  }

  startEditNotes(task: Task): void {
    this.editingNotesId.set(task.id);
    this.editingNotes = task.notes ?? '';
  }

  saveNotes(task: Task): void {
    this.taskService.update(task.id, {
      text: task.text, priority: task.priority, done: task.done,
      dueDate: task.dueDate, notes: this.editingNotes
    }).subscribe(() => {
      this.editingNotesId.set(null);
      this.loadTasks();
    });
  }

  cancelEditNotes(): void { this.editingNotesId.set(null); }

  // ── SubTasks ──────────────────────────────────────────────────────────────

  createSubTask(taskId: number): void {
    const text = (this.newSubTaskText[taskId] || '').trim();
    if (!text) return;
    this.subTaskService.create(taskId, { text }).subscribe(() => {
      this.newSubTaskText[taskId] = '';
      this.loadTasks();
    });
  }

  toggleSubTask(task: Task, sub: SubTask): void {
    this.subTaskService.update(task.id, sub.id, { text: sub.text, done: !sub.done })
      .subscribe(() => this.loadTasks());
  }

  deleteSubTask(task: Task, subId: number): void {
    this.subTaskService.delete(task.id, subId).subscribe(() => this.loadTasks());
  }

  subTaskProgress(task: Task): number {
    if (!task.subTasks.length) return 0;
    return Math.round((task.subTasks.filter(s => s.done).length / task.subTasks.length) * 100);
  }

  loadTasks(): void {
    const f = this.filter();
    const q: TaskQueryParams = {
      page:    this.currentPage(),
      limit:   this.pageSize(),
      deleted: this.showTrash(),
    };
    if (f === 'concluídas')             { q.done = true; }
    else if (f === 'alta')              { q.priority = 'alta';  q.done = false; }
    else if (f === 'média')             { q.priority = 'media'; q.done = false; }
    else if (f === 'baixa')             { q.priority = 'baixa'; q.done = false; }
    else if (f !== 'todas')             { /* noop */ }

    const s = this.search().trim();
    if (s) q.search = s;

    this.taskService.getAll(q).subscribe(result => {
      this.tasks.set(result.items);
      this.totalItems.set(result.total);
      this.totalPages.set(result.totalPages);
      if (!this.notifChecked) {
        this.notifChecked = true;
        this.checkDueNotifications();
      }
    });
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  create(): void {
    if (!this.newTask.text.trim()) return;
    this.taskService.create(this.newTask).subscribe(() => {
      this.newTask = { text: '', priority: 'media' };
      this.showToast('Tarefa criada!');
      this.loadTasks();
    });
  }

  complete(task: Task): void {
    if (!task.done) {
      this.completingId.set(task.id);
      setTimeout(() => this.completingId.set(null), 700);
      this.logCompletion(task.id);
      this.playSound();
    }
    this.taskService.update(task.id, {
      text: task.text, priority: task.priority, done: !task.done, dueDate: task.dueDate
    }).subscribe(() => {
      this.showToast(task.done ? 'Tarefa reaberta!' : 'Tarefa concluída! ✓');
      this.loadTasks();
    });
  }

  cyclePriority(task: Task): void {
    const next = this.priorityCycle[task.priority];
    this.taskService.update(task.id, {
      text: task.text, priority: next, done: task.done, dueDate: task.dueDate
    }).subscribe(() => {
      this.showToast(`Prioridade → ${next}!`);
      this.loadTasks();
    });
  }

  requestDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void            { this.confirmDeleteId.set(null); }

  confirmDelete(id: number): void {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;
    this.tasks.update(ts => ts.filter(t => t.id !== id));
    this.confirmDeleteId.set(null);
    this.undoPendingTask = task;
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoToast.set(true);
    this.undoTimer = setTimeout(() => {
      if (this.undoPendingTask?.id === id) {
        // Soft delete: move para lixeira
        this.taskService.delete(id).subscribe(() => this.loadTasks());
        this.undoPendingTask = null;
      }
      this.undoToast.set(false);
    }, 4000);
  }

  undoDelete(): void {
    if (!this.undoPendingTask) return;
    this.tasks.update(ts => [this.undoPendingTask!, ...ts]);
    this.undoPendingTask = null;
    if (this.undoTimer) { clearTimeout(this.undoTimer); this.undoTimer = null; }
    this.undoToast.set(false);
    this.showToast('Exclusão desfeita!');
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

  startEdit(task: Task): void { this.editingId.set(task.id); this.editingText = task.text; }

  saveEdit(task: Task): void {
    if (!this.editingText.trim() || this.editingId() !== task.id) return;
    this.taskService.update(task.id, {
      text: this.editingText, priority: task.priority, done: task.done, dueDate: task.dueDate
    }).subscribe(() => {
      this.editingId.set(null);
      this.showToast('Tarefa atualizada!');
      this.loadTasks();
    });
  }

  cancelEdit(): void { this.editingId.set(null); }

  startEditDueDate(task: Task): void {
    this.editingDueDateId.set(task.id);
    this.editingDueDate = task.dueDate ? task.dueDate.substring(0, 10) : '';
  }

  saveDueDate(task: Task): void {
    this.taskService.update(task.id, {
      text: task.text, priority: task.priority, done: task.done,
      dueDate: this.editingDueDate || undefined
    }).subscribe(() => {
      this.editingDueDateId.set(null);
      this.showToast('Prazo atualizado!');
      this.loadTasks();
    });
  }

  cancelEditDueDate(): void { this.editingDueDateId.set(null); }

  // ── Controles ─────────────────────────────────────────────────────────────

  setFilter(f: string): void {
    this.filter.set(f);
    this.currentPage.set(1);
    localStorage.setItem('tf_filter', f);
    this.loadTasks();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.loadTasks();
    }, 300);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadTasks();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadTasks();
    }
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.loadTasks();
  }

  toggleTrash(): void {
    this.showTrash.update(v => !v);
    this.currentPage.set(1);
    this.loadTasks();
  }

  restoreTask(id: number): void {
    this.taskService.restore(id).subscribe(() => {
      this.showToast('Tarefa restaurada!');
      this.loadTasks();
    });
  }
  setPriority(p: 'baixa' | 'media' | 'alta'): void { this.newTask.priority = p; }

  toggleSort(): void {
    const cycle: Array<'date' | 'priority' | 'dueDate'> = ['date', 'priority', 'dueDate'];
    const cur  = this.sortBy();
    const next = cur === 'custom' ? 'date' : cycle[(cycle.indexOf(cur as any) + 1) % cycle.length];
    this.sortBy.set(next);
    localStorage.setItem('tf_sort', next);
  }

  toggleFocus(): void { this.focusMode.update(v => !v); }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    localStorage.setItem('tf_sound', String(next));
    this.showToast(next ? '🔊 Som ativado' : '🔇 Som desativado');
  }

  toggleTheme(): void {
    const next = this.themeMode() === 'dark' ? 'light' : 'dark';
    this.themeMode.set(next);
    localStorage.setItem('tf_theme', next);
    this.applyTheme(next);
  }

  async requestNotifications(): Promise<void> {
    if (typeof Notification === 'undefined') {
      this.showToast('Notificações não suportadas neste browser');
      return;
    }
    if (Notification.permission === 'granted') {
      this.notifChecked = false; // força recheck
      this.checkDueNotifications();
      this.showToast('🔔 Verificando tarefas com prazo...');
      return;
    }
    const perm = await Notification.requestPermission();
    this.notifPermission.set(perm);
    if (perm === 'granted') {
      this.showToast('🔔 Notificações ativadas!');
      this.checkDueNotifications();
    } else {
      this.showToast('Permissão negada pelo browser');
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  onDragStart(task: Task): void  { this.draggedTaskId.set(task.id); }
  onDragOver(e: DragEvent): void { e.preventDefault(); }
  onDragEnd(): void              { this.draggedTaskId.set(null); }

  onDrop(targetTask: Task): void {
    const draggedId = this.draggedTaskId();
    if (!draggedId || draggedId === targetTask.id) { this.draggedTaskId.set(null); return; }
    const tasks = [...this.tasks()];
    const di = tasks.findIndex(t => t.id === draggedId);
    const ti = tasks.findIndex(t => t.id === targetTask.id);
    const [dragged] = tasks.splice(di, 1);
    tasks.splice(ti, 0, dragged);
    this.tasks.set(tasks);
    this.draggedTaskId.set(null);
    this.sortBy.set('custom');
    const order = tasks.map(t => t.id);
    this.customOrder.set(order);
    localStorage.setItem('tf_order', JSON.stringify(order));
    localStorage.setItem('tf_sort', 'custom');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isFirstOfPriority(tasks: Task[], index: number): boolean {
    if (this.sortBy() !== 'priority') return false;
    if (index === 0) return true;
    return tasks[index].priority !== tasks[index - 1].priority;
  }

  dueDateLabel(task: Task): string {
    if (!task.dueDate) return '';
    const due   = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff === 0)  return '📅 hoje';
    if (diff === 1)  return '📅 amanhã';
    if (diff > 1)    return `📅 em ${diff} dias`;
    if (diff === -1) return '⚠️ atrasada 1 dia';
    return `⚠️ atrasada ${Math.abs(diff)} dias`;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.done) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }

  getFilterCount(f: string): number {
    const tasks = this.tasks();
    if (f === 'todas')      return tasks.length;
    if (f === 'alta')       return tasks.filter(t => t.priority === 'alta'  && !t.done).length;
    if (f === 'média')      return tasks.filter(t => t.priority === 'media' && !t.done).length;
    if (f === 'baixa')      return tasks.filter(t => t.priority === 'baixa' && !t.done).length;
    if (f === 'concluídas') return tasks.filter(t => t.done).length;
    return 0;
  }

  priorityColor(p: string): string {
    // Retorna hex fixo — CSS var() não funciona quando concatenado com '66' para alpha
    return p === 'alta' ? '#ff4757' : p === 'media' ? '#ffa502' : '#2ed573';
  }

  priorityLabel(p: string): string {
    return p === 'alta' ? 'ALTA' : p === 'media' ? 'MÉDIA' : 'BAIXA';
  }

  sortLabel(): string {
    return this.sortBy() === 'priority' ? '🔢 Prioridade'
         : this.sortBy() === 'custom'   ? '↕️ Custom'
         : this.sortBy() === 'dueDate'  ? '📅 Prazo'
         : '🕐 Data';
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2500);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private applyTheme(mode: 'dark' | 'light'): void {
    document.documentElement.setAttribute('data-theme', mode);
  }

  private checkDueNotifications(): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    // Evita notificar a mesma tarefa mais de uma vez por sessão
    const notified = new Set<number>(
      JSON.parse(sessionStorage.getItem('tf_notified') || '[]')
    );

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const newIds: number[] = [];

    this.tasks()
      .filter(t => !t.done && t.dueDate && !notified.has(t.id))
      .forEach(t => {
        const due  = new Date(t.dueDate!); due.setHours(0, 0, 0, 0);
        const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
        if (diff > 0) return; // só avisa vencendo hoje ou atrasadas
        new Notification('TaskFlow ⚡', {
          body: diff === 0 ? `📅 "${t.text}" vence hoje!` : `⚠️ "${t.text}" está atrasada!`,
        });
        newIds.push(t.id);
      });

    if (newIds.length > 0) {
      sessionStorage.setItem('tf_notified', JSON.stringify([...notified, ...newIds]));
    }
  }

  private logCompletion(taskId: number): void {
    const log      = [...this.completionLog(), { id: taskId, date: new Date().toISOString() }];
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = log.filter(c => new Date(c.date).getTime() > monthAgo);
    this.completionLog.set(filtered);
    localStorage.setItem('tf_completion_log', JSON.stringify(filtered));
  }

  private playSound(): void {
    if (!this.soundEnabled()) return;
    try {
      const ctx   = new AudioContext();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch { }
  }

  private triggerConfetti(): void {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id:    i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left:  Math.random() * 100,
      delay: Math.random() * 2,
      dur:   2 + Math.random() * 2,
      size:  6 + Math.random() * 7,
    }));
    this.confettiPieces.set(pieces);
    setTimeout(() => this.confettiPieces.set([]), 4500);
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

    if (e.key === 'Escape') {
      this.cancelEdit(); this.cancelEditDueDate(); this.focusMode.set(false); return;
    }
    if (isInput) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); this.taskInputRef?.nativeElement.focus(); }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.searchInputRef?.nativeElement.focus(); }
    if (e.key === 'z' || e.key === 'Z') { this.toggleFocus(); }
    if (e.key === 't' || e.key === 'T') { this.toggleTheme(); }
  }
}
