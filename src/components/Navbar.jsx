import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export function Navbar({ warBalance }) {
  const { account, isConnected, connectWallet, disconnect } = useWeb3();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
              ⚔️
            </div>
            <div>
              <h1 className="text-xl font-black text-gradient">五行战斗</h1>
              <p className="text-xs text-gray-400 -mt-1">Five Elements Battle</p>
            </div>
            {isConnected && (
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                ● 已连接
              </span>
            )}
          </div>

          {/* 右侧内容 */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-yellow-400 text-lg">💰</span>
                <div>
                  <span className="text-gray-400 text-xs block">WAR 余额</span>
                  <span className="font-mono font-bold text-white">{warBalance}</span>
                </div>
              </div>
            )}

            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                  <span className="text-sm font-mono text-indigo-300">
                    {formatAddress(account)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all"
                  title="断开连接"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>连接钱包</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
