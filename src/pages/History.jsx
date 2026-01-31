import React from 'react';
import { BattleHistoryItem } from '../components/BattleHistoryItem';

export function History({ battleHistory }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">战斗历史</h3>
      
      {battleHistory.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-6xl mb-4">📜</div>
          <p>暂无战斗记录</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {battleHistory.map((record, index) => (
            <BattleHistoryItem key={index} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
