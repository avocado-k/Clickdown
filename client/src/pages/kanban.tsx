import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/utils/api'

export default function Kanban() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [draggedTask, setDraggedTask] = useState(null)
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('')

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ]

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async () => {
    try {
      const [tasksResponse, projectsResponse, workspacesResponse] = await Promise.all([
        apiClient.getTasks({ projectId: selectedProject }),
        apiClient.getProjects(),
        apiClient.getWorkspaces()
      ])

      if (tasksResponse.data) {
        setTasks(tasksResponse.data.tasks)
      }

      if (projectsResponse.data) {
        setProjects(projectsResponse.data.projects)
      }

      if (workspacesResponse.data && workspacesResponse.data.workspaces.length > 0) {
        const workspaceId = workspacesResponse.data.workspaces[0].id
        setCurrentWorkspaceId(workspaceId)
        
        const membersResponse = await apiClient.getWorkspaceMembers(workspaceId)
        if (membersResponse.data) {
          setWorkspaceMembers(membersResponse.data.members)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // 낙관적 업데이트를 위해 임시로 상태 변경
      const previousTasks = [...tasks]
      setTasks(tasks.map((task: any) => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))

      const response = await apiClient.updateTask(taskId, { status: newStatus })
      if (response.error) {
        // 에러 발생 시 이전 상태로 롤백
        setTasks(previousTasks)
        alert(`Failed to update task: ${response.error}`)
      } else if (response.data) {
        // 성공 시 서버 응답 데이터로 최종 업데이트
        setTasks(tasks.map((task: any) => 
          task.id === taskId ? response.data.task : task
        ))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      // 에러 발생 시 데이터 다시 로드
      await fetchData()
    }
  }

  const getTasksByStatus = (status: string) => {
    let filteredTasks = tasks.filter((task: any) => task.status === status)
    
    if (searchTerm) {
      filteredTasks = filteredTasks.filter((task: any) => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filteredTasks.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 }
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'border-l-green-500'
      case 'medium': return 'border-l-yellow-500'
      case 'high': return 'border-l-orange-500'
      case 'urgent': return 'border-l-red-500'
      default: return 'border-l-gray-500'
    }
  }

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    const today = new Date()
    const due = new Date(dueDate)
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return due < today
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

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kanban Board</h1>
            <p className="text-gray-600">Visual task management with drag & drop</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Title</option>
              <option value="created">Created</option>
            </select>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-[800px] lg:min-w-0">
          {columns.map((column) => (
            <div key={column.id} className="bg-white rounded-lg shadow-sm">
              <div className={`p-4 ${column.color} rounded-t-lg`}>
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="text-sm text-gray-600">
                  {getTasksByStatus(column.id).length} tasks
                </span>
              </div>
              
              <div 
                className="p-4 space-y-3 min-h-96"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  e.currentTarget.classList.add('bg-gray-50')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-gray-50')
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('bg-gray-50')
                  const taskId = e.dataTransfer.getData('text/plain')
                  if (taskId && draggedTask && draggedTask.status !== column.id) {
                    await handleStatusChange(taskId, column.id)
                  }
                  setDraggedTask(null)
                }}
              >
                {getTasksByStatus(column.id).map((task: any) => (
                  <div
                    key={task.id}
                    className={`border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${draggedTask?.id === task.id ? 'opacity-50' : ''} ${isOverdue(task.dueDate) ? 'bg-pink-50 border-pink-200' : 'bg-white'}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', task.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggedTask(task)
                    }}
                    onDragEnd={() => {
                      setDraggedTask(null)
                    }}
                    onClick={() => {
                      window.location.href = `/tasks/${task.id}`;
                    }}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{task.project?.name}</span>
                      <span className="capitalize">{task.priority}</span>
                    </div>
                    
                    {task.assignee && (
                      <div className="flex items-center mt-2 text-xs text-gray-600">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-2">
                          {task.assignee.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{task.assignee.username}</span>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {task.startDate && (
                        <div className="flex items-center">
                          <span className="text-green-600 font-medium">시작:</span>
                          <span className="ml-1">{new Date(task.startDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center">
                          <span className="text-red-600 font-medium">마감:</span>
                          <span className="ml-1">{new Date(task.dueDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                    </div>
                    
                  </div>
                ))}
                
                {getTasksByStatus(column.id).length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                    {draggedTask && draggedTask.status !== column.id 
                      ? `Drop task here to move to ${column.title}`
                      : 'No tasks in this column'
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No tasks found</p>
            <p className="text-gray-400 text-sm">
              {selectedProject ? 'No tasks in this project' : 'Create some tasks to see them here'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}