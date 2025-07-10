// React Hook들 import
import { useState, useEffect } from 'react'
// Next.js 라우터 Hook
import { useRouter } from 'next/router'
// Next.js Link 컴포넌트
import Link from 'next/link'

// Props 타입 정의
interface LayoutProps {
  children: React.ReactNode // React 요소들을 받는 타입
}

// 공통 레이아웃 컴포넌트
export default function Layout({ children }: LayoutProps) {
  // 사용자 정보 상태
  const [user, setUser] = useState<any>(null)
  // 라우터 인스턴스
  const router = useRouter()

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData)) // JSON 문자열을 객체로 변환
    }
  }, [])

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('token') // 토큰 삭제
    localStorage.removeItem('user')  // 사용자 정보 삭제
    router.push('/login')           // 로그인 페이지로 이동
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                Click<span className="text-primary-600">down</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/tasks" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Tasks
              </Link>
              <Link 
                href="/projects" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Projects
              </Link>
              <Link 
                href="/kanban" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Kanban
              </Link>
              
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {/* 옵셔널 체이닝으로 안전하게 첫 글자 가져오기 */}
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 영역 */}
      <main className="py-8">
        {children} {/* 자식 컴포넌트들이 여기에 렌더링 됨 */}
      </main>
    </div>
  )
}