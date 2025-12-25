import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Search, Film, Tv, Gamepad2, Star, Calendar } from 'lucide-react'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const loadResults = async () => {
      if (!query) return
      
      setLoading(true)
      try {
        const { data } = await axios.get('/api/content/search', {
          params: { query, limit: 50 }
        })
        setResults(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [query])

  const filteredResults = filter === 'ALL' 
    ? results 
    : results.filter(r => r.content_type === filter)

  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'MOVIE': return <Film className="h-5 w-5" />
      case 'TV_SERIES': return <Tv className="h-5 w-5" />
      case 'GAME': return <Gamepad2 className="h-5 w-5" />
      default: return <Film className="h-5 w-5" />
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

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Search className="h-16 w-16 text-dark-400 mx-auto mb-4" />
        <p className="text-dark-300 text-lg">Введите запрос для поиска</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-dark-100 mb-2">
          Результаты поиска
        </h1>
        <p className="text-dark-300">
          По запросу: <span className="text-imdb font-medium">"{query}"</span>
        </p>
        <p className="text-dark-400 text-sm mt-1">
          Найдено: {filteredResults.length} {filteredResults.length === 1 ? 'результат' : 'результатов'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', 'MOVIE', 'TV_SERIES', 'GAME'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              filter === type
                ? 'bg-imdb text-dark-900'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {type === 'ALL' ? 'Всё' : getContentTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-imdb border-t-transparent rounded-full"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-300 text-lg mb-2">Ничего не найдено</p>
          <p className="text-dark-400">Попробуйте изменить запрос или фильтры</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredResults.map((item) => (
            <Link
              key={item.id}
              to={`/content/${item.id}`}
              className="group bg-dark-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-imdb transition-all"
            >
              <div className="relative aspect-[2/3] bg-dark-700">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-500">
                    {getContentTypeIcon(item.content_type)}
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="px-2 py-1 bg-dark-900/90 backdrop-blur-sm rounded text-xs font-medium text-dark-100 flex items-center gap-1">
                    {getContentTypeIcon(item.content_type)}
                    {getContentTypeLabel(item.content_type)}
                  </span>
                </div>
                {item.avg_rating > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-imdb/90 backdrop-blur-sm rounded text-xs font-bold text-dark-900 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {Number(item.avg_rating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-dark-100 line-clamp-2 group-hover:text-imdb transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-dark-400">
                  {item.release_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.release_year}
                    </span>
                  )}
                  {item.genre && (
                    <>
                      <span>•</span>
                      <span className="truncate">{item.genre}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchResults
