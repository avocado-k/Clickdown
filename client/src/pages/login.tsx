// React Hook들 import
import { useState } from 'react'
// Next.js 라우터 Hook
import { useRouter } from 'next/router'
// Next.js Link 컴포넌트
import Link from 'next/link'
// 커스텀 API 클라이언트
import { apiClient } from '@/utils/api'
// 로거 유틸리티
import logger from '@/utils/logger'

// 로그인 페이지 컴포넌트
export default function Login() {
  // useState: 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  // 로딩 상태 관리
  const [loading, setLoading] = useState(false)
  // 에러 메시지 상태 관리
  const [error, setError] = useState('')
  // 라우터 인스턴스
  const router = useRouter()

  // 폼 제출 핸들러 (비동기 함수)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 폼 기본 제출 동작 방지
    setLoading(true)   // 로딩 상태 활성화
    setError('')       // 이전 에러 메시지 초기화

    // 로그인 시도를 로거에 기록
    logger.userAction('login_attempt', { email: formData.email })

    try {
      // API 클라이언트를 통해 로그인 요청
      const response = await apiClient.login(formData)
      
      // 응답에 에러가 있는 경우
      if (response.error) {
        logger.warn('Login failed', { email: formData.email, error: response.error })
        setError(response.error)
      } else if (response.data) {
        // 로그인 성공 시
        logger.info('Login successful', { 
          email: formData.email, 
          userId: response.data.user.id 
        })
        logger.setUserId(response.data.user.id)
        // 토큰과 사용자 정보를 로컬스토리지에 저장
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        // 대시보드로 이동
        router.push('/dashboard')
      }
    } catch (err) {
      // 예외 발생 시 에러 처리
      logger.error('Login error', { 
        email: formData.email, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      })
      setError('Something went wrong. Please try again.')
    } finally {
      // 로딩 상태 비활성화 (성공/실패 관계없이 실행)
      setLoading(false)
    }
  }

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData, // 기존 데이터를 복사 (스프레드 연산자)
      [e.target.name]: e.target.value // 동적 키로 특정 필드 업데이트
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to <span className="text-primary-600">Clickdown</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 로그인 폼 */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 조건부 렌더링: 에러가 있을 때만 에러 메시지 표시 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}