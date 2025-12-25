import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Menu, X, Film, User, Star, Tv, Gamepad2, Sparkles, Calendar, LogOut, LogIn, Shield, Flame, Heart, Globe, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const navItems = [
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search autocomplete with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        try {
          const { data } = await axios.get('/api/content/autocomplete', {
            params: { q: searchQuery, limit: 8 }
          })
          setSearchResults(data || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const handleSelectContent = (contentId) => {
    setSearchQuery('')
    setShowSuggestions(false)
    setSearchResults([])
    navigate(`/content/${contentId}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'MOVIE': return <Film className="h-4 w-4" />
      case 'TV_SERIES': return <Tv className="h-4 w-4" />
      case 'GAME': return <Gamepad2 className="h-4 w-4" />
      default: return <Film className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (type) => {
    switch(type) {
      case 'MOVIE': return 'Фильм'
      case 'TV_SERIES': return 'Сериал'
      case 'GAME': return 'Игра'
      default: return type
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActivePath = (path) => location.pathname === path

  return (
    <nav className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg shadow-accent-500/20">
                <Film className="h-5 w-5 text-white" />
                <Zap className="absolute -bottom-1 -right-1 h-4 w-4 text-white fill-current drop-shadow-md" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black tracking-tight text-white group-hover:text-accent-500 transition-colors">
                Cine<span className="text-accent-500">Vibe</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-dark-400 -mt-1 group-hover:text-white transition-colors">
                Feel the Content
              </span>
            </div>
          </Link>

          {/* Поиск */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 h-4 w-4 z-10" />
              <input
                type="text"
                placeholder="Поиск фильмов, сериалов, игр..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                className="w-full pl-11 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded text-dark-100 placeholder-dark-400
                         focus:outline-none focus:border-imdb focus:ring-1 focus:ring-imdb transition-all"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="px-4 py-3 text-center text-dark-400">
                      <div className="animate-spin h-5 w-5 border-2 border-imdb border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectContent(result.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-dark-700 transition-colors text-left border-b border-dark-700 last:border-0"
                        >
                          {result.poster_url ? (
                            <img 
                              src={result.poster_url} 
                              alt={result.title}
                              className="w-10 h-14 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-10 h-14 bg-dark-700 rounded flex items-center justify-center">
                              {getContentTypeIcon(result.content_type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-dark-100 truncate">{result.title}</div>
                            <div className="text-xs text-dark-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                {getContentTypeIcon(result.content_type)}
                                {getContentTypeLabel(result.content_type)}
                              </span>
                              {result.release_year && (
                                <>
                                  <span>•</span>
                                  <span>{result.release_year}</span>
                                </>
                              )}
                              {result.avg_rating > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-imdb text-imdb" />
                                    {Number(result.avg_rating).toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {searchQuery.trim() && (
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full px-4 py-3 text-sm text-imdb hover:bg-dark-700 transition-colors text-center"
                        >
                          Показать все результаты для "{searchQuery}"
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-center text-dark-400 text-sm">
                      Ничего не найдено
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Навигация для десктопа - удалена, перенесена в сайдбар */}
          <div className="hidden md:flex items-center space-x-1 ml-auto">
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 rounded font-medium text-sm transition-all ${
                      isActivePath('/admin')
                        ? 'bg-imdb text-dark-900'
                        : 'text-dark-200 hover:text-dark-100 hover:bg-dark-700'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Админ</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 rounded font-medium text-sm transition-all ${
                    isActivePath('/profile')
                      ? 'bg-imdb text-dark-900'
                      : 'text-dark-200 hover:text-dark-100 hover:bg-dark-700'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded font-medium text-sm text-dark-200 hover:text-dark-100 hover:bg-dark-700 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выход</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded font-medium text-sm text-dark-200 hover:text-dark-100 hover:bg-dark-700 transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Вход</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-2 px-4 py-2 rounded font-medium text-sm bg-imdb text-dark-900 hover:bg-imdb/90 transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Регистрация</span>
                </Link>
              </div>
            )}
          </div>

          {/* Мобильное меню кнопка */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded hover:bg-dark-700 text-dark-200 transition"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Мобильное меню */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-600">
            {/* Мобильный поиск */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded text-dark-100 
                           focus:outline-none focus:border-imdb"
                />
              </div>
            </div>

            {/* Мобильная навигация */}
            <div className="space-y-1">
              {/* Контент секция */}
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-dark-400 uppercase">Контент</div>
                {contentItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded font-medium transition ${
                        isActivePath(item.path)
                          ? 'bg-imdb text-dark-900'
                          : 'text-dark-200 hover:bg-dark-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Остальные пункты */}
              <div className="pt-2 border-t border-dark-700">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded font-medium transition ${
                        isActivePath(item.path)
                          ? 'bg-imdb text-dark-900'
                          : 'text-dark-200 hover:bg-dark-700'
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
        )}
      </div>
    </nav>
  )
}

export default Navbar