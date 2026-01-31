import React from 'react';
import { ethers } from 'ethers';

export function BattleHistoryItem({ record }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  return (
    <div className={`p-4 rounded-lg border ${
      record.victory 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{record.victory ? '🏆' : '💀'}</span>
          <div>
            <div className={`font-bold ${record.victory ? 'text-green-700' : 'text-red-700'}`}>
              {record.victory ? '胜利' : '失败'}
            </div>
            <div className="text-sm text-gray-500">
              角色 #{record.warriorId} vs 敌人 #{record.enemyId}
            </div>
          </div>
        </div>
        <div className="text-right">
          {record.victory ? (
            <div className="font-bold text-yellow-600">
              +{parseFloat(ethers.utils.formatEther(record.reward)).toFixed(2)} WAR
            </div>
          ) : (
            <div className="text-gray-400">无奖励</div>
          )}
          <div className="text-sm text-gray-500">
            +{parseFloat(ethers.utils.formatEther(record.experienceGained)).toFixed(2)} EXP
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(record.timestamp)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        战力: {record.playerPower} vs {record.enemyPower} | 
        胜率: {record.winProbability}% | 
        {record.elementRelation}
      </div>
    </div>
  );
}
