import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

const RatingDynamicsChart = ({ dynamics }) => {
  if (!dynamics || dynamics.length === 0) {
    return (
      <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
        <h3 className="text-xl font-bold text-secondary-100 mb-4 flex items-center gap-2">
          <TrendingUp className="text-accent-400" size={24} />
          Динамика рейтингов
        </h3>
        <p className="text-secondary-400 text-center py-8">
          Недостаточно данных для отображения динамики рейтингов
        </p>
      </div>
    )
  }

  // Calculate trend (comparing first and last data points)
  const firstRating = parseFloat(dynamics[0]?.cumulativeAvg || dynamics[0]?.weeklyAvg || 0)
  const lastRating = parseFloat(dynamics[dynamics.length - 1]?.cumulativeAvg || dynamics[dynamics.length - 1]?.weeklyAvg || 0)
  const trend = lastRating - firstRating
  const trendPercent = firstRating > 0 ? ((trend / firstRating) * 100).toFixed(1) : 0

  // Format data for chart
  const chartData = dynamics.map((point, idx) => ({
    name: point.date ? new Date(point.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }) : `День ${idx + 1}`,
    'Недельный': parseFloat(point.weeklyAvg || point.avg_rating || 0),
    'Накопительный': parseFloat(point.cumulativeAvg || point.avg_rating || 0),
    Отзывов: point.reviewCount || point.review_count || 0
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary-900 border border-accent-400 rounded-lg p-3 shadow-lg">
          <p className="text-secondary-100 font-semibold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value.toFixed(2)}</strong>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-primary-800 rounded-lg p-6 border border-secondary-600">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-100 mb-2 flex items-center gap-2">
            <Calendar className="text-accent-400" size={24} />
            Динамика рейтингов
          </h3>
          <p className="text-secondary-400 text-sm">
            Изменение оценок за {dynamics.length} {dynamics.length === 1 ? 'период' : 'периодов'}
          </p>
        </div>

        {/* Trend indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          trend > 0 ? 'bg-green-500/20 text-green-400' : trend < 0 ? 'bg-red-500/20 text-red-400' : 'bg-secondary-700 text-secondary-300'
        }`}>
          {trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          <div className="text-right">
            <div className="text-lg font-bold">
              {trend > 0 ? '+' : ''}{trend.toFixed(2)}
            </div>
            <div className="text-xs opacity-80">
              {trend > 0 ? '+' : ''}{trendPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            domain={[0, 10]} 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Area 
            type="monotone" 
            dataKey="Накопительный" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCumulative)"
          />
          <Area 
            type="monotone" 
            dataKey="Недельный" 
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorWeekly)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-secondary-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-400">{firstRating.toFixed(1)}</div>
          <div className="text-sm text-secondary-400">Начальный рейтинг</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-400">{lastRating.toFixed(1)}</div>
          <div className="text-sm text-secondary-400">Текущий рейтинг</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-400">
            {dynamics.reduce((sum, p) => sum + (p.reviewCount || p.review_count || 0), 0)}
          </div>
          <div className="text-sm text-secondary-400">Всего отзывов</div>
        </div>
      </div>
    </div>
  )
}

export default RatingDynamicsChart
