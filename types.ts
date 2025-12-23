
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  time?: string;
}

export interface DailyTasks {
  [date: string]: Task[];
}

export interface Lesson {
  id: string;
  name: string;
  url?: string;
}

export interface LearningModule {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  modules: LearningModule[];
}

export type ViewState = 'calendar' | 'lessons';
