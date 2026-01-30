import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/todo';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 인증 성공 - 리다이렉트
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 인증 실패 - 에러 메시지와 함께 로그인 페이지로 리다이렉트
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('이메일 인증에 실패했습니다. 다시 시도해주세요.')}`
  );
}
