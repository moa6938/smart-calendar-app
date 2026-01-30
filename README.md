# 스마트 캘린더 & 투두 리스트

Next.js 15 + Supabase 기반의 실시간 캘린더 및 할 일 관리 애플리케이션입니다.

## 주요 기능

### 🗓️ 캘린더
- 월별 네비게이션 (이전/다음 달 이동)
- 오늘 날짜 자동 강조
- 일정이 있는 날짜에 시각적 인디케이터 표시
- 날짜 클릭 시 해당 날짜의 상세 일정 모달

### ✅ 투두 리스트
- CRUD 작업 (추가, 조회, 수정, 삭제)
- 우선순위 시스템 (높음/중간/낮음) - 색상으로 구분
- 완료 상태 체크박스 토글
- 필터링 기능 (전체/진행중/완료/우선순위별)
- 날짜별 투두 관리

### 🎨 UI/UX
- 다크/라이트 모드 전환
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 부드러운 애니메이션 효과
- Tailwind CSS 기반 모던한 디자인

### ⚡ 실시간 동기화
- Supabase Realtime 구독으로 즉시 데이터 반영
- 여러 탭/디바이스에서 동시 사용 가능

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime

## 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
cd smart-calendar-app
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 대시보드에서 **Settings > API** 이동
3. **Project URL**과 **anon public** 키 복사

### 3. 환경 변수 설정

`.env.local` 파일을 열어 Supabase 정보를 입력합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 데이터베이스 스키마 적용

1. Supabase 대시보드에서 **SQL Editor** 이동
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. **Database > Replication** 에서 `tasks` 테이블의 Realtime 활성화

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 프로젝트 구조

```
smart-calendar-app/
├── app/
│   ├── todo/
│   │   └── page.tsx          # 메인 투두/캘린더 페이지
│   ├── layout.tsx             # 루트 레이아웃
│   ├── page.tsx               # 홈 페이지
│   └── globals.css            # 글로벌 스타일
├── lib/
│   ├── supabase.ts            # Supabase 클라이언트 설정
│   └── types/
│       └── database.ts        # TypeScript 타입 정의
├── .env.local                 # 환경 변수 (git ignore)
├── supabase-schema.sql        # 데이터베이스 스키마
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 데이터베이스 스키마

### tasks 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 (자동 생성) |
| created_at | TIMESTAMP | 생성 시각 |
| updated_at | TIMESTAMP | 수정 시각 (자동 업데이트) |
| user_id | UUID | 사용자 ID (선택사항) |
| text | TEXT | 할 일 내용 |
| priority | ENUM | 우선순위 (low/medium/high) |
| completed | BOOLEAN | 완료 여부 |
| date | DATE | 할 일 날짜 |

## 주요 기능 설명

### localStorage에서 Supabase로 전환

**기존 (localStorage)**
```javascript
const todos = JSON.parse(localStorage.getItem('todos')) || [];
localStorage.setItem('todos', JSON.stringify(todos));
```

**변경 (Supabase)**
```typescript
// 데이터 로드
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .order('created_at', { ascending: false });

// 데이터 추가
const { error } = await supabase
  .from('tasks')
  .insert({ text, priority, date });

// 데이터 수정
const { error } = await supabase
  .from('tasks')
  .update({ completed: !completed })
  .eq('id', taskId);

// 데이터 삭제
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
```

### 실시간 구독

```typescript
const unsubscribe = subscribeToTasks(() => {
  loadTasks(); // 데이터 변경 시 자동 리로드
});

// 컴포넌트 언마운트 시 구독 해제
return () => unsubscribe();
```

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. 배포

## 라이선스

MIT License

## 개발자

스마트 캘린더 & 투두 리스트 - 2026

---

## 문제 해결

### Supabase 연결 오류
- `.env.local` 파일의 환경 변수가 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### Realtime 작동 안 함
- Supabase 대시보드에서 Realtime이 활성화되어 있는지 확인
- `supabase-schema.sql`의 마지막 부분 실행 확인

### 스타일이 적용 안 됨
- `npm run dev` 재시작
- 브라우저 캐시 삭제
