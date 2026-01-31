import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { EnemyCard } from '../components/EnemyCard';
import { ELEMENTS, generateWarriorName } from '../utils/contracts';
import toast from 'react-hot-toast';

export function Battle({ 
  warriors, 
  weapons, 
  enemies, 
  loadEnemies, 
  loadWarriors, 
  loadWeapons, 
  loadBattleStats,
  loadBattleHistory,
  loadWarBalance 
}) {
  const { contracts } = useWeb3();
  const [selectedWarrior, setSelectedWarrior] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [battlePreview, setBattlePreview] = useState(null);
  const [isBattling, setIsBattling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  // 刷新敌人列表
  const refreshEnemies = async () => {
    if (!selectedWarrior) {
      toast.error('请先选择一个角色');
      return;
    }
    await loadEnemies(selectedWarrior);
    setSelectedEnemy(null);
    setBattlePreview(null);
  };

  // 选择敌人
  const handleSelectEnemy = (enemy) => {
    setSelectedEnemy(enemy);
    updateBattlePreview(selectedWarrior, selectedWeapon, enemy.id);
  };

  // 更新战斗预览
  const updateBattlePreview = async (warriorId, weaponId, enemyId) => {
    if (!warriorId || !weaponId || !enemyId) return;

    try {
      const preview = await contracts.battleSystem.getBattlePreview(warriorId, weaponId, enemyId);
      setBattlePreview({
        playerPower: preview.playerPower.toString(),
        enemyPower: preview.enemyPower.toString(),
        winProbability: preview.winProbability.toString(),
        potentialReward: ethers.utils.formatEther(preview.potentialReward),
        potentialExperience: preview.potentialExperience.toString(),
        elementRelation: preview.elementRelation,
        adjustmentReason: preview.adjustmentReason
      });
    } catch (error) {
      console.error('获取战斗预览失败:', error);
    }
  };

  // 处理选择变化
  const handleWarriorChange = (e) => {
    const value = e.target.value;
    setSelectedWarrior(value);
    setSelectedEnemy(null);
    setBattlePreview(null);
    if (value && selectedWeapon && selectedEnemy) {
      updateBattlePreview(value, selectedWeapon, selectedEnemy.id);
    }
  };

  const handleWeaponChange = (e) => {
    const value = e.target.value;
    setSelectedWeapon(value);
    if (selectedWarrior && value && selectedEnemy) {
      updateBattlePreview(selectedWarrior, value, selectedEnemy.id);
    }
  };

  // 开始战斗
  const startBattle = async () => {
    if (!selectedWarrior || !selectedWeapon || !selectedEnemy) {
      toast.error('请选择角色、武器和敌人');
      return;
    }

    setIsBattling(true);
    try {
      // 估算gas
      let gasLimit;
      try {
        const estimatedGas = await contracts.battleSystem.estimateGas.startBattle(
          selectedWarrior, selectedWeapon, selectedEnemy.id
        );
        gasLimit = estimatedGas.mul(120).div(100);
      } catch (e) {
        gasLimit = 2000000;
      }

      const tx = await contracts.battleSystem.startBattle(
        selectedWarrior, selectedWeapon, selectedEnemy.id,
        { gasLimit }
      );

      toast.loading('战斗中...', { id: 'battle' });
      const receipt = await tx.wait();

      // 解析战斗结果
      const battleEvent = receipt.events?.find(e => e.event === 'BattleCompleted');
      const weaponDropEvent = receipt.events?.find(e => e.event === 'WeaponDropped');
      
      if (battleEvent) {
        const { victory, reward, experienceGained } = battleEvent.args;
        
        // 检查是否有武器掉落
        let dropInfo = null;
        if (weaponDropEvent && victory) {
          const { stars, dropSource } = weaponDropEvent.args;
          dropInfo = {
            stars: stars.toNumber(),
            dropSource
          };
        }
        
        setBattleResult({
          victory,
          reward: ethers.utils.formatEther(reward),
          experienceGained: experienceGained.toString(),
          dropInfo
        });
        setShowResult(true);
      }

      toast.dismiss('battle');

      // 刷新数据
      setTimeout(async () => {
        await Promise.all([
          loadWarriors(),
          loadWeapons(),
          loadBattleStats(),
          loadBattleHistory(),
          loadWarBalance()
        ]);
        if (selectedWarrior) {
          await loadEnemies(selectedWarrior);
        }
      }, 1000);
    } catch (error) {
      console.error('战斗失败:', error);
      let errorMsg = error.message;
      if (error.message.includes('Battle cooldown active')) {
        errorMsg = '战斗冷却中，请等待 5 分钟后再试';
      } else if (error.message.includes('Not enough stamina')) {
        errorMsg = '体力不足，请等待体力恢复';
      } else if (error.message.includes('Weapon not usable')) {
        errorMsg = '武器不可用（可能已损坏）';
      }
      toast.error('战斗失败: ' + errorMsg, { id: 'battle' });
    } finally {
      setIsBattling(false);
    }
  };

  // 获取可用的武器列表
  const availableWeapons = weapons.filter(w => !w.broken && w.currentDurability > 0);

  return (
    <div className="p-3 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* 战斗配置 */}
        <div>
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">选择战斗配置</h3>
          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 md:mb-3 flex items-center">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white flex items-center justify-center text-xs mr-2">1</span>
                选择角色
              </label>
              <select
                value={selectedWarrior}
                onChange={handleWarriorChange}
                className="w-full bg-gray-900 border-2 border-gray-700 hover:border-blue-400 rounded-xl px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg cursor-pointer appearance-none text-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="" className="bg-gray-800 text-gray-400 py-2">请选择角色</option>
                {warriors.map((warrior) => {
                  const element = ELEMENTS[warrior.element];
                  const warriorName = generateWarriorName(warrior.id, warrior.element);
                  const elementColors = {
                    0: '#16A34A', // 木 - 绿色
                    1: '#DC2626', // 火 - 红色
                    2: '#D97706', // 土 - 琥珀色
                    3: '#6B7280', // 金 - 灰色
                    4: '#2563EB', // 水 - 蓝色
                  };
                  const color = elementColors[warrior.element] || '#6B7280';
                  return (
                    <option
                      key={warrior.id}
                      value={warrior.id}
                      style={{ color: color, fontWeight: 600 }}
                      className="py-2"
                    >
                      {element.icon} {warriorName} Lv.{warrior.level} {warrior.elementName}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 md:mb-3 flex items-center">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white flex items-center justify-center text-xs mr-2">2</span>
                选择武器
              </label>
              <select
                value={selectedWeapon}
                onChange={handleWeaponChange}
                className="w-full bg-gray-900 border-2 border-gray-700 hover:border-orange-400 rounded-xl px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-lg cursor-pointer appearance-none text-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="" className="bg-gray-800 text-gray-400 py-2">请选择武器</option>
                {availableWeapons.map((weapon) => {
                  const element = ELEMENTS[weapon.element];
                  const stars = '⭐'.repeat(weapon.stars + 1);
                  const elementColors = {
                    0: '#16A34A', // 木 - 绿色
                    1: '#DC2626', // 火 - 红色
                    2: '#D97706', // 土 - 琥珀色
                    3: '#6B7280', // 金 - 灰色
                    4: '#2563EB', // 水 - 蓝色
                  };
                  const color = elementColors[weapon.element] || '#6B7280';
                  return (
                    <option
                      key={weapon.id}
                      value={weapon.id}
                      style={{ color: color, fontWeight: 600 }}
                      className="py-2"
                    >
                      {element.icon} {weapon.name} {stars} (战力:{weapon.basePower})
                    </option>
                  );
                })}
              </select>
              {weapons.length > 0 && availableWeapons.length === 0 && (
                <p className="text-xs md:text-sm text-red-500 mt-1">
                  没有可用的武器，请先修理损坏的武器
                </p>
              )}
            </div>
            <button
              onClick={refreshEnemies}
              disabled={!selectedWarrior}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm md:text-base"
            >
              🔄 刷新敌人列表
            </button>
          </div>
        </div>

        {/* 敌人列表 */}
        <div>
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">选择敌人</h3>
          <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
            {enemies.length === 0 ? (
              <div className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">
                {selectedWarrior ? '点击刷新获取敌人列表' : '请先选择角色'}
              </div>
            ) : (
              enemies.map((enemy) => (
                <EnemyCard
                  key={enemy.id}
                  enemy={enemy}
                  isSelected={selectedEnemy?.id === enemy.id}
                  onSelect={handleSelectEnemy}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 战斗预览 */}
      {battlePreview && (
        <div className="mt-4 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">⚔️ 战斗预览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-500">玩家战力</div>
              <div className="text-xl md:text-2xl font-bold text-blue-600">{battlePreview.playerPower}</div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-500">敌人战力</div>
              <div className="text-xl md:text-2xl font-bold text-red-600">{battlePreview.enemyPower}</div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-500">胜率</div>
              <div className="text-xl md:text-2xl font-bold text-green-600">{battlePreview.winProbability}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-500">潜在奖励</div>
              <div className="text-lg md:text-2xl font-bold text-yellow-600">
                {parseFloat(battlePreview.potentialReward).toFixed(2)} WAR
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              {battlePreview.elementRelation} - {battlePreview.adjustmentReason}
            </div>
            <button
              onClick={startBattle}
              disabled={isBattling}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-base md:text-lg font-medium px-6 md:px-8 py-2.5 md:py-3 rounded-lg transition-colors w-full md:w-auto"
            >
              {isBattling ? '战斗中...' : '开始战斗！'}
            </button>
          </div>
        </div>
      )}

      {/* 战斗结果弹窗 */}
      {showResult && battleResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-5xl md:text-6xl mb-3 md:mb-4">
                {battleResult.victory ? '🏆' : '💀'}
              </div>
              <h3 className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 ${battleResult.victory ? 'text-green-600' : 'text-red-600'}`}>
                {battleResult.victory ? '战斗胜利！' : '战斗失败'}
              </h3>
              <div className="space-y-2 mb-4 md:mb-6">
                {battleResult.victory ? (
                  <div className="text-yellow-600 font-bold text-lg md:text-xl">
                    +{parseFloat(battleResult.reward).toFixed(2)} WAR
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm md:text-base">没有获得 WAR 奖励</div>
                )}
                <div className="text-blue-600 text-sm md:text-base">
                  +{parseFloat(battleResult.experienceGained).toFixed(2)} EXP
                </div>
                
                {/* 武器掉落显示 */}
                {battleResult.dropInfo && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">🎁</span>
                      <span className="font-bold text-purple-700">武器掉落!</span>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-xl">{'⭐'.repeat(battleResult.dropInfo.stars)}</span>
                      <div className="text-xs text-gray-600 mt-1">
                        {battleResult.dropInfo.dropSource}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowResult(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 md:px-8 py-2 rounded-lg transition-colors w-full md:w-auto"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
