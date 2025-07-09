// 클라이언트 로깅 시스템
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  data?: any;
  url?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
}

class ClientLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 메모리 제한
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
    this.loadUserId();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadUserId(): void {
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('user');
        if (user) {
          this.userId = JSON.parse(user).id;
        }
      } catch (error) {
        // 사용자 정보 로드 실패 시 무시
      }
    }
  }

  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // 전역 에러 핸들러
      window.addEventListener('error', (event) => {
        this.error('Global Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      // Promise rejection 핸들러
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        });
      });
    }
  }

  private createLogEntry(level: LogEntry['level'], message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    this.logs.push(entry);
    
    // 메모리 관리
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return entry;
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
    const currentLevelIndex = levels.indexOf(currentLevel);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex <= currentLevelIndex;
  }

  error(message: string, data?: any): void {
    const entry = this.createLogEntry('error', message, data);
    
    if (this.shouldLog('error')) {
      console.error(`[${entry.timestamp}] ERROR: ${message}`, data);
    }
    
    // 에러는 즉시 서버로 전송
    this.sendToServer([entry]);
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    
    if (this.shouldLog('warn')) {
      console.warn(`[${entry.timestamp}] WARN: ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    
    if (this.shouldLog('info')) {
      console.info(`[${entry.timestamp}] INFO: ${message}`, data);
    }
  }

  debug(message: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, data);
    
    if (this.shouldLog('debug')) {
      console.debug(`[${entry.timestamp}] DEBUG: ${message}`, data);
    }
  }

  // API 요청 로깅
  apiRequest(method: string, url: string, status: number, duration: number, data?: any): void {
    this.info('API Request', {
      method,
      url,
      status,
      duration: `${duration}ms`,
      data
    });
  }

  // API 에러 로깅
  apiError(method: string, url: string, error: any): void {
    this.error('API Error', {
      method,
      url,
      error: error.message || error,
      stack: error.stack
    });
  }

  // 사용자 액션 로깅
  userAction(action: string, data?: any): void {
    this.info('User Action', {
      action,
      data
    });
  }

  // 페이지 뷰 로깅
  pageView(path: string, data?: any): void {
    this.info('Page View', {
      path,
      data
    });
  }

  // 성능 로깅
  performance(name: string, duration: number, data?: any): void {
    this.info('Performance', {
      name,
      duration: `${duration}ms`,
      data
    });
  }

  // 사용자 ID 업데이트
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // 로그를 서버로 전송
  private async sendToServer(logs: LogEntry[]): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        console.error('Failed to send logs to server');
      }
    } catch (error) {
      console.error('Error sending logs to server:', error);
    }
  }

  // 주기적으로 로그를 서버로 전송
  flushLogs(): void {
    if (this.logs.length === 0) return;

    const logsToSend = this.logs.filter(log => 
      log.level === 'error' || log.level === 'warn'
    );

    if (logsToSend.length > 0) {
      this.sendToServer(logsToSend);
    }
  }

  // 로그 내보내기 (디버깅용)
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 로그 지우기
  clearLogs(): void {
    this.logs = [];
  }
}

// 싱글톤 인스턴스 생성
const logger = new ClientLogger();

// 주기적으로 로그 전송 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    logger.flushLogs();
  }, 5 * 60 * 1000);

  // 페이지 언로드 시 로그 전송
  window.addEventListener('beforeunload', () => {
    logger.flushLogs();
  });
}

export default logger;