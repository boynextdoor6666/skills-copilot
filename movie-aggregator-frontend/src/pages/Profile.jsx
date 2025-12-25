import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Trophy, Star, Award, TrendingUp, Zap, Lock, CheckCircle, Target, Footprints, Film, Heart, Palette, Flame, User, Mail, Edit2, Save, X, Key, Globe } from 'lucide-react'

// Список стран для выбора
const COUNTRIES = [
  { code: 'RU', name: 'Россия' },
  { code: 'US', name: 'США' },
  { code: 'GB', name: 'Великобритания' },
  { code: 'DE', name: 'Германия' },
  { code: 'FR', name: 'Франция' },
  { code: 'IT', name: 'Италия' },
  { code: 'ES', name: 'Испания' },
  { code: 'JP', name: 'Япония' },
  { code: 'CN', name: 'Китай' },
  { code: 'KR', name: 'Южная Корея' },
  { code: 'CA', name: 'Канада' },
  { code: 'AU', name: 'Австралия' },
  { code: 'BR', name: 'Бразилия' },
  { code: 'IN', name: 'Индия' },
  { code: 'MX', name: 'Мексика' },
  { code: 'PL', name: 'Польша' },
  { code: 'UA', name: 'Украина' },
  { code: 'BY', name: 'Беларусь' },
  { code: 'KZ', name: 'Казахстан' },
  { code: 'NL', name: 'Нидерланды' },
  { code: 'SE', name: 'Швеция' },
  { code: 'NO', name: 'Норвегия' },
  { code: 'FI', name: 'Финляндия' },
  { code: 'DK', name: 'Дания' },
  { code: 'TR', name: 'Турция' },
  { code: 'AR', name: 'Аргентина' },
  { code: 'CZ', name: 'Чехия' },
  { code: 'AT', name: 'Австрия' },
  { code: 'CH', name: 'Швейцария' },
  { code: 'BE', name: 'Бельгия' },
  { code: 'PT', name: 'Португалия' },
  { code: 'GR', name: 'Греция' },
  { code: 'IL', name: 'Израиль' },
  { code: 'AE', name: 'ОАЭ' },
  { code: 'SG', name: 'Сингапур' },
  { code: 'TW', name: 'Тайвань' },
  { code: 'TH', name: 'Таиланд' },
  { code: 'VN', name: 'Вьетнам' },
  { code: 'ID', name: 'Индонезия' },
  { code: 'MY', name: 'Малайзия' },
  { code: 'PH', name: 'Филиппины' },
  { code: 'NZ', name: 'Новая Зеландия' },
  { code: 'ZA', name: 'ЮАР' },
  { code: 'EG', name: 'Египет' },
  { code: 'SA', name: 'Саудовская Аравия' },
]

// Функция для получения флага страны по коду
const getCountryFlag = (code) => {
  if (!code) return '🌍'
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Экспортируем для использования в других компонентах
export { COUNTRIES, getCountryFlag }

const Profile = () => {
  const auth = useAuth()
  const user = auth?.user
  const logout = auth?.logout
  
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    avatarUrl: '',
    bio: '',
    country: ''
  })
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [achievements, setAchievements] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [level, setLevel] = useState(null)

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || user.avatar_url || '',
        bio: user.bio || '',
        country: user.country || ''
      })
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [achRes, levelRes, lbRes] = await Promise.all([
        axios.get('/api/users/me/achievements'),
        axios.get('/api/users/me/level'),
        axios.get('/api/users/leaderboard')
      ])
      setAchievements(achRes.data)
      setLevel(levelRes.data)
      setLeaderboard(lbRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const saveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await axios.patch('/api/users/me', form)
      console.log('Profile saved:', response.data)
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Save profile error:', err)
      // Show more detailed error message
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Неизвестная ошибка'
      setError(`Не удалось сохранить: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      await axios.patch('/api/users/me/password', { currentPassword: pwdCurrent, newPassword: pwdNew })
      setMsg('Пароль успешно изменен')
      setPwdCurrent('')
      setPwdNew('')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Ошибка при смене пароля')
    }
  }

  const unlockedAchievements = achievements.filter(a => a.unlockedAt)
  const progressPercentage = level ? (level.currentXP / level.nextLevelXP) * 100 : 0

  if (!user) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
    </div>
  )

  const iconMap = {
    footprints: <Footprints />,
    film: <Film />,
    star: <Star />,
    heart: <Heart />,
    palette: <Palette />,
    flame: <Flame />,
    trophy: <Trophy />,
    feather: <Edit2 />,
    gavel: <Award />,
    users: <User />,
    default: <Award />
  }

  const renderAchievementCard = (achievement) => {
    const isUnlocked = achievement.unlockedAt !== undefined
    const progressPercent = achievement.requirement > 0 ? (achievement.progress / achievement.requirement) * 100 : 0
    const IconComponent = iconMap[achievement.icon] || iconMap.default

    return (
      <div
        key={achievement.id}
        className={`group relative p-5 rounded-xl border transition-all duration-300 overflow-hidden ${
          isUnlocked
            ? 'bg-gradient-to-br from-accent-900/20 to-dark-800 border-accent-500/50 hover:border-accent-400 hover:shadow-lg hover:shadow-accent-500/10'
            : 'bg-dark-800/50 border-dark-700 opacity-70 hover:opacity-100'
        }`}
      >
        {isUnlocked && (
          <div className="absolute top-0 right-0 p-2">
            <CheckCircle size={16} className="text-accent-400" />
          </div>
        )}
        
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-accent-500/20 text-accent-400' : 'bg-dark-700 text-dark-400'}`}>
            {React.cloneElement(IconComponent, { size: 24 })}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold mb-1 truncate ${isUnlocked ? 'text-white' : 'text-dark-300'}`}>
              {achievement.title}
            </h4>
            <p className="text-sm text-dark-400 mb-3 line-clamp-2">{achievement.description}</p>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className={isUnlocked ? 'text-accent-400' : 'text-dark-500'}>
                  {isUnlocked ? 'Получено' : 'Прогресс'}
                </span>
                <span className="text-dark-400">{achievement.progress} / {achievement.requirement}</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnlocked ? 'bg-accent-500' : 'bg-dark-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 pb-20">
      {/* Hero Profile Header */}
      <div className="relative bg-dark-800 border-b border-dark-700 mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-900/10 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 py-12 relative">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-accent-500 to-purple-600 shadow-xl shadow-accent-500/20">
                <img
                  src={user.avatarUrl || user.avatar_url || 'https://placehold.co/150'}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover border-4 border-dark-800 bg-dark-700"
                />
              </div>
              {level && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-dark-900 border border-accent-500/50 text-accent-400 px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap flex items-center gap-1">
                  <Star size={12} className="fill-current" />
                  Уровень {level.level}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight">{user.username || user.name}</h1>
              <p className="text-dark-400 flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} />
                {user.email}
              </p>
              {level && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent-500/10 text-accent-400 text-sm font-medium border border-accent-500/20">
                  <Trophy size={14} />
                  {level.title}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-white">{unlockedAchievements.length}</div>
                <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">Достижения</div>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-accent-400">{level?.currentXP || 0}</div>
                <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">XP</div>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-purple-400">#{leaderboard.findIndex(u => u.username === user.username) + 1 || '-'}</div>
                <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">Ранг</div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar (Full Width) */}
          {level && (
            <div className="mt-8 max-w-2xl mx-auto md:mx-0">
              <div className="flex justify-between text-xs text-dark-400 mb-2 font-medium">
                <span>Текущий опыт: {level.currentXP}</span>
                <span>Следующий уровень: {level.nextLevelXP}</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-600 to-purple-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 bg-dark-800 p-1 rounded-xl w-fit border border-dark-700">
          {[
            { id: 'profile', label: 'Профиль', icon: User },
            { id: 'achievements', label: 'Достижения', icon: Trophy },
            { id: 'leaderboard', label: 'Лидеры', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-fadeIn">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Info Card */}
              <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="text-accent-500" size={20} />
                    Личная информация
                  </h3>
                  {!editing ? (
                    <button 
                      onClick={() => setEditing(true)} 
                      className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 size={18} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={saveProfile} 
                        className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Сохранить"
                      >
                        <Save size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditing(false)
                          setForm({
                            username: user.username || '',
                            email: user.email || '',
                            avatarUrl: user.avatarUrl || user.avatar_url || '',
                            bio: user.bio || '',
                            country: user.country || ''
                          })
                        }} 
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Отмена"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">Имя пользователя</label>
                      {editing ? (
                        <input
                          name="username"
                          value={form.username}
                          onChange={handleChange}
                          className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                        />
                      ) : (
                        <div className="text-lg text-white font-medium">{user.username}</div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">Email</label>
                      {editing ? (
                        <input
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                        />
                      ) : (
                        <div className="text-lg text-white font-medium">{user.email}</div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">О себе</label>
                      {editing ? (
                        <textarea
                          name="bio"
                          value={form.bio}
                          onChange={handleChange}
                          rows={4}
                          className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all resize-none"
                          placeholder="Расскажите о себе..."
                        />
                      ) : (
                        <div className="text-dark-300 leading-relaxed">
                          {user.bio || <span className="text-dark-500 italic">Информация отсутствует</span>}
                        </div>
                      )}
                    </div>

                    {editing && (
                      <div className="group">
                        <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">URL Аватара</label>
                        <input
                          name="avatarUrl"
                          value={form.avatarUrl}
                          onChange={handleChange}
                          className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {/* Country Selector */}
                    <div className="group">
                      <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={14} />
                        Страна
                      </label>
                      {editing ? (
                        <select
                          name="country"
                          value={form.country}
                          onChange={handleChange}
                          className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="">Выберите страну</option>
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-lg text-white font-medium flex items-center gap-2">
                          {user.country ? (
                            <>
                              <span className="text-2xl">{getCountryFlag(user.country)}</span>
                              {COUNTRIES.find(c => c.code === user.country)?.name || user.country}
                            </>
                          ) : (
                            <span className="text-dark-500 italic">Не указана</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-dark-500 mt-1">
                        Ваша страна используется для глобальной статистики рейтингов
                      </p>
                    </div>

                    {editing && (
                      <div className="space-y-3 pt-2">
                        {error && (
                          <div className="text-sm p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                            {error}
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={saveProfile}
                            disabled={saving}
                            className="px-4 py-2 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            {saving ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save size={18} />
                            )}
                            {saving ? 'Сохранение...' : 'Сохранить изменения'}
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false)
                              setError('')
                              setForm({
                                username: user.username || '',
                                email: user.email || '',
                                avatarUrl: user.avatarUrl || user.avatar_url || '',
                                bio: user.bio || '',
                                country: user.country || ''
                              })
                            }}
                            disabled={saving}
                            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-white rounded-lg font-medium transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden h-fit">
                <div className="p-6 border-b border-dark-700">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Key className="text-accent-500" size={20} />
                    Безопасность
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">Текущий пароль</label>
                    <input
                      type="password"
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">Новый пароль</label>
                    <input
                      type="password"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
                    />
                  </div>
                  
                  {msg && (
                    <div className={`text-sm p-3 rounded-lg ${
                      msg.includes('успешно') 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {msg}
                    </div>
                  )}

                  <button
                    onClick={changePassword}
                    disabled={!pwdCurrent || !pwdNew}
                    className="w-full bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-accent-600/20 mt-2"
                  >
                    Обновить пароль
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-8">
              {['reviews', 'critics', 'diversity', 'engagement', 'special'].map((category) => {
                const categoryAchievements = achievements.filter((a) => a.category === category)
                if (categoryAchievements.length === 0) return null

                const categoryNames = {
                  reviews: 'Отзывы и рецензии',
                  critics: 'Взаимодействие с критиками',
                  diversity: 'Разнообразие контента',
                  engagement: 'Социальная активность',
                  special: 'Особые достижения',
                }

                const categoryIcons = {
                  reviews: Award,
                  critics: Star,
                  diversity: Zap,
                  engagement: TrendingUp,
                  special: Trophy,
                }

                const Icon = categoryIcons[category]

                return (
                  <div key={category} className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-dark-700">
                      <div className="p-2 bg-dark-700 rounded-lg text-accent-500">
                        <Icon size={24} />
                      </div>
                      {categoryNames[category]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAchievements.map(renderAchievementCard)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden max-w-4xl mx-auto">
              <div className="p-6 border-b border-dark-700 bg-dark-800/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="text-accent-500" size={24} />
                  Топ-10 участников
                </h3>
                <p className="text-dark-400 text-sm mt-1">Самые активные пользователи платформы</p>
              </div>
              
              <div className="divide-y divide-dark-700">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = user && entry.username === user.username
                  const isTop3 = index < 3
                  
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-5 transition-colors ${
                        isCurrentUser ? 'bg-accent-500/10 border-l-4 border-accent-500' : 'hover:bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                            'bg-dark-700 text-dark-400'}
                        `}>
                          {entry.rank}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden border border-dark-600">
                            {/* Placeholder for avatar if not available in leaderboard data */}
                            <User className="w-full h-full p-2 text-dark-400" />
                          </div>
                          <div>
                            <div className={`font-bold text-lg ${isCurrentUser ? 'text-accent-400' : 'text-white'}`}>
                              {entry.username}
                              {isCurrentUser && <span className="ml-2 text-xs bg-accent-500 text-white px-2 py-0.5 rounded-full">Вы</span>}
                            </div>
                            <div className="text-sm text-dark-400 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Edit2 size={12} /> {entry.reviewCount} отзывов</span>
                              <span className="flex items-center gap-1"><Star size={12} /> {entry.avgRating} ср. рейтинг</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-white font-mono">{entry.xp.toLocaleString()} <span className="text-accent-500 text-sm">XP</span></div>
                        {isTop3 && <div className="text-xs text-accent-400 font-medium mt-1">Лидер топа</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
