import React, { useState } from 'react'
import { login } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      const data = await login(form)
      localStorage.setItem('token', data.token)
      nav('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Login</button>
    </form>
  )
}
