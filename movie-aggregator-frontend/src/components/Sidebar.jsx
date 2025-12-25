import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Film, Star, Tv, Gamepad2, Sparkles, Calendar, Flame, Heart, Globe, Zap, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const navItems = [
    ...(isAuthenticated && user?.role === 'ADMIN' ? [{ path: '/dashboard', label: 'Дашборд', icon: LayoutDashboard }] : []),
    { path: '/critics', label: 'Критики', icon: Star },
    { path: '/analytics', label: 'Аналитика', icon: Globe },
    { path: '/world-ratings', label: 'Мир оценок', icon: Zap },
    { path: '/taste-profile', label: 'Мой вкус', icon: Heart },
    { path: '/hype-monitoring', label: 'Хайп', icon: Flame },
    { path: '/coming-soon', label: 'Скоро выйдет', icon: Calendar },
  ]

  const contentItems = [
    { path: '/', label: 'Все', icon: Sparkles },
    { path: '/movies', label: 'Фильмы', icon: Film },
    { path: '/series', label: 'Сериалы', icon: Tv },
    { path: '/games', label: 'Игры', icon: Gamepad2 },
  ]

  const isActivePath = (path) => location.pathname === path

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Content Section */}
        <div>
          <h3 className="px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
            Контент
          </h3>
          <div className="space-y-1">
            {contentItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isActivePath(item.path)
                      ? 'bg-imdb text-dark-900 shadow-lg shadow-imdb/20'
                      : 'text-dark-200 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Navigation Section */}
        <div>
          <h3 className="px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
            Навигация
          </h3>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isActivePath(item.path)
                      ? 'bg-imdb text-dark-900 shadow-lg shadow-imdb/20'
                      : 'text-dark-200 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
