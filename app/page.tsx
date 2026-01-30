export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-6">스마트 캘린더 & 투두 리스트</h1>
        <p className="text-xl mb-8">Supabase 기반 실시간 할 일 관리</p>
        <a
          href="/todo"
          className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all hover:-translate-y-1"
        >
          시작하기
        </a>
      </div>
    </div>
  );
}
