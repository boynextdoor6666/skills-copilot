import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Film, Star, Heart, Palette, Flame, Feather, Gavel, Users } from 'lucide-react';

const iconMap = {
  footprints: '👣',
  film: '🎬',
  star: '⭐',
  heart: '❤️',
  palette: '🎨',
  flame: '🔥',
  feather: '🪶',
  trophy: '🏆',
  gavel: '⚖️',
  users: '👥',
};

const AchievementToast = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const iconName = achievement.icon || achievement.icon_name || 'trophy';
  const IconComponent = iconMap[iconName] || '🏆';

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-8 right-8 bg-[#1b2838] border border-[#3d4450] rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-4 w-80 z-[100] overflow-hidden cursor-pointer hover:bg-[#2a3f5a] transition-colors"
      onClick={onClose}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#2a475e] to-[#1b2838] flex items-center justify-center border-r border-[#3d4450]">
        <span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] filter grayscale-[0.2] hover:grayscale-0 transition-all duration-300 transform hover:scale-110">
          {IconComponent}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-3 pr-4">
        <p className="text-[10px] text-[#66c0f4] uppercase font-bold tracking-wider mb-0.5">Достижение получено</p>
        <h3 className="text-[#dcdedf] font-bold truncate text-sm">{achievement.name || achievement.title}</h3>
        <p className="text-[#8f98a0] text-xs truncate">{achievement.description}</p>
      </div>
    </motion.div>
  );
};

export default AchievementToast;
