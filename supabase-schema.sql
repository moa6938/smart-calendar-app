-- ============================================
-- 스마트 캘린더 & 투두 리스트 - Supabase 스키마
-- ============================================

-- 1. 우선순위 Enum 타입 생성
CREATE TYPE priority_type AS ENUM ('low', 'medium', 'high');

-- 2. tasks 테이블 생성
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    priority priority_type DEFAULT 'medium' NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    date DATE NOT NULL
);

-- 3. 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- 4. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) 활성화
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 설정
-- 익명 사용자도 사용 가능하도록 모든 작업 허용
-- (실제 프로덕션에서는 auth.users와 연동하여 사용자별로 제한)

-- 조회 정책
CREATE POLICY "Enable read access for all users" ON public.tasks
    FOR SELECT USING (true);

-- 삽입 정책
CREATE POLICY "Enable insert access for all users" ON public.tasks
    FOR INSERT WITH CHECK (true);

-- 업데이트 정책
CREATE POLICY "Enable update access for all users" ON public.tasks
    FOR UPDATE USING (true);

-- 삭제 정책
CREATE POLICY "Enable delete access for all users" ON public.tasks
    FOR DELETE USING (true);

-- ============================================
-- 사용자 인증을 추가하려는 경우 (선택사항)
-- ============================================
-- 위의 정책들을 삭제하고 아래 정책들로 교체:

-- CREATE POLICY "Users can view their own tasks" ON public.tasks
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own tasks" ON public.tasks
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own tasks" ON public.tasks
--     FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own tasks" ON public.tasks
--     FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 테스트 데이터 삽입 (선택사항)
-- ============================================
INSERT INTO public.tasks (text, priority, completed, date) VALUES
    ('프로젝트 기획서 작성', 'high', false, CURRENT_DATE),
    ('데이터베이스 설계', 'high', false, CURRENT_DATE),
    ('UI/UX 디자인 검토', 'medium', false, CURRENT_DATE + INTERVAL '1 day'),
    ('코드 리뷰', 'medium', true, CURRENT_DATE - INTERVAL '1 day'),
    ('문서화 작업', 'low', false, CURRENT_DATE + INTERVAL '2 days');

-- ============================================
-- Realtime 활성화 (실시간 구독 기능)
-- ============================================
-- Supabase Dashboard > Database > Replication 에서
-- 'tasks' 테이블의 Realtime을 활성화하거나,
-- 아래 SQL을 실행하세요:

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- ============================================
-- 완료!
-- ============================================
-- 이제 애플리케이션에서 Supabase 클라이언트를 통해
-- tasks 테이블과 상호작용할 수 있습니다.
