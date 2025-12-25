import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { AuthProvider } from './context/AuthContext'
import { AchievementProvider } from './context/AchievementContext'
import App from './App.jsx'
import './index.css'

// Global axios defaults to avoid long hanging requests when backend is down
axios.defaults.timeout = 8000 // 8s hard timeout
axios.defaults.withCredentials = true

// Optional: graceful network error logging (keeps UI responsive)
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      console.warn('[HTTP] Request timeout:', err.config?.url)
    }
    return Promise.reject(err)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AchievementProvider>
          <App />
        </AchievementProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)