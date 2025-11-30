export type TodoStatus = "todo" | "in-progress" | "done";

export type Todo = {
  id: string;
  title: string;
  status: TodoStatus;
};

export type StorageChanges = {
  time?: number;
  workTime?: number;
  breakTime?: number;
  longBreak?: number;

  isRunning?: boolean;
  isBreak?: boolean;
  isPaused?: boolean;
  ultraFocusMode?: boolean;

  isSoundEnabled?: boolean;
  selectedSound?: string;
  soundVolume?: number;
  isNotificationEnabled?: boolean;

  isMusicEnabled?: boolean;
  selectedMusic?: string;
  musicVolume?: number;

  blockedSites?: string[];
  allowedUrls?: string[];
  todos?: Todo[];
};

export type PomodoroHistory = {
  createdAt: string;
  totalPomodoros: number;
  completedTodos: number;
  totalWorkTime: number;
};
