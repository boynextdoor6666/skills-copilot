import React, { useEffect, useState } from 'react';
import { Calendar, Bell, Play, ExternalLink, Star } from 'lucide-react';
import MetascoreBadge from '../components/MetascoreBadge';
import axios from 'axios';

const ComingSoon = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, movies, series, games
  const [timeframe, setTimeframe] = useState('all'); // all, week, month, quarter, year
  const [watchlist, setWatchlist] = useState(new Set());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get('/api/content/coming-soon/active');
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load coming soon:', e);
        setError('Не удалось загрузить список предстоящих релизов');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Фильтрация по типу контента
  const filteredByType = items.filter(item => {
    const typeMap = { MOVIE: 'movie', TV_SERIES: 'series', GAME: 'game' };
    const thisType = typeMap[item.content_type] || 'movie';
    return activeTab === 'all' || thisType === activeTab.slice(0, -1);
  });

  // Фильтрация по времени
  const filteredReleases = filteredByType.filter(item => {
    if (timeframe === 'all') return true;
    
  const releaseDate = new Date(item.release_date);
    const now = new Date();
    const diffTime = releaseDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    switch (timeframe) {
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      case 'quarter':
        return diffDays <= 90;
      case 'year':
        return diffDays <= 365;
      default:
        return true;
    }
  });

  // Добавить/удалить из watchlist
  const toggleWatchlist = (id) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(id)) {
      newWatchlist.delete(id);
    } else {
      newWatchlist.add(id);
    }
    setWatchlist(newWatchlist);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Форматирование количества отслеживающих
  const formatWatchlistCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  // Дни до релиза
  const getDaysUntilRelease = (dateString) => {
    const releaseDate = new Date(dateString);
    const now = new Date();
    const diffTime = releaseDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-8">
      {/* Заголовок с градиентом */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 via-transparent to-accent-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent mb-3 flex items-center gap-4">
            <Calendar className="text-accent-400" size={32} />
            Скоро выйдет
          </h1>
          <p className="text-secondary-300 text-lg">
            Следите за предстоящими релизами и добавляйте их в watchlist
          </p>
        </div>
      </div>

      {/* Фильтры - modern design */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
        {/* Фильтр по типу */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 scale-105'
                : 'bg-black/40 border border-white/10 hover:bg-black/60 text-gray-300'
            }`}
          >
            Всё
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'movies'
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 scale-105'
                : 'bg-black/40 border border-white/10 hover:bg-black/60 text-gray-300'
            }`}
          >
            Фильмы
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'series'
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 scale-105'
                : 'bg-black/40 border border-white/10 hover:bg-black/60 text-gray-300'
            }`}
          >
            Сериалы
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 scale-105'
                : 'bg-black/40 border border-white/10 hover:bg-black/60 text-gray-300'
            }`}
          >
            Игры
          </button>
        </div>

        {/* Фильтр по времени - chips style */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          {['all', 'week', 'month', 'quarter', 'year'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                  : 'bg-black/20 text-gray-400 hover:text-gray-200 hover:bg-black/40 border border-white/5'
              }`}
            >
              {tf === 'all' ? 'Все даты' : tf === 'week' ? 'Эта неделя' : tf === 'month' ? 'Этот месяц' : tf === 'quarter' ? 'Этот квартал' : 'Этот год'}
            </button>
          ))}
        </div>
      </div>

      {/* Список релизов */}
      {loading ? (
        <div className="text-center py-12 text-secondary-400">Загрузка...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : (
      <div className="space-y-6">
        {filteredReleases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Нет предстоящих релизов в выбранном периоде
          </div>
        ) : (
          filteredReleases.map((item) => {
            const daysUntil = getDaysUntilRelease(item.release_date);
            const isInWatchlist = watchlist.has(item.id);

            return (
              <div
                key={item.id}
                className="professional-card overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Постер с эффектами */}
                  <div className="w-full md:w-56 flex-shrink-0 bg-primary-800 relative overflow-hidden">
                    <img
                      src={item.poster_url || 'https://placehold.co/300x450?text=Coming+Soon'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    {/* Expected Metascore */}
                    <div className="absolute top-4 left-4">
                      <MetascoreBadge score={item.expected_score ?? 0} size="small" />
                      <p className="text-[10px] text-center text-gray-300 mt-1.5 font-semibold bg-black/50 px-1.5 py-0.5 rounded">
                        прогноз
                      </p>
                    </div>
                    {/* Countdown badge */}
                    {daysUntil > 0 && daysUntil <= 30 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                        {daysUntil}д
                      </div>
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Информация */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-secondary-100 mb-2 group-hover:text-accent-400 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-accent-400 font-bold bg-accent-500/10 px-3 py-1.5 rounded-lg border border-accent-500/30">
                              <Calendar className="inline w-3.5 h-3.5 mr-1.5" />
                              {formatDate(item.release_date)}
                            </span>
                            {daysUntil > 0 && (
                              <span className="text-secondary-400 bg-primary-700 px-3 py-1.5 rounded-lg">
                                Через {daysUntil} {daysUntil === 1 ? 'день' : daysUntil < 5 ? 'дня' : 'дней'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Детали */}
                        <div className="flex flex-wrap gap-2 text-sm">
                            {item.content_type === 'GAME' && (
                            <>
                                {item.developer && <span className="text-secondary-300 bg-primary-700 px-3 py-1 rounded-lg">{item.developer}</span>}
                              <span className="text-secondary-500">•</span>
                                {Array.isArray(item.platforms) && <span className="text-secondary-400">{item.platforms.join(', ')}</span>}
                            </>
                          )}
                            {item.content_type === 'MOVIE' && (
                            <>
                                {item.director && <span className="text-secondary-300 bg-primary-700 px-3 py-1 rounded-lg">{item.director}</span>}
                              <span className="text-secondary-500">•</span>
                                {item.studio && <span className="text-secondary-400">{item.studio}</span>}
                            </>
                          )}
                            {item.content_type === 'TV_SERIES' && (
                            <>
                                {item.creator && <span className="text-secondary-300 bg-primary-700 px-3 py-1 rounded-lg">{item.creator}</span>}
                              <span className="text-secondary-500">•</span>
                                {item.network && <span className="text-secondary-400">{item.network}</span>}
                            </>
                          )}
                        </div>

                        {/* Описание */}
                        <p className="text-secondary-300 text-sm leading-relaxed">
                          {item.description}
                        </p>

                        {/* Watchlist статистика с иконкой */}
                        <div className="flex items-center gap-2 text-sm text-secondary-400 bg-primary-700/50 px-3 py-2 rounded-lg w-fit">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold text-secondary-200">
                            {formatWatchlistCount(item.watchlist_count || 0)}
                          </span>
                          <span>отслеживают</span>
                        </div>

                        {/* Кнопки действий - улучшенный дизайн */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => toggleWatchlist(item.id)}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                              isInWatchlist
                                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-green-500/30'
                                : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-accent-500/30 hover:scale-105'
                            }`}
                          >
                            <Bell className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                            {isInWatchlist ? 'В Watchlist' : 'Добавить в Watchlist'}
                          </button>

                          {item.trailer_url && (
                            <a
                              href={item.trailer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-lg font-semibold professional-card hover:border-accent-500 transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                              <Play className="w-4 h-4" />
                              Трейлер
                            </a>
                          )}

                          {item.screenshots?.length > 0 && (
                            <button className="px-5 py-2.5 rounded-lg font-semibold professional-card hover:border-accent-500 transition-all duration-300 hover:scale-105">
                              {item.screenshots.length} скриншотов
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};

export default ComingSoon;
