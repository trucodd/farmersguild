import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Edit2, Trash2, Save, X, FileText, Download, Activity, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">ACTIVITY LOG</h1>
          <p className="text-text-secondary text-lg">Track farming activities for {selectedCrop.name}</p>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-accent-meadow" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">FARM ACTIVITIES</h3>
                <p className="text-text-secondary">{activities.length} activities logged</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {activities.length > 0 && (
                <button
                  onClick={exportToJSON}
                  className="glass-card border border-white/20 text-text-primary px-4 py-3 rounded-lg hover:bg-white/10 transition-all flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2 font-medium shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Log Activity</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-accent-meadow" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Log New Activity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddActivity} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Task *
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary"
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
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Custom Task Name *
                  </label>
                  <input
                    type="text"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="Enter custom task name"
                    className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  rows={4}
                  placeholder="Add any additional notes or observations..."
                  className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-accent-meadow text-white rounded-lg hover:bg-accent-meadow/80 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <Save className="h-5 w-5" />
                <span>Log Activity</span>
              </button>
            </form>
          </motion.div>
        )}

        {/* Activities List */}
        {activities.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl border border-white/20 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent-meadow" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">ACTIVITY TIMELINE</h3>
                <p className="text-text-secondary">Chronological history for {selectedCrop.name}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const isToday = activity.date.toDateString() === new Date().toDateString()
                const showDate = index === 0 || activity.date.toDateString() !== activities[index - 1]?.date.toDateString()
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {showDate && (
                      <div className="flex items-center justify-center mb-6">
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                          isToday ? 'bg-accent-meadow/20 text-accent-meadow border border-accent-meadow/30' : 'glass-card border border-white/20 text-text-secondary'
                        }`}>
                          {isToday ? 'Today' : activity.date.toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4 group">
                      <div className="w-12 h-12 bg-accent-meadow/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-accent-meadow" />
                      </div>
                      <div className="flex-1 glass-card border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-text-primary">{activity.task}</h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 text-text-secondary text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="p-1 text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete activity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {activity.note && (
                          <div className="glass-card p-3 rounded-lg border border-white/10 mt-3">
                            <p className="text-sm text-text-secondary">{activity.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl border border-white/20 p-12 text-center"
          >
            <div className="w-20 h-20 bg-accent-meadow/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="h-10 w-10 text-accent-meadow" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Activities Logged Yet</h3>
            <p className="text-text-secondary text-lg mb-6">Start tracking your farming activities for {selectedCrop.name}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Log Your First Activity
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogFeature