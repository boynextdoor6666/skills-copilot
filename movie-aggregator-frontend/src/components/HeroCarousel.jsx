import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Star, Clock } from 'lucide-react'
import axios from 'axios'

const HeroCarousel = () => {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    loadCarousel()
  }, [])

  useEffect(() => {
    if (slides.length > 1 && !isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length)
      }, 5000) // Auto-advance every 5 seconds
      return () => clearInterval(interval)
    }
  }, [slides.length, isHovered])

  const loadCarousel = async () => {
    try {
      const { data } = await axios.get('/api/content/hero-carousel/active', { params: { sort: 'latest' } })
      setSlides(data || [])
    } catch (error) {
      console.error('Failed to load hero carousel:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  if (loading) {
    return (
      <div className="relative w-full h-[550px] mx-auto max-w-[98%] mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-3xl animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin"></div>
              <div className="text-[#666]">Загрузка...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return null
  }

  const currentSlide = slides[currentIndex]

  return (
    <div 
      className="relative w-full max-w-[98%] mx-auto mt-4 h-[550px] overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Container with rounded corners */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 z-10 scale-100' 
                : 'opacity-0 z-0 scale-105'
            }`}
          >
            {/* Background Image with Ken Burns effect */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out ${
                index === currentIndex ? 'scale-110' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url(${slide.background_image || slide.content?.poster_url || 'https://placehold.co/1920x600/1e293b/ffffff?text=Hero'})`,
              }}
            >
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-8 h-full flex items-center">
              <div className="max-w-2xl space-y-5">
                {/* Badge/Tag */}
                {slide.content?.content_type && (
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                    <span className="w-2 h-2 bg-[#ff6600] rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-white/90 uppercase tracking-wider">
                      {slide.content.content_type === 'MOVIE' ? 'Фильм' : 
                       slide.content.content_type === 'TV_SERIES' ? 'Сериал' : 'Игра'}
                    </span>
                  </div>
                )}

                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                    {slide.title}
                  </span>
                </h1>
                
                {slide.subtitle && (
                  <p className="text-xl md:text-2xl text-[#ff6600] font-semibold tracking-wide">
                    {slide.subtitle}
                  </p>
                )}
                
                {/* Meta info */}
                {slide.content && (
                  <div className="flex items-center gap-4 text-white/70">
                    {slide.content.release_year && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {slide.content.release_year}
                      </span>
                    )}
                    {slide.content.avg_rating && (
                      <span className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {Number(slide.content.avg_rating).toFixed(1)}
                      </span>
                    )}
                    {slide.content.genre && (
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                        {slide.content.genre}
                      </span>
                    )}
                  </div>
                )}

                {slide.description && (
                  <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-xl line-clamp-3">
                    {slide.description}
                  </p>
                )}

                {slide.call_to_action_link && (
                  <div className="flex items-center gap-4 pt-2">
                    <Link
                      to={slide.call_to_action_link}
                      className="group/btn inline-flex items-center gap-3 bg-[#ff6600] hover:bg-[#ff7722] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#ff6600]/30 hover:shadow-[#ff6600]/50 hover:scale-105 transition-all duration-300"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover/btn:bg-white/30 transition-colors">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      {slide.call_to_action_text || 'Смотреть'}
                    </Link>
                    
                    {/* Secondary button */}
                    <button className="px-6 py-4 rounded-2xl font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
                      Подробнее
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - More elegant */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-black/30 hover:bg-black/60 text-white rounded-2xl backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-black/30 hover:bg-black/60 text-white rounded-2xl backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}

        {/* Progress Bar & Dots - Modern style */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="relative h-1.5 rounded-full overflow-hidden transition-all duration-500"
                  style={{ width: index === currentIndex ? '48px' : '12px' }}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full"></div>
                  {index === currentIndex && (
                    <div 
                      className="absolute inset-0 bg-[#ff6600] rounded-full origin-left"
                      style={{
                        animation: isHovered ? 'none' : 'progress 5s linear forwards'
                      }}
                    ></div>
                  )}
                </button>
              ))}
              
              {/* Slide counter */}
              <div className="text-white/60 text-sm font-medium ml-2 border-l border-white/20 pl-3">
                {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for progress animation */}
      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}

export default HeroCarousel
