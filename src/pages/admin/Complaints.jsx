import { useEffect, useState } from 'react'
import api from '../../utils/api'
import Modal from '../../components/Modal'

const Complaints = () => {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints')
      if (response.data.success) {
        setComplaints(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status })
      fetchComplaints()
    } catch (error) {
      console.error('Error updating complaint:', error)
      alert('Failed to update complaint')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return
    }
    try {
      await api.delete(`/complaints/${id}`)
      fetchComplaints()
    } catch (error) {
      console.error('Error deleting complaint:', error)
      alert('Failed to delete complaint')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No complaints found
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">#{complaint.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{complaint.subject}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {complaint.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{complaint.complaintBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(complaint)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <select
                      value={complaint.status}
                      onChange={(e) => handleUpdateStatus(complaint.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={() => handleDelete(complaint.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <p className="mt-1 text-sm text-gray-900">{selectedComplaint.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{selectedComplaint.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedComplaint.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complaint By</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedComplaint.complaintBy}</p>
              </div>
            </div>
            {selectedComplaint.rider && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rider</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedComplaint.rider.firstName} {selectedComplaint.rider.lastName}
                </p>
              </div>
            )}
            {selectedComplaint.driver && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Driver</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedComplaint.driver.firstName} {selectedComplaint.driver.lastName}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Complaints

