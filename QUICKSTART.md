# 🚀 빠른 시작 가이드

## 1단계: 의존성 설치

```bash
cd smart-calendar-app
npm install
```

## 2단계: Supabase 프로젝트 설정

### Supabase 계정 생성 및 프로젝트 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. 새 프로젝트 생성 (프로젝트 이름, 데이터베이스 비밀번호 설정)
4. 프로젝트 생성 완료까지 1-2분 대기

### API 키 복사
1. 프로젝트 대시보드에서 **Settings** (왼쪽 사이드바 하단) 클릭
2. **API** 메뉴 선택
3. **Project URL** 복사
4. **Project API keys**에서 **anon public** 키 복사

## 3단계: 환경 변수 설정

`.env.local` 파일을 열고 복사한 값을 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4단계: 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** (왼쪽 사이드바) 클릭
2. **New Query** 버튼 클릭
3. `supabase-schema.sql` 파일을 열고 전체 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
6. 성공 메시지 확인

## 5단계: Realtime 활성화

1. Supabase 대시보드에서 **Database** > **Replication** 이동
2. **tasks** 테이블 찾기
3. **Enable Replication** 토글 활성화

## 6단계: 개발 서버 실행

```bash
npm run dev
```

## 7단계: 애플리케이션 접속

브라우저에서 http://localhost:3000 접속

- 홈 화면에서 "시작하기" 버튼 클릭
- `/todo` 경로로 이동하여 캘린더 & 투두 리스트 사용

## ✅ 확인 사항

### 데이터베이스 확인
Supabase 대시보드 > **Table Editor**에서 `tasks` 테이블이 생성되었는지 확인

### 테스트 데이터
스키마 실행 시 자동으로 5개의 테스트 데이터가 삽입됩니다.

## 🎨 기능 테스트

1. **할 일 추가**: 투두 입력창에 내용 입력 후 "추가" 버튼
2. **우선순위 설정**: 드롭다운에서 높음/중간/낮음 선택
3. **완료 처리**: 체크박스 클릭
4. **필터링**: 필터 버튼 클릭 (전체/진행중/완료/우선순위별)
5. **날짜별 일정**: 캘린더에서 날짜 클릭 → 모달에서 일정 추가
6. **다크 모드**: 우측 상단 "다크 모드" 버튼 클릭
7. **실시간 동기화**: 새 탭을 열어 동일한 URL 접속 → 한쪽에서 변경 시 다른 쪽에 즉시 반영

## 🐛 문제 해결

### "환경 변수가 설정되지 않았습니다" 오류
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수명이 정확한지 확인 (NEXT_PUBLIC_ 접두사 필수)
- 개발 서버 재시작 (`npm run dev`)

### 데이터가 표시되지 않음
- 브라우저 콘솔(F12)에서 에러 확인
- Supabase 대시보드에서 `tasks` 테이블 존재 확인
- RLS 정책이 올바르게 설정되었는지 확인

### Realtime이 작동하지 않음
- Supabase Dashboard > Database > Replication에서 활성화 확인
- 스키마 SQL의 마지막 부분(`ALTER PUBLICATION...`) 실행 확인

## 📦 프로덕션 빌드

```bash
npm run build
npm start
```

## 🌐 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 프로덕션 배포
vercel --prod
```

---

문제가 해결되지 않으면 README.md의 "문제 해결" 섹션을 참고하세요!
