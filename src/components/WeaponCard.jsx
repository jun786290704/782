import React from 'react';
import { ELEMENTS, STAR_NAMES } from '../utils/contracts';

export function WeaponCard({ weapon, onEquip, onUnequip, onRepair, onBurn, onReforge }) {
  const element = ELEMENTS[weapon.element] || ELEMENTS[0];
  const starInfo = STAR_NAMES[weapon.stars] || STAR_NAMES[0];
  const totalStats = weapon.stat1 + weapon.stat2 + weapon.stat3;
  const durabilityPercent = (weapon.currentDurability / weapon.maxDurability) * 100;
  const equipped = weapon.equippedBy !== '0';
  const canReforge = weapon.stars >= 2;
  const recoveryTime = weapon.maxDurability - weapon.currentDurability > 0
    ? `约${Math.ceil((weapon.maxDurability - weapon.currentDurability) * 50)}分钟回满`
    : '已回满';

  // 计算战力乘数
  const multiplier = totalStats > 0 ? 100 + Math.floor(totalStats * 25 / 10000) : 100;
  const multiplierStr = `${(multiplier / 100).toFixed(2)}x`;

  // 根据星级获取渐变背景色
  const getStarGradient = (stars) => {
    const gradients = {
      0: 'from-gray-50 via-gray-100 to-gray-200',      // 普通 - 银灰
      1: 'from-green-50 via-green-100 to-emerald-100', // 优秀 - 翠绿
      2: 'from-blue-50 via-blue-100 to-cyan-100',      // 稀有 - 天蓝
      3: 'from-purple-50 via-purple-100 to-violet-100', // 史诗 - 紫罗兰
      4: 'from-amber-50 via-yellow-100 to-orange-100',  // 传说 - 金橙
    };
    return gradients[stars] || gradients[0];
  };

  // 根据元素获取边框颜色
  const getElementBorder = (element) => {
    const borders = {
      0: 'border-green-300 hover:border-green-400',    // 木
      1: 'border-red-300 hover:border-red-400',        // 火
      2: 'border-amber-300 hover:border-amber-400',    // 土
      3: 'border-gray-300 hover:border-gray-400',      // 金
      4: 'border-blue-300 hover:border-blue-400',      // 水
    };
    return borders[element] || borders[0];
  };

  // 根据元素获取字体颜色
  const getElementTextColor = (element) => {
    const colors = {
      0: 'text-green-700',    // 木
      1: 'text-red-700',      // 火
      2: 'text-amber-700',    // 土
      3: 'text-gray-700',     // 金
      4: 'text-blue-700',     // 水
    };
    return colors[element] || colors[0];
  };

  const gradientBg = getStarGradient(weapon.stars);
  const borderColor = getElementBorder(weapon.element);
  const textColor = getElementTextColor(weapon.element);

  return (
    <div className={`relative bg-gradient-to-br ${gradientBg} rounded-xl shadow-lg p-4 md:p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 ${borderColor} ${weapon.broken ? 'ring-2 ring-red-400 ring-opacity-50' : ''}`}>
      {/* 星级角标 */}
      <div className="absolute -top-2 -right-2">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg"
          style={{ background: `linear-gradient(135deg, ${starInfo.color}30, ${starInfo.color}60)` }}
        >
          {starInfo.stars}
        </div>
      </div>

      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl md:text-3xl drop-shadow-sm">{element.icon}</span>
          <span className={`font-bold text-base md:text-lg ${textColor}`}>#{weapon.id}</span>
        </div>
        <span className={`${element.color} text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-md`}>
          {weapon.elementName}
        </span>
      </div>
      
      {/* 名称和星级 */}
      <div className="text-center mb-3 md:mb-4">
        <div 
          className="font-bold text-base md:text-lg truncate"
          style={{ color: starInfo.color, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          {weapon.name}
        </div>
        <div className="flex items-center justify-center mt-1">
          <span 
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              background: `linear-gradient(135deg, ${starInfo.color}20, ${starInfo.color}40)`,
              color: starInfo.color,
              border: `1px solid ${starInfo.color}40`
            }}
          >
            {starInfo.name}
          </span>
        </div>
        {/* 掉落能力标识 */}
        {weapon.hasDropChance && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
              <span className="mr-1">🎁</span>
              可掉落
            </span>
          </div>
        )}
      </div>
      
      {/* 属性数据 */}
      <div className="space-y-2 mb-3 md:mb-4">
        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
          <span className="text-gray-600 text-sm font-medium">战力</span>
          <div className="text-right">
            <span className="font-bold text-lg" style={{ color: starInfo.color }}>{weapon.basePower}</span>
            {weapon.level > 0 && (
              <span className="text-xs font-bold text-blue-600 ml-1 bg-blue-100 px-1.5 py-0.5 rounded-full">Lv.{weapon.level}</span>
            )}
          </div>
        </div>
        
        {totalStats > 0 && (
          <>
            <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
              <span className="text-gray-600 text-sm font-medium">属性</span>
              <div className="text-xs space-x-1">
                {weapon.stat1 > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-md font-medium shadow-sm">
                    {weapon.stat1}
                  </span>
                )}
                {weapon.stat2 > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md font-medium shadow-sm">
                    {weapon.stat2}
                  </span>
                )}
                {weapon.stat3 > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-md font-medium shadow-sm">
                    {weapon.stat3}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg px-3 py-2 border border-amber-200">
              <span className="text-amber-700 text-sm font-medium">倍数</span>
              <span className="font-bold text-amber-700 text-base">{multiplierStr}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
          <span className="text-gray-600 text-sm font-medium">类型</span>
          <span className={`font-bold ${textColor}`}>{weapon.weaponType}</span>
        </div>
        
        {equipped && (
          <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <span className="text-green-700 text-sm font-medium">装备于</span>
            <span className="font-bold text-green-700">#{weapon.equippedBy}</span>
          </div>
        )}
      </div>
      
      {/* 耐久度条 */}
      <div className="mb-3 md:mb-4 bg-white/60 rounded-lg p-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-600 font-medium">耐久度</span>
          <span className={`font-bold ${weapon.broken ? 'text-red-600' : durabilityPercent < 30 ? 'text-orange-600' : durabilityPercent < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
            {weapon.currentDurability}/{weapon.maxDurability}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              weapon.broken 
                ? 'bg-gradient-to-r from-red-400 to-red-600' 
                : durabilityPercent < 30 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                  : durabilityPercent < 60
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
            }`}
            style={{ width: `${durabilityPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1.5 text-right hidden md:block">{recoveryTime}</div>
      </div>
      
      {weapon.broken && (
        <div className="text-red-600 text-center text-sm font-bold mb-3 bg-red-50 rounded-lg py-2 border border-red-200">
          ⚠️ 武器损坏，需要修理
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {equipped ? (
          <button
            onClick={() => onUnequip(weapon.id)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-sm font-bold py-2.5 px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            🔓 <span className="hidden md:inline">卸下</span>
          </button>
        ) : (
          <button
            onClick={() => onEquip(weapon.id)}
            disabled={weapon.broken || weapon.currentDurability === 0}
            className={`${weapon.broken || weapon.currentDurability === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-md hover:shadow-lg active:scale-95'} text-white text-sm font-bold py-2.5 px-3 rounded-lg transition-all`}
          >
            🔒 <span className="hidden md:inline">装备</span>
          </button>
        )}
        
        {weapon.broken || weapon.currentDurability < weapon.maxDurability ? (
          <button
            onClick={() => onRepair(weapon.id)}
            className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold py-2.5 px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            🔧 <span className="hidden md:inline">修理</span>
          </button>
        ) : (
          <button
            onClick={() => onBurn(weapon.id)}
            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold py-2.5 px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            🔥 <span className="hidden md:inline">燃烧</span>
          </button>
        )}
        
        {canReforge && !equipped && (
          <button
            onClick={() => onReforge(weapon.id)}
            className="col-span-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-sm font-bold py-2.5 px-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            ⚒️ <span className="hidden md:inline">重铸</span>
          </button>
        )}
      </div>
    </div>
  );
}
