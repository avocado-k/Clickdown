import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import logger from '@/utils/logger'

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const publicRoutes = ['/login', '/register', '/']
    
    logger.pageView(router.pathname)
    
    if (!token && !publicRoutes.includes(router.pathname)) {
      logger.info('Redirecting to login', { from: router.pathname })
      router.push('/login')
    } else if (token && publicRoutes.includes(router.pathname)) {
      logger.info('Redirecting to dashboard', { from: router.pathname })
      router.push('/dashboard')
    } else {
      setIsAuthenticated(!!token)
      if (token) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          logger.setUserId(user.id)
          logger.info('User authenticated', { userId: user.id })
        } catch (error) {
          logger.error('Failed to parse user data', { error })
        }
      }
    }
    
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <Component {...pageProps} />
}