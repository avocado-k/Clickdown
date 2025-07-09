import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/utils/api'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    assigneeId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tasksResponse, projectsResponse, workspacesResponse] = await Promise.all([
        apiClient.getTasks({ projectId: selectedProject, status: selectedStatus }),
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiClient.createTask(newTask)
      if (response.data) {
        setTasks([response.data.task, ...tasks])
        setNewTask({
          title: '',
          description: '',
          projectId: '',
          priority: 'medium',
          startDate: '',
          dueDate: '',
          assigneeId: ''
        })
        setShowCreateModal(false)
      }
    } catch (error) {
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
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(tasks.filter((task: any) => task.id !== taskId))
    } catch (error) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
            <p className="text-gray-600">Manage and track your tasks</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create Task
            </button>
            <button
              onClick={() => {
                const email = prompt('초대할 사용자의 이메일을 입력하세요:')
                if (email && currentWorkspaceId) {
                  apiClient.inviteUserToWorkspace(currentWorkspaceId, { email })
                    .then(() => {
                      alert('초대가 완료되었습니다!')
                      fetchData()
                    })
                    .catch((error) => {
                      alert('초대 실패: ' + (error.message || '알 수 없는 오류'))
                    })
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Invite Member
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-sm">
          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/tasks/${task.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{task.project?.name}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span>담당자: {task.assignee.username}</span>
                          </>
                        )}
                        {task.startDate && (
                          <>
                            <span>•</span>
                            <span>시작: {new Date(task.startDate).toLocaleDateString('ko-KR')}</span>
                          </>
                        )}
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span>마감: {new Date(task.dueDate).toLocaleDateString('ko-KR')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleUpdateTask(task.id, { status: e.target.value })
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    required
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project: any) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">담당자 없음</option>
                    {workspaceMembers.map((member: any) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.username} ({member.user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                  >
                    Create Task
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