import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { TrendingUp, Flame, Star, AlertTriangle, ThumbsUp, Eye } from 'lucide-react'

const HypeMonitoring = () => {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('trending') // 'trending', 'overhyped', 'underhyped'

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/content', { params: { limit: 100 } })
      setContent(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading content:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateHypeGap = (item) => {
    const hype = Number(item.hype_index ?? 0)
    const quality = Number(item.avg_rating ?? 0)
    // Normalize both to 0-10 scale for comparison
    const normalizedHype = hype / 10
    return normalizedHype - quality
  }

  const getFilteredContent = () => {
    const withHypeGap = content.map(item => ({
      ...item,
      hypeGap: calculateHypeGap(item)
    }))

    switch (filter) {
      case 'trending':
        // High hype regardless of quality
        return withHypeGap
          .filter(item => Number(item.hype_index ?? 0) >= 50)
          .sort((a, b) => Number(b.hype_index ?? 0) - Number(a.hype_index ?? 0))
          .slice(0, 20)
      
      case 'overhyped':
        // High hype but low quality (gap > 2)
        return withHypeGap
          .filter(item => item.hypeGap > 2 && Number(item.hype_index ?? 0) >= 40)
          .sort((a, b) => b.hypeGap - a.hypeGap)
          .slice(0, 20)
      
      case 'underhyped':
        // Low hype but high quality (gap < -2)
        return withHypeGap
          .filter(item => item.hypeGap < -2 && Number(item.avg_rating ?? 0) >= 7)
          .sort((a, b) => a.hypeGap - b.hypeGap)
          .slice(0, 20)
      
      default:
        return withHypeGap.slice(0, 20)
    }
  }

  const renderContentCard = (item) => {
    const hypeGap = calculateHypeGap(item)
    const isOverhyped = hypeGap > 2
    const isUnderhyped = hypeGap < -2
    
    return (
      <Link
        key={item.id}
        to={`/movie/${item.id}`}
        className="bg-primary-800 rounded-lg p-5 border border-secondary-600 hover:border-accent-500 transition-all duration-200 flex gap-4"
      >
        {/* Poster */}
        <div className="w-24 h-36 bg-secondary-700 rounded-lg overflow-hidden flex-shrink-0">
          {item.poster_url ? (
            <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary-500">
              <Star size={32} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-secondary-100 mb-1 truncate">{item.title}</h3>
          <p className="text-sm text-secondary-400 mb-3">
            {item.release_year && `${item.release_year} • `}
            {item.genre || 'Без жанра'}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Hype Index */}
            <div>
              <div className="flex items-center gap-2 text-xs text-secondary-400 mb-1">
                <Flame size={14} />
                <span>Хайп-индекс</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-orange-600 to-red-500"
                    style={{ width: `${item.hype_index || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-orange-400">{item.hype_index || 0}</span>
              </div>
            </div>

            {/* Quality Rating */}
            <div>
              <div className="flex items-center gap-2 text-xs text-secondary-400 mb-1">
                <Star size={14} />
                <span>Качество</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-green-600 to-green-400"
                    style={{ width: `${Number(item.avg_rating ?? 0) * 10}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-green-400">{Number(item.avg_rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Hype Gap Badge */}
          {(isOverhyped || isUnderhyped) && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isOverhyped 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {isOverhyped ? <AlertTriangle size={14} /> : <ThumbsUp size={14} />}
              <span>
                {isOverhyped 
                  ? `Переоценён на ${Math.abs(hypeGap).toFixed(1)} балла`
                  : `Недооценён на ${Math.abs(hypeGap).toFixed(1)} балла`
                }
              </span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  const filteredContent = getFilteredContent()

  return (
    <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-100 mb-3 flex items-center gap-3">
            <Flame className="text-orange-500" size={40} />
            Мониторинг хайпа
          </h1>
          <p className="text-secondary-400 text-lg">
            Отслеживайте тренды и находите переоценённый или недооценённый контент
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 border-b border-secondary-700 pb-2">
          <button
            onClick={() => setFilter('trending')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
              filter === 'trending'
                ? 'text-accent-400 border-b-2 border-accent-400'
                : 'text-secondary-400 hover:text-secondary-200'
            }`}
          >
            <TrendingUp size={20} />
            <span>В тренде</span>
          </button>
          <button
            onClick={() => setFilter('overhyped')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
              filter === 'overhyped'
                ? 'text-accent-400 border-b-2 border-accent-400'
                : 'text-secondary-400 hover:text-secondary-200'
            }`}
          >
            <AlertTriangle size={20} />
            <span>Переоценённое</span>
          </button>
          <button
            onClick={() => setFilter('underhyped')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
              filter === 'underhyped'
                ? 'text-accent-400 border-b-2 border-accent-400'
                : 'text-secondary-400 hover:text-secondary-200'
            }`}
          >
            <Eye size={20} />
            <span>Скрытые жемчужины</span>
          </button>
        </div>

        {/* Info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-orange-400" size={24} />
              <h3 className="font-semibold text-orange-400">В тренде</h3>
            </div>
            <p className="text-sm text-secondary-300">
              Контент с высоким индексом хайпа независимо от качества
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="font-semibold text-red-400">Переоценённое</h3>
            </div>
            <p className="text-sm text-secondary-300">
              Высокий хайп, но реальное качество разочаровывает
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="text-green-400" size={24} />
              <h3 className="font-semibold text-green-400">Скрытые жемчужины</h3>
            </div>
            <p className="text-sm text-secondary-300">
              Низкий хайп, но отличное качество - стоит внимания!
            </p>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12 text-secondary-400">
            <p>Загрузка...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">
            <p className="text-xl">Контент не найден</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map(renderContentCard)}
          </div>
        )}
      </div>
    </div>
  )
}

export default HypeMonitoring
