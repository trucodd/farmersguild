import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign } from 'lucide-react'

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
      <div className="text-center py-8 text-gray-500">
        Select a crop to track costs
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Cost Summary */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">{cropName} - Total Cost</h3>
            <p className="text-2xl font-bold text-green-600">₹{total.total_cost.toFixed(2)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
        
        {/* Breakdown */}
        {Object.keys(total.breakdown).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(total.breakdown).map(([type, amount]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type}:</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Cost Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
      >
        <Plus className="h-4 w-4" />
        Add Expense
      </button>

      {/* Add Cost Form */}
      {showForm && (
        <form onSubmit={addCost} className="bg-white p-4 border rounded-lg space-y-4">
          <select
            value={newCost.expense_type}
            onChange={(e) => setNewCost({...newCost, expense_type: e.target.value})}
            className="w-full p-2 border rounded"
            required
          >
            {expenseTypes.map(type => (
              <option key={type} value={type} className="capitalize">{type}</option>
            ))}
          </select>
          
          {newCost.expense_type === 'other' && (
            <input
              type="text"
              placeholder="Expense title"
              value={newCost.title}
              onChange={(e) => setNewCost({...newCost, title: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          )}
          
          <input
            type="number"
            step="0.01"
            placeholder="Amount (₹)"
            value={newCost.amount}
            onChange={(e) => setNewCost({...newCost, amount: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
          
          <input
            type="text"
            placeholder="Description (optional)"
            value={newCost.description}
            onChange={(e) => setNewCost({...newCost, description: e.target.value})}
            className="w-full p-2 border rounded"
          />
          
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Add
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Cost List */}
      <div className="space-y-2">
        {costs.map(cost => (
          <div key={cost.id} className="flex items-center justify-between bg-white p-3 border rounded">
            <div>
              <div className="font-medium">
                {cost.expense_type === 'other' ? cost.title : cost.expense_type.charAt(0).toUpperCase() + cost.expense_type.slice(1)}
              </div>
              <div className="text-sm text-gray-600">{cost.description}</div>
              <div className="text-xs text-gray-400">{new Date(cost.date).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">₹{cost.amount.toFixed(2)}</span>
              <button
                onClick={() => deleteCost(cost.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CostTracker