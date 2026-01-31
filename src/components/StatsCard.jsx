import React from 'react';

export function StatsCard({ title, value, color, icon, glow }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl md:rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-102 md:hover:scale-105 ${colorClasses[color] || colorClasses.blue} ${glow || ''}`}>
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]?.split(' ')[0] || ''} opacity-50`} />
      
      {/* 内容 */}
      <div className="relative p-3 md:p-6">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <span className="text-gray-400 text-xs md:text-sm font-medium truncate mr-2">{title}</span>
          <span className="text-lg md:text-2xl">{icon}</span>
        </div>
        <div className="text-xl md:text-3xl font-black text-white">
          {value}
        </div>
      </div>
      
      {/* 装饰性光效 */}
      <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full blur-2xl" />
    </div>
  );
}
