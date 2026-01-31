import React from 'react';
import { ethers } from 'ethers';
import { ELEMENTS, STAR_NAMES } from '../utils/contracts';

export function MarketItemCard({ item, type, onBuy, onCancel, isOwner }) {
  const isAuction = type === 'auction';
  const element = ELEMENTS[item.element] || ELEMENTS[0];
  const starInfo = STAR_NAMES[item.stars] || STAR_NAMES[0];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border border-gray-200">
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{element.icon}</span>
          <span className="font-bold">#{item.tokenId}</span>
        </div>
        <span className={`${element.color} text-white px-2 py-0.5 rounded-full text-xs`}>
          {element.cn}
        </span>
      </div>

      {/* NFT信息 */}
      <div className="text-center mb-3">
        <div className="font-bold">{item.name || `NFT #${item.tokenId}`}</div>
        {item.stars !== undefined && (
          <div className="flex items-center justify-center space-x-1 mt-1">
            <span style={{ color: starInfo.color }}>{starInfo.stars}</span>
            <span className="text-xs" style={{ color: starInfo.color }}>
              {starInfo.name}
            </span>
          </div>
        )}
      </div>

      {/* 卖家信息 */}
      <div className="text-xs text-gray-500 mb-2">
        卖家: {item.seller?.slice(0, 6)}...{item.seller?.slice(-4)}
      </div>

      {/* 价格信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        {isAuction ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">起拍价</span>
              <span className="font-bold">{ethers.utils.formatEther(item.startPrice)} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">当前出价</span>
              <span className="font-bold text-blue-600">
                {item.highestBid > 0 
                  ? `${ethers.utils.formatEther(item.highestBid)} ETH` 
                  : '暂无出价'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">结束时间</span>
              <span className="text-xs">
                {new Date(item.endTime * 1000).toLocaleDateString()}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">价格</span>
            <span className="text-xl font-bold text-green-600">
              {ethers.utils.formatEther(item.price)} ETH
            </span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        {isOwner ? (
          <button
            onClick={() => onCancel(item.id)}
            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
          >
            取消上架
          </button>
        ) : (
          <button
            onClick={() => onBuy(item)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
          >
            {isAuction ? '出价' : '购买'}
          </button>
        )}
      </div>
    </div>
  );
}
