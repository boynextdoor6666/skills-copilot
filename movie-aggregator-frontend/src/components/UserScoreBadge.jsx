import React from 'react';
import { Star } from 'lucide-react';

/**
 * UserScoreBadge - Компонент для отображения User Score в стиле Metacritic
 * @param {number} score - Оценка от 0 до 10
 * @param {number} reviewCount - Количество отзывов
 * @param {string} size - Размер badge ('small', 'medium', 'large')
 */
const UserScoreBadge = ({ score, reviewCount = 0, size = 'medium' }) => {
  // Преобразуем score в число
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;

  // Определяем цвет на основе оценки
  const getScoreColor = () => {
    if (numericScore >= 7.5) return 'border-[#00CE7A] text-[#00CE7A]'; // Зелёный
    if (numericScore >= 5.0) return 'border-[#FFBD3F] text-[#FFBD3F]'; // Жёлтый
    return 'border-[#FF6874] text-[#FF6874]'; // Красный
  };

  // Определяем размеры
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-10 h-10 text-base';
      case 'large':
        return 'w-20 h-20 text-3xl';
      case 'medium':
      default:
        return 'w-14 h-14 text-xl';
    }
  };

  // Форматируем оценку
  const formatScore = (s) => {
    const num = typeof s === 'number' ? s : parseFloat(s) || 0;
    return num.toFixed(1);
  };

  // Текстовое описание
  const getScoreDescription = () => {
    if (numericScore >= 8.0) return 'Overwhelmingly Positive';
    if (numericScore >= 7.0) return 'Generally Favorable';
    if (numericScore >= 5.0) return 'Mixed';
    if (numericScore >= 3.0) return 'Generally Unfavorable';
    return 'Overwhelmingly Negative';
  };

  // Форматируем количество отзывов
  const formatReviewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          ${getScoreColor()}
          ${getSizeClasses()}
          flex items-center justify-center
          font-bold
          border-4
          bg-[#1a1a1a]
          rounded-sm
          transition-all
          hover:scale-105
        `}
        title={`User Score: ${formatScore(score)}/10 - ${getScoreDescription()}`}
      >
        {formatScore(score)}
      </div>
      {size === 'large' && (
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-400">USER SCORE</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-gray-500" />
            <span>{formatReviewCount(reviewCount)} Ratings</span>
          </div>
        </div>
      )}
      {size !== 'large' && reviewCount > 0 && (
        <p className="text-xs text-gray-500">
          {formatReviewCount(reviewCount)} ratings
        </p>
      )}
    </div>
  );
};

export default UserScoreBadge;
