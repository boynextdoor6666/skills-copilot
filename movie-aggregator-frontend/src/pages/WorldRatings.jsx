import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Globe, TrendingUp, TrendingDown, Users, Star, Film, Tv, Gamepad2, ArrowUpDown, Search, ChevronDown, ChevronUp, BarChart3, MapPin } from 'lucide-react'
import { COUNTRIES, getCountryFlag } from './Profile'
import MetascoreBadge from '../components/MetascoreBadge'

const WorldRatings = () => {
  const [globalStats, setGlobalStats] = useState(null)
  const [contentWithCountryRatings, setContentWithCountryRatings] = useState([])
  const [selectedContent, setSelectedContent] = useState(null)
  const [contentRatings, setContentRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('difference') // 'difference', 'country', 'rating'
  const [filterType, setFilterType] = useState('all') // 'all', 'MOVIE', 'TV_SERIES', 'GAME'
  const [expandedCountry, setExpandedCountry] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, contentRes] = await Promise.allSettled([
        axios.get('/api/content/country-ratings/stats'),
        axios.get('/api/content', { params: { limit: 100 } })
      ])

      if (statsRes.status === 'fulfilled') {
        setGlobalStats(statsRes.value.data)
      }

      if (contentRes.status === 'fulfilled') {
        setContentWithCountryRatings(contentRes.value.data || [])
      }
    } catch (err) {
      console.error('Error loading world ratings:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadContentRatings = async (contentId) => {
    setLoadingContent(true)
    try {
      const { data } = await axios.get(`/api/content/${contentId}/country-ratings`)
      setContentRatings(data)
    } catch (err) {
      console.error('Error loading content country ratings:', err)
      setContentRatings(null)
    } finally {
      setLoadingContent(false)
    }
  }

  const handleContentSelect = (content) => {
    setSelectedContent(content)
    loadContentRatings(content.id)
  }

  const getCountryName = (code) => {
    return COUNTRIES.find(c => c.code === code)?.name || code
  }

  const getRatingDifference = (countryRating, globalRating) => {
    const diff = countryRating - globalRating
    return diff
  }

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-400'
    if (rating >= 6) return 'text-yellow-400'
    if (rating >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  const getDifferenceColor = (diff) => {
    if (diff > 1) return 'text-green-400'
    if (diff > 0) return 'text-green-300'
    if (diff < -1) return 'text-red-400'
    if (diff < 0) return 'text-red-300'
    return 'text-gray-400'
  }

  const filteredContent = contentWithCountryRatings
    .filter(item => {
      if (filterType !== 'all' && item.content_type !== filterType) return false
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

  const sortedCountryRatings = contentRatings?.ratings
    ? [...contentRatings.ratings].sort((a, b) => {
        if (sortBy === 'difference') {
          return Math.abs(b.difference) - Math.abs(a.difference)
        }
        if (sortBy === 'rating') {
          return b.avgRating - a.avgRating
        }
        return a.country.localeCompare(b.country)
      })
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#666]">Загрузка мировых рейтингов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 text-8xl opacity-10">🌍</div>
          <div className="absolute top-40 right-20 text-6xl opacity-10">🌎</div>
          <div className="absolute bottom-10 left-1/3 text-7xl opacity-10">🌏</div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#ff6600]/20 text-[#ff6600] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Глобальная статистика
            </div>
            
            <h1 className="text-5xl font-black mb-4">
              Мировые рейтинги
            </h1>
            <p className="text-xl text-[#999] mb-8">
              Сравните, как оценивают контент пользователи из разных стран мира
            </p>

            {/* Global Stats Cards */}
            {globalStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                  <div className="text-3xl font-bold text-[#ff6600]">{globalStats.totalCountries || 0}</div>
                  <div className="text-sm text-[#666]">Стран</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-400">{globalStats.totalRatings || 0}</div>
                  <div className="text-sm text-[#666]">Оценок</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">{globalStats.activeUsers || 0}</div>
                  <div className="text-sm text-[#666]">Пользователей</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-400">
                    {globalStats.avgDifference ? Math.abs(globalStats.avgDifference).toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-[#666]">Ср. расхождение</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Content List (Left) */}
          <div className="lg:col-span-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden sticky top-4">
              <div className="p-4 border-b border-[#333]">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#ff6600]" />
                  Выберите контент
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Все', icon: null },
                    { value: 'MOVIE', label: 'Фильмы', icon: Film },
                    { value: 'TV_SERIES', label: 'Сериалы', icon: Tv },
                    { value: 'GAME', label: 'Игры', icon: Gamepad2 },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFilterType(type.value)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                        filterType === type.value
                          ? 'bg-[#ff6600] text-white'
                          : 'bg-[#222] text-[#999] hover:bg-[#333]'
                      }`}
                    >
                      {type.icon && <type.icon className="w-3 h-3 inline mr-1" />}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredContent.length === 0 ? (
                  <div className="p-8 text-center text-[#666]">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Контент не найден</p>
                  </div>
                ) : (
                  filteredContent.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleContentSelect(item)}
                      className={`w-full p-4 text-left border-b border-[#222] hover:bg-[#222] transition-colors ${
                        selectedContent?.id === item.id ? 'bg-[#ff6600]/10 border-l-4 border-l-[#ff6600]' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-16 bg-[#333] rounded overflow-hidden flex-shrink-0">
                          {item.poster_url && (
                            <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#666]">{item.release_year}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              item.content_type === 'MOVIE' ? 'bg-blue-500/20 text-blue-400' :
                              item.content_type === 'TV_SERIES' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {item.content_type === 'MOVIE' ? 'Фильм' :
                               item.content_type === 'TV_SERIES' ? 'Сериал' : 'Игра'}
                            </span>
                          </div>
                          {item.avg_rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs text-[#999]">{Number(item.avg_rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Country Ratings (Right) */}
          <div className="lg:col-span-8">
            {!selectedContent ? (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 text-center">
                <Globe className="w-20 h-20 mx-auto mb-6 text-[#333]" />
                <h2 className="text-2xl font-bold mb-2">Выберите контент</h2>
                <p className="text-[#666]">
                  Выберите фильм, сериал или игру слева, чтобы увидеть, как его оценивают в разных странах
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Content Header */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-48 bg-[#333] rounded-xl overflow-hidden flex-shrink-0">
                      {selectedContent.poster_url && (
                        <img src={selectedContent.poster_url} alt={selectedContent.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{selectedContent.title}</h2>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[#666]">{selectedContent.release_year}</span>
                        <span className="text-[#666]">•</span>
                        <span className="text-[#666]">{selectedContent.genre}</span>
                      </div>
                      
                      {/* Global Rating */}
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-sm text-[#666] mb-1">Общий рейтинг</div>
                          <div className="flex items-center gap-2">
                            <div className={`text-4xl font-black ${getRatingColor(Number(selectedContent.avg_rating || 0))}`}>
                              {Number(selectedContent.avg_rating || 0).toFixed(1)}
                            </div>
                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                          </div>
                        </div>
                        
                        {contentRatings && (
                          <>
                            <div className="w-px h-12 bg-[#333]" />
                            <div>
                              <div className="text-sm text-[#666] mb-1">Стран оценило</div>
                              <div className="text-2xl font-bold text-[#ff6600]">
                                {contentRatings.ratings?.length || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-[#666] mb-1">Всего оценок</div>
                              <div className="text-2xl font-bold text-green-400">
                                {contentRatings.totalRatings || 0}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-4">
                  <span className="text-[#666] text-sm">Сортировать по:</span>
                  {[
                    { value: 'difference', label: 'Расхождению' },
                    { value: 'rating', label: 'Рейтингу' },
                    { value: 'country', label: 'Стране' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === option.value
                          ? 'bg-[#ff6600] text-white'
                          : 'bg-[#1a1a1a] text-[#999] hover:bg-[#222]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Country Ratings List */}
                {loadingContent ? (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 text-center">
                    <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#666]">Загрузка рейтингов по странам...</p>
                  </div>
                ) : contentRatings?.ratings?.length === 0 ? (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-[#333]" />
                    <h3 className="text-xl font-bold mb-2">Пока нет данных</h3>
                    <p className="text-[#666] mb-4">
                      Этот контент ещё не оценивали пользователи с указанной страной
                    </p>
                    <Link
                      to={`/movie/${selectedContent.id}`}
                      className="inline-flex items-center gap-2 bg-[#ff6600] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#ff7722] transition-colors"
                    >
                      Оставить первую оценку
                    </Link>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#333] text-sm font-medium text-[#666]">
                      <div className="col-span-4">Страна</div>
                      <div className="col-span-2 text-center">Рейтинг</div>
                      <div className="col-span-2 text-center">Оценок</div>
                      <div className="col-span-2 text-center">Разница</div>
                      <div className="col-span-2 text-center">Тренд</div>
                    </div>

                    {sortedCountryRatings.map((rating, index) => {
                      const diff = getRatingDifference(rating.avgRating, Number(selectedContent.avg_rating || 0))
                      const isExpanded = expandedCountry === rating.country

                      return (
                        <div key={rating.country}>
                          <button
                            onClick={() => setExpandedCountry(isExpanded ? null : rating.country)}
                            className="w-full grid grid-cols-12 gap-4 p-4 border-b border-[#222] hover:bg-[#222] transition-colors items-center"
                          >
                            {/* Country */}
                            <div className="col-span-4 flex items-center gap-3">
                              <span className="text-2xl">{getCountryFlag(rating.country)}</span>
                              <span className="font-medium">{getCountryName(rating.country)}</span>
                            </div>

                            {/* Rating */}
                            <div className="col-span-2 text-center">
                              <span className={`text-xl font-bold ${getRatingColor(rating.avgRating)}`}>
                                {rating.avgRating.toFixed(1)}
                              </span>
                            </div>

                            {/* Count */}
                            <div className="col-span-2 text-center">
                              <span className="text-[#999]">{rating.count}</span>
                            </div>

                            {/* Difference */}
                            <div className="col-span-2 text-center">
                              <span className={`font-semibold ${getDifferenceColor(diff)}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            </div>

                            {/* Trend */}
                            <div className="col-span-2 flex items-center justify-center gap-1">
                              {diff > 0.5 ? (
                                <div className="flex items-center gap-1 text-green-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs">Выше</span>
                                </div>
                              ) : diff < -0.5 ? (
                                <div className="flex items-center gap-1 text-red-400">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-xs">Ниже</span>
                                </div>
                              ) : (
                                <span className="text-[#666] text-xs">≈ Схоже</span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#666]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#666]" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="bg-[#0a0a0a] px-4 py-6 border-b border-[#222]">
                              <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-[#ff6600] mb-1">
                                    {rating.avgRating.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-[#666]">Средний рейтинг</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-400 mb-1">
                                    {rating.count}
                                  </div>
                                  <div className="text-sm text-[#666]">Всего оценок</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-3xl font-bold mb-1 ${getDifferenceColor(diff)}`}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-[#666]">Отклонение от глобального</div>
                                </div>
                              </div>

                              {/* Rating Distribution Bar */}
                              <div className="mt-6">
                                <div className="text-sm text-[#666] mb-2">Сравнение с глобальным рейтингом</div>
                                <div className="relative h-8 bg-[#222] rounded-lg overflow-hidden">
                                  {/* Global rating marker */}
                                  <div 
                                    className="absolute top-0 bottom-0 w-1 bg-white/50 z-10"
                                    style={{ left: `${(Number(selectedContent.avg_rating || 0) / 10) * 100}%` }}
                                  />
                                  {/* Country rating bar */}
                                  <div 
                                    className={`h-full transition-all ${rating.avgRating >= Number(selectedContent.avg_rating || 0) ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${(rating.avgRating / 10) * 100}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-[#666] mt-1">
                                  <span>0</span>
                                  <span>5</span>
                                  <span>10</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-[#1a1a2e] border border-[#333] rounded-2xl p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#ff6600]" />
                    Как это работает?
                  </h3>
                  <ul className="space-y-2 text-[#999] text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600]">•</span>
                      Укажите свою страну в <Link to="/profile" className="text-[#ff6600] hover:underline">профиле</Link>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600]">•</span>
                      Ваши оценки будут учитываться в статистике вашей страны
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600]">•</span>
                      Сравнивайте, как одинаковый контент воспринимается в разных культурах
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600]">•</span>
                      Данные обновляются в реальном времени на основе оценок пользователей
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorldRatings
