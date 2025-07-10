// React Hook들을 import
import { useEffect } from 'react'
// Next.js의 라우터 Hook import
import { useRouter } from 'next/router'
// Next.js의 Link 컴포넌트 import (클라이언트 사이드 네비게이션용)
import Link from 'next/link'

// 홈 페이지 컴포넌트 (함수형 컴포넌트)
export default function Home() {
  // useRouter: Next.js에서 라우팅을 제어하는 Hook
  const router = useRouter()

  // useEffect: 컴포넌트가 마운트될 때 실행되는 사이드 이펙트
  useEffect(() => {
    // 로컬스토리지에서 토큰 확인
    const token = localStorage.getItem('token')
    if (token) {
      // 토큰이 있으면 대시보드로 리디렉션
      router.push('/dashboard')
    }
  }, [router]) // 의존성 배열에 router 포함

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Click<span className="text-primary-600">down</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            A simple and powerful project management tool inspired by ClickUp. 
            Organize your tasks, collaborate with your team, and get things done.
          </p>
          
          {/* 버튼 그룹 */}
          <div className="flex justify-center space-x-4 mb-16">
            {/* Link 컴포넌트: 클라이언트 사이드 네비게이션 */}
            <Link
              href="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-semibold border border-gray-200 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Management</h3>
              <p className="text-gray-600">Create, organize, and track your tasks with ease. Set priorities, due dates, and assign team members.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Work together seamlessly with your team. Share workspaces, assign tasks, and track progress.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kanban Boards</h3>
              <p className="text-gray-600">Visualize your workflow with intuitive Kanban boards. Drag and drop tasks to update their status.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}