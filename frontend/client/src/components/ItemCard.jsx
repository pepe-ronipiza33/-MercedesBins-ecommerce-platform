import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { placeBid, createCheckoutSession } from '../api'

export default function ItemCard({ item }) {
  const [bid, setBid] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submitBid(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      await placeBid(item._id, Number(bid), token)
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Bid failed')
    } finally {
      setLoading(false)
    }
  }

  async function buyNow() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const { url } = await createCheckoutSession(item._id, token)
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  const isAuction = item.saleType === 'auction'
  const isEnded = isAuction && item.auctionEnd && new Date() > new Date(item.auctionEnd)
  const currentPrice = item.currentPrice || item.startingPrice || item.price

  return (
    <div className="card">
      <span className="category">{item.category}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <p className="price">${currentPrice?.toFixed(2)}</p>
      <p>Seller: {item.seller?.name || 'Unknown'}</p>
      {isAuction && (
        <p>
          {isEnded ? 'Auction Ended' : `Ends: ${new Date(item.auctionEnd).toLocaleString()}`}
        </p>
      )}
      <div style={{ marginTop: '1rem' }}>
        <Link to={`/item/${item._id}`} className="view-details">View Details</Link>
        {isAuction && !isEnded ? (
          <form onSubmit={submitBid} style={{ marginTop: '0.5rem' }}>
            {error && <div className="error">{error}</div>}
            <input
              placeholder="Your bid"
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              type="number"
              step="0.01"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Bidding...' : 'Place Bid'}
            </button>
          </form>
        ) : !isAuction && (
          <button onClick={buyNow} disabled={loading || item.isSold}>
            {loading ? 'Processing...' : item.isSold ? 'Sold' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  )
}
