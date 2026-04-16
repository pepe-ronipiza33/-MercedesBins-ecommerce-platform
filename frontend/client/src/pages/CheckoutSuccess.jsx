import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { confirmPayment } from '../api'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('confirming')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const itemId = searchParams.get('itemId')
    const token = localStorage.getItem('token')

    if (sessionId && itemId && token) {
      confirmPayment(sessionId, itemId, token)
        .then(() => {
          setStatus('success')
          setMessage('Payment confirmed! Your purchase is complete.')
        })
        .catch(err => {
          setStatus('error')
          setMessage(err.message || 'Payment confirmation failed.')
        })
    } else {
      setStatus('error')
      setMessage('Invalid checkout parameters.')
    }
  }, [searchParams])

  return (
    <div className="checkout-success">
      <div className="card">
        <h1>{status === 'success' ? '🎉 Purchase Successful!' : status === 'error' ? '❌ Payment Error' : '⏳ Confirming Payment...'}</h1>
        <p>{message}</p>
        <Link to="/" className="cta">Back to Marketplace</Link>
      </div>
    </div>
  )
}