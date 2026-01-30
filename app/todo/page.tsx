'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logout } from '../login/actions';

// 타입 정의
type Priority = 'low' | 'medium' | 'high';
type FilterType = 'all' | 'active' | 'completed' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  text: string;
  priority: Priority;
  completed: boolean;
  task_date: string;
}

interface User {
  id: string;
  email?: string;
}

export default function TodoPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 폼 입력 상태
  const [todoInput, setTodoInput] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [modalTodoInput, setModalTodoInput] = useState('');
  const [modalPriority, setModalPriority] = useState<Priority>('medium');

  // 사용자 인증 확인 및 초기 데이터 로드
  useEffect(() => {
    const initialize = async () => {
      // 현재 사용자 가져오기
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/login');
        return;
      }
      
      setUser({
        id: currentUser.id,
        email: currentUser.email,
      });
      
      // 태스크 로드
      await loadTasks(currentUser.id);
      loadTheme();
    };

    initialize();

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadTasks(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // 테마 로드
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  };

  // 테마 토글
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Supabase에서 태스크 로드 (사용자별 필터링)
  const loadTasks = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (error: any) {
      console.error('태스크 로드 실패:', error?.message || error);
      alert(`데이터를 불러오는데 실패했습니다: ${error?.message || '테이블이 존재하지 않을 수 있습니다. Supabase에서 스키마를 실행해주세요.'}`);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  // 새 태스크 추가
  const addTask = async (text: string, taskPriority: Priority, date?: Date) => {
    if (!text || text.trim() === '') {
      alert('할 일을 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const { data, error } = await supabase.from('tasks').insert({
        text: text.trim(),
        priority: taskPriority,
        completed: false,
        task_date: formatDate(date || new Date()),
        user_id: user.id,
      } as any).select().single();

      if (error) throw error;

      // 즉시 UI 업데이트 (새 태스크를 목록 맨 앞에 추가)
      if (data) {
        setTasks((prev) => [data as Task, ...prev]);
      }

      // 입력 필드 초기화
      setTodoInput('');
      setModalTodoInput('');

      // 완료 알림
      alert('일정이 추가되었습니다!');
    } catch (error: any) {
      console.error('태스크 추가 실패:', error?.message || error);
      alert(`할 일 추가에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  // 태스크 완료 상태 토글
  const toggleTask = async (id: string, completed: boolean) => {
    // 즉시 UI 업데이트 (낙관적 업데이트)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !completed } : task
      )
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      // 실패 시 원래 상태로 복구
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: completed } : task
        )
      );
      console.error('태스크 업데이트 실패:', error?.message || error);
      alert(`상태 변경에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  // 태스크 수정
  const editTask = async (id: string, currentText: string) => {
    const newText = prompt('할 일 수정:', currentText);
    if (!newText || newText.trim() === '') return;

    // 즉시 UI 업데이트
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, text: newText.trim() } : task
      )
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ text: newText.trim() })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      // 실패 시 원래 상태로 복구
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, text: currentText } : task
        )
      );
      console.error('태스크 수정 실패:', error?.message || error);
      alert(`수정에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  // 태스크 삭제
  const deleteTask = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    // 삭제 전 백업 (실패 시 복구용)
    const deletedTask = tasks.find((task) => task.id === id);

    // 즉시 UI에서 제거
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      // 실패 시 원래 상태로 복구
      if (deletedTask) {
        setTasks((prev) => [...prev, deletedTask]);
      }
      console.error('태스크 삭제 실패:', error?.message || error);
      alert(`삭제에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 캘린더 렌더링을 위한 날짜 배열 생성
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      taskCount: number;
    }> = [];

    // 이전 달 날짜
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevLastDay.getDate() - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        taskCount: getTaskCountForDate(date),
      });
    }

    // 현재 달 날짜
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        taskCount: getTaskCountForDate(date),
      });
    }

    // 다음 달 날짜 (42칸 채우기)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        taskCount: getTaskCountForDate(date),
      });
    }

    return days;
  };

  // 특정 날짜의 태스크 개수
  const getTaskCountForDate = (date: Date): number => {
    const dateString = formatDate(date);
    return tasks.filter((task) => task.task_date === dateString).length;
  };

  // 필터링된 태스크
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      if (currentFilter === 'high' || currentFilter === 'medium' || currentFilter === 'low') {
        return task.priority === currentFilter;
      }
      return true;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  // 모달 열기
  const openModal = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setModalTodoInput('');
  };

  // 선택된 날짜의 태스크
  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateString = formatDate(selectedDate);
    return tasks.filter((task) => task.task_date === dateString);
  };

  const priorityText = { high: '높음', medium: '중간', low: '낮음' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              스마트 캘린더 & 투두 리스트
            </h1>
            <div className="flex items-center gap-4">
              {/* 사용자 이메일 표시 */}
              {user?.email && (
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                  {user.email}
                </span>
              )}
              {/* 테마 토글 버튼 */}
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-indigo-600 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                {isDarkMode ? '라이트 모드' : '다크 모드'}
              </button>
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    로그아웃 중...
                  </>
                ) : (
                  '로그아웃'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 캘린더 섹션 */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                캘린더
              </h2>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                    )
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-md"
                >
                  이전
                </button>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] text-center">
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </div>
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                    )
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-md"
                >
                  다음
                </button>
              </div>
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-2">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-600 dark:text-gray-400 py-4 text-sm"
                >
                  {day}
                </div>
              ))}

              {/* 날짜 셀 */}
              {getCalendarDays().map((day, index) => (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && openModal(day.date)}
                  className={`
                    aspect-square border rounded-lg p-2 cursor-pointer transition-all duration-200
                    ${
                      day.isCurrentMonth
                        ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-sm'
                        : 'border-gray-100 dark:border-gray-800 opacity-40 pointer-events-none'
                    }
                    ${
                      day.isToday
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold hover:bg-indigo-700'
                        : 'bg-white dark:bg-gray-800'
                    }
                    min-h-[80px] flex flex-col relative
                  `}
                >
                  <div className="text-sm font-medium">
                    {day.date.getDate()}
                  </div>
                  {day.taskCount > 0 && (
                    <>
                      <div className="mt-auto text-xs text-gray-600 dark:text-gray-400">
                        {day.isToday ? (
                          <span className="text-white opacity-90">{day.taskCount}개</span>
                        ) : (
                          <span>{day.taskCount}개</span>
                        )}
                      </div>
                      <div
                        className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          day.isToday ? 'bg-white' : 'bg-green-500'
                        }`}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 투두 리스트 섹션 */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 h-fit lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              할 일 목록
            </h2>

            {/* 입력 폼 */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask(todoInput, priority)}
                placeholder="새로운 할 일을 입력하세요..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="low">낮은 우선순위</option>
                <option value="medium">중간 우선순위</option>
                <option value="high">높은 우선순위</option>
              </select>
              <button
                onClick={() => addTask(todoInput, priority)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-all hover:-translate-y-0.5 shadow-md"
              >
                추가
              </button>
            </div>

            {/* 필터 버튼 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { value: 'all', label: '전체' },
                { value: 'active', label: '진행중' },
                { value: 'completed', label: '완료' },
                { value: 'high', label: '높음' },
                { value: 'medium', label: '중간' },
                { value: 'low', label: '낮음' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setCurrentFilter(filter.value as FilterType)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    currentFilter === filter.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 태스크 리스트 */}
            <div className="space-y-3">
              {getFilteredTasks().length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  할 일이 없습니다.
                </div>
              ) : (
                getFilteredTasks().map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg flex items-start gap-3 transition-all duration-200 animate-slideIn ${
                      task.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500'
                        : task.priority === 'medium'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    } ${task.completed ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="mt-1 cursor-pointer w-[18px] h-[18px]"
                    />
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 ${
                          task.completed ? 'line-through' : ''
                        }`}
                      >
                        {task.text}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {priorityText[task.priority]} | {task.task_date}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(task.id, task.text)}
                        className="text-lg hover:scale-125 transition-transform"
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-lg hover:scale-125 transition-transform"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 p-8 rounded-xl max-w-lg w-[90%] max-h-[80vh] overflow-y-auto shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{' '}
                {selectedDate.getDate()}일
              </h3>
              <button
                onClick={closeModal}
                className="text-2xl text-gray-500 hover:text-red-600 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* 모달 입력 폼 */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={modalTodoInput}
                onChange={(e) => setModalTodoInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  addTask(modalTodoInput, modalPriority, selectedDate)
                }
                placeholder="이 날짜의 일정을 추가하세요..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <select
                value={modalPriority}
                onChange={(e) => setModalPriority(e.target.value as Priority)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="low">낮은 우선순위</option>
                <option value="medium">중간 우선순위</option>
                <option value="high">높은 우선순위</option>
              </select>
              <button
                onClick={() => {
                  addTask(modalTodoInput, modalPriority, selectedDate);
                }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-all hover:-translate-y-0.5 shadow-md"
              >
                일정 추가
              </button>
            </div>

            {/* 해당 날짜의 태스크 목록 */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getTasksForSelectedDate().length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  이 날짜에 일정이 없습니다.
                </div>
              ) : (
                getTasksForSelectedDate().map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-3 border-l-indigo-600"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {task.text}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      우선순위: {priorityText[task.priority]} |{' '}
                      {task.completed ? '완료' : '진행중'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }

        /* 스크롤바 스타일링 */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
