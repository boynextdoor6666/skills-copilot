import React from 'react';

/**
 * MetascoreBadge - Компонент для отображения Metascore в стиле Metacritic
 * @param {number} score - Оценка от 0 до 100
 * @param {string} size - Размер badge ('small', 'medium', 'large')
 */
const MetascoreBadge = ({ score, size = 'medium' }) => {
  // Определяем цвет на основе оценки
  const getScoreColor = () => {
    if (score >= 75) return 'bg-[#00CE7A]'; // Зелёный (Universal Acclaim)
    if (score >= 50) return 'bg-[#FFBD3F]'; // Жёлтый (Mixed or Average)
    return 'bg-[#FF6874]'; // Красный (Generally Unfavorable)
  };

  // Определяем размеры
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-10 h-10 text-lg';
      case 'large':
        return 'w-20 h-20 text-4xl';
      case 'medium':
      default:
        return 'w-14 h-14 text-2xl';
    }
  };

  // Текстовое описание
  const getScoreDescription = () => {
    if (score >= 90) return 'Universal Acclaim';
    if (score >= 75) return 'Generally Favorable';
    if (score >= 50) return 'Mixed or Average';
    if (score >= 20) return 'Generally Unfavorable';
    return 'Overwhelming Dislike';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          ${getScoreColor()}
          ${getSizeClasses()}
          flex items-center justify-center
          font-bold
          text-white
          rounded-sm
          transition-transform
          hover:scale-105
        `}
        title={`Metascore: ${score}/100 - ${getScoreDescription()}`}
      >
        {score}
      </div>
      {size === 'large' && (
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-400">METASCORE</p>
          <p className="text-xs text-gray-500">{getScoreDescription()}</p>
        </div>
      )}
    </div>
  );
};

export default MetascoreBadge;
