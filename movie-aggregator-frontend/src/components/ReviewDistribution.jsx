import React from 'react';

/**
 * ReviewDistribution - Компонент для отображения распределения отзывов
 * @param {object} distribution - Объект с количеством положительных, смешанных и отрицательных отзывов
 * @param {string} type - Тип отзывов ('critic' или 'user')
 */
const ReviewDistribution = ({ distribution, type = 'critic' }) => {
  const { positive = 0, mixed = 0, negative = 0 } = distribution;
  const total = positive + mixed + negative;

  // Вычисляем проценты
  const getPercentage = (value) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const positivePercent = getPercentage(positive);
  const mixedPercent = getPercentage(mixed);
  const negativePercent = getPercentage(negative);

  // Kinopoisk style colors
  const colors = {
    positive: '#3bb33b',
    mixed: '#777777', // Neutral/Gray
    negative: '#ff4d4d'
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase">
          {type === 'critic' ? 'Рецензии критиков' : 'Отзывы пользователей'}
        </h3>
        <span className="text-sm text-gray-500">{total} Всего</span>
      </div>

      {/* График распределения */}
      <div className="space-y-3">
        {/* Положительные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.positive }} className="font-medium">Положительные</span>
            <span className="text-gray-400">
              {positive} ({positivePercent}%)
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${positivePercent}%`, backgroundColor: colors.positive }}
            />
          </div>
        </div>

        {/* Смешанные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.mixed }} className="font-medium">Нейтральные</span>
            <span className="text-gray-400">
              {mixed} ({mixedPercent}%)
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${mixedPercent}%`, backgroundColor: colors.mixed }}
            />
          </div>
        </div>

        {/* Отрицательные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.negative }} className="font-medium">Отрицательные</span>
            <span className="text-gray-400">
              {negative} ({negativePercent}%)
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${negativePercent}%`, backgroundColor: colors.negative }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDistribution;
