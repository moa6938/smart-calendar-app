/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트
 * 브라우저에서 실행되는 React 컴포넌트에서 사용
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
