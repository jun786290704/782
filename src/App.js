import React, { useState, useEffect } from 'react';
import { useWeb3 } from './contexts/Web3Context';
import { useGameData } from './hooks/useGameData';
import { Navbar } from './components/Navbar';
import { StatsCard } from './components/StatsCard';
import { Warriors } from './pages/Warriors';
import { Weapons } from './pages/Weapons';
import { Battle } from './pages/Battle';
import { History } from './pages/History';
import { Marketplace } from './pages/Marketplace';
import { Admin } from './pages/Admin';
import { Toaster } from 'react-hot-toast';

function App() {
  const { isConnected, connectWallet } = useWeb3();
  const {
    warriors,
    weapons,
    dustBalance,
    warBalance,
    battleStats,
    battleHistory,
    enemies,
    isLoading,
    loadWarriors,
    loadWeapons,
    loadDustBalance,
    loadBattleStats,
    loadBattleHistory,
    loadEnemies,
    loadAllData,
    loadWarBalance
  } = useGameData();

  const [activeTab, setActiveTab] = useState('warriors');

  // 连接后加载数据
  useEffect(() => {
    if (isConnected) {
      loadAllData();
    }
  }, [isConnected, loadAllData]);

  // 标签页配置
  const tabs = [
    { id: 'warriors', label: '🧙‍♂️ 角色', color: 'from-blue-500 to-cyan-400' },
    { id: 'weapons', label: '⚔️ 武器', color: 'from-purple-500 to-pink-400' },
    { id: 'battle', label: '⚔️ 战斗', color: 'from-orange-500 to-red-400' },
    { id: 'history', label: '📜 历史', color: 'from-green-500 to-emerald-400' },
    { id: 'marketplace', label: '🛒 市场', color: 'from-yellow-500 to-amber-400' },
    { id: 'admin', label: '🛠️ 管理', color: 'from-gray-500 to-slate-400' }
  ];

  // 渲染当前标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'warriors':
        return (
          <Warriors
            warriors={warriors}
            loadWarriors={loadWarriors}
            loadWarBalance={loadWarBalance}
          />
        );
      case 'weapons':
        return (
          <Weapons
            weapons={weapons}
            warriors={warriors}
            dustBalance={dustBalance}
            loadWeapons={loadWeapons}
            loadDustBalance={loadDustBalance}
            loadWarBalance={loadWarBalance}
          />
        );
      case 'battle':
        return (
          <Battle
            warriors={warriors}
            weapons={weapons}
            enemies={enemies}
            loadEnemies={loadEnemies}
            loadWarriors={loadWarriors}
            loadWeapons={loadWeapons}
            loadBattleStats={loadBattleStats}
            loadBattleHistory={loadBattleHistory}
            loadWarBalance={loadWarBalance}
          />
        );
      case 'history':
        return <History battleHistory={battleHistory} />;
      case 'marketplace':
        return (
          <Marketplace
            warriors={warriors}
            weapons={weapons}
          />
        );
      case 'admin':
        return <Admin />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* 粒子背景 */}
      <div className="particles-bg" />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Navbar warBalance={warBalance} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6 float-animation">🎮</div>
            <h2 className="text-4xl font-black mb-4 text-gradient">五行战斗游戏</h2>
            <p className="text-gray-400 mb-8 text-lg">连接钱包，开启你的五行冒险之旅</p>
            <button
              onClick={connectWallet}
              className="btn-primary text-lg px-10 py-4"
            >
              <span className="mr-2">🔗</span> 连接 MetaMask
            </button>
            
            {/* 特性展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-6 card-hover">
                <div className="text-4xl mb-3">🧙‍♂️</div>
                <h3 className="font-bold text-lg mb-2">收集角色</h3>
                <p className="text-gray-400 text-sm">铸造独一无二的五行角色</p>
              </div>
              <div className="glass rounded-2xl p-6 card-hover">
                <div className="text-4xl mb-3">⚔️</div>
                <h3 className="font-bold text-lg mb-2">策略战斗</h3>
                <p className="text-gray-400 text-sm">利用五行相克战胜敌人</p>
              </div>
              <div className="glass rounded-2xl p-6 card-hover">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-bold text-lg mb-2">赚取奖励</h3>
                <p className="text-gray-400 text-sm">战斗胜利获得 WAR 代币</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="我的角色"
                value={warriors.length}
                color="blue"
                icon="🧙‍♂️"
                glow="neon-glow"
              />
              <StatsCard
                title="我的武器"
                value={weapons.length}
                color="purple"
                icon="⚔️"
                glow="neon-glow-purple"
              />
              <StatsCard
                title="战斗次数"
                value={battleStats.total}
                color="orange"
                icon="⚔️"
              />
              <StatsCard
                title="胜率"
                value={`${battleStats.winRate}%`}
                color="green"
                icon="🏆"
                glow="neon-glow-green"
              />
            </div>

            {/* 标签页导航 */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="border-b border-white/10">
                <nav className="flex space-x-2 px-2 py-2 overflow-x-auto" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-btn py-3 px-6 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="min-h-[400px] p-6">
                {isLoading && warriors.length === 0 && weapons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                    </div>
                    <span className="mt-4 text-gray-400">加载中...</span>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="glass-dark mt-12 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            <span className="text-gradient font-bold">五行战斗游戏</span> — Web3 RPG Game | Built with React & Ethers.js
          </p>
          <div className="flex justify-center space-x-4 mt-3 text-xs text-gray-600">
            <span>🏦 国库奖励系统</span>
            <span>•</span>
            <span>⚡ 实时战斗</span>
            <span>•</span>
            <span>🔒 安全可靠</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
