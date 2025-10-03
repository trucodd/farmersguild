import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Edit2, Trash2, Save, X, FileText, Download } from 'lucide-react'

const ActivityLogFeature = ({ selectedCrop }) => {
  const [activities, setActivities] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState('')
  const [customTask, setCustomTask] = useState('')
  const [activityNote, setActivityNote] = useState('')

  // Common tasks for all crops
  const commonTasks = [
    'Plowed soil',
    'Watered',
    'Added fertilizer',
    'Removed weeds',
    'Checked growth',
    'Applied pesticide',
    'Harvested'
  ]

  // Crop-specific tasks
  const cropSpecificTasks = {
    'Wheat': ['Sowed seeds', 'Applied herbicide', 'Monitored grain filling'],
    'Rice': ['Flood irrigated', 'Transplanted seedlings', 'Drained field'],
    'Tomato': ['Pruned branches', 'Staked plants', 'Removed suckers'],
    'Cotton': ['Picked cotton', 'Applied growth regulator', 'Monitored bollworm'],
    'Mango': ['Bagged fruits', 'Pruned canopy', 'Applied fruit fly trap'],
    'Corn': ['Side-dressed fertilizer', 'Checked tasseling', 'Monitored ear development'],
    'Potato': ['Hilled soil', 'Monitored blight', 'Checked tuber development']
  }

  // Get available tasks for current crop
  const getAvailableTasks = () => {
    const cropTasks = cropSpecificTasks[selectedCrop.name] || []
    return [...commonTasks, ...cropTasks]
  }

  // Load activities from localStorage
  useEffect(() => {
    const savedActivities = localStorage.getItem(`activities_${selectedCrop.id}`)
    if (savedActivities) {
      const parsedActivities = JSON.parse(savedActivities)
      const activitiesWithDates = parsedActivities.map(activity => ({
        ...activity,
        date: new Date(activity.date),
        createdAt: new Date(activity.createdAt)
      }))
      setActivities(activitiesWithDates.sort((a, b) => a.createdAt - b.createdAt))
      setShowAddForm(false) // Hide form if activities exist
    } else {
      setShowAddForm(true) // Show form if no activities exist
    }
  }, [selectedCrop.id])

  // Save activities to localStorage
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem(`activities_${selectedCrop.id}`, JSON.stringify(activities))
    }
  }, [activities, selectedCrop.id])

  const resetForm = () => {
    setSelectedTask('')
    setCustomTask('')
    setActivityNote('')
    // Only hide form if activities exist, otherwise keep it open for first-time users
    if (activities.length > 0) {
      setShowAddForm(false)
    }
  }

  const handleAddActivity = (e) => {
    e.preventDefault()
    
    const taskName = selectedTask === 'custom' ? customTask : selectedTask
    if (!taskName) return

    const now = new Date()
    const newActivity = {
      id: Date.now(),
      crop: selectedCrop.name,
      task: taskName,
      date: now,
      note: activityNote,
      createdAt: now
    }

    setActivities(prev => [...prev, newActivity].sort((a, b) => a.createdAt - b.createdAt))
    resetForm()
  }



  const handleDeleteActivity = (activityId) => {
    setActivities(prev => {
      const updated = prev.filter(activity => activity.id !== activityId)
      if (updated.length === 0) {
        localStorage.removeItem(`activities_${selectedCrop.id}`)
      }
      return updated
    })
  }

  const exportToJSON = () => {
    const exportData = activities.map(activity => ({
      crop: activity.crop,
      task: activity.task,
      date: activity.date.toISOString().split('T')[0],
      time: activity.date.toTimeString().slice(0, 8),
      note: activity.note || ''
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCrop.name}_activity_log.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-gray-600">Track farming activities for {selectedCrop.name}</p>
        </div>
        <div className="flex space-x-3">
          {activities.length > 0 && (
            <button
              onClick={exportToJSON}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Log New Activity
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task *
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select a task</option>
                <optgroup label="Common Tasks">
                  {commonTasks.map(task => (
                    <option key={task} value={task}>{task}</option>
                  ))}
                </optgroup>
                {cropSpecificTasks[selectedCrop.name] && (
                  <optgroup label={`${selectedCrop.name} Specific`}>
                    {cropSpecificTasks[selectedCrop.name].map(task => (
                      <option key={task} value={task}>{task}</option>
                    ))}
                  </optgroup>
                )}
                <option value="custom">Custom Task...</option>
              </select>
            </div>

            {selectedTask === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Task Name *
                </label>
                <input
                  type="text"
                  value={customTask}
                  onChange={(e) => setCustomTask(e.target.value)}
                  placeholder="Enter custom task name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            )}



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                rows={3}
                placeholder="Add any additional notes or observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Log Activity</span>
            </button>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <h3 className="font-semibold text-purple-800">Activity Timeline for {selectedCrop.name}</h3>
              <p className="text-sm text-purple-600">Chronological history of farming activities</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activities.map((activity, index) => {
                const isToday = activity.date.toDateString() === new Date().toDateString()
                const showDate = index === 0 || activity.date.toDateString() !== activities[index - 1]?.date.toDateString()
                
                return (
                  <div key={activity.id}>
                    {showDate && (
                      <div className="flex items-center justify-center mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isToday ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isToday ? 'Today' : activity.date.toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3 group">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 max-w-xs lg:max-w-md">
                        <div className="font-medium text-gray-900 mb-1">{activity.task}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {activity.note && (
                          <div className="text-sm text-gray-700 bg-white rounded-lg p-2 mt-2">
                            {activity.note}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete activity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogFeature