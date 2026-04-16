import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import CreateItem from './pages/CreateItem'
import Dashboard from './pages/Dashboard'
import ItemDetail from './pages/ItemDetail'
import CheckoutSuccess from './pages/CheckoutSuccess'
import { getMe } from './api'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe(token).then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/')
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <Link to="/" className="brand-link">🚗 Mercedes Bins</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Browse</Link>
          {user && <Link to="/create">Sell Item</Link>}
          {user && <Link to="/dashboard">My Items</Link>}
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="cta">Join</Link>
            </>
          ) : (
            <button onClick={logout} className="logout-btn">Logout</button>
          )}
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreateItem />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
        </Routes>
      </main>
    </div>
  )
}
