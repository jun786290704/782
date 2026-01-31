import React from 'react';
import { ELEMENTS, DIFFICULTY } from '../utils/contracts';

// 难度经验倍数配置 (与合约保持一致)
// 0: Easy=0.8, 1: Normal=0.9, 2: Medium=1.0, 3: Hard=1.1, 4: Boss=1.5
const EXP_MULTIPLIERS = {
  0: 0.8,   // 简单
  1: 0.9,   // 普通
  2: 1.0,   // 中等
  3: 1.1,   // 困难
  4: 1.5    // BOSS
};

// 基础经验值 (与合约 baseExperience 保持一致)
const BASE_EXPERIENCE = 32;

export function EnemyCard({ enemy, isSelected, onSelect }) {
  const element = ELEMENTS[enemy.element] || ELEMENTS[0];
  const difficulty = DIFFICULTY[enemy.difficulty] || DIFFICULTY[0];
  
  // 计算显示的经验值: 基础经验 × 难度倍数
  const expMultiplier = EXP_MULTIPLIERS[enemy.difficulty] || 1.0;
  const displayExperience = Math.floor(BASE_EXPERIENCE * expMultiplier * 10) / 10; // 保留1位小数

  return (
    <div
      onClick={() => onSelect(enemy)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{element.icon}</span>
          <div>
            <div className="font-bold">{enemy.name}</div>
            <div className="text-sm text-gray-500">
              {enemy.description?.slice(0, 50)}...
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`${difficulty.color} font-bold`}>{difficulty.name}</div>
          <div className="text-sm text-gray-500">基础战力: {enemy.basePower}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center space-x-4 text-sm">
        <span className={`${element.color} text-white px-2 py-0.5 rounded text-xs`}>
          {element.cn}
        </span>
        <span className="text-yellow-600">奖励: {enemy.rewardMultiplier}%</span>
        <span className="text-blue-600">经验: {displayExperience}</span>
      </div>
    </div>
  );
}
