/**
 * Export data to Excel, PDF, or CSV
 */

export const exportToExcel = (data, headers, filename = 'export') => {
  // Convert data to CSV first, then download
  const csv = convertToCSV(data, headers)
  downloadFile(csv, `${filename}.csv`, 'text/csv')
}

export const exportToPDF = (data, headers, filename = 'export', title = 'Report') => {
  // For PDF, we'll use the backend endpoint
  // This is a placeholder for client-side PDF generation if needed
  console.log('PDF export should use backend endpoint')
}

export const exportToCSV = (data, headers, filename = 'export') => {
  const csv = convertToCSV(data, headers)
  downloadFile(csv, `${filename}.csv`, 'text/csv')
}

const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return ''
  
  // Get header row
  const headerRow = headers.map(h => {
    const label = typeof h === 'string' ? h : (h.label || h.key || '')
    return `"${label.replace(/"/g, '""')}"`
  }).join(',')
  
  // Get data rows
  const rows = data.map(row => {
    return headers.map(header => {
      const key = typeof header === 'string' ? header : (header.key || header.label || '')
      const value = row[key] !== undefined ? String(row[key] || '') : ''
      return `"${value.replace(/"/g, '""')}"`
    }).join(',')
  })
  
  return [headerRow, ...rows].join('\n')
}

const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export data using backend endpoint
 */
export const exportFromBackend = async (endpoint, format = 'excel', params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      format,
      ...params
    })
    
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'https://qeema-track.developteam.site/api'
    
    const response = await fetch(`${apiUrl}${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `export_${Date.now()}`
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    } else {
      // Default filename based on format
      const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx'
      filename = `export_${Date.now()}.${extension}`
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true }
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

