import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { getElementType } from '../utils/contracts';
import toast from 'react-hot-toast';

export function useGameData() {
  const { contracts, account } = useWeb3();
  const [warriors, setWarriors] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [dustBalance, setDustBalance] = useState({ low: 0, four: 0, five: 0 });
  const [warBalance, setWarBalance] = useState('0');
  const [battleStats, setBattleStats] = useState({ total: 0, wins: 0, losses: 0, winRate: 0 });
  const [battleHistory, setBattleHistory] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载 WAR 余额
  const loadWarBalance = useCallback(async () => {
    if (!contracts.warToken || !account) return;
    try {
      const balance = await contracts.warToken.balanceOf(account);
      setWarBalance(parseFloat(ethers.utils.formatEther(balance)).toFixed(2));
    } catch (error) {
      console.error('加载余额失败:', error);
    }
  }, [contracts.warToken, account]);

  // 加载灰尘余额
  const loadDustBalance = useCallback(async () => {
    if (!contracts.weaponNFT || !account) return;
    try {
      const dust = await contracts.weaponNFT.getDustSupplies(account);
      setDustBalance({
        low: parseInt(dust.low.toString()),
        four: parseInt(dust.four.toString()),
        five: parseInt(dust.five.toString())
      });
    } catch (e) {
      console.warn('加载灰尘余额失败:', e.message);
    }
  }, [contracts.weaponNFT, account]);

  // 加载角色列表
  const loadWarriors = useCallback(async () => {
    if (!contracts.warriorNFT || !contracts.battleSystem || !account) return;
    setIsLoading(true);
    try {
      // 使用 getWarriorsByOwner 获取用户所有角色
      const warriorIds = await contracts.warriorNFT.getWarriorsByOwner(account);
      console.log('getWarriorsByOwner 返回:', warriorIds.map(id => id.toString()));
      
      const warriorList = [];

      for (const id of warriorIds) {
        // 跳过 ID 为 0 的无效角色
        if (id.toString() === '0') {
          console.log('跳过无效角色 ID: 0');
          continue;
        }
        
        try {
          // 验证角色所有权
          const owner = await contracts.warriorNFT.ownerOf(id);
          if (owner.toLowerCase() !== account.toLowerCase()) {
            console.log(`角色 #${id} 不属于当前用户，跳过`);
            continue;
          }
          
          const info = await contracts.warriorNFT.getWarriorInfo(id);
          const stamina = await contracts.battleSystem.getCurrentStamina(id);
          const elementType = getElementType(info.elementName);

          warriorList.push({
            id: id.toString(),
            level: info.level.toString(),
            power: info.power.toString(),
            experience: parseFloat(ethers.utils.formatEther(info.experience)).toFixed(0),
            requiredExp: parseFloat(ethers.utils.formatEther(info.requiredExp)).toFixed(0),
            stamina: stamina.toString(),
            element: elementType,
            elementName: info.elementName,
            battlesWon: info.battlesWon.toString(),
            battlesLost: info.battlesLost.toString(),
            progressPercentage: info.progressPercentage.toString()
          });
        } catch (e) {
          console.error(`加载角色 ${id} 失败:`, e);
        }
      }

      setWarriors(warriorList);
    } catch (error) {
      console.error('加载角色失败:', error);
      toast.error('加载角色失败');
    } finally {
      setIsLoading(false);
    }
  }, [contracts.warriorNFT, contracts.battleSystem, account]);

  // 加载武器列表 - 使用多种方式尝试获取
  const loadWeapons = useCallback(async () => {
    if (!contracts.weaponNFT || !account) return;
    setIsLoading(true);
    try {
      let weaponIds = [];
      
      // 方式1: 尝试使用 getWeaponsByOwner (新添加的函数)
      try {
        const result = await contracts.weaponNFT.getWeaponsByOwner(account);
        weaponIds = result.map(id => id.toString());
        console.log('通过 getWeaponsByOwner 获取到武器:', weaponIds);
      } catch (e) {
        console.log('getWeaponsByOwner 不可用:', e.message);
      }
      
      // 方式2: 尝试使用 nextWeaponId 遍历查询
      if (weaponIds.length === 0) {
        try {
          const nextId = await contracts.weaponNFT.nextWeaponId();
          const maxId = parseInt(nextId.toString());
          console.log('最大武器ID:', maxId);
          
          // 只检查最近的50个武器（避免太多请求）
          const checkStart = Math.max(1, maxId - 50);
          
          for (let i = checkStart; i <= maxId; i++) {
            try {
              const balance = await contracts.weaponNFT.balanceOf(account, i);
              if (balance.gt(0)) {
                weaponIds.push(i.toString());
              }
            } catch (e) {
              // 忽略单个查询错误
            }
          }
          console.log('通过遍历获取到武器:', weaponIds);
        } catch (e) {
          console.log('遍历查询失败:', e.message);
        }
      }

      const weaponList = [];
      for (const id of weaponIds) {
        try {
          const info = await contracts.weaponNFT.getWeaponInfo(id);
          const isArray = Array.isArray(info);
          const getValue = (index, name) => isArray ? info[index] : info[name];

          weaponList.push({
            id: id.toString(),
            name: getValue(0, 'name'),
            elementName: getValue(1, 'elementName'),
            stars: parseInt(getValue(2, 'stars')),
            stat1: parseInt(getValue(3, 'stat1')),
            stat2: parseInt(getValue(4, 'stat2')),
            stat3: parseInt(getValue(5, 'stat3')),
            level: parseInt(getValue(6, 'level')),
            basePower: getValue(7, 'basePower').toString(),
            equippedBy: getValue(8, 'equippedBy').toString(),
            weaponType: getValue(9, 'weaponType'),
            currentDurability: parseInt(getValue(10, 'currentDurability')),
            maxDurability: parseInt(getValue(11, 'maxDurability')),
            broken: getValue(12, 'broken'),
            element: getElementType(getValue(1, 'elementName'))
          });
        } catch (e) {
          console.error(`加载武器 ${id} 失败:`, e);
        }
      }

      console.log('最终武器列表:', weaponList);
      setWeapons(weaponList);
      await loadDustBalance();
    } catch (error) {
      console.error('加载武器失败:', error);
      toast.error('加载武器失败');
    } finally {
      setIsLoading(false);
    }
  }, [contracts.weaponNFT, account, loadDustBalance]);

  // 加载战斗统计
  const loadBattleStats = useCallback(async () => {
    if (!contracts.battleSystem || !account) return;
    try {
      const stats = await contracts.battleSystem.getBattleStatistics(account);
      const total = parseInt(stats.totalBattles.toString());
      const wins = parseInt(stats.wins.toString());
      const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
      
      setBattleStats({
        total,
        wins,
        losses: parseInt(stats.losses.toString()),
        winRate: rate,
        totalRewards: ethers.utils.formatEther(stats.totalRewards),
        totalExperience: ethers.utils.formatEther(stats.totalExperience)
      });
    } catch (error) {
      console.error('加载战斗统计失败:', error);
    }
  }, [contracts.battleSystem, account]);

  // 加载战斗历史
  const loadBattleHistory = useCallback(async () => {
    if (!contracts.battleSystem || !account) return;
    try {
      const history = await contracts.battleSystem.getPlayerBattleHistory(account);
      setBattleHistory(history.reverse());
    } catch (error) {
      console.error('加载战斗历史失败:', error);
    }
  }, [contracts.battleSystem, account]);

  // 加载敌人列表
  const loadEnemies = useCallback(async (warriorId) => {
    if (!contracts.battleSystem || !contracts.enemyLibrary || !warriorId) return;
    setIsLoading(true);
    try {
      const enemyIds = await contracts.battleSystem.getRecommendedEnemies(warriorId);
      const enemyList = [];

      for (const id of enemyIds) {
        try {
          const enemyData = await contracts.enemyLibrary.getEnemyDetails(id);
          const getValue = (index, name) => Array.isArray(enemyData) ? enemyData[index] : enemyData[name];
          
          const enemy = {
            id: getValue(0, 'id').toString(),
            difficulty: parseInt(getValue(1, 'difficulty')),
            element: parseInt(getValue(2, 'element')),
            basePower: getValue(3, 'basePower').toString(),
            rewardMultiplier: getValue(4, 'rewardMultiplier').toString(),
            experienceReward: getValue(5, 'experienceReward').toString(),
            active: getValue(6, 'active')
          };
          
          const warrior = warriors.find(w => w.id === warriorId.toString());
          if (warrior) {
            const warriorPower = parseInt(warrior.power) || 500;
            const calculatedPower = await contracts.enemyLibrary.calculateEnemyPower(id, warriorPower);
            enemy.calculatedPower = calculatedPower.toString();
          } else {
            enemy.calculatedPower = enemy.basePower;
          }
          
          const elementNames = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
          const difficultyNames = ['Easy', 'Normal', 'Medium', 'Hard', 'Boss'];
          enemy.name = `${elementNames[enemy.element]} ${difficultyNames[enemy.difficulty]} #${enemy.id}`;
          enemy.description = `A ${difficultyNames[enemy.difficulty]} enemy with ${elementNames[enemy.element]} element.`;
          enemy.imageUri = '';
          enemy.abilities = [];
          
          enemyList.push(enemy);
        } catch (e) {
          console.error(`加载敌人 ${id} 失败:`, e);
        }
      }

      setEnemies(enemyList);
    } catch (error) {
      console.error('加载敌人失败:', error);
      toast.error('加载敌人失败');
    } finally {
      setIsLoading(false);
    }
  }, [contracts.battleSystem, contracts.enemyLibrary, warriors]);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadWarBalance(),
      loadWarriors(),
      loadWeapons(),
      loadBattleStats(),
      loadBattleHistory()
    ]);
  }, [loadWarBalance, loadWarriors, loadWeapons, loadBattleStats, loadBattleHistory]);

  return {
    warriors,
    weapons,
    dustBalance,
    warBalance,
    battleStats,
    battleHistory,
    enemies,
    isLoading,
    loadWarBalance,
    loadWarriors,
    loadWeapons,
    loadDustBalance,
    loadBattleStats,
    loadBattleHistory,
    loadEnemies,
    loadAllData,
    setWeapons
  };
}
