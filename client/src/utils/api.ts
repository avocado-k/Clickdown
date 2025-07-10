// 클라이언트 로거 import
import logger from './logger';

// API 서버 기본 URL (환경변수에서 가져오거나 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API 응답 타입 정의 (제네릭 타입 T 사용)
interface ApiResponse<T> {
  data?: T;        // 성공 시 데이터 (옵셔널)
  message?: string; // 메시지 (옵셔널)
  error?: string;   // 에러 메시지 (옵셔널)
}

// API 클라이언트 클래스 정의
class ApiClient {
  private baseUrl: string; // private: 클래스 내부에서만 접근 가능

  // 생성자: 인스턴스 생성 시 baseUrl 설정
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 프라이빗 메서드: HTTP 요청을 처리하는 핵심 함수
  // 제네릭 <T>: 응답 데이터의 타입을 동적으로 지정
  private async request<T>(
    endpoint: string,        // API 엔드포인트 (예: '/api/users')
    options: RequestInit = {} // fetch 옵션 (method, body 등)
  ): Promise<ApiResponse<T>> { // Promise를 반환하여 비동기 처리
    const startTime = Date.now(); // 응답 시간 측정을 위한 시작 시간
    
    // 브라우저 환경에서만 localStorage에 접근
    // typeof window !== 'undefined': 브라우저 환경인지 확인
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // HTTP 헤더 설정
    const headers: HeadersInit = {
      'Content-Type': 'application/json', // JSON 형태로 데이터 전송
      ...options.headers, // 기존 헤더와 병합 (스프레드 연산자)
    };

    // 토큰이 있으면 Authorization 헤더에 Bearer 토큰 추가
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      // 요청 시작 로그
      logger.debug('API Request started', {
        endpoint,
        method: options.method || 'GET',
        headers: Object.keys(headers) // 헤더 키들만 로그에 기록 (보안상 값은 제외)
      });

      // fetch API를 사용하여 HTTP 요청
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, // 전달받은 옵션들 (method, body 등)
        headers,    // 설정한 헤더들
      });

      const responseTime = Date.now() - startTime; // 응답 시간 계산
      const data = await response.json(); // JSON 응답 파싱

      // HTTP 상태 코드가 200번대가 아닌 경우 (에러 처리)
      if (!response.ok) {
        logger.apiError(options.method || 'GET', endpoint, {
          status: response.status,
          message: data.message || 'API Error',
          responseTime
        });
        throw new Error(data.message || 'Something went wrong');
      }

      // 성공 로그
      logger.apiRequest(options.method || 'GET', endpoint, response.status, responseTime);
      return { data }; // 성공 시 데이터 반환
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.apiError(options.method || 'GET', endpoint, {
        // instanceof: 객체가 특정 클래스의 인스턴스인지 확인
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 인증 관련 API 엔드포인트들
  
  // 로그인 메서드
  async login(credentials: { email: string; password: string }) {
    // 제네릭으로 응답 타입 지정: user 객체와 token 문자열
    return this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials), // 객체를 JSON 문자열로 변환
    });
  }

  // 회원가입 메서드
  async register(userData: { email: string; username: string; password: string }) {
    return this.request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // 작업(Task) 관련 API 엔드포인트들
  
  // 작업 목록 조회 (필터링 옵션 포함)
  async getTasks(params?: { workspaceId?: string; projectId?: string; status?: string }) {
    // URLSearchParams: URL 쿼리 파라미터를 쉽게 만들어주는 Web API
    const queryParams = new URLSearchParams();
    
    // 옵셔널 체이닝(?.) 사용: params가 존재하고 workspaceId가 있으면 추가
    if (params?.workspaceId) queryParams.append('workspaceId', params.workspaceId);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.status) queryParams.append('status', params.status);

    // toString(): 쿼리 파라미터를 문자열로 변환 (예: "workspaceId=123&status=active")
    const queryString = queryParams.toString();
    
    // 삼항 연산자: 쿼리 스트링이 있으면 ?를 붙여서 추가, 없으면 빈 문자열
    return this.request<{ tasks: any[] }>(`/api/tasks${queryString ? `?${queryString}` : ''}`);
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    projectId: string;
    priority?: string;
    startDate?: string;
    dueDate?: string;
    assigneeId?: string;
  }) {
    return this.request<{ task: any }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: string, taskData: any) {
    return this.request<{ task: any }>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<{ message: string }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getTaskActivities(taskId: string) {
    return this.request<{ activities: any[] }>(`/api/tasks/${taskId}/activities`);
  }

  // Comment endpoints
  async getComments(taskId: string) {
    return this.request<{ comments: any[] }>(`/api/tasks/${taskId}/comments`);
  }

  async createComment(taskId: string, content: string) {
    return this.request<{ comment: any }>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(taskId: string, commentId: string) {
    return this.request<{ message: string }>(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async getProjects(workspaceId?: string) {
    const queryParams = new URLSearchParams();
    if (workspaceId) queryParams.append('workspaceId', workspaceId);

    const queryString = queryParams.toString();
    return this.request<{ projects: any[] }>(`/api/tasks/projects${queryString ? `?${queryString}` : ''}`);
  }

  async createProject(projectData: {
    name: string;
    description?: string;
    workspaceId: string;
    color?: string;
  }) {
    return this.request<{ project: any }>('/api/tasks/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId: string) {
    return this.request<{ message: string }>(`/api/tasks/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Workspace endpoints
  async getWorkspaces() {
    return this.request<{ workspaces: any[] }>('/api/workspaces');
  }

  async createWorkspace(workspaceData: {
    name: string;
    description?: string;
    color?: string;
  }) {
    return this.request<{ workspace: any }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    });
  }

  // Workspace member endpoints
  async getWorkspaceMembers(workspaceId: string) {
    return this.request<{ members: any[] }>(`/api/workspaces/${workspaceId}/members`);
  }

  async inviteUserToWorkspace(workspaceId: string, userData: {
    email: string;
    role?: string;
  }) {
    return this.request<{ member: any }>(`/api/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async removeWorkspaceMember(workspaceId: string, userId: string) {
    return this.request<{ message: string }>(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }
}

// ApiClient 인스턴스 생성 및 내보내기
export const apiClient = new ApiClient(API_BASE_URL);

// 기본 내보내기 (default export)
// 다른 파일에서 import apiClient from './api' 형태로 가져다 쓸 수 있음
export default apiClient;