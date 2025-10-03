import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Admin = () => {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600 mb-4">Admin features will be added here in the future.</p>
        <p className="text-sm text-gray-500">
          For now, you can access commodities data directly at:
          <br />
          <a 
            href="http://localhost:8000/api/market/commodities" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            http://localhost:8000/api/market/commodities
          </a>
        </p>
      </div>
    </div>
  )
}

export default Admin