import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { apiClient } from '@/utils/api'
import logger from '@/utils/logger'

export default function ProjectDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    startDate: '',
    dueDate: ''
  })

  useEffect(() => {
    if (id) {
      fetchProjectData()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      logger.userAction('view_project_detail', { projectId: id })
      
      // 프로젝트별 태스크 조회
      const tasksResponse = await apiClient.getTasks({ projectId: id as string })
      // 모든 프로젝트 조회해서 현재 프로젝트 찾기
      const projectsResponse = await apiClient.getProjects()
      
      if (tasksResponse.data) {
        setTasks(tasksResponse.data.tasks)
      }
      
      if (projectsResponse.data) {
        const currentProject = projectsResponse.data.projects.find((p: any) => p.id === id)
        setProject(currentProject)
      }
    } catch (error) {
      logger.error('Failed to fetch project data', { projectId: id, error })
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const taskData = {
        ...newTask,
        projectId: id as string
      }
      
      const response = await apiClient.createTask(taskData)
      if (response.data) {
        setTasks([response.data.task, ...tasks])
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          startDate: '',
          dueDate: ''
        })
        setShowCreateModal(false)
        logger.userAction('create_task_from_project', { 
          projectId: id, 
          taskId: response.data.task.id 
        })
      }
    } catch (error) {
      logger.error('Failed to create task', { projectId: id, error })
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const response = await apiClient.updateTask(taskId, updates)
      if (response.data) {
        setTasks(tasks.map((task: any) => 
          task.id === taskId ? response.data.task : task
        ))
        logger.userAction('update_task_status', { 
          taskId, 
          projectId: id, 
          newStatus: updates.status 
        })
      }
    } catch (error) {
      logger.error('Failed to update task', { taskId, error })
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(tasks.filter((task: any) => task.id !== taskId))
      logger.userAction('delete_task_from_project', { taskId, projectId: id })
    } catch (error) {
      logger.error('Failed to delete task', { taskId, error })
      console.error('Error deleting task:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStats = () => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task: any) => task.status === 'done').length
    const inProgressTasks = tasks.filter((task: any) => task.status === 'in_progress').length
    const todoTasks = tasks.filter((task: any) => task.status === 'todo').length
    
    return { totalTasks, completedTasks, inProgressTasks, todoTasks }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">프로젝트를 찾을 수 없습니다</h1>
            <Link href="/projects" className="text-primary-600 hover:text-primary-700">
              ← 프로젝트 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = getTaskStats()

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/projects" className="text-gray-500 hover:text-gray-700 mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3" 
                style={{ backgroundColor: project.color }}
              ></div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            </div>
          </div>
          
          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              생성일: {new Date(project.createdAt).toLocaleDateString('ko-KR')}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              새 태스크 만들기
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            <div className="text-sm text-gray-500">전체 태스크</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <div className="text-sm text-gray-500">진행 중</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <div className="text-sm text-gray-500">완료</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-600">{stats.todoTasks}</div>
            <div className="text-sm text-gray-500">대기 중</div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">태스크 목록</h2>
          </div>
          
          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">아직 태스크가 없습니다</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                첫 번째 태스크 만들기
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {task.startDate && (
                          <span>시작일: {new Date(task.startDate).toLocaleDateString('ko-KR')}</span>
                        )}
                        {task.startDate && task.dueDate && <span>•</span>}
                        {task.dueDate && (
                          <span>마감일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'low' ? '낮음' : 
                         task.priority === 'medium' ? '보통' :
                         task.priority === 'high' ? '높음' : '긴급'}
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">할 일</option>
                        <option value="in_progress">진행 중</option>
                        <option value="review">검토</option>
                        <option value="done">완료</option>
                      </select>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">새 태스크 만들기</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                  >
                    태스크 만들기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}