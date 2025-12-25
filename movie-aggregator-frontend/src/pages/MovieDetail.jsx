import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Star, TrendingUp, Globe, Calendar, Clock, Play, User, Film, ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp, Award, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAchievement } from '../context/AchievementContext'
import RatingDynamicsChart from '../components/RatingDynamicsChart'

const MovieDetail = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const { user, isAuthenticated } = useAuth()
  const { showAchievement } = useAchievement()

  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [emotionCloud, setEmotionCloud] = useState(null)
  const [perceptionMap, setPerceptionMap] = useState(null)
  const [dynamics, setDynamics] = useState([])
  const [reviews, setReviews] = useState([])
  const [personalizedRating, setPersonalizedRating] = useState(null)
  const [personalizedReviewCount, setPersonalizedReviewCount] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [reviewSort, setReviewSort] = useState('recent')

  const [reviewText, setReviewText] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [rating, setRating] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [asPro, setAsPro] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)
  const [reviewType, setReviewType] = useState('neutral')
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  // Aspect ratings (1-10 scale) - dynamically adjusted based on content type
  const [aspects, setAspects] = useState({
    plot: 5,
    acting: 5,
    visuals: 5,
    soundtrack: 5,
    originality: 5
  })

  // Emotion toggles with intensity (0-100)
  const [emotions, setEmotions] = useState({
    joy: 0,
    excitement: 0,
    tension: 0,
    awe: 0,
    anticipation: 0
  })

  // Get aspect labels based on content type
  const getAspectLabels = (contentType) => {
    if (contentType === 'GAME') {
      return {
        gameplay: 'Геймплей',
        graphics: 'Графика',
        story: 'Сюжет',
        soundtrack: 'Саундтрек',
        replayability: 'Реиграбельность'
      }
    } else if (contentType === 'TV_SERIES') {
      return {
        plot: 'Сюжет',
        acting: 'Актёрская игра',
        pacing: 'Темп повествования',
        characters: 'Развитие персонажей',
        finale: 'Финал сезона'
      }
    } else {
      return {
        plot: 'Сюжет',
        acting: 'Актёрская игра',
        visuals: 'Визуальные эффекты',
        soundtrack: 'Саундтрек',
        originality: 'Оригинальность'
      }
    }
  }

  const aspectLabels = content ? getAspectLabels(content.content_type) : {
    plot: 'Сюжет',
    acting: 'Актёрская игра',
    visuals: 'Визуальные эффекты',
    soundtrack: 'Саундтрек',
    originality: 'Оригинальность'
  }

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    const stats = { positive: 0, neutral: 0, negative: 0, total: reviews.length }
    reviews.forEach(r => {
      const rating = Number(r.rating || 0)
      if (rating >= 7) stats.positive++
      else if (rating <= 4 && rating > 0) stats.negative++
      else stats.neutral++
    })
    return stats
  }, [reviews])

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews]
    switch (reviewSort) {
      case 'highest':
        return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      case 'lowest':
        return sorted.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0))
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [reviews, reviewSort])

  // Calculate strong and weak sides
  const strongWeakSides = useMemo(() => {
    if (!reviews.length) return null
    
    const totals = {}
    const counts = {}
    
    reviews.forEach(r => {
      if (!r.aspects) return
      try {
        const aspects = typeof r.aspects === 'string' ? JSON.parse(r.aspects) : r.aspects
        Object.entries(aspects).forEach(([key, val]) => {
          totals[key] = (totals[key] || 0) + Number(val)
          counts[key] = (counts[key] || 0) + 1
        })
      } catch (e) {}
    })
    
    const averages = Object.entries(totals).map(([key, total]) => ({
      key,
      label: aspectLabels[key] || key,
      score: total / counts[key]
    }))
    
    if (averages.length === 0) return null
    
    averages.sort((a, b) => b.score - a.score)
    
    return {
      strong: averages.slice(0, 2).filter(a => a.score >= 7),
      weak: averages.slice(-2).reverse().filter(a => a.score < 7)
    }
  }, [reviews, aspectLabels])

  // Auto-detect review type based on rating
  useEffect(() => {
    const r = Number(rating)
    if (r >= 7) setReviewType('positive')
    else if (r <= 4 && r > 0) setReviewType('negative')
    else setReviewType('neutral')
  }, [rating])

  // Rating color based on value (Kinopoisk style)
  const getRatingColor = (rating) => {
    const r = Number(rating)
    if (r >= 7) return '#3bb33b'
    if (r >= 5) return '#777'
    return '#ff0f0f'
  }

  const getRatingBgColor = (rating) => {
    const r = Number(rating)
    if (r >= 7) return 'bg-[#3bb33b]'
    if (r >= 5) return 'bg-[#777]'
    return 'bg-[#ff0f0f]'
  }

  const emotionLabels = {
    joy: 'Радость',
    excitement: 'Волнение',
    tension: 'Напряжение',
    awe: 'Восторг',
    anticipation: 'Предвкушение'
  }

  const emotionColors = {
    joy: '#fbbf24',
    excitement: '#fb923c',
    tension: '#ef4444',
    awe: '#a855f7',
    anticipation: '#3b82f6'
  }

  const emotionIcons = {
    joy: '😊',
    excitement: '🔥',
    tension: '😰',
    awe: '✨',
    anticipation: '🎯'
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await axios.get(`/api/content/${id}`)
        if (!cancelled) setContent(data)
      } catch (e) {
        // fallback: try to find in list
        try {
          const { data } = await axios.get('/api/content', { params: { limit: 200 } })
          const found = (Array.isArray(data) ? data : []).find((c) => String(c.id) === String(id))
          if (found) {
            if (!cancelled) setContent(found)
          } else {
            setError('Не удалось загрузить контент')
          }
        } catch (_) {
          setError('Не удалось загрузить контент')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!content) return
    let cancelled = false
    const loadExtra = async () => {
      try {
        const promises = [
          axios.get(`/api/content/${id}/emotional-cloud`),
          axios.get(`/api/content/${id}/perception-map`),
          axios.get(`/api/content/${id}/dynamics`),
          axios.get(`/api/reviews/content/${id}`),
        ]
        
        // Add personalized rating fetch if user is authenticated
        if (isAuthenticated) {
          promises.push(axios.get(`/api/critics/personalized/${id}`))
        }

        const results = await Promise.allSettled(promises)
        
        if (!cancelled) {
          if (results[0].status === 'fulfilled') setEmotionCloud(results[0].value.data || null)
          if (results[1].status === 'fulfilled') setPerceptionMap(results[1].value.data || null)
          if (results[2].status === 'fulfilled') setDynamics(Array.isArray(results[2].value.data) ? results[2].value.data : [])
          if (results[3].status === 'fulfilled') setReviews(Array.isArray(results[3].value.data) ? results[3].value.data : [])
          
          // Set personalized rating if available
          if (isAuthenticated && results[4]?.status === 'fulfilled') {
            const personalData = results[4].value.data
            setPersonalizedRating(personalData.personalRating)
            setPersonalizedReviewCount(personalData.reviewCount || 0)
          }
        }
      } catch (_) {
        // ignore optional analytics errors
      }
    }
    loadExtra()
    return () => { cancelled = true }
  }, [content, id, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !content) return
    const checkWatchlist = async () => {
      try {
        const { data } = await axios.get('/api/users/me/watchlist')
        if (Array.isArray(data)) {
          const found = data.find(item => String(item.content_id) === String(id))
          setIsInWatchlist(!!found)
        }
      } catch (e) {
        console.error('Failed to check watchlist', e)
      }
    }
    checkWatchlist()
  }, [id, isAuthenticated, content])

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show notification
      alert('Пожалуйста, войдите в систему')
      return
    }
    setWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        await axios.delete(`/api/users/me/watchlist/${id}`)
        setIsInWatchlist(false)
      } else {
        await axios.post(`/api/users/me/watchlist/${id}`)
        setIsInWatchlist(true)
      }
    } catch (e) {
      console.error('Watchlist toggle error', e)
      alert('Ошибка при обновлении списка')
    } finally {
      setWatchlistLoading(false)
    }
  }

  const getPerceptionColor = (value) => {
    if (value >= 7) return '#3bb33b'
    if (value >= 5) return '#777'
    return '#ff0f0f'
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return
    if (!reviewText.trim()) { setSubmitMsg('Введите текст отзыва'); return }
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      // Build emotions object (filter out zero intensities)
      const emotionData = {}
      Object.keys(emotions).forEach(key => {
        if (emotions[key] > 0) emotionData[key] = emotions[key]
      })

      let response;
      if (asPro && user?.role === 'CRITIC') {
        response = await axios.post('/api/reviews/pro', {
          content_id: Number(id),
          review_text: reviewText.trim(),
          aspects,
          emotions: emotionData,
          rating: rating === '' ? 0 : Number(rating),
        })
      } else {
        const payload = {
          content_id: Number(id),
          content: reviewText.trim(),
          aspects,
          emotions: emotionData
        }
        if (rating !== '') {
          payload.rating = Number(rating)
        }
        response = await axios.post('/api/reviews', payload)
      }

      // Check for new achievements
      if (response.data && response.data.newAchievements && Array.isArray(response.data.newAchievements)) {
        response.data.newAchievements.forEach(achievement => {
          showAchievement(achievement);
        });
      }

      setSubmitMsg('Отзыв успешно отправлен!')
      setReviewText('')
      setReviewTitle('')
      setRating('')
      setAspects({ plot: 5, acting: 5, visuals: 5, soundtrack: 5, originality: 5 })
      setEmotions({ joy: 0, excitement: 0, tension: 0, awe: 0, anticipation: 0 })
      
      // Refresh content and reviews to show updated ratings
      const [reviewsRes, contentRes] = await Promise.all([
        axios.get(`/api/reviews/content/${id}`),
        axios.get(`/api/content/${id}`)
      ])
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : [])
      if (contentRes.data) {
        setContent(contentRes.data)
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || 'Ошибка отправки'
      setSubmitMsg(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-12 w-12 border-4 border-[#ff6600] border-t-transparent rounded-full"></div>
      </div>
    )
  }
  if (error) {
    return <div className="text-red-400 text-center py-12">{error}</div>
  }

  const movie = {
    id: content?.id,
    title: content?.title || 'Контент',
    originalTitle: content?.original_title || '',
    year: content?.release_year || '—',
    runtime: content?.runtime || null,
    genre: (content?.genre ? [content.genre] : []),
    rating: content?.avg_rating ?? 0,
    criticsRating: content?.critics_rating ?? 0,
    audienceRating: content?.audience_rating ?? 0,
    hypeIndex: content?.hype_index ?? 0,
    emotionCloud: emotionCloud || content?.emotional_cloud || {},
    poster: content?.poster_url || null,
    backdrop: content?.backdrop_url || content?.poster_url || null,
    trailer: content?.trailer_url || null,
    director: content?.director || '',
    cast: content?.cast ? String(content.cast).split(',').map(s => s.trim()) : [],
    directorPhoto: content?.director_photo_url || null,
    castPhotos: (() => {
      const src = content?.cast_photos
      if (!src) return []
      if (Array.isArray(src)) return src
      try {
        const parsed = JSON.parse(String(src))
        if (Array.isArray(parsed)) return parsed
      } catch {}
      return String(src).split(',').map(s => s.trim()).filter(Boolean)
    })(),
    description: content?.description || '',
    perceptionMap: perceptionMap || content?.perception_map || {},
    ratingDynamics: dynamics || [],
    contentType: content?.content_type || 'MOVIE',
    reviewCount: reviews.length,
  }

  // Star rating component for review form
  const StarRating = ({ value, onChange, size = 'lg' }) => {
    const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
    
    return (
      <div className="flex gap-1">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star 
              className={`${sizeClass} transition-colors ${
                star <= (hoverRating || Number(value)) 
                  ? 'fill-[#ff6600] text-[#ff6600]' 
                  : 'fill-transparent text-[#555]'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  // Review card component (Kinopoisk style)
  const ReviewCard = ({ review }) => {
    const reviewRating = Number(review.rating || 0)
    const isPositive = reviewRating >= 7
    const isNegative = reviewRating > 0 && reviewRating <= 4
    const [expanded, setExpanded] = useState(false)
    
    let bgClass = 'bg-[#1a1a1a] border-[#333]'
    let typeLabel = 'Нейтральный'
    let typeLabelColor = 'text-[#999]'
    
    if (isPositive) {
      bgClass = 'bg-[#1a2e1a] border-[#2d4a2d]'
      typeLabel = 'Положительный'
      typeLabelColor = 'text-[#3bb33b]'
    } else if (isNegative) {
      bgClass = 'bg-[#2e1a1a] border-[#4a2d2d]'
      typeLabel = 'Отрицательный'
      typeLabelColor = 'text-[#ff4444]'
    }

    const reviewContent = review.content || review.review_text || ''
    const isLong = reviewContent.length > 400

    return (
      <div className={`${bgClass} border rounded-lg p-6 transition-all hover:border-[#555]`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {review.avatar_url ? (
              <img 
                src={review.avatar_url} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center">
                <User className="w-6 h-6 text-[#666]" />
              </div>
            )}
            <div>
              <div className="font-semibold text-white">
                {review.username || `Пользователь #${review.user_id}`}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={typeLabelColor}>{typeLabel}</span>
                <span className="text-[#666]">•</span>
                <span className="text-[#666]">
                  {review.created_at 
                    ? new Date(review.created_at).toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      }) 
                    : 'Недавно'}
                </span>
              </div>
            </div>
          </div>
          
          {reviewRating > 0 && (
            <div 
              className={`${getRatingBgColor(reviewRating)} px-3 py-2 rounded-lg flex items-center gap-1`}
            >
              <Star className="w-4 h-4 fill-white text-white" />
              <span className="font-bold text-white text-lg">{reviewRating}</span>
            </div>
          )}
        </div>

        <div className={`text-[#e0e0e0] leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
          {reviewContent}
        </div>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-[#ff6600] hover:text-[#ff8833] text-sm font-medium flex items-center gap-1"
          >
            {expanded ? (
              <>Свернуть <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Читать полностью <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}

        {review.aspects && Object.keys(typeof review.aspects === 'string' ? JSON.parse(review.aspects) : review.aspects).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#333]">
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeof review.aspects === 'string' ? JSON.parse(review.aspects) : review.aspects)
                .map(([key, val]) => (
                  <span 
                    key={key} 
                    className="text-xs px-2 py-1 bg-[#222] rounded text-[#999] border border-[#333]"
                  >
                    {aspectLabels[key] || key}: <span className="text-white font-medium">{val}/10</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#333] flex items-center gap-6">
          <button className="flex items-center gap-2 text-[#999] hover:text-[#3bb33b] transition-colors text-sm">
            <ThumbsUp className="w-4 h-4" />
            <span>Полезно</span>
          </button>
          <button className="flex items-center gap-2 text-[#999] hover:text-[#ff4444] transition-colors text-sm">
            <ThumbsDown className="w-4 h-4" />
            <span>Не полезно</span>
          </button>
          <button className="flex items-center gap-2 text-[#999] hover:text-white transition-colors text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>Комментировать</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section - Kinopoisk Style */}
      <div className="relative">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
          style={{ backgroundImage: movie.backdrop ? `url(${movie.backdrop})` : 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/80 to-[#1a1a1a]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 pt-6 lg:pt-8 pb-8 lg:pb-12 px-4">
          {/* Poster */}
          <div className="flex-shrink-0 w-full max-w-[280px] mx-auto lg:mx-0">
            <div className="rounded-lg overflow-hidden shadow-2xl">
              {movie.poster ? (
                <img 
                  src={movie.poster} 
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => { e.target.src = '/placeholder-movie.jpg' }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-[#222] flex items-center justify-center">
                  <Film className="w-16 h-16 text-[#444]" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div className="text-lg text-[#999]">{movie.originalTitle}</div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[#999] mt-3 text-sm">
                <span>{movie.year}</span>
                {movie.runtime && (
                  <>
                    <span className="text-[#444]">•</span>
                    <span>{movie.runtime} мин</span>
                  </>
                )}
                <span className="text-[#444]">•</span>
                <span>{movie.genre.join(', ') || '—'}</span>
              </div>
            </div>

            {/* Ratings Row - Kinopoisk Style */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              {/* Main Rating */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center text-2xl lg:text-3xl font-bold text-white"
                  style={{ backgroundColor: getRatingColor(movie.rating) }}
                >
                  {Number(movie.rating).toFixed(1)}
                </div>
                <div>
                  <div className="text-xs text-[#999]">Рейтинг CineVibe</div>
                  <div className="text-white font-medium text-sm">{movie.reviewCount} оценок</div>
                </div>
              </div>

              {/* Critics Rating */}
              {movie.criticsRating > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: getRatingColor(movie.criticsRating) }}
                  >
                    {Number(movie.criticsRating).toFixed(1)}
                  </div>
                  <div>
                    <div className="text-xs text-[#999]">Критики</div>
                    <Award className="w-4 h-4 text-[#ff6600]" />
                  </div>
                </div>
              )}

              {/* Personalized Rating */}
              {personalizedRating !== null && personalizedReviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white bg-purple-600">
                    {Number(personalizedRating).toFixed(1)}
                  </div>
                  <div>
                    <div className="text-xs text-[#999]">Ваши критики</div>
                    <div className="text-white text-xs">{personalizedReviewCount} оценок</div>
                  </div>
                </div>
              )}

              {/* Audience Rating */}
              {movie.audienceRating > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: getRatingColor(movie.audienceRating) }}
                  >
                    {Number(movie.audienceRating).toFixed(1)}
                  </div>
                  <div>
                    <div className="text-xs text-[#999]">Зрители</div>
                    <User className="w-4 h-4 text-[#fbbf24]" />
                  </div>
                </div>
              )}

              {/* Hype Index */}
              {movie.hypeIndex > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-[#ff6600] to-[#ff3300]">
                    {movie.hypeIndex}
                  </div>
                  <div>
                    <div className="text-xs text-[#999]">Хайп</div>
                    <Zap className="w-4 h-4 text-[#ff6600]" />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {movie.trailer && (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ff6600] hover:bg-[#ff7722] text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  Смотреть трейлер
                </a>
              )}
              <button 
                onClick={handleWatchlistToggle}
                disabled={watchlistLoading}
                className={`${
                  isInWatchlist 
                    ? 'bg-[#3bb33b] hover:bg-[#2d922d]' 
                    : 'bg-[#333] hover:bg-[#444]'
                } text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2`}
              >
                {watchlistLoading ? '...' : (isInWatchlist ? 'В списке' : 'Буду смотреть')}
              </button>
            </div>

            {/* Description */}
            <p className="text-[#ccc] leading-relaxed text-sm lg:text-base">{movie.description}</p>

            {/* Director Section with Photo */}
            {movie.director && (
              <div className="bg-[#222]/50 rounded-lg p-4">
                <h3 className="text-sm text-[#999] mb-3">Режиссёр</h3>
                <div className="flex items-center gap-4">
                  {movie.directorPhoto ? (
                    <img 
                      src={movie.directorPhoto} 
                      alt={movie.director}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#333]"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center border-2 border-[#444]">
                      <User className="w-10 h-10 text-[#666]" />
                    </div>
                  )}
                  <span className="text-[#ff6600] font-medium text-lg hover:underline cursor-pointer">{movie.director}</span>
                </div>
              </div>
            )}

            {/* Cast Section with Photos */}
            {movie.cast.length > 0 && (
              <div className="bg-[#222]/50 rounded-lg p-4">
                <h3 className="text-sm text-[#999] mb-4">В главных ролях</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movie.cast.slice(0, 10).map((actor, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      {movie.castPhotos && movie.castPhotos[idx] ? (
                        <img 
                          src={movie.castPhotos[idx]} 
                          alt={actor}
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#333] hover:border-[#ff6600] transition-colors"
                          onError={(e) => { 
                            e.target.onerror = null
                            e.target.src = 'https://placehold.co/80x80/222/666?text=' + encodeURIComponent(actor.charAt(0))
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center border-2 border-[#444]">
                          <span className="text-[#666] font-bold text-2xl">{actor.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm text-white text-center leading-tight">{actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#333] px-4">
        <div className="flex gap-6 lg:gap-8">
          {['overview', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold transition-colors relative text-sm lg:text-base ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-[#999] hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Обзор' : `Рецензии (${reviews.length})`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6600]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 px-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {activeTab === 'overview' ? (
            <>
              {/* Perception Map */}
              {Object.keys(movie.perceptionMap).length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Карта восприятия</h2>
                  <div className="space-y-4">
                    {Object.entries(movie.perceptionMap).map(([aspect, value]) => {
                      const numValue = Number(value)
                      return (
                        <div key={aspect}>
                          <div className="flex justify-between mb-2">
                            <span className="text-[#ccc] text-sm">{aspectLabels[aspect] || aspect}</span>
                            <span 
                              className="font-bold"
                              style={{ color: getPerceptionColor(numValue) }}
                            >
                              {numValue.toFixed(1)}
                            </span>
                          </div>
                          <div className="w-full bg-[#333] rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${numValue * 10}%`,
                                backgroundColor: getPerceptionColor(numValue)
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Review Form */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-6">Написать рецензию</h2>
                
                {!isAuthenticated ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-[#444] mx-auto mb-4" />
                    <p className="text-[#999] mb-4">Войдите, чтобы оставить рецензию</p>
                    <Link 
                      to="/login"
                      className="inline-block bg-[#ff6600] hover:bg-[#ff7722] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Войти
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    {/* Critic toggle */}
                    {user?.role === 'CRITIC' && (
                      <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={asPro} 
                            onChange={(e) => setAsPro(e.target.checked)}
                            className="w-5 h-5 rounded"
                          />
                          <div>
                            <span className="text-purple-300 font-semibold">Опубликовать как критик</span>
                            <p className="text-xs text-purple-400/70">Ваш отзыв будет отмечен как профессиональная рецензия</p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Review Type Selection */}
                    <div>
                      <label className="block text-[#999] text-sm mb-3">Тип рецензии</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'positive', label: 'Положительная', color: 'bg-[#3bb33b]' },
                          { value: 'neutral', label: 'Нейтральная', color: 'bg-[#777]' },
                          { value: 'negative', label: 'Отрицательная', color: 'bg-[#ff4444]' },
                        ].map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setReviewType(type.value)}
                            className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition-all text-sm ${
                              reviewType === type.value
                                ? `${type.color} text-white`
                                : 'bg-[#222] text-[#999] hover:bg-[#333]'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                      <label className="block text-[#999] text-sm mb-3">Ваша оценка</label>
                      <div className="flex items-center gap-4">
                        <StarRating 
                          value={rating} 
                          onChange={(val) => setRating(val.toString())}
                        />
                        {rating && (
                          <span 
                            className="text-3xl font-bold"
                            style={{ color: getRatingColor(rating) }}
                          >
                            {rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div>
                      <label className="block text-[#999] text-sm mb-2">Текст рецензии</label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Поделитесь впечатлениями..."
                        rows={5}
                        className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#ff6600] resize-none"
                      />
                      <div className="text-right text-xs text-[#666] mt-1">
                        {reviewText.length} символов
                      </div>
                    </div>

                    {/* Aspect Ratings */}
                    <div>
                      <label className="block text-[#999] text-sm mb-4">Оценка по аспектам</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(aspectLabels).map(([key, label]) => (
                          <div key={key} className="bg-[#222] rounded-lg p-3">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-[#ccc]">{label}</span>
                              <span className="font-bold text-[#ff6600]">{aspects[key]}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={aspects[key]}
                              onChange={(e) => setAspects({ ...aspects, [key]: parseInt(e.target.value) })}
                              className="w-full accent-[#ff6600]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emotions */}
                    <div>
                      <label className="block text-[#999] text-sm mb-4">Эмоциональная реакция</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(emotionLabels).map(([key, label]) => (
                          <div key={key} className="bg-[#222] rounded-lg p-3">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-[#ccc]">
                                {emotionIcons[key]} {label}
                              </span>
                              <span className="font-bold" style={{ color: emotionColors[key] }}>
                                {emotions[key]}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={emotions[key]}
                              onChange={(e) => setEmotions({ ...emotions, [key]: parseInt(e.target.value) })}
                              className="w-full"
                              style={{ accentColor: emotionColors[key] }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {submitMsg && (
                      <div className={`p-4 rounded-lg text-sm ${
                        submitMsg.includes('успешно') 
                          ? 'bg-green-900/30 border border-green-600/30 text-green-400'
                          : 'bg-red-900/30 border border-red-600/30 text-red-400'
                      }`}>
                        {submitMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !reviewText.trim()}
                      className="w-full bg-[#ff6600] hover:bg-[#ff7722] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
                    >
                      {submitting ? 'Отправка...' : 'Опубликовать рецензию'}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            /* Reviews Tab */
            <div className="space-y-6">
              {/* Reviews Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-bold text-white">
                  Рецензии зрителей
                  <span className="text-[#666] font-normal ml-2">({reviews.length})</span>
                </h2>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="recent">Сначала новые</option>
                  <option value="highest">Высокие оценки</option>
                  <option value="lowest">Низкие оценки</option>
                </select>
              </div>

              {/* Review Distribution Bar */}
              {reviews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    {reviewStats.positive > 0 && (
                      <div 
                        className="bg-[#3bb33b] h-full transition-all" 
                        style={{ width: `${(reviewStats.positive / reviewStats.total) * 100}%` }}
                      />
                    )}
                    {reviewStats.neutral > 0 && (
                      <div 
                        className="bg-[#777] h-full transition-all" 
                        style={{ width: `${(reviewStats.neutral / reviewStats.total) * 100}%` }}
                      />
                    )}
                    {reviewStats.negative > 0 && (
                      <div 
                        className="bg-[#ff4444] h-full transition-all" 
                        style={{ width: `${(reviewStats.negative / reviewStats.total) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#3bb33b]">{reviewStats.positive} положительных</span>
                    <span className="text-[#777]">{reviewStats.neutral} нейтральных</span>
                    <span className="text-[#ff4444]">{reviewStats.negative} отрицательных</span>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {(showAllReviews ? sortedReviews : sortedReviews.slice(0, 5)).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {/* Show More Button */}
              {sortedReviews.length > 5 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full py-3 border border-[#333] rounded-lg text-[#ff6600] hover:bg-[#222] transition-colors font-medium text-sm"
                >
                  {showAllReviews 
                    ? 'Скрыть'
                    : `Показать все рецензии (${sortedReviews.length})`
                  }
                </button>
              )}

              {reviews.length === 0 && (
                <div className="text-center py-12 text-[#666]">
                  Пока нет рецензий. Будьте первым!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Strong & Weak Sides */}
          {strongWeakSides && (strongWeakSides.strong.length > 0 || strongWeakSides.weak.length > 0) && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
              <h3 className="font-bold text-white mb-4 text-sm">Сильные и слабые стороны</h3>
              
              {strongWeakSides.strong.length > 0 && (
                <div className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-[#3bb33b] mb-2 uppercase tracking-wider flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    Плюсы
                  </div>
                  <div className="space-y-2">
                    {strongWeakSides.strong.map(item => (
                      <div key={item.key} className="flex justify-between items-center text-sm">
                        <span className="text-[#ccc]">{item.label}</span>
                        <span className="font-bold text-[#3bb33b]">{item.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {strongWeakSides.weak.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#ff4444] mb-2 uppercase tracking-wider flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3" />
                    Минусы
                  </div>
                  <div className="space-y-2">
                    {strongWeakSides.weak.map(item => (
                      <div key={item.key} className="flex justify-between items-center text-sm">
                        <span className="text-[#ccc]">{item.label}</span>
                        <span className="font-bold text-[#ff4444]">{item.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emotion Cloud */}
          {Object.keys(movie.emotionCloud).length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
              <h3 className="font-bold text-white mb-4 text-sm">Эмоциональное облако</h3>
              <div className="space-y-3">
                {Object.entries(movie.emotionCloud)
                  .sort(([,a], [,b]) => b - a)
                  .map(([emotion, intensity]) => (
                    <div key={emotion}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#ccc]">{emotionIcons[emotion]} {emotionLabels[emotion]}</span>
                        <span style={{ color: emotionColors[emotion] }}>{intensity}%</span>
                      </div>
                      <div className="w-full bg-[#333] rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full"
                          style={{ width: `${intensity}%`, backgroundColor: emotionColors[emotion] }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Rating Dynamics */}
          {dynamics && dynamics.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-[#ff6600]" />
                Динамика рейтинга
              </h3>
              <RatingDynamicsChart dynamics={dynamics} />
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
            <h3 className="font-bold text-white mb-4 text-sm">Информация</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#666]">Год</span>
                <span className="text-white">{movie.year}</span>
              </div>
              {movie.runtime && (
                <div className="flex justify-between">
                  <span className="text-[#666]">Длительность</span>
                  <span className="text-white">{movie.runtime} мин</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#666]">Жанр</span>
                <span className="text-white">{movie.genre.join(', ') || '—'}</span>
              </div>
              {movie.director && (
                <div className="flex justify-between">
                  <span className="text-[#666]">Режиссёр</span>
                  <span className="text-[#ff6600]">{movie.director}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews (compact) */}
          {reviews.length > 0 && activeTab === 'overview' && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
              <h3 className="font-bold text-white mb-4 text-sm">Последние рецензии</h3>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r) => {
                  const rRating = Number(r.rating || 0)
                  return (
                    <div key={r.id} className="pb-3 border-b border-[#333] last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white truncate">{r.username || `Пользователь #${r.user_id}`}</span>
                        {rRating > 0 && (
                          <span 
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: getRatingColor(rRating), color: 'white' }}
                          >
                            {rRating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#999] line-clamp-2">{r.content || r.review_text}</p>
                    </div>
                  )
                })}
              </div>
              <button 
                onClick={() => setActiveTab('reviews')}
                className="w-full mt-3 text-center text-[#ff6600] hover:text-[#ff8833] text-xs font-medium"
              >
                Все рецензии →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieDetail