const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, opts = {}) {
  const res = await fetch(API_BASE + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data
}

export const register = (payload) => request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const login = (payload) => request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const getMe = (token) => request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
export const fetchItems = () => request('/api/items')
export const fetchMyItems = (token) => request('/api/items/mine', { headers: { Authorization: `Bearer ${token}` } })
export const createItem = (payload, token) => request('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
export const placeBid = (id, amount, token) => request(`/api/auctions/${id}/bid`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount }) })
export const createCheckoutSession = (itemId, token) => request(`/api/checkout/create-session/${itemId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
export const confirmPayment = (sessionId, itemId, token) => request('/api/checkout/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sessionId, itemId }) })
