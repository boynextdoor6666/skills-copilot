import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Calendar, Star, Users, Globe, 
  Heart, Share2, Bookmark, ChevronDown, ChevronUp, 
  ThumbsUp, ThumbsDown, Gamepad2, Monitor, Cpu, HardDrive
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MetascoreBadge from '../components/MetascoreBadge';
import UserScoreBadge from '../components/UserScoreBadge';
import ReviewDistribution from '../components/ReviewDistribution';
import CriticReviewCard from '../components/CriticReviewCard';
import ExpectationsWidget from '../components/ExpectationsWidget';

const GameDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllCriticReviews, setShowAllCriticReviews] = useState(false);
  
  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 10, content: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, reviewsRes] = await Promise.all([
          axios.get(`/api/content/${id}`),
          axios.get(`/api/reviews/content/${id}`)
        ]);
        setContent(contentRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkWatchlist();
    }
  }, [user, id]);

  const checkWatchlist = async () => {
    try {
      const res = await axios.get('/api/users/me/watchlist');
      const found = res.data.some(item => (item.content_id || item.id) === Number(id));
      setIsInWatchlist(found);
    } catch (error) {
      console.error('Failed to check watchlist:', error);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) return alert('Войдите, чтобы добавить в список');
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await axios.delete(`/api/users/me/watchlist/${id}`);
      } else {
        await axios.post(`/api/users/me/watchlist/${id}`);
      }
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      alert('Ошибка обновления списка');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleVoteReview = async (reviewId, type) => {
    if (!user) return alert('Войдите, чтобы голосовать');
    try {
      await axios.post(`/api/reviews/${reviewId}/vote`, { type });
      const res = await axios.get(`/api/reviews/content/${id}`);
      setReviews(res.data);
    } catch (error) {
      alert('Ошибка голосования');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Войдите, чтобы оставить отзыв');
    setReviewSubmitting(true);
    try {
      await axios.post('/api/reviews', {
        content_id: Number(id),
        rating: Number(reviewForm.rating),
        content: reviewForm.content
      });
      setShowReviewModal(false);
      setReviewForm({ rating: 10, content: '' });
      const res = await axios.get(`/api/reviews/content/${id}`);
      setReviews(res.data);
      alert('Отзыв опубликован!');
    } catch (error) {
      alert('Ошибка публикации отзыва');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Calculate strong and weak sides
  const strongWeakSides = useMemo(() => {
    if (!reviews.length) return null
    
    const aspectLabels = {
      gameplay: 'Геймплей',
      graphics: 'Графика',
      story: 'Сюжет',
      soundtrack: 'Саундтрек',
      replayability: 'Реиграбельность'
    }

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
  }, [reviews])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Загрузка...</div>;
  if (!content) return <div className="min-h-screen flex items-center justify-center text-white">Контент не найден</div>;

  // Данные игры из backend или пустые значения
  const gameData = {
    id: content.id,
    title: content.title,
    year: content.release_year,
    releaseDate: content.release_date || content.created_at,
    
    posterUrl: content.poster_url || 'https://placehold.co/300x450/1e293b/ffffff?text=No+Poster',
    coverUrl: content.cover_url || content.poster_url || 'https://placehold.co/1920x600/1e293b/ffffff?text=No+Cover',
    trailerUrl: content.trailer_url,
    
    metascore: content.critics_rating ? Math.round(content.critics_rating * 10) : 0,
    userScore: content.audience_rating || 0,
    
    // Игровые данные
    developer: content.developer || '',
    publisher: content.publisher || '',
    platforms: content.platforms || [], // ["PC", "PS5", "Xbox Series X", "Nintendo Switch"]
    
    genre: content.genre ? (Array.isArray(content.genre) ? content.genre : [content.genre]) : [],
    esrbRating: content.esrb_rating || content.age_rating || '',
    players: content.players || '', // "1 игрок", "1-4 игрока", "Онлайн"
    
    description: content.description || '',
    
    // Системные требования
    systemRequirements: content.system_requirements || {
      minimum: {},
      recommended: {}
    },
    
    // Поддерживаемые языки
    languages: content.languages || [],
    
    // Размер файла
    fileSize: content.file_size || '',
    
    criticReviews: {
      total: reviews.filter(r => r.user?.role === 'CRITIC').length,
      positive: content.positive_reviews || 0,
      mixed: content.mixed_reviews || 0,
      negative: content.negative_reviews || 0
    },
    userReviews: {
      total: reviews.filter(r => r.user?.role !== 'CRITIC').length,
      positive: 0,
      mixed: 0,
      negative: 0
    }
  };

  // Преобразуем отзывы для отображения
  const criticReviewsList = reviews.filter(r => r.user?.role === 'CRITIC' || r.role === 'CRITIC').map(r => ({
    id: r.id,
    publicationName: 'Critic',
    criticName: r.username || r.user?.username || 'Unknown',
    score: r.rating * 10,
    excerpt: r.text || r.content,
    publishDate: r.created_at,
    type: r.rating >= 7 ? 'positive' : r.rating >= 4 ? 'mixed' : 'negative'
  }));

  const userReviewsList = reviews.filter(r => r.user?.role !== 'CRITIC' && r.role !== 'CRITIC').map(r => ({
    id: r.id,
    userName: r.username || r.user?.username || 'User',
    userAvatar: r.avatar_url || r.user?.avatar_url || 'https://placehold.co/50',
    score: r.rating,
    content: r.text || r.content,
    helpful: Number(r.likes || 0),
    notHelpful: Number(r.dislikes || 0),
    date: r.created_at,
    type: r.rating >= 7 ? 'positive' : r.rating >= 4 ? 'neutral' : 'negative'
  }));

  // Иконки платформ
  const getPlatformIcon = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes('pc') || p.includes('windows')) return '🖥️';
    if (p.includes('playstation') || p.includes('ps')) return '🎮';
    if (p.includes('xbox')) return '🟢';
    if (p.includes('nintendo') || p.includes('switch')) return '🔴';
    if (p.includes('mac')) return '🍎';
    if (p.includes('linux')) return '🐧';
    return '🎮';
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative -mx-4">
        <div className="h-[300px] md:h-[450px] relative overflow-hidden">
          <img
            src={gameData.coverUrl}
            alt={gameData.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={gameData.posterUrl}
                  alt={gameData.title}
                  className="w-32 md:w-48 rounded-lg shadow-2xl border border-gray-800"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                      <Gamepad2 className="w-3 h-3 inline mr-1" />
                      ИГРА
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{gameData.title}</h1>
                  <div className="flex items-center gap-3 text-gray-400 mt-2">
                    <span>{gameData.year}</span>
                    <span>•</span>
                    <span>{gameData.genre.join(', ')}</span>
                    {gameData.esrbRating && (
                      <>
                        <span>•</span>
                        <span>{gameData.esrbRating}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Платформы */}
                {gameData.platforms.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Платформы:</span>
                    <div className="flex gap-2">
                      {gameData.platforms.map((platform, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-sm text-white"
                          title={platform}
                        >
                          {getPlatformIcon(platform)} {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Метрики */}
                <div className="flex items-center gap-6">
                  <MetascoreBadge score={gameData.metascore} size="large" />
                  <UserScoreBadge 
                    score={gameData.userScore} 
                    reviewCount={gameData.userReviews.total}
                    size="large"
                  />
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-wrap gap-3">
                  {gameData.trailerUrl && (
                    <a 
                      href={gameData.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 transition flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Смотреть трейлер
                    </a>
                  )}
                  <button 
                    onClick={handleToggleWatchlist}
                    disabled={watchlistLoading}
                    className={`px-6 py-3 font-bold rounded border transition flex items-center gap-2 ${
                      isInWatchlist 
                        ? 'bg-[#f5c518] text-black border-[#f5c518]' 
                        : 'bg-[#1a1a1a] text-white border-gray-700 hover:bg-[#252525]'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${isInWatchlist ? 'fill-black' : ''}`} />
                    {isInWatchlist ? 'В списке' : 'Хочу поиграть'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 overflow-x-auto">
        <div className="flex gap-8 min-w-max px-4 md:px-0">
          {['overview', 'reviews', 'requirements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-[#f5c518]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' && 'Обзор'}
              {tab === 'reviews' && `Рецензии (${criticReviewsList.length + userReviewsList.length})`}
              {tab === 'requirements' && 'Системные требования'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Об игре</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {gameData.description || 'Описание будет добавлено позже.'}
                </p>
              </div>

              {criticReviewsList.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Рецензии критиков</h2>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-[#f5c518] hover:text-[#f5c518]/80 text-sm font-semibold"
                    >
                      Все рецензии →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {criticReviewsList.slice(0, 3).map((review) => (
                      <CriticReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <>
              {criticReviewsList.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Рецензии критиков</h2>
                  <div className="space-y-4">
                    {criticReviewsList.map((review) => (
                      <CriticReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Отзывы пользователей</h2>
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 bg-[#f5c518] text-black font-semibold rounded-lg hover:bg-[#f5c518]/90 transition flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Написать отзыв
                  </button>
                </div>
                
                {userReviewsList.length === 0 ? (
                  <div className="bg-[#1f1f1f] border border-[#2d2d2d] rounded-lg p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">Отзывов пока нет. Станьте первым!</p>
                    <button 
                      onClick={() => setShowReviewModal(true)}
                      className="px-6 py-3 bg-[#f5c518] text-black font-bold rounded-lg hover:bg-[#f5c518]/90 transition"
                    >
                      Написать первый отзыв
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userReviewsList.map((review) => {
                      // Определяем цвета по типу отзыва
                      const borderColor = review.type === 'positive' 
                        ? 'border-l-[#66cc33]' 
                        : review.type === 'negative' 
                          ? 'border-l-[#ff0000]' 
                          : 'border-l-[#ffcc33]';
                      
                      const scoreBgColor = review.type === 'positive' 
                        ? 'bg-[#66cc33]' 
                        : review.type === 'negative' 
                          ? 'bg-[#ff0000]' 
                          : 'bg-[#ffcc33]';
                      
                      const scoreTextColor = review.type === 'positive' || review.type === 'negative'
                        ? 'text-white'
                        : 'text-black';

                      return (
                        <div 
                          key={review.id} 
                          className={`bg-[#1f1f1f] border border-[#2d2d2d] border-l-4 ${borderColor} rounded-lg p-6`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <img src={review.userAvatar} alt="" className="w-10 h-10 rounded-full" />
                              <div>
                                <p className="text-white font-semibold">{review.userName}</p>
                                <p className="text-gray-500 text-sm">{formatDate(review.date)}</p>
                              </div>
                            </div>
                            {review.score && (
                              <div className={`px-3 py-1 ${scoreBgColor} rounded text-xl font-bold ${scoreTextColor}`}>
                                {review.score}/10
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 mb-4">{review.content}</p>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleVoteReview(review.id, 'LIKE')}
                              className="flex items-center gap-2 text-gray-400 hover:text-green-500"
                            >
                              <ThumbsUp className="w-4 h-4" /> {review.helpful}
                            </button>
                            <button 
                              onClick={() => handleVoteReview(review.id, 'DISLIKE')}
                              className="flex items-center gap-2 text-gray-400 hover:text-red-500"
                            >
                              <ThumbsDown className="w-4 h-4" /> {review.notHelpful}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* System Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Системные требования</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Минимальные */}
                <div className="bg-[#141414] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-white">Минимальные</h3>
                  </div>
                  
                  {Object.keys(gameData.systemRequirements?.minimum || {}).length > 0 ? (
                    <dl className="space-y-3 text-sm">
                      {Object.entries(gameData.systemRequirements.minimum).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-gray-500 capitalize flex items-center gap-2">
                            {key === 'os' && <Monitor className="w-4 h-4" />}
                            {key === 'processor' && <Cpu className="w-4 h-4" />}
                            {key === 'memory' && '💾'}
                            {key === 'graphics' && '🎮'}
                            {key === 'storage' && <HardDrive className="w-4 h-4" />}
                            {key}:
                          </dt>
                          <dd className="text-gray-300 ml-6">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-gray-500 text-sm">Требования будут добавлены позже</p>
                  )}
                </div>

                {/* Рекомендуемые */}
                <div className="bg-[#141414] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-white">Рекомендуемые</h3>
                  </div>
                  
                  {Object.keys(gameData.systemRequirements?.recommended || {}).length > 0 ? (
                    <dl className="space-y-3 text-sm">
                      {Object.entries(gameData.systemRequirements.recommended).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-gray-500 capitalize flex items-center gap-2">
                            {key === 'os' && <Monitor className="w-4 h-4" />}
                            {key === 'processor' && <Cpu className="w-4 h-4" />}
                            {key === 'memory' && '💾'}
                            {key === 'graphics' && '🎮'}
                            {key === 'storage' && <HardDrive className="w-4 h-4" />}
                            {key}:
                          </dt>
                          <dd className="text-gray-300 ml-6">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-gray-500 text-sm">Требования будут добавлены позже</p>
                  )}
                </div>
              </div>

              {/* Языки */}
              {gameData.languages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Поддерживаемые языки</h3>
                  <div className="flex flex-wrap gap-2">
                    {gameData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#141414] text-gray-300 rounded-full text-sm border border-gray-800"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Write Review Button */}
          <button 
            onClick={() => setShowReviewModal(true)}
            className="w-full py-4 bg-[#f5c518] text-black font-bold rounded-lg hover:bg-[#f5c518]/90 transition flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            Оценить игру
          </button>

          {/* Strong & Weak Sides */}
          {strongWeakSides && (strongWeakSides.strong.length > 0 || strongWeakSides.weak.length > 0) && (
            <div className="bg-[#141414] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Сильные и слабые стороны</h3>
              
              {strongWeakSides.strong.length > 0 && (
                <div className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-[#3bb33b] mb-2 uppercase tracking-wider flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    Плюсы
                  </div>
                  <div className="space-y-2">
                    {strongWeakSides.strong.map(item => (
                      <div key={item.key} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{item.label}</span>
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
                        <span className="text-gray-300">{item.label}</span>
                        <span className="font-bold text-[#ff4444]">{item.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score Summary */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Оценки</h3>
            <div className="flex justify-around items-center">
              <MetascoreBadge score={gameData.metascore} size="large" />
              <UserScoreBadge 
                score={gameData.userScore} 
                reviewCount={gameData.userReviews.total}
                size="large"
              />
            </div>
            <ReviewDistribution distribution={gameData.criticReviews} type="critic" />
            <ReviewDistribution distribution={gameData.userReviews} type="user" />
          </div>

          {/* Expectations Widget */}
          <ExpectationsWidget 
            contentId={Number(id)} 
            actualRating={gameData.userScore} 
          />

          {/* Info */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Информация</h3>
            <dl className="space-y-3 text-sm">
              {gameData.developer && (
                <div>
                  <dt className="text-gray-500">Разработчик</dt>
                  <dd className="text-gray-300 font-medium">{gameData.developer}</dd>
                </div>
              )}
              {gameData.publisher && (
                <div>
                  <dt className="text-gray-500">Издатель</dt>
                  <dd className="text-gray-300 font-medium">{gameData.publisher}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Дата выхода</dt>
                <dd className="text-gray-300 font-medium">{formatDate(gameData.releaseDate)}</dd>
              </div>
              {gameData.platforms.length > 0 && (
                <div>
                  <dt className="text-gray-500">Платформы</dt>
                  <dd className="text-gray-300 font-medium">{gameData.platforms.join(', ')}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Жанр</dt>
                <dd className="text-gray-300 font-medium">{gameData.genre.join(', ') || '—'}</dd>
              </div>
              {gameData.esrbRating && (
                <div>
                  <dt className="text-gray-500">Возрастной рейтинг</dt>
                  <dd className="text-gray-300 font-medium">{gameData.esrbRating}</dd>
                </div>
              )}
              {gameData.players && (
                <div>
                  <dt className="text-gray-500">Игроки</dt>
                  <dd className="text-gray-300 font-medium">{gameData.players}</dd>
                </div>
              )}
              {gameData.fileSize && (
                <div>
                  <dt className="text-gray-500">Размер</dt>
                  <dd className="text-gray-300 font-medium">{gameData.fileSize}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg max-w-lg w-full border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f5c518] to-[#d4a817] p-4">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-6 h-6 text-black" />
                <h3 className="text-xl font-bold text-black">Написать отзыв</h3>
              </div>
              <p className="text-black/70 text-sm mt-1">{content?.title}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-6">
              {/* Rating with Slider */}
              <div>
                <label className="block text-gray-400 mb-3">Ваша оценка</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className={`text-5xl font-bold ${
                      reviewForm.rating >= 7 ? 'text-[#66cc33]' :
                      reviewForm.rating >= 4 ? 'text-[#ffcc33]' : 'text-[#ff0000]'
                    }`}>
                      {reviewForm.rating}
                    </div>
                    <span className="text-2xl text-gray-500 ml-1">/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#f5c518]"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>👎 Ужасно</span>
                    <span>Средне</span>
                    <span>Шедевр 👍</span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-gray-400 mb-2">Текст отзыва</label>
                <textarea 
                  rows="5"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:border-[#f5c518] focus:outline-none transition resize-none"
                  required
                  placeholder="Поделитесь своими впечатлениями от игры..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Минимум 10 символов. Написано: {reviewForm.content.length}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
                <button 
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={reviewSubmitting || reviewForm.content.length < 10}
                  className="px-6 py-2.5 bg-[#f5c518] text-black font-bold rounded-lg hover:bg-[#f5c518]/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {reviewSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Публикация...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Опубликовать
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameDetail;
