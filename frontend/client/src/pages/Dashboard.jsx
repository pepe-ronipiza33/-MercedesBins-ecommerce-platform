import React, { useEffect, useState } from 'react'
import { fetchMyItems } from '../api'
import ItemCard from '../components/ItemCard'

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please log in')
      setLoading(false)
      return
    }
    fetchMyItems(token).then(setItems).catch(setError).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading your items...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="dashboard">
      <h1>🎨 Your Mercedes Bins Marketplace</h1>
      {items.length === 0 ? (
        <p>You haven't listed any items yet. <a href="/create">Create your first item!</a></p>
      ) : (
        <div className="grid">
          {items.map((it) => (
            <ItemCard key={it._id} item={it} />
          ))}
        </div>
      )}
    </div>
  )
}