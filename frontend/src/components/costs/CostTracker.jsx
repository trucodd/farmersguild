import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

const CostTracker = ({ cropId, cropName }) => {
  const [costs, setCosts] = useState([])
  const [total, setTotal] = useState({ total_cost: 0, breakdown: {} })
  const [showForm, setShowForm] = useState(false)
  const [newCost, setNewCost] = useState({
    expense_type: 'seed',
    title: '',
    amount: '',
    description: ''
  })

  const expenseTypes = ['seed', 'fertilizer', 'pesticide', 'labor', 'transport', 'other']

  useEffect(() => {
    if (cropId) {
      fetchCosts()
      fetchTotal()
    }
  }, [cropId])

  const fetchCosts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/costs/crop/${cropId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCosts(data)
      }
    } catch (error) {
      console.error('Error fetching costs:', error)
    }
  }

  const fetchTotal = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/costs/crop/${cropId}/total`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTotal(data)
      }
    } catch (error) {
      console.error('Error fetching total:', error)
    }
  }

  const addCost = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/costs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crop_id: cropId,
          ...newCost,
          amount: parseFloat(newCost.amount)
        })
      })
      if (response.ok) {
        setNewCost({ expense_type: 'seed', title: '', amount: '', description: '' })
        setShowForm(false)
        fetchCosts()
        fetchTotal()
      }
    } catch (error) {
      console.error('Error adding cost:', error)
    }
  }

  const deleteCost = async (costId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/costs/${costId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchCosts()
        fetchTotal()
      }
    } catch (error) {
      console.error('Error deleting cost:', error)
    }
  }

  if (!cropId) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <TrendingUp className="h-16 w-16 text-text-secondary mb-4" />
        <p className="text-text-secondary text-lg">Select a crop to track costs</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-2">COST TRACKING</h2>
        <p className="text-text-secondary">{cropName} expense management</p>
      </motion.div>

      {/* Total Cost Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
      >
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-2">TOTAL EXPENSES</h3>
              <p className="text-3xl font-bold text-accent-meadow">₹{total.total_cost.toFixed(2)}</p>
            </div>
            <div className="w-16 h-16 bg-accent-meadow/20 rounded-full flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-accent-meadow" />
            </div>
          </div>
          
          {/* Breakdown */}
          {Object.keys(total.breakdown).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(total.breakdown).map(([type, amount]) => (
                <div key={type} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-sm text-text-secondary capitalize mb-1">{type}</p>
                  <p className="font-bold text-text-primary">₹{amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Cost Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-3 bg-accent-meadow hover:bg-accent-meadow/80 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
      >
        <Plus className="h-5 w-5" />
        Add New Expense
      </motion.button>

      {/* Add Cost Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={addCost}
          className="glass-card p-6 rounded-xl space-y-4 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Expense</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Expense Type</label>
              <select
                value={newCost.expense_type}
                onChange={(e) => setNewCost({...newCost, expense_type: e.target.value})}
                className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary"
                required
              >
                {expenseTypes.map(type => (
                  <option key={type} value={type} className="capitalize">{type}</option>
                ))}
              </select>
            </div>
            
            {newCost.expense_type === 'other' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Expense Title</label>
                <input
                  type="text"
                  placeholder="Enter expense title"
                  value={newCost.title}
                  onChange={(e) => setNewCost({...newCost, title: e.target.value})}
                  className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newCost.amount}
                onChange={(e) => setNewCost({...newCost, amount: e.target.value})}
                className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Description (Optional)</label>
              <textarea
                placeholder="Add notes about this expense..."
                value={newCost.description}
                onChange={(e) => setNewCost({...newCost, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary resize-none"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 border border-white/20 text-text-secondary rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-accent-meadow text-white rounded-lg hover:bg-accent-meadow/80 transition-colors font-medium"
            >
              Add Expense
            </button>
          </div>
        </motion.form>
      )}

      {/* Cost List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-text-primary">Recent Expenses</h3>
        
        {costs.length === 0 ? (
          <div className="glass-card p-8 rounded-xl text-center border border-white/20">
            <TrendingUp className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No expenses recorded yet</p>
            <p className="text-sm text-text-secondary mt-1">Add your first expense to start tracking costs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {costs.map((cost, index) => (
              <motion.div
                key={cost.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card p-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-accent-meadow" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {cost.expense_type === 'other' ? cost.title : cost.expense_type.charAt(0).toUpperCase() + cost.expense_type.slice(1)}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(cost.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {cost.description && (
                      <p className="text-sm text-text-secondary ml-13">{cost.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold text-accent-meadow">₹{cost.amount.toFixed(2)}</span>
                    <button
                      onClick={() => deleteCost(cost.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default CostTracker