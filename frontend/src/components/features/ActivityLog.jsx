import { useState } from 'react'
import { Plus, Calendar, Droplets, Scissors, Bug, Fertilizer, Clock } from 'lucide-react'

const ActivityLog = ({ crop }) => {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'irrigation',
      title: 'Watering',
      description: 'Applied 2 hours of drip irrigation',
      date: '2024-01-15',
      time: '06:00 AM',
      icon: Droplets,
      color: 'blue'
    },
    {
      id: 2,
      type: 'fertilizer',
      title: 'Fertilizer Application',
      description: 'Applied NPK fertilizer - 50kg per acre',
      date: '2024-01-14',
      time: '08:30 AM',
      icon: Fertilizer,
      color: 'green'
    },
    {
      id: 3,
      type: 'pest_control',
      title: 'Pest Control',
      description: 'Sprayed organic pesticide for aphid control',
      date: '2024-01-12',
      time: '05:45 PM',
      icon: Bug,
      color: 'red'
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: '',
    title: '',
    description: '',
    date: '',
    time: ''
  })

  const activityTypes = [
    { value: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'blue' },
    { value: 'fertilizer', label: 'Fertilizer', icon: Fertilizer, color: 'green' },
    { value: 'pest_control', label: 'Pest Control', icon: Bug, color: 'red' },
    { value: 'harvesting', label: 'Harvesting', icon: Scissors, color: 'yellow' },
    { value: 'planting', label: 'Planting', icon: Calendar, color: 'purple' }
  ]

  const handleAddActivity = (e) => {
    e.preventDefault()
    if (!newActivity.type || !newActivity.title || !newActivity.date) return

    const activityType = activityTypes.find(type => type.value === newActivity.type)
    const activity = {
      id: Date.now(),
      ...newActivity,
      icon: activityType.icon,
      color: activityType.color
    }

    setActivities([activity, ...activities])
    setNewActivity({ type: '', title: '', description: '', date: '', time: '' })
    setShowAddForm(false)
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      red: 'bg-red-100 text-red-600 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
            <p className="text-gray-600">Track daily activities for {crop.name}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Add Activity Form */}
        {showAddForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Activity</h3>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type
                  </label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select type</option>
                    {activityTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                    placeholder="Brief title for the activity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  placeholder="Detailed description of the activity"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities recorded</h3>
              <p className="text-gray-500 mb-4">Start tracking your farming activities</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Activity
              </button>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(activity.color)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                          {activity.time && (
                            <>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>{activity.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-gray-600">{activity.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLog