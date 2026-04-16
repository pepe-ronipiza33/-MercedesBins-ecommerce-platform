import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchItems, placeBid, createCheckoutSession } from '../api'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [bid, setBid] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bidLoading, setBidLoading] = useState(false)

  useEffect(() => {
    fetchItems().then(items => {
      const found = items.find(i => i._id === id)
      setItem(found)
    }).catch(setError).finally(() => setLoading(false))
  }, [id])

  async function submitBid(e) {
    e.preventDefault()
    setBidLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      await placeBid(id, Number(bid), token)
      // Refresh item
      const items = await fetchItems()
      const updated = items.find(i => i._id === id)
      setItem(updated)
      setBid('')
    } catch (err) {
      setError(err.message || 'Bid failed')
    } finally {
      setBidLoading(false)
    }
  }

  async function buyNow() {
    setBidLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const { url } = await createCheckoutSession(id, token)
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Purchase failed')
    } finally {
      setBidLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading item...</div>
  if (!item) return <div className="error">Item not found</div>

  const isAuction = item.saleType === 'auction'
  const isEnded = isAuction && item.auctionEnd && new Date() > new Date(item.auctionEnd)
  const currentPrice = item.currentPrice || item.startingPrice || item.price

  return (
    <div className="item-detail">
      <div className="card">
        <span className="category">{item.category}</span>
        <h1>{item.title}</h1>
        <p className="description">{item.description}</p>
        <p className="price">${currentPrice?.toFixed(2)}</p>
        <p>Seller: {item.seller?.name || 'Unknown'}</p>
        {isAuction && (
          <>
            <p>Ends: {new Date(item.auctionEnd).toLocaleString()}</p>
            {item.bids?.length > 0 && (
              <div>
                <h3>Bid History</h3>
                <ul>
                  {item.bids.slice(-5).reverse().map((b, i) => (
                    <li key={i}>{b.bidder.name}: ${b.amount} ({new Date(b.createdAt).toLocaleString()})</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {error && <p className="error">{error}</p>}
        {isAuction && !isEnded ? (
          <form onSubmit={submitBid}>
            <input
              placeholder="Your bid amount"
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              type="number"
              step="0.01"
              required
            />
            <button type="submit" disabled={bidLoading}>
              {bidLoading ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </form>
        ) : !isAuction && (
          <button onClick={buyNow} disabled={bidLoading || item.isSold}>
            {bidLoading ? 'Processing...' : item.isSold ? 'Sold' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  )
}