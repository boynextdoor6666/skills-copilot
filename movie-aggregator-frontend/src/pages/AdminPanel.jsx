import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, Film, MessageSquare, Activity, Server, Database, AlertCircle, CheckCircle, 
  TrendingUp, TrendingDown, Calendar, Monitor, Gamepad2, Tv
} from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users' | 'content' | 'hero-carousel' | 'coming-soon' | 'reviews' | 'achievements' | 'publications'

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Content management state
  const [contents, setContents] = useState([]);
  const [contentSearch, setContentSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    title: '', 
    content_type: 'MOVIE', 
    release_year: '', 
    genre: '', 
    description: '', 
    poster_url: '',
    trailer_url: '',
    // Movie/Series
    director: '',
    director_photo_url: '',
    cast: '',
    cast_photos: '', // comma-separated URLs
    runtime: '',
    // Game-specific
    developer: '',
    publisher: '',
    platforms: '', // comma-separated
    esrb_rating: '',
    players: '',
    file_size: '',
    technical_info: '' // JSON (optional)
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    title: '', 
    release_year: '', 
    genre: '', 
    description: '', 
    poster_url: '',
    trailer_url: '',
    // Movie/Series
    director: '',
    director_photo_url: '',
    cast: '',
    cast_photos: '',
    runtime: '',
    // Game-specific
    developer: '',
    publisher: '',
    platforms: '',
    esrb_rating: '',
    players: '',
    file_size: '',
    technical_info: ''
  });

  // Hero Carousel state
  const [heroItems, setHeroItems] = useState([]);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroCreateForm, setHeroCreateForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_image: '',
    call_to_action_text: '',
    call_to_action_link: '',
    content_id: '',
    display_order: 0,
    is_active: true,
  });
  const [heroEditingId, setHeroEditingId] = useState(null);
  const [heroEditForm, setHeroEditForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_image: '',
    call_to_action_text: '',
    call_to_action_link: '',
    content_id: '',
    display_order: 0,
    is_active: true,
  });

  // Coming Soon state
  const [comingItems, setComingItems] = useState([]);
  const [comingLoading, setComingLoading] = useState(false);
  const [comingCreateForm, setComingCreateForm] = useState({
    title: '',
    content_type: 'MOVIE',
    release_date: '',
    description: '',
    poster_url: '',
    trailer_url: '',
    expected_score: '',
    genre: '',
    developer: '',
    director: '',
    creator: '',
    studio: '',
    network: '',
    publisher: '',
    platforms: '', // comma-separated allowed
    screenshots: '', // comma-separated URLs
    is_active: true,
  });
  const [comingEditingId, setComingEditingId] = useState(null);
  const [comingEditForm, setComingEditForm] = useState({
    title: '',
    content_type: 'MOVIE',
    release_date: '',
    description: '',
    poster_url: '',
    trailer_url: '',
    expected_score: '',
    genre: '',
    developer: '',
    director: '',
    creator: '',
    studio: '',
    network: '',
    publisher: '',
    platforms: '',
    screenshots: '',
    is_active: true,
  });

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementCreateForm, setAchievementCreateForm] = useState({
    name: '',
    description: '',
    icon_name: '',
    xp_reward: 10,
    category: 'general',
  });
  const [achievementEditingId, setAchievementEditingId] = useState(null);
  const [achievementEditForm, setAchievementEditForm] = useState({
    name: '',
    description: '',
    icon_name: '',
    xp_reward: 10,
    category: 'general',
  });

  // Publications state
  const [publications, setPublications] = useState([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [publicationCreateForm, setPublicationCreateForm] = useState({
    name: '',
    logo_url: '',
    website: '',
    description: '',
  });
  const [publicationEditingId, setPublicationEditingId] = useState(null);
  const [publicationEditForm, setPublicationEditForm] = useState({
    name: '',
    logo_url: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users', { params: { role: filter || undefined } }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeroItems = async () => {
    setHeroLoading(true);
    try {
      const res = await axios.get('/api/content/hero-carousel/all');
      setHeroItems(res.data || []);
    } catch (e) {
      console.error('Failed to load hero carousel', e);
    } finally {
      setHeroLoading(false);
    }
  };

  const fetchComingItems = async () => {
    setComingLoading(true);
    try {
      const res = await axios.get('/api/content/coming-soon/all');
      setComingItems(res.data || []);
    } catch (e) {
      console.error('Failed to load coming soon items', e);
    } finally {
      setComingLoading(false);
    }
  };

  const fetchAchievements = async () => {
    setAchievementsLoading(true);
    try {
      const res = await axios.get('/api/gamification/all');
      setAchievements(res.data || []);
    } catch (e) {
      console.error('Failed to load achievements', e);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const fetchPublications = async () => {
    setPublicationsLoading(true);
    try {
      const res = await axios.get('/api/critics/publications/all');
      setPublications(res.data || []);
    } catch (e) {
      console.error('Failed to load publications', e);
    } finally {
      setPublicationsLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axios.get('/api/admin/reviews');
      setReviews(res.data || []);
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Удалить этот отзыв?')) return;
    try {
      await axios.delete(`/api/admin/reviews/${id}`);
      fetchReviews();
    } catch (e) {
      alert('Ошибка удаления отзыва');
    }
  };

  const fetchContents = async () => {
    setContentLoading(true);
    try {
      const params = {};
      if (contentTypeFilter) params.type = contentTypeFilter;
  const res = await axios.get('/api/content', { params });
      setContents(res.data || []);
    } catch (e) {
      console.error('Failed to load content list', e);
    } finally {
      setContentLoading(false);
    }
  };

  const handleBanUser = async (userId, currentStatus) => {
    if (!confirm(`Вы уверены, что хотите ${currentStatus ? 'забанить' : 'разбанить'} этого пользователя?`)) return;
    try {
      await axios.patch(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      fetchData();
    } catch (error) {
      alert('Ошибка при изменении статуса пользователя');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!confirm(`Изменить роль пользователя на ${newRole}?`)) return;
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (error) {
      alert('Ошибка при изменении роли пользователя');
    }
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    try {
      if (createForm.poster_url && createForm.poster_url.trim() && !/^https?:\/\//i.test(createForm.poster_url.trim())) {
        alert('Постер URL должен начинаться с http:// или https://');
        return;
      }
      const payload = {
        title: createForm.title,
        content_type: createForm.content_type,
        release_year: createForm.release_year ? Number(createForm.release_year) : undefined,
        genre: createForm.genre || undefined,
        description: createForm.description || undefined,
        poster_url: createForm.poster_url || undefined,
        trailer_url: createForm.trailer_url || undefined,
        // Movie/Series
        director: createForm.content_type !== 'GAME' ? (createForm.director || undefined) : undefined,
        director_photo_url: createForm.content_type !== 'GAME' ? (createForm.director_photo_url || undefined) : undefined,
        cast: createForm.content_type !== 'GAME' ? (createForm.cast || undefined) : undefined,
        cast_photos: createForm.content_type !== 'GAME' && createForm.cast_photos ? createForm.cast_photos.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        runtime: createForm.content_type !== 'GAME' && createForm.runtime ? Number(createForm.runtime) : undefined,
        // Game-specific
        developer: createForm.content_type === 'GAME' ? (createForm.developer || undefined) : undefined,
        publisher: createForm.content_type === 'GAME' ? (createForm.publisher || undefined) : undefined,
        platforms: createForm.content_type === 'GAME' ? (createForm.platforms || undefined) : undefined,
        esrb_rating: createForm.content_type === 'GAME' ? (createForm.esrb_rating || undefined) : undefined,
        players: createForm.content_type === 'GAME' ? (createForm.players || undefined) : undefined,
        file_size: createForm.content_type === 'GAME' ? (createForm.file_size || undefined) : undefined,
        technical_info: createForm.content_type === 'GAME' && createForm.technical_info ? (parseSafeJSON(createForm.technical_info)) : undefined,
      };
      await axios.post('/api/content', payload);
      setCreateForm({ 
        title: '', 
        content_type: 'MOVIE', 
        release_year: '', 
        genre: '', 
        description: '', 
        poster_url: '',
        trailer_url: '',
        director: '',
        director_photo_url: '',
        cast: '',
        cast_photos: '',
        runtime: '',
        developer: '',
        publisher: '',
        platforms: '',
        esrb_rating: '',
        players: '',
        file_size: '',
        technical_info: ''
      });
      fetchContents();
      alert('Контент добавлен');
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка добавления контента');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || '',
      release_year: item.release_year || '',
      genre: item.genre || '',
      description: item.description || '',
      poster_url: item.poster_url || '',
      trailer_url: item.trailer_url || '',
      // Movie/Series
      director: item.director || '',
      director_photo_url: item.director_photo_url || '',
      cast: item.cast || '',
      cast_photos: Array.isArray(item.cast_photos) ? item.cast_photos.join(', ') : (item.cast_photos || ''),
      runtime: item.runtime || '',
      // Game-specific
      developer: item.developer || '',
      publisher: item.publisher || '',
      platforms: Array.isArray(item.platforms) ? item.platforms.join(', ') : (item.platforms || ''),
      esrb_rating: item.esrb_rating || '',
      players: item.players || '',
      file_size: item.file_size || '',
      technical_info: item.technical_info ? JSON.stringify(item.technical_info, null, 2) : ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ 
      title: '', release_year: '', genre: '', description: '', poster_url: '', trailer_url: '',
      director: '', cast: '', runtime: '', developer: '', publisher: '', platforms: '', esrb_rating: '',
      players: '', file_size: '', technical_info: ''
    });
  };

  const handleUpdateContent = async (id) => {
    try {
      if (editForm.poster_url && editForm.poster_url.trim() && !/^https?:\/\//i.test(editForm.poster_url.trim())) {
        alert('Постер URL должен начинаться с http:// или https://');
        return;
      }
      const payload = {
        title: editForm.title,
        release_year: editForm.release_year ? Number(editForm.release_year) : null,
        genre: editForm.genre,
        description: editForm.description,
        poster_url: editForm.poster_url,
        trailer_url: editForm.trailer_url,
        // Movie/Series
        director: editForm.director,
        director_photo_url: editForm.director_photo_url,
        cast: editForm.cast,
        cast_photos: editForm.cast_photos ? editForm.cast_photos.split(',').map(s=>s.trim()).filter(Boolean) : [],
        runtime: editForm.runtime ? Number(editForm.runtime) : null,
        // Game-specific
        developer: editForm.developer,
        publisher: editForm.publisher,
        platforms: editForm.platforms ? (Array.isArray(editForm.platforms) ? editForm.platforms : editForm.platforms.split(',').map(s=>s.trim()).filter(Boolean)) : [],
        esrb_rating: editForm.esrb_rating,
        players: editForm.players,
        file_size: editForm.file_size,
        technical_info: editForm.technical_info ? parseSafeJSON(editForm.technical_info) : null,
      };
      await axios.put(`/api/content/${id}`, payload);
      cancelEdit();
      fetchContents();
      alert('Контент обновлён');
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка обновления контента');
    }
  };

  const handleDeleteContent = async (id) => {
    if (!confirm('Удалить этот контент?')) return;
    try {
  await axios.delete(`/api/content/${id}`);
      fetchContents();
    } catch (e) {
      alert('Ошибка удаления');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('ВНИМАНИЕ! Это навсегда удалит пользователя и все его данные. Продолжить?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchData();
    } catch (error) {
      alert('Ошибка при удалении пользователя');
    }
  };

  // Achievement handlers
  const handleCreateAchievement = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/gamification', achievementCreateForm);
      setAchievementCreateForm({ name: '', description: '', icon_name: '', xp_reward: 10, category: 'general' });
      fetchAchievements();
      alert('Достижение создано');
    } catch (e) {
      alert('Ошибка создания достижения');
    }
  };

  const handleUpdateAchievement = async (id) => {
    try {
      await axios.put(`/api/gamification/${id}`, achievementEditForm);
      setAchievementEditingId(null);
      fetchAchievements();
      alert('Достижение обновлено');
    } catch (e) {
      alert('Ошибка обновления достижения');
    }
  };

  const handleDeleteAchievement = async (id) => {
    if (!confirm('Удалить достижение?')) return;
    try {
      await axios.delete(`/api/gamification/${id}`);
      fetchAchievements();
    } catch (e) {
      alert('Ошибка удаления достижения');
    }
  };

  // Publication handlers
  const handleCreatePublication = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/critics/publications', publicationCreateForm);
      setPublicationCreateForm({ name: '', logo_url: '', website: '', description: '' });
      fetchPublications();
      alert('Издание создано');
    } catch (e) {
      alert('Ошибка создания издания');
    }
  };

  const handleUpdatePublication = async (id) => {
    try {
      await axios.put(`/api/critics/publications/${id}`, publicationEditForm);
      setPublicationEditingId(null);
      fetchPublications();
      alert('Издание обновлено');
    } catch (e) {
      alert('Ошибка обновления издания');
    }
  };

  const handleDeletePublication = async (id) => {
    if (!confirm('Удалить издание?')) return;
    try {
      await axios.delete(`/api/critics/publications/${id}`);
      fetchPublications();
    } catch (e) {
      alert('Ошибка удаления издания');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-primary-900 text-secondary-300">Загрузка...</div>;

  function parseSafeJSON(txt) {
    try {
      return JSON.parse(txt);
    } catch { return undefined; }
  }

  return (
    <div className="min-h-screen bg-primary-900 text-secondary-300 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-secondary-100">Панель администратора</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded ${activeTab==='dashboard'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Дашборд</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab==='users'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Пользователи</button>
          <button onClick={() => { setActiveTab('content'); fetchContents(); }} className={`px-4 py-2 rounded ${activeTab==='content'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Контент</button>
          <button onClick={() => { setActiveTab('hero-carousel'); setTimeout(() => { fetchHeroItems(); fetchContents(); }, 10); }} className={`px-4 py-2 rounded ${activeTab==='hero-carousel'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Hero Карусель</button>
          <button onClick={() => { setActiveTab('coming-soon'); setTimeout(fetchComingItems, 10); }} className={`px-4 py-2 rounded ${activeTab==='coming-soon'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Скоро выйдет</button>
          <button onClick={() => { setActiveTab('reviews'); setTimeout(fetchReviews, 10); }} className={`px-4 py-2 rounded ${activeTab==='reviews'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Отзывы</button>
          <button onClick={() => { setActiveTab('achievements'); setTimeout(fetchAchievements, 10); }} className={`px-4 py-2 rounded ${activeTab==='achievements'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Достижения</button>
          <button onClick={() => { setActiveTab('publications'); setTimeout(fetchPublications, 10); }} className={`px-4 py-2 rounded ${activeTab==='publications'?'bg-accent-500 text-white':'bg-primary-800 text-secondary-200 hover:bg-primary-700'}`}>Издания</button>
        </div>

        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Users */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-secondary-400 text-sm mb-1">Пользователи</div>
                    <div className="text-3xl font-bold text-secondary-100">{stats.users?.total || 0}</div>
                    <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <Activity size={12} /> {stats.users?.active || 0} активных
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    <Users size={24} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-secondary-400 text-sm mb-1">Контент</div>
                    <div className="text-3xl font-bold text-secondary-100">{stats.content?.total || 0}</div>
                    <div className="text-xs text-secondary-400 mt-1">
                      Фильмы, сериалы, игры
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <Film size={24} />
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-secondary-400 text-sm mb-1">Рецензии</div>
                    <div className="text-3xl font-bold text-secondary-100">{stats.reviews?.total || 0}</div>
                    <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      ⭐ {stats.reviews?.avgRating || 0} ср. оценка
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
                    <MessageSquare size={24} />
                  </div>
                </div>
              </div>

              {/* System */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-secondary-400 text-sm mb-1">Система</div>
                    <div className="text-lg font-bold text-green-400 flex items-center gap-2">
                      <CheckCircle size={18} /> Stable
                    </div>
                    <div className="text-xs text-secondary-400 mt-1">
                      v{stats.system?.version || '1.0.0'}
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                    <Server size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Chart */}
              <div className="lg:col-span-2 bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-lg font-bold text-secondary-100 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-accent-500" />
                  Активность рецензий (7 дней)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.reviews?.activity || []}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                        itemStyle={{ color: '#a78bfa' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" name="Отзывы" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Content Distribution */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-lg font-bold text-secondary-100 mb-6 flex items-center gap-2">
                  <Database size={20} className="text-accent-500" />
                  Распределение контента
                </h3>
                <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Фильмы', value: stats.content?.byType?.movies || 0, color: '#3b82f6' },
                          { name: 'Сериалы', value: stats.content?.byType?.series || 0, color: '#10b981' },
                          { name: 'Игры', value: stats.content?.byType?.games || 0, color: '#f59e0b' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Фильмы', value: stats.content?.byType?.movies || 0, color: '#3b82f6' },
                          { name: 'Сериалы', value: stats.content?.byType?.series || 0, color: '#10b981' },
                          { name: 'Игры', value: stats.content?.byType?.games || 0, color: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                    <div className="text-2xl font-bold text-secondary-100">{stats.content?.total || 0}</div>
                    <div className="text-xs text-secondary-400">Всего</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. System & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-lg font-bold text-secondary-100 mb-4 flex items-center gap-2">
                  <Server size={20} className="text-accent-500" />
                  Статус сервисов
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-dark-900 rounded border border-dark-600">
                    <div className="flex items-center gap-3">
                      <Database size={18} className="text-blue-400" />
                      <span className="text-secondary-200">База данных (MySQL)</span>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-900 rounded border border-dark-600">
                    <div className="flex items-center gap-3">
                      <Film size={18} className="text-cyan-400" />
                      <span className="text-secondary-200">TMDB API</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${stats.system?.tmdb === 'configured' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {stats.system?.tmdb === 'configured' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {stats.system?.tmdb === 'configured' ? 'Active' : 'Missing Key'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-900 rounded border border-dark-600">
                    <div className="flex items-center gap-3">
                      <Gamepad2 size={18} className="text-purple-400" />
                      <span className="text-secondary-200">IGDB API</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${stats.system?.igdb === 'configured' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {stats.system?.igdb === 'configured' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {stats.system?.igdb === 'configured' ? 'Active' : 'Missing Keys'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions (Existing but styled) */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h3 className="text-lg font-bold text-secondary-100 mb-4">Быстрые действия</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('content')} className="p-4 bg-dark-900 rounded border border-dark-600 hover:border-accent-500 transition-colors text-left group">
                    <div className="text-accent-500 mb-2 text-2xl group-hover:scale-110 transition-transform">🎬</div>
                    <div className="font-semibold text-secondary-100">Добавить контент</div>
                    <div className="text-xs text-secondary-400">Фильмы, сериалы, игры</div>
                  </button>
                  <button onClick={() => setActiveTab('users')} className="p-4 bg-dark-900 rounded border border-dark-600 hover:border-accent-500 transition-colors text-left group">
                    <div className="text-accent-500 mb-2 text-2xl group-hover:scale-110 transition-transform">👥</div>
                    <div className="font-semibold text-secondary-100">Пользователи</div>
                    <div className="text-xs text-secondary-400">Модерация и роли</div>
                  </button>
                  <button onClick={() => setActiveTab('reviews')} className="p-4 bg-dark-900 rounded border border-dark-600 hover:border-accent-500 transition-colors text-left group">
                    <div className="text-accent-500 mb-2 text-2xl group-hover:scale-110 transition-transform">💬</div>
                    <div className="font-semibold text-secondary-100">Отзывы</div>
                    <div className="text-xs text-secondary-400">Проверка рецензий</div>
                  </button>
                  <button onClick={() => setActiveTab('coming-soon')} className="p-4 bg-dark-900 rounded border border-dark-600 hover:border-accent-500 transition-colors text-left group">
                    <div className="text-accent-500 mb-2 text-2xl group-hover:scale-110 transition-transform">📅</div>
                    <div className="font-semibold text-secondary-100">Скоро выйдет</div>
                    <div className="text-xs text-secondary-400">Управление релизами</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Recent Users Table (Existing) */}
            <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
              <h3 className="text-lg font-bold mb-4 text-secondary-100">Последние регистрации</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-dark-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Пользователь</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Email</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-secondary-400 uppercase">Роль</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {users.slice(0, 5).map(u => (
                      <tr key={u.id} className="hover:bg-dark-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-secondary-100 font-medium">{u.username}</td>
                        <td className="px-4 py-3 text-sm text-secondary-400">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'ADMIN' ? 'bg-red-900/30 text-red-400' : u.role === 'CRITIC' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
        <>
        {/* Filters */}
        <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 mb-6">
          <label className="block text-sm font-medium mb-2">Фильтр по роли</label>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setTimeout(fetchData, 100); }}
            className="px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-secondary-100"
          >
            <option value="">Все пользователи</option>
            <option value="USER">Зрители</option>
            <option value="CRITIC">Критики</option>
            <option value="ADMIN">Администраторы</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Репутация</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-dark-800 divide-y divide-dark-700">
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? 'bg-red-950/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-200">{u.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-secondary-100">{u.username}</div>
                    <div className="text-xs text-secondary-500">{u.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-200">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="text-sm bg-dark-900 border border-dark-600 rounded px-2 py-1 text-secondary-100"
                      disabled={u.id === user.id}
                    >
                      <option value="USER">Зритель</option>
                      <option value="CRITIC">Критик</option>
                      <option value="ADMIN">Админ</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-200">{u.reputation}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full border ${u.isActive ? 'border-green-600 text-green-300 bg-green-900/20' : 'border-red-600 text-red-300 bg-red-900/20'}`}>
                      {u.isActive ? 'Активен' : 'Забанен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleBanUser(u.id, u.isActive)}
                      disabled={u.id === user.id}
                      className={`px-3 py-1 rounded ${u.isActive ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white'} disabled:opacity-50`}
                    >
                      {u.isActive ? 'Бан' : 'Разбан'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === user.id}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}

        {activeTab === 'content' && (
        <>
          {/* Content Filters + Create Form */}
          <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Фильтр по типу</label>
                <select value={contentTypeFilter} onChange={(e)=>{ setContentTypeFilter(e.target.value); setTimeout(fetchContents, 50); }} className="px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100">
                  <option value="">Все</option>
                  <option value="MOVIE">Фильмы</option>
                  <option value="TV_SERIES">Сериалы</option>
                  <option value="GAME">Игры</option>
                </select>
              </div>
              <div className="w-full md:w-80">
                <label className="block text-sm font-medium mb-1">Поиск по названию</label>
                <input
                  value={contentSearch}
                  onChange={(e)=>setContentSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100"
                  placeholder="Начните вводить..."
                />
              </div>
              <form onSubmit={handleCreateContent} className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Название *</label>
                    <input value={createForm.title} onChange={(e)=>setCreateForm({...createForm,title:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Тип *</label>
                    <select value={createForm.content_type} onChange={(e)=>setCreateForm({...createForm,content_type:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100">
                      <option value="MOVIE">Фильм</option>
                      <option value="TV_SERIES">Сериал</option>
                      <option value="GAME">Игра</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Год</label>
                    <input type="number" value={createForm.release_year} onChange={(e)=>setCreateForm({...createForm,release_year:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="2025" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Жанр</label>
                    <input value={createForm.genre} onChange={(e)=>setCreateForm({...createForm,genre:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="Action" />
                  </div>
                  {createForm.content_type !== 'GAME' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Режиссёр</label>
                        <input value={createForm.director} onChange={(e)=>setCreateForm({...createForm,director:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Длительность (мин)</label>
                        <input type="number" value={createForm.runtime} onChange={(e)=>setCreateForm({...createForm,runtime:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="120" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Разработчик</label>
                        <input value={createForm.developer} onChange={(e)=>setCreateForm({...createForm,developer:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Издатель</label>
                        <input value={createForm.publisher} onChange={(e)=>setCreateForm({...createForm,publisher:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Постер URL</label>
                    <input value={createForm.poster_url} onChange={(e)=>setCreateForm({...createForm,poster_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Трейлер URL (YouTube)</label>
                    <input value={createForm.trailer_url} onChange={(e)=>setCreateForm({...createForm,trailer_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </div>
                
                {createForm.content_type !== 'GAME' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Актёрский состав (через запятую)</label>
                    <input value={createForm.cast} onChange={(e)=>setCreateForm({...createForm,cast:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="Actor 1, Actor 2, Actor 3" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {createForm.content_type !== 'GAME' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Фото режиссёра (URL)</label>
                      <input value={createForm.director_photo_url} onChange={(e)=>setCreateForm({...createForm,director_photo_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://..." />
                      {createForm.director_photo_url && (
                        <div className="mt-2">
                          <img src={createForm.director_photo_url} alt="Director Preview" className="w-12 h-12 rounded-full object-cover border border-dark-600" onError={(e)=>e.target.style.display='none'} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Фото актёров (через запятую)</label>
                      <input value={createForm.cast_photos} onChange={(e)=>setCreateForm({...createForm,cast_photos:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://img1.jpg, https://img2.jpg" />
                      {createForm.cast_photos && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {createForm.cast_photos.split(',').map((url, idx) => url.trim() && (
                            <img key={idx} src={url.trim()} alt="Cast Preview" className="w-10 h-10 rounded-full object-cover border border-dark-600" onError={(e)=>e.target.style.display='none'} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                    <div>
                      <label className="block text-sm font-medium mb-1">Платформы (через запятую)</label>
                      <input value={createForm.platforms} onChange={(e)=>setCreateForm({...createForm,platforms:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="PS5, Xbox Series X" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Рейтинг ESRB</label>
                      <input value={createForm.esrb_rating} onChange={(e)=>setCreateForm({...createForm,esrb_rating:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="M (17+)" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Игроки</label>
                      <input value={createForm.players} onChange={(e)=>setCreateForm({...createForm,players:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="1-30 Online" />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea value={createForm.description} onChange={(e)=>setCreateForm({...createForm,description:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" rows={3} />
                </div>

                {createForm.content_type === 'GAME' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Размер файла</label>
                      <input value={createForm.file_size} onChange={(e)=>setCreateForm({...createForm,file_size:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="150 GB" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Техническая информация (JSON)</label>
                      <textarea value={createForm.technical_info} onChange={(e)=>setCreateForm({...createForm,technical_info:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" rows={3} placeholder='{"systemRequirements": {"minimum": {...}, "recommended": {...}}}' />
                      <div className="text-xs mt-1">
                        {(() => { try { JSON.parse(createForm.technical_info || '{}'); return <span className="text-green-400">JSON валиден</span>; } catch { return <span className="text-red-400">Некорректный JSON</span>; } })()}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <button type="submit" className="px-6 py-2 bg-imdb hover:bg-imdb/90 text-dark-900 font-semibold rounded transition-colors">
                    ➕ Добавить контент
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Edit Form (full) */}
          {editingId && (
            <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-secondary-100 font-semibold">Редактирование контента #{editingId}</h3>
                <button onClick={cancelEdit} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Закрыть</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input value={editForm.title} onChange={(e)=>setEditForm({...editForm,title:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Год</label>
                  <input type="number" value={editForm.release_year} onChange={(e)=>setEditForm({...editForm,release_year:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Жанр</label>
                  <input value={editForm.genre} onChange={(e)=>setEditForm({...editForm,genre:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Постер URL</label>
                  <input value={editForm.poster_url} onChange={(e)=>setEditForm({...editForm,poster_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Трейлер URL</label>
                  <input value={editForm.trailer_url} onChange={(e)=>setEditForm({...editForm,trailer_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
              </div>

              {/* Movie/Series fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Режиссёр</label>
                  <input value={editForm.director} onChange={(e)=>setEditForm({...editForm,director:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Длительность (мин)</label>
                  <input type="number" value={editForm.runtime} onChange={(e)=>setEditForm({...editForm,runtime:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Актёрский состав</label>
                  <input value={editForm.cast} onChange={(e)=>setEditForm({...editForm,cast:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
              </div>

              {/* Director/Actors photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Фото режиссёра (URL)</label>
                  <input value={editForm.director_photo_url} onChange={(e)=>setEditForm({...editForm,director_photo_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                  {editForm.director_photo_url && (
                    <div className="mt-2">
                      <img src={editForm.director_photo_url} alt="Director Preview" className="w-12 h-12 rounded-full object-cover border border-dark-600" onError={(e)=>e.target.style.display='none'} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Фото актёров (через запятую)</label>
                  <input value={editForm.cast_photos} onChange={(e)=>setEditForm({...editForm,cast_photos:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://img1.jpg, https://img2.jpg" />
                  {editForm.cast_photos && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editForm.cast_photos.split(',').map((url, idx) => url.trim() && (
                        <img key={idx} src={url.trim()} alt="Cast Preview" className="w-10 h-10 rounded-full object-cover border border-dark-600" onError={(e)=>e.target.style.display='none'} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Game fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Разработчик</label>
                  <input value={editForm.developer} onChange={(e)=>setEditForm({...editForm,developer:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Издатель</label>
                  <input value={editForm.publisher} onChange={(e)=>setEditForm({...editForm,publisher:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Платформы</label>
                  <input value={editForm.platforms} onChange={(e)=>setEditForm({...editForm,platforms:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="PS5, Xbox Series X" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">ESRB</label>
                  <input value={editForm.esrb_rating} onChange={(e)=>setEditForm({...editForm,esrb_rating:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Игроки</label>
                  <input value={editForm.players} onChange={(e)=>setEditForm({...editForm,players:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Размер файла</label>
                  <input value={editForm.file_size} onChange={(e)=>setEditForm({...editForm,file_size:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="150 GB" />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Техническая информация (JSON)</label>
                <textarea value={editForm.technical_info} onChange={(e)=>setEditForm({...editForm,technical_info:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" rows={3} />
                <div className="text-xs mt-1">
                  {(() => { try { JSON.parse(editForm.technical_info || '{}'); return <span className="text-green-400">JSON валиден</span>; } catch { return <span className="text-red-400">Некорректный JSON</span>; } })()}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={()=>handleUpdateContent(editingId)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Сохранить</button>
                <button onClick={cancelEdit} className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded">Отмена</button>
              </div>
            </div>
          )}

          {/* Content List */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
            <table className="min-w-full divide-y divide-dark-700">
              <thead className="bg-dark-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Постер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Год</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Жанр</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Рейтинг</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-dark-800 divide-y divide-dark-700">
                {contentLoading ? (
                  <tr><td className="px-4 py-3 text-secondary-300" colSpan={6}>Загрузка...</td></tr>
                ) : contents.length === 0 ? (
                  <tr><td className="px-4 py-3 text-secondary-300" colSpan={6}>Пусто</td></tr>
                ) : contents
                  .filter((c) => !contentSearch || String(c.title || '').toLowerCase().includes(contentSearch.toLowerCase()))
                  .map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      {c.poster_url ? (
                        <img src={c.poster_url} alt={c.title} className="w-10 h-14 object-cover rounded border border-dark-700" onError={(e)=>{e.currentTarget.src='https://placehold.co/60x84/1e293b/666?text=No';}} />
                      ) : (
                        <div className="w-10 h-14 bg-dark-900 rounded border border-dark-700" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-200">{c.id}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <input className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" value={editForm.title} onChange={(e)=>setEditForm({...editForm,title:e.target.value})} />
                      ) : (
                        <div className="font-medium text-secondary-100">{c.title}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-300">{c.content_type}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <input className="w-24 px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" value={editForm.release_year} onChange={(e)=>setEditForm({...editForm,release_year:e.target.value})} />
                      ) : (
                        <span className="text-sm text-secondary-300">{c.release_year || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <input className="w-40 px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" value={editForm.genre} onChange={(e)=>setEditForm({...editForm,genre:e.target.value})} />
                      ) : (
                        <span className="text-sm text-secondary-300">{c.genre || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-300">{Number(c.avg_rating || 0).toFixed(1)}</td>
                    <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                      {editingId === c.id ? (
                        <>
                          <button onClick={()=>handleUpdateContent(c.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded">Сохранить</button>
                          <button onClick={cancelEdit} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded">Отмена</button>
                        </>
                      ) : (
                        <>
                          <a
                            href={`/${c.content_type === 'GAME' ? 'game' : c.content_type === 'TV_SERIES' ? 'series' : 'movie'}/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-secondary-700 hover:bg-secondary-600 text-secondary-100 rounded"
                          >Открыть</a>
                          <button onClick={()=>startEdit(c)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Редактировать</button>
                          <button onClick={()=>handleDeleteContent(c.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

        {/* HERO CAROUSEL TAB */}
        {activeTab === 'hero-carousel' && (
          <div className="bg-primary-800 p-6 rounded-lg border border-primary-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-100">Hero Carousel Management</h2>
              <div className="flex gap-2">
                <button onClick={fetchHeroItems} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Обновить</button>
              </div>
            </div>

            {/* Create form */}
            <div className="bg-primary-900 p-4 rounded-lg border border-primary-700 mb-6">
              <h3 className="text-secondary-200 font-semibold mb-3">Добавить слайд</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-secondary-400">Заголовок *</label>
                  <input value={heroCreateForm.title} onChange={(e)=>setHeroCreateForm({...heroCreateForm, title:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Подзаголовок</label>
                  <input value={heroCreateForm.subtitle} onChange={(e)=>setHeroCreateForm({...heroCreateForm, subtitle:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Content ID (опц.)</label>
                  <select
                    value={heroCreateForm.content_id}
                    onChange={(e)=>setHeroCreateForm({...heroCreateForm, content_id:e.target.value})}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100"
                  >
                    <option value="">-- Без привязки --</option>
                    {contents.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.release_year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary-400">Описание</label>
                  <input value={heroCreateForm.description} onChange={(e)=>setHeroCreateForm({...heroCreateForm, description:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Порядок</label>
                  <input type="number" value={heroCreateForm.display_order} onChange={(e)=>setHeroCreateForm({...heroCreateForm, display_order:Number(e.target.value)||0})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary-400">Фоновое изображение (URL)</label>
                  <input value={heroCreateForm.background_image} onChange={(e)=>setHeroCreateForm({...heroCreateForm, background_image:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://..." />
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-sm text-secondary-400 flex items-center gap-2">
                    <input type="checkbox" checked={heroCreateForm.is_active} onChange={(e)=>setHeroCreateForm({...heroCreateForm, is_active:e.target.checked})} />
                    Активен
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-sm text-secondary-400">Текст кнопки</label>
                  <input value={heroCreateForm.call_to_action_text} onChange={(e)=>setHeroCreateForm({...heroCreateForm, call_to_action_text:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="Подробнее" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary-400">Ссылка кнопки</label>
                  <input value={heroCreateForm.call_to_action_link} onChange={(e)=>setHeroCreateForm({...heroCreateForm, call_to_action_link:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="/movie/1 или https://..." />
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={async ()=>{
                    try {
                      const payload = {
                        ...heroCreateForm,
                        content_id: heroCreateForm.content_id? Number(heroCreateForm.content_id): null,
                      };
                      await axios.post('/api/content/hero-carousel', payload);
                      setHeroCreateForm({ title:'', subtitle:'', description:'', background_image:'', call_to_action_text:'', call_to_action_link:'', content_id:'', display_order:0, is_active:true });
                      fetchHeroItems();
                    } catch (e) { alert(e.response?.data?.message || 'Не удалось добавить слайд'); }
                  }}
                  className="px-4 py-2 bg-imdb hover:bg-imdb/90 text-dark-900 rounded font-semibold"
                >Добавить слайд</button>
              </div>
            </div>

            {/* List */}
            <div className="bg-primary-900 rounded-lg border border-primary-700 overflow-hidden">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Заголовок</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Порядок</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Активен</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {heroLoading ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={5}>Загрузка...</td></tr>
                  ) : heroItems.length === 0 ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={5}>Пусто</td></tr>
                  ) : heroItems.sort((a,b)=> (a.display_order||0)-(b.display_order||0)).map((item)=> (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-secondary-200">{item.id}</td>
                      <td className="px-4 py-3">
                        {heroEditingId===item.id ? (
                          <input value={heroEditForm.title} onChange={(e)=>setHeroEditForm({...heroEditForm, title:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                        ) : (
                          <div className="font-medium text-secondary-100">{item.title}</div>
                        )}
                        <div className="text-xs text-secondary-500 truncate max-w-xs">{item.background_image}</div>
                      </td>
                      <td className="px-4 py-3">
                        {heroEditingId===item.id ? (
                          <input type="number" value={heroEditForm.display_order} onChange={(e)=>setHeroEditForm({...heroEditForm, display_order: Number(e.target.value)||0})} className="w-24 px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                        ) : (
                          <span className="text-sm text-secondary-300">{item.display_order||0}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {heroEditingId===item.id ? (
                          <input type="checkbox" checked={!!heroEditForm.is_active} onChange={(e)=>setHeroEditForm({...heroEditForm, is_active:e.target.checked})} />
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full border ${item.is_active? 'border-green-600 text-green-300 bg-green-900/20':'border-red-600 text-red-300 bg-red-900/20'}`}>{item.is_active? 'Да':'Нет'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {heroEditingId===item.id ? (
                          <>
                            <button onClick={async ()=>{ try{ await axios.put(`/api/content/hero-carousel/${item.id}`, { ...heroEditForm, content_id: heroEditForm.content_id? Number(heroEditForm.content_id): null }); setHeroEditingId(null); fetchHeroItems(); } catch(e){ alert('Не удалось сохранить'); } }} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded">Сохранить</button>
                            <button onClick={()=>setHeroEditingId(null)} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded">Отмена</button>
                          </>
                        ) : (
                          <>
                            <button onClick={()=>{ setHeroEditingId(item.id); setHeroEditForm({ title:item.title||'', subtitle:item.subtitle||'', description:item.description||'', background_image:item.background_image||'', call_to_action_text:item.call_to_action_text||'', call_to_action_link:item.call_to_action_link||'', content_id:item.content_id||'', display_order:item.display_order||0, is_active: !!item.is_active }); }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Редактировать</button>
                            <button onClick={async ()=>{ if(!confirm('Удалить слайд?')) return; try{ await axios.delete(`/api/content/hero-carousel/${item.id}`); fetchHeroItems(); } catch(e){ alert('Не удалось удалить'); } }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Удалить</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Auto-load on open */}
            <div className="hidden">{activeTab==='hero-carousel' && !heroLoading && heroItems.length===0 ? null : null}</div>
          </div>
        )}

        {/* COMING SOON TAB */}
        {activeTab === 'coming-soon' && (
          <div className="bg-primary-800 p-6 rounded-lg border border-primary-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-100">Coming Soon Management</h2>
              <div className="flex gap-2">
                <button onClick={fetchComingItems} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Обновить</button>
              </div>
            </div>

            {/* Create form */}
            <div className="bg-primary-900 p-4 rounded-lg border border-primary-700 mb-6">
              <h3 className="text-secondary-200 font-semibold mb-3">Добавить элемент</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary-400">Название *</label>
                  <input value={comingCreateForm.title} onChange={(e)=>setComingCreateForm({...comingCreateForm, title:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Тип *</label>
                  <select value={comingCreateForm.content_type} onChange={(e)=>setComingCreateForm({...comingCreateForm, content_type:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100">
                    <option value="MOVIE">Фильм</option>
                    <option value="TV_SERIES">Сериал</option>
                    <option value="GAME">Игра</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Дата релиза *</label>
                  <input type="date" value={comingCreateForm.release_date} onChange={(e)=>setComingCreateForm({...comingCreateForm, release_date:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary-400">Описание</label>
                  <input value={comingCreateForm.description} onChange={(e)=>setComingCreateForm({...comingCreateForm, description:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Постер URL</label>
                  <input value={comingCreateForm.poster_url} onChange={(e)=>setComingCreateForm({...comingCreateForm, poster_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Трейлер URL</label>
                  <input value={comingCreateForm.trailer_url} onChange={(e)=>setComingCreateForm({...comingCreateForm, trailer_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://youtube.com/..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="text-sm text-secondary-400">Ожидаемый счёт</label>
                  <input type="number" value={comingCreateForm.expected_score} onChange={(e)=>setComingCreateForm({...comingCreateForm, expected_score:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="90" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Жанр</label>
                  <input value={comingCreateForm.genre} onChange={(e)=>setComingCreateForm({...comingCreateForm, genre:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Платформы (через запятую)</label>
                  <input value={comingCreateForm.platforms} onChange={(e)=>setComingCreateForm({...comingCreateForm, platforms:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="PS5, Xbox Series X, PC" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-sm text-secondary-400 flex items-center gap-2">
                    <input type="checkbox" checked={comingCreateForm.is_active} onChange={(e)=>setComingCreateForm({...comingCreateForm, is_active:e.target.checked})} />
                    Активен
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="text-sm text-secondary-400">Режиссёр (фильм)</label>
                  <input value={comingCreateForm.director} onChange={(e)=>setComingCreateForm({...comingCreateForm, director:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Создатель (сериал)</label>
                  <input value={comingCreateForm.creator} onChange={(e)=>setComingCreateForm({...comingCreateForm, creator:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Студия/Сеть</label>
                  <input value={comingCreateForm.studio} onChange={(e)=>setComingCreateForm({...comingCreateForm, studio:e.target.value})} placeholder="Studio" className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="text-sm text-secondary-400">Издатель/Разработчик</label>
                  <input value={comingCreateForm.publisher} onChange={(e)=>setComingCreateForm({...comingCreateForm, publisher:e.target.value})} placeholder="Publisher / Developer" className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm text-secondary-400">Скриншоты (через запятую)</label>
                  <input value={comingCreateForm.screenshots} onChange={(e)=>setComingCreateForm({...comingCreateForm, screenshots:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://img1.jpg, https://img2.jpg" />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async ()=>{
                      try {
                        const payload = {
                          ...comingCreateForm,
                          expected_score: comingCreateForm.expected_score? Number(comingCreateForm.expected_score): null,
                          platforms: comingCreateForm.platforms ? comingCreateForm.platforms.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
                          screenshots: comingCreateForm.screenshots ? comingCreateForm.screenshots.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
                        };
                        await axios.post('/api/content/coming-soon', payload);
                        setComingCreateForm({ title:'', content_type:'MOVIE', release_date:'', description:'', poster_url:'', trailer_url:'', expected_score:'', genre:'', developer:'', director:'', creator:'', studio:'', network:'', publisher:'', platforms:'', screenshots:'', is_active:true });
                        fetchComingItems();
                      } catch(e) { alert(e.response?.data?.message || 'Не удалось добавить'); }
                    }}
                    className="px-4 py-2 bg-imdb hover:bg-imdb/90 text-dark-900 rounded font-semibold"
                  >Добавить элемент</button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="bg-primary-900 rounded-lg border border-primary-700 overflow-hidden">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Тип</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Релиз</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Счёт</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Активен</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {comingLoading ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={7}>Загрузка...</td></tr>
                  ) : comingItems.length === 0 ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={7}>Пусто</td></tr>
                  ) : comingItems.sort((a,b)=> new Date(a.release_date) - new Date(b.release_date)).map((item)=> (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-secondary-200">{item.id}</td>
                      <td className="px-4 py-3">
                        {comingEditingId===item.id ? (
                          <input value={comingEditForm.title} onChange={(e)=>setComingEditForm({...comingEditForm, title:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                        ) : (
                          <div className="font-medium text-secondary-100">{item.title}</div>
                        )}
                        <div className="text-xs text-secondary-500 truncate max-w-xs">{item.poster_url}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-300">{item.content_type}</td>
                      <td className="px-4 py-3">
                        {comingEditingId===item.id ? (
                          <input type="date" value={(comingEditForm.release_date||'').slice(0,10)} onChange={(e)=>setComingEditForm({...comingEditForm, release_date:e.target.value})} className="w-40 px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                        ) : (
                          <span className="text-sm text-secondary-300">{(item.release_date||'').slice(0,10)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {comingEditingId===item.id ? (
                          <input type="number" value={comingEditForm.expected_score||''} onChange={(e)=>setComingEditForm({...comingEditForm, expected_score:e.target.value})} className="w-24 px-2 py-1 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                        ) : (
                          <span className="text-sm text-secondary-300">{item.expected_score ?? '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {comingEditingId===item.id ? (
                          <input type="checkbox" checked={!!comingEditForm.is_active} onChange={(e)=>setComingEditForm({...comingEditForm, is_active:e.target.checked})} />
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full border ${item.is_active? 'border-green-600 text-green-300 bg-green-900/20':'border-red-600 text-red-300 bg-red-900/20'}`}>{item.is_active? 'Да':'Нет'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {comingEditingId===item.id ? (
                          <>
                            <button onClick={async ()=>{ try{ const payload={...comingEditForm, expected_score: comingEditForm.expected_score? Number(comingEditForm.expected_score): null, platforms: comingEditForm.platforms? comingEditForm.platforms.split(',').map(s=>s.trim()).filter(Boolean): undefined, screenshots: comingEditForm.screenshots? comingEditForm.screenshots.split(',').map(s=>s.trim()).filter(Boolean): undefined }; await axios.put(`/api/content/coming-soon/${item.id}`, payload); setComingEditingId(null); fetchComingItems(); } catch(e){ alert('Не удалось сохранить'); } }} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded">Сохранить</button>
                            <button onClick={()=>setComingEditingId(null)} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded">Отмена</button>
                          </>
                        ) : (
                          <>
                            <button onClick={()=>{ setComingEditingId(item.id); setComingEditForm({ title:item.title||'', content_type:item.content_type||'MOVIE', release_date: (item.release_date||'').slice(0,10), description:item.description||'', poster_url:item.poster_url||'', trailer_url:item.trailer_url||'', expected_score:item.expected_score??'', genre:item.genre||'', developer:item.developer||'', director:item.director||'', creator:item.creator||'', studio:item.studio||'', network:item.network||'', publisher:item.publisher||'', platforms: Array.isArray(item.platforms)? item.platforms.join(', '): (item.platforms||''), screenshots: Array.isArray(item.screenshots)? item.screenshots.join(', '): (item.screenshots||''), is_active: !!item.is_active }); }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Редактировать</button>
                            <button onClick={async ()=>{ if(!confirm('Удалить элемент?')) return; try{ await axios.delete(`/api/content/coming-soon/${item.id}`); fetchComingItems(); } catch(e){ alert('Не удалось удалить'); } }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Удалить</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="bg-primary-800 p-6 rounded-lg border border-primary-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-100">Управление отзывами</h2>
              <button onClick={fetchReviews} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Обновить</button>
            </div>

            <div className="bg-primary-900 rounded-lg border border-primary-700 overflow-hidden">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Пользователь</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Контент</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Оценка</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Текст</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {reviewsLoading ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={7}>Загрузка...</td></tr>
                  ) : reviews.length === 0 ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={7}>Пусто</td></tr>
                  ) : reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-4 py-3 text-sm text-secondary-200">{review.id}</td>
                      <td className="px-4 py-3 text-sm text-secondary-100">
                        {review.user ? review.user.username : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-100">
                        {review.content ? review.content.title : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-400 font-bold">{review.rating}</td>
                      <td className="px-4 py-3 text-sm text-secondary-300 max-w-xs truncate" title={review.text}>
                        {review.text}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleDeleteReview(review.id)} 
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="bg-primary-800 p-6 rounded-lg border border-primary-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-100">Управление достижениями</h2>
              <button onClick={fetchAchievements} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Обновить</button>
            </div>

            {/* Create Form */}
            <div className="bg-primary-900 p-4 rounded-lg border border-primary-700 mb-6">
              <h3 className="text-secondary-200 font-semibold mb-3">Создать достижение</h3>
              <form onSubmit={handleCreateAchievement} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input value={achievementCreateForm.name} onChange={(e)=>setAchievementCreateForm({...achievementCreateForm, name:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Иконка (Lucide name)</label>
                  <input value={achievementCreateForm.icon_name} onChange={(e)=>setAchievementCreateForm({...achievementCreateForm, icon_name:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="Trophy" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <input value={achievementCreateForm.description} onChange={(e)=>setAchievementCreateForm({...achievementCreateForm, description:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">XP Награда</label>
                  <input type="number" value={achievementCreateForm.xp_reward} onChange={(e)=>setAchievementCreateForm({...achievementCreateForm, xp_reward:Number(e.target.value)})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Категория</label>
                  <select value={achievementCreateForm.category} onChange={(e)=>setAchievementCreateForm({...achievementCreateForm, category:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100">
                    <option value="general">Общее</option>
                    <option value="reviews">Отзывы</option>
                    <option value="engagement">Активность</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Создать</button>
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-primary-900 rounded-lg border border-primary-700 overflow-hidden">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Описание</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">XP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {achievementsLoading ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={5}>Загрузка...</td></tr>
                  ) : achievements.map((ach) => (
                    <tr key={ach.id}>
                      <td className="px-4 py-3 text-sm text-secondary-200">{ach.id}</td>
                      <td className="px-4 py-3 text-sm text-secondary-100">
                        {achievementEditingId === ach.id ? (
                          <input value={achievementEditForm.name} onChange={(e)=>setAchievementEditForm({...achievementEditForm, name:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded" />
                        ) : ach.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-300">
                        {achievementEditingId === ach.id ? (
                          <input value={achievementEditForm.description} onChange={(e)=>setAchievementEditForm({...achievementEditForm, description:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded" />
                        ) : ach.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-400">
                        {achievementEditingId === ach.id ? (
                          <input type="number" value={achievementEditForm.xp_reward} onChange={(e)=>setAchievementEditForm({...achievementEditForm, xp_reward:Number(e.target.value)})} className="w-20 px-2 py-1 bg-dark-900 border border-dark-600 rounded" />
                        ) : ach.xp_reward}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {achievementEditingId === ach.id ? (
                          <>
                            <button onClick={()=>handleUpdateAchievement(ach.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">Сохранить</button>
                            <button onClick={()=>setAchievementEditingId(null)} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded text-sm">Отмена</button>
                          </>
                        ) : (
                          <>
                            <button onClick={()=>{setAchievementEditingId(ach.id); setAchievementEditForm(ach);}} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Изменить</button>
                            <button onClick={()=>handleDeleteAchievement(ach.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Удалить</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PUBLICATIONS TAB */}
        {activeTab === 'publications' && (
          <div className="bg-primary-800 p-6 rounded-lg border border-primary-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-100">Управление изданиями</h2>
              <button onClick={fetchPublications} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-secondary-200">Обновить</button>
            </div>

            {/* Create Form */}
            <div className="bg-primary-900 p-4 rounded-lg border border-primary-700 mb-6">
              <h3 className="text-secondary-200 font-semibold mb-3">Создать издание</h3>
              <form onSubmit={handleCreatePublication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input value={publicationCreateForm.name} onChange={(e)=>setPublicationCreateForm({...publicationCreateForm, name:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Веб-сайт</label>
                  <input value={publicationCreateForm.website} onChange={(e)=>setPublicationCreateForm({...publicationCreateForm, website:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Логотип URL</label>
                  <input value={publicationCreateForm.logo_url} onChange={(e)=>setPublicationCreateForm({...publicationCreateForm, logo_url:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <input value={publicationCreateForm.description} onChange={(e)=>setPublicationCreateForm({...publicationCreateForm, description:e.target.value})} className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded text-secondary-100" />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Создать</button>
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-primary-900 rounded-lg border border-primary-700 overflow-hidden">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Сайт</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {publicationsLoading ? (
                    <tr><td className="px-4 py-3 text-secondary-300" colSpan={4}>Загрузка...</td></tr>
                  ) : publications.map((pub) => (
                    <tr key={pub.id}>
                      <td className="px-4 py-3 text-sm text-secondary-200">{pub.id}</td>
                      <td className="px-4 py-3 text-sm text-secondary-100">
                        {publicationEditingId === pub.id ? (
                          <input value={publicationEditForm.name} onChange={(e)=>setPublicationEditForm({...publicationEditForm, name:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded" />
                        ) : pub.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-400">
                        {publicationEditingId === pub.id ? (
                          <input value={publicationEditForm.website} onChange={(e)=>setPublicationEditForm({...publicationEditForm, website:e.target.value})} className="w-full px-2 py-1 bg-dark-900 border border-dark-600 rounded" />
                        ) : (
                          <a href={pub.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{pub.website}</a>
                        )}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {publicationEditingId === pub.id ? (
                          <>
                            <button onClick={()=>handleUpdatePublication(pub.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">Сохранить</button>
                            <button onClick={()=>setPublicationEditingId(null)} className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-secondary-200 rounded text-sm">Отмена</button>
                          </>
                        ) : (
                          <>
                            <button onClick={()=>{setPublicationEditingId(pub.id); setPublicationEditForm(pub);}} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Изменить</button>
                            <button onClick={()=>handleDeletePublication(pub.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Удалить</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
