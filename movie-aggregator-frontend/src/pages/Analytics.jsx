import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, TrendingDown, Flame, AlertTriangle } from 'lucide-react';

const Analytics = () => {
  const [worldRatings, setWorldRatings] = useState([]);
  const [antiRating, setAntiRating] = useState([]);
  const [hypeTop, setHypeTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [worldRes, antiRes, hypeRes] = await Promise.all([
          axios.get('/api/analytics/world-ratings'),
          axios.get('/api/analytics/anti-rating'),
          axios.get('/api/analytics/hype-top')
        ]);

        setWorldRatings(worldRes.data);
        setAntiRating(antiRes.data);
        setHypeTop(hypeRes.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Не удалось загрузить данные аналитики");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-imdb border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-red-500">
        <AlertTriangle className="mr-2" /> {error}
      </div>
    );
  }

  // Prepare data for charts
  const countryData = worldRatings.map(item => ({
    name: item.country || 'Unknown',
    rating: parseFloat(item.avg_rating)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#F5C518'];

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold text-imdb mb-2">Аналитика Киномира</h1>
          <p className="text-dark-400">Глобальные тренды, анти-рейтинги и хайп-индекс</p>
        </header>

        {/* World Ratings Section */}
        <section className="bg-dark-800 rounded-xl p-6 border border-dark-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-blue-400 h-8 w-8" />
            <h2 className="text-2xl font-bold">Мировой Рейтинг</h2>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 10]} stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ color: '#F5C518' }}
                />
                <Legend />
                <Bar dataKey="rating" name="Средняя оценка" fill="#F5C518" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-dark-400 mt-4 text-center">Средняя оценка контента пользователями из разных стран</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Anti-Rating Section */}
          <section className="bg-dark-800 rounded-xl p-6 border border-dark-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="text-red-500 h-8 w-8" />
              <h2 className="text-2xl font-bold">Анти-Рейтинг</h2>
            </div>
            <div className="space-y-4">
              {antiRating.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors">
                  <div className="text-2xl font-bold text-dark-500 w-8">#{index + 1}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-dark-100">{item.title}</h3>
                    <div className="text-xs text-dark-400">{item.release_year}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <span className="text-red-500 font-bold">{Number(item.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Hype Top Section */}
          <section className="bg-dark-800 rounded-xl p-6 border border-dark-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="text-orange-500 h-8 w-8" />
              <h2 className="text-2xl font-bold">Топ Хайпа</h2>
            </div>
            <div className="space-y-4">
              {hypeTop.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors border-l-4 border-orange-500">
                  <div className="text-2xl font-bold text-orange-500 w-8">#{index + 1}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-dark-100">{item.title}</h3>
                    <div className="text-xs text-dark-400">Ожидают: {item.waiting_count} чел.</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-orange-400 font-bold text-sm">Hype Index</div>
                    <div className="text-xl font-bold text-white">{Math.round(item.hype_index)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Analytics;
