import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Play, Star, TrendingUp, Users, Heart, Zap, Globe, Target, Film, Tv, Gamepad2, X, ChevronDown } from 'lucide-react'
import MetascoreBadge from '../components/MetascoreBadge'
import UserScoreBadge from '../components/UserScoreBadge'
import HeroCarousel from '../components/HeroCarousel'
import ContentHoverCard from '../components/ContentHoverCard'
import RecommendedSection from '../components/RecommendedSection'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const features = [
    {
      icon: Heart,
      title: 'Анализ эмоций',
      description: 'Эмоциональное облако: радость, грусть, напряжение, восторг',
      color: 'text-critics'
    },
    {
      icon: Target,
      title: 'До/После просмотра',
      description: 'Сравнение ожиданий с реальностью после просмотра',
      color: 'text-audience'
    },
    {
      icon: Users,
      title: 'Персональный агрегатор',
      description: 'Выбирайте своих критиков и любимую аудиторию',
      color: 'text-meta'
    },
    {
      icon: Star,
      title: 'Карта восприятия',
      description: 'Детальный анализ: сюжет, актёрская игра, визуал, саундтрек',
      color: 'text-imdb'
    },
    {
      icon: Globe,
      title: 'Мировые оценки',
      description: 'Сравнение восприятия в разных странах мира',
      color: 'text-critics'
    },
    {
      icon: Zap,
      title: 'Хайп-индекс',
      description: 'Анализ социальных сетей и уровня обсуждений',
      color: 'text-audience'
    }
  ]

  // Dynamic content state fetched from backend
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [games, setGames] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, rating, old

  // Get unique genres from all content
  const allGenres = useMemo(() => {
    const genres = new Set()
    ;[...movies, ...series, ...games].forEach(item => {
      if (item.genre) genres.add(item.genre)
    })
    return Array.from(genres).sort()
  }, [movies, series, games])

  // Get unique years from all content
  const allYears = useMemo(() => {
    const years = new Set()
    ;[...movies, ...series, ...games].forEach(item => {
      if (item.release_year) years.add(item.release_year)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [movies, series, games])

  // Filter and Sort content
  const processContent = (items) => {
    let processed = items.filter(item => {
      // Genre filter
      if (selectedGenre && item.genre !== selectedGenre) return false
      // Year filter
      if (selectedYear && item.release_year !== parseInt(selectedYear)) return false
      // Rating filter
      if (selectedRating) {
        const rating = Number(item.avg_rating || 0)
        if (selectedRating === 'high' && rating < 7) return false
        if (selectedRating === 'medium' && (rating < 5 || rating >= 7)) return false
        if (selectedRating === 'low' && rating >= 5) return false
      }
      return true
    })

    // Sorting
    return processed.sort((a, b) => {
      if (sortBy === 'newest') return (b.release_year || 0) - (a.release_year || 0)
      if (sortBy === 'old') return (a.release_year || 0) - (b.release_year || 0)
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0)
      return 0
    })
  }

  const filteredMovies = useMemo(() => processContent(movies), [movies, selectedGenre, selectedYear, selectedRating, sortBy])
  const filteredSeries = useMemo(() => processContent(series), [series, selectedGenre, selectedYear, selectedRating, sortBy])
  const filteredGames = useMemo(() => processContent(games), [games, selectedGenre, selectedYear, selectedRating, sortBy])

  const hasActiveFilters = selectedGenre || selectedYear || selectedRating || sortBy !== 'newest'

  const clearFilters = () => {
    setSelectedGenre('')
    setSelectedYear('')
    setSelectedRating('')
    setSortBy('newest')
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [mRes, sRes, gRes, cRes] = await Promise.all([
          axios.get('/api/content', { params: { type: 'MOVIE', limit: 12 } }),
          axios.get('/api/content', { params: { type: 'TV_SERIES', limit: 6 } }),
          axios.get('/api/content', { params: { type: 'GAME', limit: 6 } }),
          axios.get('/api/content/coming-soon/active')
        ])
        if (cancelled) return
        setMovies(Array.isArray(mRes.data) ? mRes.data : [])
        setSeries(Array.isArray(sRes.data) ? sRes.data : [])
        setGames(Array.isArray(gRes.data) ? gRes.data : [])
        setComingSoon(Array.isArray(cRes.data) ? cRes.data : [])
      } catch (e) {
        if (!cancelled) setError('Не удалось загрузить контент')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const topEmotions = (emotional_cloud) => {
    if (!emotional_cloud) return []
    try {
      if (Array.isArray(emotional_cloud)) return emotional_cloud.slice(0, 5)
      const entries = Object.entries(emotional_cloud)
      return entries
        .sort(([,a],[,b]) => Number(b) - Number(a))
        .slice(0, 5)
        .map(([k]) => k)
    } catch { return [] }
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen pb-20">
      {/* Hero Carousel - Full Width */}
      <HeroCarousel />

      <div className="container mx-auto px-4 mt-12">
        
        {/* Filter Bar */}
        <div className="mb-8">
          {/* Modern Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            
            {/* Genre Dropdown */}
            <div className="relative group">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[140px]"
              >
                <option value="">Все жанры</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            {/* Year Dropdown */}
            <div className="relative group">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[120px]"
              >
                <option value="">Год</option>
                {allYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            {/* Rating Dropdown */}
            <div className="relative group">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[140px]"
              >
                <option value="">Рейтинг</option>
                <option value="high">Высокий (7+)</option>
                <option value="medium">Средний (5-7)</option>
                <option value="low">Низкий (&lt;5)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>

            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[160px]"
              >
                <option value="newest">Сначала новые</option>
                <option value="old">Сначала старые</option>
                <option value="rating">По рейтингу</option>
              </select>
              <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Сбросить
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column (Left) */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Recommendations Section */}
            {isAuthenticated && <RecommendedSection />}

            {/* Movies Section */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b-2 border-accent-500/30 pb-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                  <Film className="text-accent-500" />
                  В кинотеатрах
                  {hasActiveFilters && filteredMovies.length !== movies.length && (
                    <span className="text-sm font-normal text-[#999]">({filteredMovies.length} из {movies.length})</span>
                  )}
                </h2>
                <Link to="/movies" className="text-sm font-bold text-accent-500 hover:text-white transition-colors uppercase tracking-wider">
                  Все фильмы →
                </Link>
              </div>
              
              {loading && <div className="text-secondary-400">Загрузка...</div>}
              
              {!loading && filteredMovies.length === 0 && hasActiveFilters ? (
                <div className="text-center py-12 text-[#666]">
                  <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет фильмов, соответствующих фильтрам</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {filteredMovies.slice(0, 6).map((item) => (
                    <ContentCard key={item.id} item={item} type="movie" />
                  ))}
                </div>
              )}
            </section>

            {/* Series Section */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b-2 border-purple-500/30 pb-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                  <Tv className="text-purple-500" />
                  Популярные сериалы
                  {hasActiveFilters && filteredSeries.length !== series.length && (
                    <span className="text-sm font-normal text-[#999]">({filteredSeries.length} из {series.length})</span>
                  )}
                </h2>
                <Link to="/series" className="text-sm font-bold text-purple-500 hover:text-white transition-colors uppercase tracking-wider">
                  Все сериалы →
                </Link>
              </div>
              
              {!loading && filteredSeries.length === 0 && hasActiveFilters ? (
                <div className="text-center py-12 text-[#666]">
                  <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет сериалов, соответствующих фильтрам</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {filteredSeries.slice(0, 3).map((item) => (
                    <ContentCard key={item.id} item={item} type="series" />
                  ))}
                </div>
              )}
            </section>

            {/* Games Section */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b-2 border-blue-500/30 pb-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                  <Gamepad2 className="text-blue-500" />
                  Новые игры
                  {hasActiveFilters && filteredGames.length !== games.length && (
                    <span className="text-sm font-normal text-[#999]">({filteredGames.length} из {games.length})</span>
                  )}
                </h2>
                <Link to="/games" className="text-sm font-bold text-blue-500 hover:text-white transition-colors uppercase tracking-wider">
                  Все игры →
                </Link>
              </div>
              
              {!loading && filteredGames.length === 0 && hasActiveFilters ? (
                <div className="text-center py-12 text-[#666]">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет игр, соответствующих фильтрам</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {filteredGames.slice(0, 3).map((item) => (
                    <ContentCard key={item.id} item={item} type="game" />
                  ))}
                </div>
              )}
            </section>

            {/* Features Grid (Redesigned) */}
            <section className="py-12 border-t border-white/10">
              <h2 className="text-3xl font-bold text-white mb-10 text-center">
                Почему <span className="text-accent-500">CineVibe</span>?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 hover:border-accent-500/50 hover:bg-[#222] transition-all duration-300 group">
                      <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">{feature.title}</h3>
                      <p className="text-sm text-secondary-400 leading-relaxed">{feature.description}</p>
                    </div>
                  )
                })}
              </div>
            </section>

          </div>

          {/* Sidebar Column (Right) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Coming Soon Widget */}
            <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 p-4 border-b border-white/10">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  Скоро выйдет
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {comingSoon.length > 0 ? (
                  comingSoon.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group cursor-pointer">
                      <div className="flex gap-3">
                        <div className="w-12 h-16 bg-gray-800 flex-shrink-0 rounded overflow-hidden">
                          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-accent-500 transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-xs text-secondary-400 mt-1">
                            {new Date(item.release_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-secondary-500 mt-1 border border-white/10 inline-block px-1 rounded">
                            {item.content_type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-secondary-500 text-center">Нет ожидаемых релизов</div>
                )}
              </div>
              <div className="p-3 bg-white/5 text-center border-t border-white/10">
                <Link to="/calendar" className="text-xs font-bold text-secondary-400 hover:text-white uppercase tracking-wider">
                  Календарь релизов
                </Link>
              </div>
            </div>

            {/* Top Rated Widget (Mocked from existing data for now) */}
            <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 p-4 border-b border-white/10">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent-500" />
                  Топ рейтинг
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {[...movies, ...series, ...games]
                  .sort((a, b) => b.avg_rating - a.avg_rating)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <Link key={item.id} to={`/${item.content_type === 'TV_SERIES' ? 'series' : item.content_type === 'GAME' ? 'game' : 'movie'}/${item.id}`} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4 group">
                      <div className="font-black text-2xl text-white/20 group-hover:text-accent-500/50 transition-colors w-6 text-center">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-white group-hover:text-accent-500 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MetascoreBadge score={Number(item.critics_rating || item.avg_rating || 0) * 10} size="tiny" />
                          <span className="text-xs text-secondary-400">{item.release_year}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Hype Widget */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-6 text-center">
              <Zap className="w-10 h-10 text-accent-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Что сейчас в хайпе?</h3>
              <p className="text-sm text-secondary-300 mb-4">
                Узнайте, что обсуждает весь интернет прямо сейчас.
              </p>
              <Link to="/hype-monitoring" className="block w-full">
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded text-sm uppercase tracking-wider transition-colors">
                  Перейти к трендам
                </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Component for Cards
const ContentCard = ({ item, type }) => {
  const link = type === 'series' ? `/series/${item.id}` : type === 'game' ? `/game/${item.id}` : `/movie/${item.id}`
  
  return (
    <ContentHoverCard item={item}>
      <Link to={link} className="group block h-full">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 bg-gray-800 shadow-lg">
          <img 
            src={item.poster_url || 'https://placehold.co/300x450/1e293b/ffffff?text=No+Poster'} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          
          {/* Badges */}
          <div className="absolute top-2 left-2">
            <MetascoreBadge score={Number(item.critics_rating || item.avg_rating || 0) * 10} size="small" />
          </div>
        </div>
        
        <h3 className="font-bold text-white text-base leading-tight group-hover:text-accent-500 transition-colors mb-1 line-clamp-2">
          {item.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-secondary-400">
          <span>{item.release_year}</span>
          {item.genre && (
            <>
              <span>•</span>
              <span className="truncate max-w-[100px]">{item.genre}</span>
            </>
          )}
        </div>
      </Link>
    </ContentHoverCard>
  )
}

export default Home