import React from 'react';
import { ELEMENTS, generateWarriorName } from '../utils/contracts';

export function WarriorCard({ warrior }) {
  const element = ELEMENTS[warrior.element] || ELEMENTS[0];
  const warriorName = generateWarriorName(warrior.id, warrior.element);
  const maxStamina = 100;
  const staminaPercent = (parseInt(warrior.stamina) / maxStamina) * 100;
  
  // 根据体力百分比确定颜色
  const getStaminaColor = () => {
    if (staminaPercent > 60) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (staminaPercent > 30) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  return (
    <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 card-hover border border-white/10 relative overflow-hidden group">
      {/* 元素背景光效 */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 md:w-40 md:h-40 rounded-full blur-2xl md:blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${element.color.replace('bg-', 'bg-')}`} />
      
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl ${element.color} shadow-lg`}>
            {element.icon}
          </div>
          <div>
            <span className="font-bold text-white text-base md:text-lg">{warriorName}</span>
            <span className="text-xs text-gray-500 ml-2">#{warrior.id}</span>
            <div className="text-xs text-gray-400">Lv.{warrior.level}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold ${element.color} bg-opacity-20 text-white border border-white/20 whitespace-nowrap`}>
          {warrior.elementName}
        </span>
      </div>
      
      {/* 属性数据 - 移动端更紧凑 */}
      <div className="space-y-2 md:space-y-3 mb-3 md:mb-4 relative z-10">
        <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
          <span className="text-gray-400 text-xs md:text-sm">⚔️ 战力</span>
          <span className="font-bold text-blue-400 text-base md:text-lg">{warrior.power}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span className="text-gray-400 text-xs md:text-sm">⭐ 经验</span>
            <span className="font-bold text-purple-400 text-sm md:text-base">{warrior.experience}/{warrior.requiredExp || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span className="text-gray-400 text-xs md:text-sm">🏆 战绩</span>
            <span className="font-bold text-green-400 text-xs md:text-sm">{warrior.battlesWon}胜</span>
          </div>
        </div>
      </div>
      
      {/* 体力条 */}
      <div className="mb-2 md:mb-3 relative z-10">
        <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
          <span className="text-gray-400">⚡ 体力</span>
          <span className={`font-bold ${parseInt(warrior.stamina) < 10 ? 'text-red-400' : 'text-green-400'}`}>
            {warrior.stamina}/{maxStamina}
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 md:h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getStaminaColor()}`}
            style={{ width: `${staminaPercent}%` }}
          />
        </div>
      </div>
      
      {/* 升级进度 */}
      <div className="relative z-10">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">升级进度</span>
          <span className="text-gradient font-bold">{warrior.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-700/30 rounded-full h-1 md:h-1.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            style={{ width: `${warrior.progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
