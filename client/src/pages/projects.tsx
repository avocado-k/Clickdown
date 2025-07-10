import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { apiClient } from '@/utils/api'
import logger from '@/utils/logger'

export default function Projects() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    workspaceId: '',
    color: '#10b981'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsResponse, workspacesResponse] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getWorkspaces()
      ])

      if (projectsResponse.data) {
        setProjects(projectsResponse.data.projects)
      }

      if (workspacesResponse.data) {
        setWorkspaces(workspacesResponse.data.workspaces)
        if (workspacesResponse.data.workspaces.length > 0) {
          setNewProject(prev => ({
            ...prev,
            workspaceId: workspacesResponse.data.workspaces[0].id
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiClient.createProject(newProject)
      if (response.data) {
        setProjects([response.data.project, ...projects])
        setNewProject({
          name: '',
          description: '',
          workspaceId: workspaces.length > 0 ? workspaces[0].id : '',
          color: '#10b981'
        })
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleProjectClick = (projectId: string) => {
    logger.userAction('project_card_click', { projectId })
    router.push(`/projects/${projectId}`)
  }

  const handleDeleteProject = async (project: any) => {
    if (project._count?.tasks > 0) {
      alert(`프로젝트 "${project.name}"에는 ${project._count.tasks}개의 태스크가 있어 삭제할 수 없습니다.\n\n모든 태스크를 먼저 삭제해 주세요.`);
      return;
    }

    if (confirm(`정말로 "${project.name}" 프로젝트를 삭제하시겠습니까?`)) {
      try {
        console.log(`[handleDeleteProject] Attempting to delete project: ${project.id}`);
        await apiClient.deleteProject(project.id);
        console.log(`[handleDeleteProject] Project ${project.id} deleted successfully from API.`);
        setProjects(projects.filter((p: any) => p.id !== project.id));
        alert('프로젝트가 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('[handleDeleteProject] Error deleting project:', error);
        alert(`프로젝트 삭제에 실패했습니다: ${ (error as any).message || '알 수 없는 오류' }`);
      }
    }
  }

  const colorOptions = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'
  ]

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Organize your work into projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div 
              key={project.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center cursor-pointer" onClick={() => handleProjectClick(project.id)}>
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project)
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="프로젝트 삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="cursor-pointer" onClick={() => handleProjectClick(project.id)}>
                  {project.description && (
                    <p className="text-gray-600 mb-4">{project.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{project._count?.tasks || 0} 개 태스크</span>
                    <span>{new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No projects yet</p>
              <p className="text-gray-400 text-sm">Create your first project to get started</p>
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
                  <select
                    required
                    value={newProject.workspaceId}
                    onChange={(e) => setNewProject({...newProject, workspaceId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {workspaces.map((workspace: any) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex space-x-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProject({...newProject, color})}
                        className={`w-8 h-8 rounded-full border-2 ${newProject.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
                    Create Project
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