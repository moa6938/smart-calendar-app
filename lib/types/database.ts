// 애플리케이션에서 사용할 타입 정의

export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  text: string;
  priority: Priority;
  completed: boolean;
  task_date: string;
}
