import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Movies from './pages/Movies'
import Series from './pages/Series'
import Games from './pages/Games'
import MovieDetail from './pages/MovieDetail'
import SeriesDetail from './pages/SeriesDetail'
import GameDetail from './pages/GameDetail'
import SearchResults from './pages/SearchResults'
import Profile from './pages/Profile'
import ComingSoon from './pages/ComingSoon'
import Critics from './pages/Critics'
import HypeMonitoring from './pages/HypeMonitoring'
import TasteProfile from './pages/TasteProfile'
import WorldRatings from './pages/WorldRatings'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminPanel from './pages/AdminPanel'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-8 min-w-0">
          <div className="container mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<Series />} />
          <Route path="/games" element={<Games />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/critics" element={<Critics />} />
          <Route path="/dashboard" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/hype-monitoring" element={<HypeMonitoring />} />
          <Route path="/taste-profile" element={<TasteProfile />} />
          <Route path="/world-ratings" element={<WorldRatings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/content/:id" element={<MovieDetail />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/series/:id" element={<SeriesDetail />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
            </Routes>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default App