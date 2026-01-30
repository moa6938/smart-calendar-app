'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// 입력값 검증 함수
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }
  return { valid: true, message: '' };
}

// 로그인 액션
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 서버 측 입력값 검증
  if (!email || !validateEmail(email)) {
    redirect('/login?error=유효한 이메일을 입력해주세요.');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    redirect(`/login?error=${encodeURIComponent(passwordValidation.message)}`);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/todo');
}

// 회원가입 액션
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // 서버 측 입력값 검증
  if (!email || !validateEmail(email)) {
    redirect('/signup?error=유효한 이메일을 입력해주세요.');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    redirect(`/signup?error=${encodeURIComponent(passwordValidation.message)}`);
  }

  if (password !== confirmPassword) {
    redirect('/signup?error=비밀번호가 일치하지 않습니다.');
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=가입이 완료되었습니다. 이메일을 확인해주세요.');
}

// 로그아웃 액션
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
