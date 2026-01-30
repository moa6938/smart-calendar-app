import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '스마트 캘린더 & 투두 리스트',
  description: 'Supabase 기반 실시간 캘린더 및 할 일 관리 애플리케이션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
