import React from 'react'
import { Link } from 'react-router-dom'
import { Film, Zap, Github, Twitter, Instagram, Youtube, Mail, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-dark-800 border-t border-dark-600 mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3 group w-fit">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg shadow-accent-500/20">
                  <Film className="h-5 w-5 text-white" />
                  <Zap className="absolute -bottom-1 -right-1 h-4 w-4 text-white fill-current drop-shadow-md" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-black tracking-tight text-white group-hover:text-accent-500 transition-colors">
                  Cine<span className="text-accent-500">Vibe</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-dark-400 -mt-1 group-hover:text-white transition-colors">
                  Feel the Content
                </span>
              </div>
            </Link>
            <p className="text-dark-300 text-sm leading-relaxed">
              Инновационный агрегатор рецензий с эмоциональной аналитикой. 
              Мы объединяем мнения критиков и зрителей, чтобы помочь вам найти идеальный контент.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-dark-400 hover:text-accent-500 transition-colors transform hover:scale-110">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-dark-400 hover:text-accent-500 transition-colors transform hover:scale-110">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-dark-400 hover:text-accent-500 transition-colors transform hover:scale-110">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-dark-400 hover:text-accent-500 transition-colors transform hover:scale-110">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-accent-500 rounded-full"></span>
              Разделы
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-dark-300 hover:text-accent-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Главная</Link></li>
              <li><Link to="/movies" className="text-dark-300 hover:text-accent-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Фильмы</Link></li>
              <li><Link to="/series" className="text-dark-300 hover:text-accent-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Сериалы</Link></li>
              <li><Link to="/games" className="text-dark-300 hover:text-accent-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Игры</Link></li>
              <li><Link to="/critics" className="text-dark-300 hover:text-accent-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Критики</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              Возможности
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/analytics" className="text-dark-300 hover:text-purple-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Аналитика</Link></li>
              <li><Link to="/taste-profile" className="text-dark-300 hover:text-purple-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Мой вкус</Link></li>
              <li><Link to="/hype-monitoring" className="text-dark-300 hover:text-purple-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Хайп-монитор</Link></li>
              <li><Link to="/coming-soon" className="text-dark-300 hover:text-purple-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Календарь релизов</Link></li>
            </ul>
          </div>

          {/* Contact/Support */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              Поддержка
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-dark-300 hover:text-blue-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">О проекте</a></li>
              <li><a href="#" className="text-dark-300 hover:text-blue-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">API Документация</a></li>
              <li><a href="#" className="text-dark-300 hover:text-blue-400 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">Политика конфиденциальности</a></li>
              <li className="pt-4">
                <a href="mailto:support@cinevibe.com" className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors border border-dark-600">
                  <Mail className="h-4 w-4" />
                  <span>Связаться с нами</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-dark-400 text-sm">
            © 2025 CineVibe. Все права защищены.
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>Сделано с</span>
            <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
            <span>для курсового проекта</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
