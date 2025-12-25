import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Calendar, Star, Users, Globe, 
  Heart, Share2, Bookmark, ChevronDown, ChevronUp, 
  ThumbsUp, ThumbsDown, Tv, List, Clock
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MetascoreBadge from '../components/MetascoreBadge';
import UserScoreBadge from '../components/UserScoreBadge';
import ReviewDistribution from '../components/ReviewDistribution';
import CriticReviewCard from '../components/CriticReviewCard';
import ExpectationsWidget from '../components/ExpectationsWidget';

const SeriesDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSeason, setActiveSeason] = useState(1);
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
      plot: 'Сюжет',
      acting: 'Актёрская игра',
      pacing: 'Темп повествования',
      characters: 'Развитие персонажей',
      finale: 'Финал сезона'
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

  // Данные сериала из backend или пустые значения
  const seriesData = {
    id: content.id,
    title: content.title,
    originalTitle: content.original_title || '',
    year: content.release_year,
    endYear: content.end_year || null, // null если ещё идёт
    status: content.status || 'В производстве', // "Завершён", "В производстве", "Отменён"
    
    posterUrl: content.poster_url || 'https://placehold.co/300x450/1e293b/ffffff?text=No+Poster',
    coverUrl: content.cover_url || content.poster_url || 'https://placehold.co/1920x600/1e293b/ffffff?text=No+Cover',
    trailerUrl: content.trailer_url,
    
    metascore: content.critics_rating ? Math.round(content.critics_rating * 10) : 0,
    userScore: content.audience_rating || 0,
    
    // Сериальные данные
    totalSeasons: content.total_seasons || 0,
    totalEpisodes: content.total_episodes || 0,
    episodeDuration: content.episode_duration || 0, // в минутах
    seasons: content.seasons || [], // [{season_number, episode_count, release_date, overview}]
    
    network: content.network || '', // "Netflix", "HBO", "AMC"
    creator: content.creator || content.director || '',
    cast: content.cast || [],
    
    genre: content.genre ? (Array.isArray(content.genre) ? content.genre : [content.genre]) : [],
    country: content.country || '',
    language: content.language || '',
    ageRating: content.age_rating || content.esrb_rating || '',
    
    description: content.description || '',
    
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative -mx-4">
        <div className="h-[300px] md:h-[450px] relative overflow-hidden">
          <img
            src={seriesData.coverUrl}
            alt={seriesData.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={seriesData.posterUrl}
                  alt={seriesData.title}
                  className="w-32 md:w-48 rounded-lg shadow-2xl border border-gray-800"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                      <Tv className="w-3 h-3 inline mr-1" />
                      СЕРИАЛ
                    </span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      seriesData.status === 'Завершён' ? 'bg-gray-600 text-gray-200' :
                      seriesData.status === 'Отменён' ? 'bg-red-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {seriesData.status}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{seriesData.title}</h1>
                  {seriesData.originalTitle && (
                    <p className="text-gray-400 text-lg">{seriesData.originalTitle}</p>
                  )}
                  <div className="flex items-center gap-3 text-gray-400 mt-2">
                    <span>{seriesData.year}{seriesData.endYear ? ` - ${seriesData.endYear}` : ' - ...'}</span>
                    <span>•</span>
                    <span>{seriesData.genre.join(', ')}</span>
                    <span>•</span>
                    <span>{seriesData.ageRating}</span>
                  </div>
                </div>

                {/* Серии информация */}
                <div className="flex items-center gap-6 text-gray-300">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span>{seriesData.totalSeasons} сезонов</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    <span>{seriesData.totalEpisodes} эпизодов</span>
                  </div>
                  {seriesData.episodeDuration > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>~{seriesData.episodeDuration} мин/эпизод</span>
                    </div>
                  )}
                </div>

                {/* Метрики */}
                <div className="flex items-center gap-6">
                  <MetascoreBadge score={seriesData.metascore} size="large" />
                  <UserScoreBadge 
                    score={seriesData.userScore} 
                    reviewCount={seriesData.userReviews.total}
                    size="large"
                  />
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-wrap gap-3">
                  {seriesData.trailerUrl && (
                    <a 
                      href={seriesData.trailerUrl}
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
                    {isInWatchlist ? 'В списке' : 'Буду смотреть'}
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
          {['overview', 'seasons', 'reviews', 'cast'].map((tab) => (
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
              {tab === 'seasons' && `Сезоны (${seriesData.totalSeasons})`}
              {tab === 'reviews' && `Рецензии (${criticReviewsList.length + userReviewsList.length})`}
              {tab === 'cast' && 'Актёры'}
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
                <h2 className="text-2xl font-bold text-white">О сериале</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {seriesData.description || 'Описание будет добавлено позже.'}
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

          {/* Seasons Tab */}
          {activeTab === 'seasons' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Сезоны и эпизоды</h2>
              
              {seriesData.seasons && seriesData.seasons.length > 0 ? (
                <>
                  {/* Season selector */}
                  <div className="flex gap-2 flex-wrap">
                    {seriesData.seasons.map((season) => (
                      <button
                        key={season.season_number}
                        onClick={() => setActiveSeason(season.season_number)}
                        className={`px-4 py-2 rounded font-semibold transition ${
                          activeSeason === season.season_number
                            ? 'bg-[#f5c518] text-black'
                            : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'
                        }`}
                      >
                        Сезон {season.season_number}
                      </button>
                    ))}
                  </div>

                  {/* Season details */}
                  {seriesData.seasons
                    .filter(s => s.season_number === activeSeason)
                    .map((season) => (
                      <div key={season.season_number} className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">Сезон {season.season_number}</h3>
                          <span className="text-gray-400">
                            {season.episode_count} эпизодов
                          </span>
                        </div>
                        {season.release_date && (
                          <p className="text-gray-400 text-sm">
                            Дата выхода: {formatDate(season.release_date)}
                          </p>
                        )}
                        {season.overview && (
                          <p className="text-gray-300">{season.overview}</p>
                        )}
                      </div>
                    ))}
                </>
              ) : (
                <div className="bg-[#141414] border border-gray-800 rounded-lg p-8 text-center">
                  <Tv className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Информация о сезонах будет добавлена позже
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Всего: {seriesData.totalSeasons} сезонов, {seriesData.totalEpisodes} эпизодов
                  </p>
                </div>
              )}
            </div>
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
                <h2 className="text-2xl font-bold text-white">Отзывы пользователей</h2>
                
                {userReviewsList.length === 0 ? (
                  <p className="text-gray-400">Отзывов пока нет. Напишите первый!</p>
                ) : (
                  <div className="space-y-4">
                    {userReviewsList.map((review) => (
                      <div key={review.id} className="bg-[#1f1f1f] border border-[#2d2d2d] rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img src={review.userAvatar} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="text-white font-semibold">{review.userName}</p>
                              <p className="text-gray-500 text-sm">{formatDate(review.date)}</p>
                            </div>
                          </div>
                          {review.score && (
                            <div className="px-3 py-1 bg-black/30 rounded text-xl font-bold text-white">
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
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="w-full py-4 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 transition"
                >
                  Написать отзыв
                </button>
              </div>
            </>
          )}

          {/* Cast Tab */}
          {activeTab === 'cast' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Актёры и съёмочная группа</h2>
              
              {seriesData.creator && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Создатель</h3>
                  <p className="text-white">{seriesData.creator}</p>
                </div>
              )}

              {seriesData.cast && seriesData.cast.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seriesData.cast.map((actor, index) => (
                    <div key={index} className="bg-[#141414] border border-gray-800 rounded-lg p-4 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {typeof actor === 'string' ? actor : actor.name}
                      </p>
                      {typeof actor === 'object' && actor.role && (
                        <p className="text-gray-500 text-xs">{actor.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Информация об актёрах будет добавлена позже.</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
              <MetascoreBadge score={seriesData.metascore} size="large" />
              <UserScoreBadge 
                score={seriesData.userScore} 
                reviewCount={seriesData.userReviews.total}
                size="large"
              />
            </div>
            <ReviewDistribution distribution={seriesData.criticReviews} type="critic" />
            <ReviewDistribution distribution={seriesData.userReviews} type="user" />
          </div>

          {/* Expectations Widget */}
          <ExpectationsWidget 
            contentId={Number(id)} 
            actualRating={seriesData.userScore} 
          />

          {/* Info */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Информация</h3>
            <dl className="space-y-3 text-sm">
              {seriesData.network && (
                <div>
                  <dt className="text-gray-500">Канал / Платформа</dt>
                  <dd className="text-gray-300 font-medium">{seriesData.network}</dd>
                </div>
              )}
              {seriesData.creator && (
                <div>
                  <dt className="text-gray-500">Создатель</dt>
                  <dd className="text-gray-300 font-medium">{seriesData.creator}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Год выхода</dt>
                <dd className="text-gray-300 font-medium">
                  {seriesData.year}{seriesData.endYear ? ` - ${seriesData.endYear}` : ' - наст. время'}
                </dd>
              </div>
              {seriesData.country && (
                <div>
                  <dt className="text-gray-500">Страна</dt>
                  <dd className="text-gray-300 font-medium">{seriesData.country}</dd>
                </div>
              )}
              {seriesData.language && (
                <div>
                  <dt className="text-gray-500">Язык</dt>
                  <dd className="text-gray-300 font-medium">{seriesData.language}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Жанр</dt>
                <dd className="text-gray-300 font-medium">{seriesData.genre.join(', ') || '—'}</dd>
              </div>
              {seriesData.ageRating && (
                <div>
                  <dt className="text-gray-500">Возрастной рейтинг</dt>
                  <dd className="text-gray-300 font-medium">{seriesData.ageRating}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-lg w-full border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Написать отзыв</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Оценка (1-10)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Текст отзыва</label>
                <textarea 
                  rows="5"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-white"
                  required
                  placeholder="Поделитесь своими впечатлениями..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Публикация...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesDetail;
