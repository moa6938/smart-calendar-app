import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  );
}

// Supabase 클라이언트 생성 (싱글톤 패턴)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 실시간 구독을 위한 유틸리티 함수
export const subscribeToTasks = (
  callback: (payload: any) => void,
  filter?: { userId?: string }
) => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: filter?.userId ? `user_id=eq.${filter.userId}` : undefined,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
