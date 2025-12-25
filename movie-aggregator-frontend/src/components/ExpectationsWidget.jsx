import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Star, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Компонент "До/После" - система ожиданий
 * Позволяет пользователям оценить ожидания до просмотра
 * и показывает разницу между ожиданиями и реальностью
 */
const ExpectationsWidget = ({ contentId, actualRating: rawActualRating }) => {
  const { user } = useAuth();
  const [myExpectation, setMyExpectation] = useState(null);
  const [communityExpectations, setCommunityExpectations] = useState({ avgRating: 0, count: 0 });
  const [newRating, setNewRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);

  // Конвертируем actualRating в число
  const actualRating = rawActualRating != null ? parseFloat(rawActualRating) : null;
  const hasActualRating = actualRating !== null && !isNaN(actualRating);

  useEffect(() => {
    fetchExpectations();
  }, [contentId, user]);

  const fetchExpectations = async () => {
    try {
      // Получаем общие ожидания сообщества
      const communityRes = await axios.get(`/api/expectations/${contentId}`);
      setCommunityExpectations(communityRes.data);

      // Если пользователь авторизован, получаем его ожидания
      if (user) {
        try {
          const myRes = await axios.get(`/api/expectations/${contentId}/me`);
          if (myRes.data) {
            setMyExpectation(myRes.data);
            setNewRating(myRes.data.rating);
          }
        } catch (e) {
          // Пользователь ещё не оставлял ожидания
        }
      }
    } catch (error) {
      console.error('Failed to fetch expectations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpectation = async () => {
    if (!user) {
      alert('Войдите, чтобы оставить свои ожидания');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/expectations/${contentId}`, { rating: newRating });
      setMyExpectation({ rating: newRating });
      // Обновляем общие данные
      fetchExpectations();
      alert('Ваши ожидания сохранены!');
    } catch (error) {
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Вычисляем разницу между ожиданиями и реальностью
  const calculateDifference = (expected, actual) => {
    if (!expected || actual === null || isNaN(actual)) return null;
    return actual - expected;
  };

  const getDifferenceIcon = (diff) => {
    if (diff === null) return <Minus className="w-5 h-5 text-gray-400" />;
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (diff < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getDifferenceText = (diff) => {
    if (diff === null) return 'Нет данных';
    if (diff > 1) return 'Превзошёл ожидания!';
    if (diff > 0) return 'Немного лучше ожиданий';
    if (diff < -1) return 'Ниже ожиданий';
    if (diff < 0) return 'Немного хуже ожиданий';
    return 'Соответствует ожиданиям';
  };

  const getDifferenceColor = (diff) => {
    if (diff === null) return 'text-gray-400';
    if (diff > 0) return 'text-green-500';
    if (diff < 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  const communityDiff = calculateDifference(communityExpectations.avgRating, actualRating);
  const myDiff = myExpectation ? calculateDifference(myExpectation.rating, actualRating) : null;

  if (loading) {
    return (
      <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-[#f5c518]" />
        <h3 className="text-lg font-semibold text-white">Ожидания vs Реальность</h3>
      </div>

      {/* Статистика сообщества */}
      <div className="space-y-3">
        <h4 className="text-sm text-gray-400 uppercase tracking-wide">Сообщество</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f5c518]">
              {(parseFloat(communityExpectations.avgRating) || 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Ожидали</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {hasActualRating ? actualRating.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500">Получили</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getDifferenceColor(communityDiff)}`}>
              {communityDiff !== null ? (communityDiff > 0 ? '+' : '') + communityDiff.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500">Разница</div>
          </div>
        </div>

        {communityExpectations.count > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {getDifferenceIcon(communityDiff)}
            <span className={getDifferenceColor(communityDiff)}>
              {getDifferenceText(communityDiff)}
            </span>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          {communityExpectations.count} {communityExpectations.count === 1 ? 'оценка' : 'оценок'} ожиданий
        </div>
      </div>

      {/* Разделитель */}
      <div className="border-t border-gray-700"></div>

      {/* Мои ожидания */}
      {user ? (
        <div className="space-y-3">
          <h4 className="text-sm text-gray-400 uppercase tracking-wide">Мои ожидания</h4>
          
          {myExpectation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {(parseFloat(myExpectation.rating) || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Я ожидал</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {hasActualRating ? actualRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Реальность</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getDifferenceColor(myDiff)}`}>
                    {myDiff !== null ? (myDiff > 0 ? '+' : '') + myDiff.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Для меня</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                {getDifferenceIcon(myDiff)}
                <span className={getDifferenceColor(myDiff)}>
                  {getDifferenceText(myDiff)}
                </span>
              </div>

              <button
                onClick={() => setMyExpectation(null)}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Изменить ожидания
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                Ещё не смотрели? Оцените свои ожидания!
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Мои ожидания:</span>
                  <span className="text-xl font-bold text-[#f5c518]">{newRating}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={newRating}
                  onChange={(e) => setNewRating(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#f5c518]"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Скептик</span>
                  <span>Хайп!</span>
                </div>
              </div>

              <button
                onClick={handleSubmitExpectation}
                disabled={submitting}
                className="w-full py-3 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 transition disabled:opacity-50"
              >
                {submitting ? 'Сохранение...' : 'Сохранить ожидания'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">
            Войдите, чтобы оставить свои ожидания
          </p>
        </div>
      )}

      {/* Подсказка */}
      <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
        💡 Оцените ваши ожидания до просмотра, а потом сравните с реальной оценкой
      </div>
    </div>
  );
};

export default ExpectationsWidget;
