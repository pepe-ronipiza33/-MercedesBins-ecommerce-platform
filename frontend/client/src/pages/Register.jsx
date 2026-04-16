import React, { useState } from 'react'
import { register } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      const data = await register(form)
      localStorage.setItem('token', data.token)
      nav('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Register</button>
    </form>
  )
}
