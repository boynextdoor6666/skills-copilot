import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Heart, Star, TrendingUp, Sparkles, Target, Film, Tv, Gamepad2, BarChart3 } from 'lucide-react'

const TasteProfile = () => {
  const { isAuthenticated } = useAuth()
  const [profile, setProfile] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profileRes, recsRes] = await Promise.allSettled([
        axios.get('/api/users/me/taste-profile'),
        axios.get('/api/users/me/recommendations', { params: { limit: 12 } }),
      ])

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data)
      }

      if (recsRes.status === 'fulfilled') {
        setRecommendations(Array.isArray(recsRes.value.data) ? recsRes.value.data : [])
      }
    } catch (err) {
      console.error('Error loading taste profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold text-secondary-100 mb-4">Профиль вкуса</h1>
          <p className="text-secondary-400 mb-8">Войдите в систему, чтобы увидеть свой профиль вкуса и персонализированные рекомендации</p>
          <Link to="/login" className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition inline-block">
            Войти
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary-100 mb-8">Профиль вкуса</h1>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!profile || profile.totalReviews === 0) {
    return (
      <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <Sparkles className="mx-auto text-accent-400 mb-4" size={64} />
          <h1 className="text-4xl font-bold text-secondary-100 mb-4">Профиль вкуса пока пуст</h1>
          <p className="text-secondary-400 mb-8">
            Оставьте несколько отзывов, чтобы мы могли проанализировать ваши предпочтения и предложить персонализированные рекомендации
          </p>
          <Link to="/" className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition inline-block">
            Перейти к контенту
          </Link>
        </div>
      </div>
    )
  }

  const getContentTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'MOVIE': return <Film size={20} />
      case 'TV_SERIES': return <Tv size={20} />
      case 'GAME': return <Gamepad2 size={20} />
      default: return <Film size={20} />
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-400'
    if (rating >= 6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-100 mb-3 flex items-center gap-3">
            <Heart className="text-accent-400" size={40} />
            Ваш профиль вкуса
          </h1>
          <p className="text-secondary-400 text-lg">
            Анализ на основе {profile.totalReviews} {profile.totalReviews === 1 ? 'отзыва' : 'отзывов'}
          </p>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Favorite Genres */}
          <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
            <h3 className="text-xl font-bold text-secondary-100 mb-4 flex items-center gap-2">
              <Star className="text-accent-400" size={24} />
              Любимые жанры
            </h3>
            {profile.favoriteGenres.length > 0 ? (
              <div className="space-y-3">
                {profile.favoriteGenres.map((genre, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-secondary-200">{genre.genre}</span>
                      <span className="text-secondary-400 text-sm">
                        {genre.count} отзывов • ⭐ {Number(genre?.avgRating ?? 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
                        style={{ width: `${(genre.count / profile.totalReviews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-400">Недостаточно данных</p>
            )}
          </div>

          {/* Preferred Content Types */}
          <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
            <h3 className="text-xl font-bold text-secondary-100 mb-4 flex items-center gap-2">
              <Target className="text-accent-400" size={24} />
              Типы контента
            </h3>
            {profile.preferredContentTypes.length > 0 ? (
              <div className="space-y-4">
                {profile.preferredContentTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-accent-400">
                        {getContentTypeIcon(type.type)}
                      </div>
                      <div>
                        <div className="text-secondary-100 font-semibold">
                          {type.type === 'MOVIE' ? 'Фильмы' : type.type === 'TV_SERIES' ? 'Сериалы' : 'Игры'}
                        </div>
                        <div className="text-sm text-secondary-400">{type.count} отзывов</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getRatingColor(Number(type?.avgRating ?? 0))}`}>
                        {Number(type?.avgRating ?? 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-secondary-500">ср. рейтинг</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-400">Недостаточно данных</p>
            )}
          </div>

          {/* Dominant Emotions */}
          <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
            <h3 className="text-xl font-bold text-secondary-100 mb-4 flex items-center gap-2">
              <Sparkles className="text-accent-400" size={24} />
              Доминирующие эмоции
            </h3>
            {profile.dominantEmotions.length > 0 ? (
              <div className="space-y-3">
                {profile.dominantEmotions.map((emotion, idx) => {
                  const emotionLabels = {
                    joy: 'Радость',
                    excitement: 'Волнение',
                    tension: 'Напряжение',
                    awe: 'Восторг',
                    anticipation: 'Предвкушение',
                  }
                  const emotionColors = {
                    joy: 'from-yellow-600 to-yellow-400',
                    excitement: 'from-orange-600 to-orange-400',
                    tension: 'from-purple-600 to-purple-400',
                    awe: 'from-pink-600 to-pink-400',
                    anticipation: 'from-blue-600 to-blue-400',
                  }

                  return (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-secondary-200">{emotionLabels[emotion.emotion] || emotion.emotion}</span>
                        <span className="text-secondary-400 text-sm">
                          {Math.round(Number(emotion?.intensity ?? 0))}% • {emotion.count}x
                        </span>
                      </div>
                      <div className="w-full bg-secondary-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${emotionColors[emotion.emotion] || 'from-accent-600 to-accent-400'}`}
                          style={{ width: `${emotion.intensity}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-secondary-400">Недостаточно данных</p>
            )}
          </div>

          {/* Rating Tendency */}
          <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
            <h3 className="text-xl font-bold text-secondary-100 mb-4 flex items-center gap-2">
              <BarChart3 className="text-accent-400" size={24} />
              Тенденция оценок
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary-400">Средний рейтинг</span>
                <span className="text-2xl font-bold text-accent-400">{Number(profile.ratingTendency?.average ?? 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary-400">Диапазон</span>
                <span className="text-secondary-200">
                  {Number(profile.ratingTendency?.min ?? 0).toFixed(1)} - {Number(profile.ratingTendency?.max ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Строгий</span>
                  <span className="text-secondary-400">{profile.ratingTendency.distribution.harsh}%</span>
                </div>
                <div className="w-full bg-secondary-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${profile.ratingTendency.distribution.harsh}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-400">Сбалансированный</span>
                  <span className="text-secondary-400">{profile.ratingTendency.distribution.balanced}%</span>
                </div>
                <div className="w-full bg-secondary-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ width: `${profile.ratingTendency.distribution.balanced}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Щедрый</span>
                  <span className="text-secondary-400">{profile.ratingTendency.distribution.generous}%</span>
                </div>
                <div className="w-full bg-secondary-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${profile.ratingTendency.distribution.generous}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-100 mb-6 flex items-center gap-3">
            <TrendingUp className="text-accent-400" size={32} />
            Рекомендации для вас
          </h2>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Link
                  key={rec.contentId}
                  to={`/movie/${rec.contentId}`}
                  className="bg-primary-800 rounded-lg overflow-hidden border border-secondary-600 hover:border-accent-500 transition-all duration-200 group"
                >
                  <div className="relative h-48 bg-secondary-700">
                    {rec.posterUrl ? (
                      <img src={rec.posterUrl} alt={rec.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary-500">
                        <Star size={48} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {rec.matchScore}% совпадение
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-secondary-100 mb-1 truncate group-hover:text-accent-400 transition">
                      {rec.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2 text-sm text-secondary-400">
                      {rec.releaseYear && <span>{rec.releaseYear}</span>}
                      {rec.genre && <span>• {rec.genre}</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="text-yellow-400" size={16} />
                      <span className="text-secondary-200 font-semibold">{Number(rec?.avgRating ?? 0).toFixed(1)}</span>
                    </div>
                    {rec.matchReasons && rec.matchReasons.length > 0 && (
                      <div className="space-y-1">
                        {rec.matchReasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="text-xs text-accent-400 flex items-start gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-secondary-400 text-center py-12">Недостаточно данных для генерации рекомендаций</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TasteProfile
