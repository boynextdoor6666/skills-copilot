import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Star, UserPlus, UserMinus, TrendingUp, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Critics = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [allCritics, setAllCritics] = useState([])
  const [followedCritics, setFollowedCritics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'followed'

  useEffect(() => {
    loadCritics()
  }, [isAuthenticated])

  const loadCritics = async () => {
    setLoading(true)
    setError(null)
    try {
      const allRes = await axios.get('/api/critics')
      setAllCritics(Array.isArray(allRes.data) ? allRes.data : [])

      if (isAuthenticated) {
        const followedRes = await axios.get('/api/critics/followed')
        setFollowedCritics(Array.isArray(followedRes.data) ? followedRes.data : [])
      } else {
        setFollowedCritics([])
      }
    } catch (err) {
      console.error('Error loading critics:', err)
      setError('Не удалось загрузить критиков')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (criticId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await axios.post(`/api/critics/${criticId}/follow`)
      await loadCritics() // Reload to update followed list
    } catch (err) {
      console.error('Error following critic:', err)
      alert('Не удалось подписаться на критика')
    }
  }

  const handleUnfollow = async (criticId) => {
    try {
      await axios.delete(`/api/critics/${criticId}/follow`)
      await loadCritics() // Reload to update followed list
    } catch (err) {
      console.error('Error unfollowing critic:', err)
      alert('Не удалось отписаться от критика')
    }
  }

  const isFollowing = (criticId) => {
    return followedCritics.some(c => c.id === criticId)
  }

  const renderCriticCard = (critic) => {
    const following = isFollowing(critic.id)
    
    return (
      <div 
        key={critic.id} 
        className="professional-card p-4 md:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-lg ring-2 ring-accent-500/20 group-hover:ring-4 transition-all duration-300">
                {critic.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-secondary-100 font-bold text-lg md:text-xl mb-1 group-hover:text-accent-400 transition-colors">
                  {critic.username}
                </h3>
                <p className="text-secondary-400 text-sm flex items-center gap-2">
                  <Award size={14} className="text-accent-500" />
                  {critic.email}
                </p>
              </div>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={() => following ? handleUnfollow(critic.id) : handleFollow(critic.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  following 
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600'
                    : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700'
                }`}
              >
                {following ? <UserMinus size={18} /> : <UserPlus size={18} />}
                <span>{following ? 'Отписаться' : 'Подписаться'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-xl p-4 border border-secondary-700/50 hover:border-accent-500/50 transition-all duration-300">
              <div className="flex items-center gap-2 text-secondary-400 text-sm mb-2">
                <div className="p-1.5 bg-accent-500/10 rounded-lg">
                  <TrendingUp size={16} className="text-accent-400" />
                </div>
                <span>Отзывов</span>
              </div>
              <p className="text-secondary-100 text-2xl font-bold">{critic.review_count || 0}</p>
            </div>
            
            <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-xl p-4 border border-secondary-700/50 hover:border-accent-500/50 transition-all duration-300">
              <div className="flex items-center gap-2 text-secondary-400 text-sm mb-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                  <Star size={16} className="text-yellow-400" />
                </div>
                <span>Средний рейтинг</span>
              </div>
              <p className="text-secondary-100 text-2xl font-bold">
                {critic.avg_rating_given ? parseFloat(critic.avg_rating_given).toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>

          {following && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-accent-500/10 border border-accent-500/30 rounded-lg text-accent-400 text-sm font-medium">
              <Award size={16} className="animate-pulse" />
              <span>Вы подписаны на этого критика</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary-100 mb-8">Критики</h1>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary-100 mb-8">Критики</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  const criticsToDisplay = activeTab === 'followed' ? followedCritics : allCritics

  return (
    <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with gradient */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
            <Award className="text-accent-400" size={32} />
            Критики
          </h1>
          <p className="text-secondary-300 text-lg">
            Подпишитесь на критиков, чтобы получать персонализированные рейтинги на основе их отзывов
          </p>
        </div>

        {/* Tabs with modern design */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit backdrop-blur-md">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Все критики <span className="ml-2 opacity-70">({allCritics.length})</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('followed')}
              className={`px-4 py-2 md:px-6 md:py-3 font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'followed'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'text-secondary-400 hover:text-secondary-200 hover:bg-primary-700/50'
              }`}
            >
              Мои критики <span className="ml-2 opacity-70">({followedCritics.length})</span>
            </button>
          )}
        </div>

        {!isAuthenticated && (
          <div className="professional-card bg-gradient-to-r from-accent-500/10 to-accent-600/10 border-accent-500/50 p-5 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent-500/20 rounded-lg">
                <UserPlus className="text-accent-400" size={24} />
              </div>
              <div>
                <p className="text-accent-300 font-semibold text-lg">
                  Войдите в систему
                </p>
                <p className="text-accent-400/80 text-sm">
                  чтобы подписаться на критиков и получать персонализированные рекомендации
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Critics Grid */}
        {criticsToDisplay.length === 0 ? (
          <div className="professional-card text-center py-16">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-accent-500/20 to-accent-600/10 rounded-full flex items-center justify-center">
                <Award size={48} className="text-accent-400" />
              </div>
              <p className="text-2xl font-bold text-secondary-200">
                {activeTab === 'followed' 
                  ? 'Вы еще не подписаны ни на одного критика' 
                  : 'Критики не найдены'}
              </p>
              <p className="text-secondary-400">
                {activeTab === 'followed'
                  ? 'Перейдите на вкладку "Все критики" чтобы начать подписку'
                  : 'Попробуйте изменить параметры поиска'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {criticsToDisplay.map(renderCriticCard)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Critics
