import React from 'react';
import { ExternalLink } from 'lucide-react';
import MetascoreBadge from './MetascoreBadge';

/**
 * CriticReviewCard - Карточка профессиональной рецензии
 */
const CriticReviewCard = ({ review }) => {
  const {
    publicationName,
    publicationLogo,
    criticName,
    score,
    excerpt,
    fullReviewUrl,
    publishDate,
    type
  } = review;

  // Форматируем дату
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine background color based on score (Kinopoisk style)
  let bgColor = 'bg-[#1f1f1f]'; // Neutral
  if (score >= 70) {
    bgColor = 'bg-[#1f2d22]'; // Positive
  } else if (score <= 40) {
    bgColor = 'bg-[#2d1f1f]'; // Negative
  }

  return (
    <div className={`${bgColor} rounded-lg p-6 transition-colors`}>
      <div className="flex gap-4">
        {/* Metascore Badge */}
        <div className="flex-shrink-0">
          <MetascoreBadge score={score} size="small" />
        </div>

        {/* Контент рецензии */}
        <div className="flex-1 space-y-3">
          {/* Заголовок с логотипом издания */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {publicationLogo && (
                  <img
                    src={publicationLogo}
                    alt={publicationName}
                    className="h-5 w-auto"
                  />
                )}
                <h4 className="font-semibold text-white">
                  {publicationName}
                </h4>
              </div>
              {criticName && (
                <p className="text-sm text-gray-400">by {criticName}</p>
              )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(publishDate)}
            </span>
          </div>

          {/* Цитата из рецензии */}
          <blockquote className="text-gray-300 text-sm leading-relaxed border-l-2 border-gray-700 pl-4 italic">
            "{excerpt}"
          </blockquote>

          {/* Ссылка на полную рецензию */}
          {fullReviewUrl && (
            <a
              href={fullReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#f5c518] hover:text-[#f5c518]/80 transition-colors"
            >
              Читать полную рецензию
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriticReviewCard;
