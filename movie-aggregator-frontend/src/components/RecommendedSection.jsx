import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Sparkles } from 'lucide-react'
import ContentHoverCard from './ContentHoverCard'
import MetascoreBadge from './MetascoreBadge'
import UserScoreBadge from './UserScoreBadge'

const RecommendedSection = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get('/api/recommendations')
        setRecommendations(response.data)
      } catch (error) {
        console.error('Failed to fetch recommendations', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  if (loading || recommendations.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Рекомендовано для вас</h2>
            <p className="text-sm text-gray-400">На основе ваших оценок и предпочтений</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {recommendations.filter(rec => rec.content).map((rec) => {
          const item = rec.content
          const linkPath = item?.type === 'movie' ? `/movie/${item.id}` 
            : item?.type === 'series' ? `/series/${item.id}` 
            : `/game/${item.id}`

          return (
            <ContentHoverCard key={rec.id} item={item}>
              <Link to={linkPath} className="group block relative">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        {Math.round(rec.score * 100)}% match
                      </span>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {item.metascore && <MetascoreBadge score={item.metascore} size="sm" />}
                    {item.userscore && <UserScoreBadge score={item.userscore} size="sm" />}
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-100 group-hover:text-purple-400 transition-colors truncate">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                  <span>{item.release_year}</span>
                  <span className="capitalize">{item.type}</span>
                </div>
              </Link>
            </ContentHoverCard>
          )
        })}
      </div>
    </section>
  )
}

export default RecommendedSection
