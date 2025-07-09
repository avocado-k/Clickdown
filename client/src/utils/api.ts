import logger from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      logger.debug('API Request started', {
        endpoint,
        method: options.method || 'GET',
        headers: Object.keys(headers)
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        logger.apiError(options.method || 'GET', endpoint, {
          status: response.status,
          message: data.message || 'API Error',
          responseTime
        });
        throw new Error(data.message || 'Something went wrong');
      }

      logger.apiRequest(options.method || 'GET', endpoint, response.status, responseTime);
      return { data };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.apiError(options.method || 'GET', endpoint, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { email: string; username: string; password: string }) {
    return this.request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // Task endpoints
  async getTasks(params?: { workspaceId?: string; projectId?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.workspaceId) queryParams.append('workspaceId', params.workspaceId);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
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

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;