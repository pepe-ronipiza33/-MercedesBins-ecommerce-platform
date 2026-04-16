import React, { useEffect, useState } from 'react'
import { fetchItems } from '../api'
import ItemCard from '../components/ItemCard'

const categories = [
  'All',
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

export default function Home() {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    fetchItems().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter(item => item.category === selectedCategory))
    }
  }, [items, selectedCategory])

  if (loading) return <div className="loading">Discovering amazing items...</div>

  return (
    <div className="home">
      <h1>🚗 Welcome to Mercedes Bins</h1>
      <p>Discover unique items from creators worldwide</p>
      <div className="filters">
        <label>Filter by Category:</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="grid">
        {filteredItems.map((it) => (
          <ItemCard key={it._id} item={it} />
        ))}
      </div>
      {filteredItems.length === 0 && <p>No items found in this category.</p>}
    </div>
  )
}
