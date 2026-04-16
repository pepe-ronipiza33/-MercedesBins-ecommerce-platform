import React, { useState } from 'react'
import { createItem } from '../api'
import { useNavigate } from 'react-router-dom'

const categories = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Garden',
  'Sports & Fitness',
  'Collectibles',
  'Art & Crafts',
  'Books & Media',
  'Automotive',
  'Health & Beauty',
  'Toys & Games',
  'Other'
]

export default function CreateItem() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    saleType: 'fixed',
    price: '',
    startingPrice: '',
    auctionEnd: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in first')
        return
      }
      const payload = { ...form }
      if (form.saleType === 'fixed') {
        payload.price = Number(form.price)
        delete payload.startingPrice
        delete payload.auctionEnd
      } else {
        payload.startingPrice = Number(form.startingPrice)
        payload.auctionEnd = new Date(form.auctionEnd).toISOString()
        delete payload.price
      }
      await createItem(payload, token)
      nav('/dashboard')
    } catch (err) {
      setError(err.message || 'Create item failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-item">
      <h1>🚀 Launch Your Item</h1>
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <input
            placeholder="Item Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <textarea
          placeholder="Describe your item..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows="4"
        />
        <label>
          Sale Type:
          <select value={form.saleType} onChange={(e) => setForm({ ...form, saleType: e.target.value })}>
            <option value="fixed">Fixed Price</option>
            <option value="auction">Auction</option>
          </select>
        </label>
        {form.saleType === 'fixed' ? (
          <input
            type="number"
            step="0.01"
            placeholder="Price ($)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        ) : (
          <div className="form-grid">
            <input
              type="number"
              step="0.01"
              placeholder="Starting Price ($)"
              value={form.startingPrice}
              onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              placeholder="Auction End"
              value={form.auctionEnd}
              onChange={(e) => setForm({ ...form, auctionEnd: e.target.value })}
              required
            />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Launch Item'}
        </button>
      </form>
    </div>
  )
}
