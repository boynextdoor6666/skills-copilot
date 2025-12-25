import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6']

export default function Dashboard() {
  const [contentStats, setContentStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Всегда грузим публичную статистику контента
        const c = await axios.get('/api/content/stats')
        setContentStats(c.data)

        // Статистика пользователей доступна только для админов
        if (isAuthenticated && user?.role === 'ADMIN') {
          try {
            const u = await axios.get('/api/admin/stats')
            setUserStats(u.data)
          } catch (e) {
            // Не блокируем дашборд, просто скрываем блок пользователей
            console.warn('Admin stats unavailable:', e?.response?.status)
            setUserStats(null)
          }
        } else {
          setUserStats(null)
        }
      } catch (e) {
        console.error('Failed to load dashboard', e)
        setError('Не удалось загрузить дашборд')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user])

  const pieData = contentStats ? [
    { name: 'Фильмы', value: contentStats.byType.movies },
    { name: 'Сериалы', value: contentStats.byType.series },
    { name: 'Игры', value: contentStats.byType.games },
  ] : []

  if (loading) return <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">Загрузка дашборда...</div>
  if (error) return <div className="min-h-screen bg-primary-900 text-red-400 p-8">{error}</div>

  return (
    <div className="min-h-screen bg-primary-900 text-secondary-300 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-secondary-100">Дашборд</h1>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="professional-card p-5">
            <div className="text-secondary-400 text-sm">Всего контента</div>
            <div className="text-3xl font-bold text-secondary-100">{contentStats.total}</div>
          </div>
          <div className="professional-card p-5">
            <div className="text-secondary-400 text-sm">Активных слайдов</div>
            <div className="text-3xl font-bold text-accent-400">{contentStats.heroActive}</div>
          </div>
          <div className="professional-card p-5">
            <div className="text-secondary-400 text-sm">Скоро выйдет (актив.)</div>
            <div className="text-3xl font-bold text-purple-400">{contentStats.comingActive}</div>
          </div>
          {userStats && (
            <div className="professional-card p-5">
              <div className="text-secondary-400 text-sm">Пользователей</div>
              <div className="text-3xl font-bold text-green-400">{userStats.total}</div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="professional-card p-6">
            <h3 className="text-secondary-100 font-semibold mb-4">Распределение по типам</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {userStats && userStats.users && (
            <div className="professional-card p-6">
              <h3 className="text-secondary-100 font-semibold mb-4">Пользователи по ролям</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={[{
                    name: 'Зрители', value: userStats.users.byRole.users
                  }, {
                    name: 'Критики', value: userStats.users.byRole.critics
                  }, {
                    name: 'Админы', value: userStats.users.byRole.admins
                  }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
