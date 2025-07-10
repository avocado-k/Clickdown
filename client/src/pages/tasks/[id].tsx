import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { apiClient } from '@/utils/api'

export default function TaskDetail() {
  const router = useRouter()
  const { id } = router.query
  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [projects, setProjects] = useState([])
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    startDate: '',
    dueDate: '',
    assigneeId: ''
  })

  useEffect(() => {
    if (id) {
      fetchTaskDetail()
      fetchComments()
      fetchActivities()
      fetchProjects()
      fetchWorkspaceMembers()
    }
  }, [id])

  const fetchTaskDetail = async () => {
    try {
      // It's better to have a dedicated endpoint to get a task by ID
      // but for now we filter from all tasks.
      const response = await apiClient.getTasks()
      if (response.data) {
        const foundTask = response.data.tasks.find((t: any) => t.id === id)
        if (foundTask) {
          setTask(foundTask)
          setEditForm({
            title: foundTask.title,
            description: foundTask.description || '',
            priority: foundTask.priority,
            status: foundTask.status,
            startDate: foundTask.startDate ? foundTask.startDate.split('T')[0] : '',
            dueDate: foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '',
            assigneeId: foundTask.assigneeId || ''
          })
        } else {
          router.push('/tasks')
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      router.push('/tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    if (typeof id !== 'string') return;
    try {
      const response = await apiClient.getComments(id);
      if (response.data) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchActivities = async () => {
    if (typeof id !== 'string') return;
    try {
      const response = await apiClient.getTaskActivities(id);
      if (response.data) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || typeof id !== 'string') return;

    try {
      const response = await apiClient.createComment(id, newComment);
      if (response.data) {
        setComments([...comments, response.data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to add comment.');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?') && typeof id === 'string') {
      try {
        const response = await apiClient.deleteComment(id, commentId);
        if (response.data) {
          setComments(comments.filter((c) => c.id !== commentId));
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment.');
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.getProjects()
      if (response.data) {
        setProjects(response.data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchWorkspaceMembers = async () => {
    try {
      const workspacesResponse = await apiClient.getWorkspaces()
      if (workspacesResponse.data && workspacesResponse.data.workspaces.length > 0) {
        const workspaceId = workspacesResponse.data.workspaces[0].id
        const membersResponse = await apiClient.getWorkspaceMembers(workspaceId)
        if (membersResponse.data) {
          setWorkspaceMembers(membersResponse.data.members)
        }
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error)
    }
  }

  const handleSave = async () => {
    if (typeof id !== 'string') return;
    try {
      const response = await apiClient.updateTask(id, editForm)
      if (response.data) {
        setTask(response.data.task)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('정말로 이 태스크를 삭제하시겠습니까?') && typeof id === 'string') {
      try {
        await apiClient.deleteTask(id)
        router.push('/tasks')
      } catch (error) {
        console.error('Error deleting task:', error)
      }
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

  if (!task) {
    return (
      <Layout>
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Task not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Task Content */}
          <div className={`rounded-lg shadow-sm p-6 ${isOverdue(task.dueDate) ? 'bg-pink-50 border border-pink-200' : 'bg-white'}`}>
            {editing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter task description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                  <select
                    value={editForm.assigneeId}
                    onChange={(e) => setEditForm({...editForm, assigneeId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No Assignee</option>
                    {workspaceMembers.map((member: any) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.username} ({member.user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h2>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                    {task.description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project:</span>
                        <span className="font-medium">{task.project?.name}</span>
                      </div>
                      {task.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium">{new Date(task.startDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className={`font-medium ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                            {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                            {isOverdue(task.dueDate) && <span className="ml-1 text-xs">(Overdue)</span>}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(task.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignee</h3>
                    {task.assignee ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {task.assignee.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{task.assignee.username}</div>
                          <div className="text-sm text-gray-600">{task.assignee.email}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No assignee</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments ({comments.length})</h3>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-800">{comment.author.username}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Delete Comment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="mt-6 flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add a comment..."
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-primary-300"
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Activity Log Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="flex items-center text-xl font-semibold text-gray-900 mb-4 focus:outline-none"
            >
              Activity Log ({activities.length})
              <svg
                className={`w-5 h-5 ml-2 transform transition-transform ${showActivityLog ? 'rotate-90' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {showActivityLog && (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.user?.username.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{activity.user?.username || 'Unknown User'}</span>
                      <span className="ml-1">{activity.content}</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(activity.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}