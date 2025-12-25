import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Star, TrendingUp, Play, Info, Tv, ChevronDown } from 'lucide-react'

const Series = () => {
  const [sortBy, setSortBy] = useState('rating')
  const [filterGenre, setFilterGenre] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
  const { data } = await axios.get('/api/content', { params: { type: 'TV_SERIES', limit: 60 } })
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError('Не удалось загрузить сериалы')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const genres = useMemo(() => {
    const set = new Set(items.map(i => (i.genre || '').trim()).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [items])

  const filteredSeries = items
    .filter(s => filterGenre === 'all' || (s.genre || '').trim() === filterGenre)
    .sort((a, b) => {
      if (sortBy === 'rating') return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0)
      if (sortBy === 'year') return (Number(b.release_year) || 0) - (Number(a.release_year) || 0)
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''))
      return 0
    })

  if (loading) return <div className="text-secondary-300">Загрузка...</div>
  if (error) return <div className="text-red-400">{error}</div>

  return (
    <div className="space-y-8">
      {/* Заголовок с градиентом и иконкой */}
      <div className="flex flex-col gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl shadow-lg shadow-accent-500/30">
              <Tv className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent">
                Сериалы
              </h1>
              <p className="text-secondary-300 text-lg">
                Многосерийные истории с глубокой аналитикой
              </p>
            </div>
          </div>
        </div>

        {/* Фильтры - современный дизайн */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            
            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[160px]"
              >
                <option value="rating">По рейтингу</option>
                <option value="year">По году</option>
                <option value="title">По названию</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>

            {/* Genre Dropdown */}
            <div className="relative group">
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-black/60 min-w-[140px]"
              >
                <option value="all">Все жанры</option>
                {genres.filter(g => g !== 'all').map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
            </div>

            {/* Count Badge */}
            <div className="ml-auto px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-medium text-gray-400">
              {filteredSeries.length} {filteredSeries.length === 1 ? 'сериал' : filteredSeries.length < 5 ? 'сериала' : 'сериалов'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {filteredSeries.map(series => (
          <SeriesCard
            key={series.id}
            series={series}
            isHovered={hoveredId === series.id}
            onHover={() => setHoveredId(series.id)}
            onLeave={() => setHoveredId(null)}
          />
        ))}
      </div>

      {filteredSeries.length === 0 && (
        <div className="text-center text-secondary-400 py-12">
          Нет контента для отображения
        </div>
      )}
    </div>
  )
}

const SeriesCard = ({ series, isHovered, onHover, onLeave }) => {
  const videoRef = useRef(null)

  const isValidUrl = (u) => {
    if (!u || typeof u !== 'string') return false
    if (!/^https?:\/\//i.test(u)) return false
    try { new URL(u); return true } catch { return false }
  }

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered && series.trailer_url) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isHovered, series.trailer_url])

  const posterUrl = isValidUrl(series.poster_url)
    ? series.poster_url
    : 'https://placehold.co/400x600/1e293b/ffffff?text=No+Poster'
  const trailerUrl = isValidUrl(series.trailer_url) ? series.trailer_url : null

  // Normalize people photos
  const directorPhoto = isValidUrl(series.director_photo_url) ? series.director_photo_url : null
  const castPhotos = (() => {
    const src = series.cast_photos
    if (!src) return []
    if (Array.isArray(src)) return src.filter((u) => isValidUrl(u))
    try {
      const parsed = JSON.parse(String(src))
      if (Array.isArray(parsed)) return parsed.filter((u) => isValidUrl(u))
    } catch {}
    return String(src).split(',').map((s) => s.trim()).filter((u) => isValidUrl(u))
  })()
  const peopleThumbs = [directorPhoto, ...castPhotos].filter(Boolean).slice(0, 4)

  return (
    <Link to={`/movie/${series.id}`}>
      <div
        className="professional-card group relative overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={series.title}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              isHovered && trailerUrl ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
            } group-hover:scale-110`}
          />

          {trailerUrl && (
            <video
              ref={videoRef}
              src={trailerUrl}
              muted
              loop
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-95 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-4 right-4 flex flex-col gap-2.5">
            {series.avg_rating > 0 && (
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-accent-500/40 transform group-hover:scale-110 transition-transform duration-300">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-bold text-sm">{Number(series.avg_rating).toFixed(1)}</span>
              </div>
            )}
            {series.hype_index > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/40 transform group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-4 w-4" />
                <span className="font-bold text-sm">{series.hype_index}%</span>
              </div>
            )}
          </div>

          {trailerUrl && (
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full p-5 transform scale-100 group-hover:scale-125 transition-all duration-500 shadow-2xl shadow-white/30 ring-2 ring-white/50">
                <Play className="h-10 w-10 text-white fill-current drop-shadow-lg" />
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 space-y-2 md:space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent">
            <h3 className="font-bold text-sm md:text-xl line-clamp-2 drop-shadow-lg text-secondary-50 group-hover:text-accent-300 transition-colors duration-300">
              {series.title}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-3 text-xs md:text-sm text-secondary-200">
              {series.release_year && (
                <span className="font-semibold bg-primary-700/70 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-lg">
                  {series.release_year}
                </span>
              )}
              {series.genre && (
                <span className="font-medium bg-accent-500/20 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-lg border border-accent-500/30">
                  {series.genre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Series
