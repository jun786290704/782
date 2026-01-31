import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { CONTRACTS, ABI } from '../utils/contracts';
import toast from 'react-hot-toast';

export function Admin() {
  const { account, signer } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  // 合约实例
  const [contracts, setContracts] = useState({});
  
  // 系统概览数据
  const [systemStats, setSystemStats] = useState({
    treasuryBalance: '0',
    totalWarriors: '0',
    totalWeapons: '0',
    nextBattleId: '0',
    isPaused: false
  });
  
  // 当前参数
  const [currentParams, setCurrentParams] = useState({
    warriorMintPrice: '0',
    weaponMintPrice: '0',
    baseBattleReward: '0',
    battleCooldown: '0',
    staminaCost: '0',
    maxStamina: '0',
    staminaRecoveryTime: '0',
    baseExperience: '0'
  });
  
  // 功能开关状态
  const [features, setFeatures] = useState({
    mintingEnabled: false,
    battleEnabled: false,
    marketplaceEnabled: false
  });
  
  // 表单数据
  const [formData, setFormData] = useState({
    warriorMintPrice: '',
    weaponMintPrice: '',
    baseBattleReward: '',
    battleCooldown: '',
    staminaCost: '',
    maxStamina: '',
    staminaRecoveryTime: '',
    marketplaceFeeRate: '',
    treasuryDeposit: '',
    treasuryWithdraw: '',
    grantRoleAddress: '',
    revokeRoleAddress: '',
    baseExperience: ''
  });

  // 初始化合约
  useEffect(() => {
    if (signer) {
      try {
        // 确保地址格式正确
        const checksummedAddresses = {
          gameManager: ethers.utils.getAddress(CONTRACTS.GameManager),
          treasury: ethers.utils.getAddress(CONTRACTS.Treasury),
          warriorNFT: ethers.utils.getAddress(CONTRACTS.WarriorNFT),
          weaponNFT: ethers.utils.getAddress(CONTRACTS.WeaponNFT),
          battleSystem: ethers.utils.getAddress(CONTRACTS.BattleSystemLocal),
          warToken: ethers.utils.getAddress(CONTRACTS.WarToken)
        };
        
        setContracts({
          gameManager: new ethers.Contract(checksummedAddresses.gameManager, ABI.GameManager, signer),
          treasury: new ethers.Contract(checksummedAddresses.treasury, ABI.Treasury, signer),
          warriorNFT: new ethers.Contract(checksummedAddresses.warriorNFT, ABI.WarriorNFT, signer),
          weaponNFT: new ethers.Contract(checksummedAddresses.weaponNFT, ABI.WeaponNFT, signer),
          battleSystem: new ethers.Contract(checksummedAddresses.battleSystem, ABI.BattleSystemLocal, signer),
          warToken: new ethers.Contract(checksummedAddresses.warToken, ABI.WarToken, signer)
        });
      } catch (error) {
        console.error('初始化合约失败:', error);
        toast.error('合约初始化失败: ' + error.message);
      }
    }
  }, [signer]);

  // 检查管理员权限
  useEffect(() => {
    const checkAdmin = async () => {
      if (!contracts.gameManager || !account) return;
      
      try {
        const adminRole = await contracts.gameManager.GAME_ADMIN();
        const hasGameAdmin = await contracts.gameManager.hasRole(adminRole, account);
        const defaultAdminRole = await contracts.gameManager.DEFAULT_ADMIN_ROLE();
        const hasDefaultAdmin = await contracts.gameManager.hasRole(defaultAdminRole, account);
        
        const isAuthorized = hasGameAdmin || hasDefaultAdmin;
        setIsAdmin(isAuthorized);
        
        if (isAuthorized) {
          loadAllData();
        }
      } catch (error) {
        console.error('检查管理员权限失败:', error);
      }
    };
    
    checkAdmin();
  }, [contracts.gameManager, account]);

  // 加载所有数据
  const loadAllData = async () => {
    await Promise.all([
      loadSystemStats(),
      loadParams(),
      loadFeatures()
    ]);
  };

  // 加载系统统计数据
  const loadSystemStats = async () => {
    try {
      // 国库余额
      const balance = await contracts.treasury.getTreasuryBalance();
      
      // 总角色数
      const warriorStats = await contracts.warriorNFT.getContractStats();
      
      // 总武器数
      const weaponCount = await contracts.weaponNFT.nextWeaponId();
      
      // 战斗ID
      const battleId = await contracts.battleSystem.nextBattleId();
      
      // 暂停状态
      const paused = await contracts.gameManager.paused();
      
      setSystemStats({
        treasuryBalance: ethers.utils.formatEther(balance),
        totalWarriors: warriorStats[0].toString(),
        totalWeapons: weaponCount.toString(),
        nextBattleId: battleId.toString(),
        isPaused: paused
      });
    } catch (error) {
      console.error('加载系统统计失败:', error);
    }
  };

  // 加载参数
  const loadParams = async () => {
    if (!contracts.gameManager) return;
    
    try {
      const params = await contracts.gameManager.getGameParameters();
      const config = await contracts.battleSystem.getContractConfig();
      
      setCurrentParams({
        warriorMintPrice: ethers.utils.formatEther(params.warriorMintPrice),
        weaponMintPrice: ethers.utils.formatEther(params.weaponMintPrice),
        baseBattleReward: ethers.utils.formatEther(config.reward),
        battleCooldown: config.cooldown.toString(),
        staminaCost: config.stamina.toString(),
        maxStamina: params.maxStamina.toString(),
        staminaRecoveryTime: params.staminaRecoveryTime.toString(),
        baseExperience: ethers.utils.formatEther(config.experience)
      });
    } catch (error) {
      console.error('加载参数失败:', error);
    }
  };

  // 加载功能开关
  const loadFeatures = async () => {
    if (!contracts.gameManager) return;
    
    try {
      const status = await contracts.gameManager.getFeatureStatus();
      setFeatures({
        mintingEnabled: status._mintingEnabled,
        battleEnabled: status._battleEnabled,
        marketplaceEnabled: status._marketplaceEnabled
      });
    } catch (error) {
      console.error('加载功能开关失败:', error);
    }
  };

  // 国库充值
  const depositToTreasury = async () => {
    if (!formData.treasuryDeposit) return;
    
    setIsLoading(true);
    try {
      const amount = ethers.utils.parseEther(formData.treasuryDeposit);
      
      // 先授权
      const approveTx = await contracts.warToken.approve(CONTRACTS.Treasury, amount);
      await approveTx.wait();
      
      // 存款
      const tx = await contracts.treasury.deposit(amount);
      await tx.wait();
      
      toast.success(`成功充值 ${formData.treasuryDeposit} WAR 到国库`);
      setFormData(prev => ({ ...prev, treasuryDeposit: '' }));
      loadSystemStats();
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 国库提取
  const withdrawFromTreasury = async () => {
    if (!formData.treasuryWithdraw) return;
    
    setIsLoading(true);
    try {
      const amount = ethers.utils.parseEther(formData.treasuryWithdraw);
      const tx = await contracts.treasury.withdraw(amount);
      await tx.wait();
      
      toast.success(`成功从国库提取 ${formData.treasuryWithdraw} WAR`);
      setFormData(prev => ({ ...prev, treasuryWithdraw: '' }));
      loadSystemStats();
    } catch (error) {
      console.error('提取失败:', error);
      toast.error('提取失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 授予角色
  const grantRole = async (roleType) => {
    if (!formData.grantRoleAddress) return;
    
    setIsLoading(true);
    try {
      let tx;
      if (roleType === 'gameAdmin') {
        const role = await contracts.gameManager.GAME_ADMIN();
        tx = await contracts.gameManager.grantRole(role, formData.grantRoleAddress);
      } else if (roleType === 'rewardDistributor') {
        const role = await contracts.treasury.REWARD_DISTRIBUTOR_ROLE();
        tx = await contracts.treasury.grantRole(role, formData.grantRoleAddress);
      }
      await tx.wait();
      
      toast.success(`已成功授予角色`);
      setFormData(prev => ({ ...prev, grantRoleAddress: '' }));
    } catch (error) {
      console.error('授予角色失败:', error);
      toast.error('授予角色失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新铸造价格
  const updateMintPrices = async () => {
    if (!contracts.gameManager) return;
    
    setIsLoading(true);
    try {
      if (formData.warriorMintPrice) {
        const tx = await contracts.gameManager.setWarriorMintPrice(
          ethers.utils.parseEther(formData.warriorMintPrice)
        );
        await tx.wait();
        toast.success('角色铸造价格已更新');
      }
      
      if (formData.weaponMintPrice) {
        const tx = await contracts.gameManager.setWeaponMintPrice(
          ethers.utils.parseEther(formData.weaponMintPrice)
        );
        await tx.wait();
        toast.success('武器铸造价格已更新');
      }
      
      loadParams();
      setFormData(prev => ({ ...prev, warriorMintPrice: '', weaponMintPrice: '' }));
    } catch (error) {
      console.error('更新铸造价格失败:', error);
      toast.error('更新失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新战斗参数（简化版 - 直接使用 BattleSystem 合约）
  const updateBattleParams = async () => {
    if (!contracts.battleSystem) return;
    
    setIsLoading(true);
    try {
      if (formData.baseBattleReward) {
        const tx = await contracts.battleSystem.setBaseReward(
          ethers.utils.parseEther(formData.baseBattleReward)
        );
        await tx.wait();
        toast.success('基础战斗奖励已更新');
      }
      
      if (formData.battleCooldown) {
        const tx = await contracts.battleSystem.setBattleCooldown(
          parseInt(formData.battleCooldown)
        );
        await tx.wait();
        toast.success('战斗冷却已更新');
      }
      
      if (formData.staminaCost) {
        const tx = await contracts.battleSystem.setStaminaCost(
          parseInt(formData.staminaCost)
        );
        await tx.wait();
        toast.success('体力消耗已更新');
      }
      
      if (formData.baseExperience) {
        const tx = await contracts.battleSystem.setBaseExperience(
          ethers.utils.parseEther(formData.baseExperience)
        );
        await tx.wait();
        toast.success('基础经验值已更新');
      }
      
      loadParams();
      setFormData(prev => ({
        ...prev,
        baseBattleReward: '',
        battleCooldown: '',
        staminaCost: '',
        baseExperience: ''
      }));
    } catch (error) {
      console.error('更新战斗参数失败:', error);
      toast.error('更新失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换功能开关
  const toggleFeature = async (feature, enabled) => {
    if (!contracts.gameManager) return;
    
    setIsLoading(true);
    try {
      let tx;
      switch (feature) {
        case 'minting':
          tx = await contracts.gameManager.setMintingEnabled(enabled);
          break;
        case 'battle':
          tx = await contracts.gameManager.setBattleEnabled(enabled);
          break;
        case 'marketplace':
          tx = await contracts.gameManager.setMarketplaceEnabled(enabled);
          break;
        default:
          return;
      }
      await tx.wait();
      toast.success(`${feature} 已${enabled ? '启用' : '禁用'}`);
      loadFeatures();
    } catch (error) {
      console.error('切换功能失败:', error);
      toast.error('操作失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新市场费率
  const updateMarketplaceFee = async () => {
    if (!contracts.gameManager || !formData.marketplaceFeeRate) return;
    
    setIsLoading(true);
    try {
      const feeRate = parseInt(formData.marketplaceFeeRate) * 100;
      const tx = await contracts.gameManager.setMarketplaceFeeRate(feeRate);
      await tx.wait();
      toast.success('市场费率已更新');
      setFormData(prev => ({ ...prev, marketplaceFeeRate: '' }));
    } catch (error) {
      console.error('更新市场费率失败:', error);
      toast.error('更新失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 暂停/恢复合约
  const togglePause = async (pause) => {
    if (!contracts.gameManager) return;
    
    setIsLoading(true);
    try {
      const tx = pause ? await contracts.gameManager.pause() : await contracts.gameManager.unpause();
      await tx.wait();
      toast.success(pause ? '合约已暂停' : '合约已恢复');
      loadSystemStats();
    } catch (error) {
      console.error('暂停操作失败:', error);
      toast.error('操作失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 紧急提取（仅紧急情况）
  const emergencyWithdraw = async () => {
    if (!window.confirm('确定要执行紧急提取吗？这将提取国库中的所有资金。')) return;
    
    setIsLoading(true);
    try {
      const tx = await contracts.treasury.emergencyWithdraw();
      await tx.wait();
      toast.success('紧急提取成功');
      loadSystemStats();
    } catch (error) {
      console.error('紧急提取失败:', error);
      toast.error('紧急提取失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">无访问权限</h2>
        <p className="text-gray-600">只有游戏管理员才能访问此页面</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: '📊 系统概览', icon: '📊' },
    { id: 'treasury', label: '💰 国库管理', icon: '💰' },
    { id: 'prices', label: '💵 铸造价格', icon: '💵' },
    { id: 'battle', label: '⚔️ 战斗参数', icon: '⚔️' },
    { id: 'features', label: '🔧 功能开关', icon: '🔧' },
    { id: 'market', label: '🏪 市场设置', icon: '🏪' },
    { id: 'roles', label: '👥 权限管理', icon: '👥' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🛠️ 游戏管理</h2>
          <p className="text-gray-600 mt-1">管理游戏参数、国库和权限</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => togglePause(true)}
            disabled={isLoading || systemStats.isPaused}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            ⏸️ 暂停合约
          </button>
          <button
            onClick={() => togglePause(false)}
            disabled={isLoading || !systemStats.isPaused}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            ▶️ 恢复合约
          </button>
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>

      {/* 暂停状态警告 */}
      {systemStats.isPaused && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <div>
            <p className="font-bold">合约已暂停</p>
            <p className="text-sm">所有游戏功能暂时不可用，请点击"恢复合约"按钮恢复。</p>
          </div>
        </div>
      )}

      {/* 导航标签 */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {navItems.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeSection === section.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* 系统概览 */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-blue-100 text-sm mb-1">国库余额</p>
            <p className="text-3xl font-bold">{parseFloat(systemStats.treasuryBalance).toLocaleString()} WAR</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <p className="text-purple-100 text-sm mb-1">总角色数</p>
            <p className="text-3xl font-bold">{systemStats.totalWarriors}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <p className="text-orange-100 text-sm mb-1">总武器数</p>
            <p className="text-3xl font-bold">{systemStats.totalWeapons}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <p className="text-green-100 text-sm mb-1">战斗次数</p>
            <p className="text-3xl font-bold">{systemStats.nextBattleId}</p>
          </div>
          
          {/* 功能状态 */}
          <div className="col-span-full bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">功能状态</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: '铸造', enabled: features.mintingEnabled, color: 'blue' },
                { key: '战斗', enabled: features.battleEnabled, color: 'orange' },
                { key: '市场', enabled: features.marketplaceEnabled, color: 'purple' }
              ].map(item => (
                <div key={item.key} className={`p-4 rounded-lg ${item.enabled ? `bg-${item.color}-100` : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.key}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${item.enabled ? `bg-${item.color}-500 text-white` : 'bg-gray-400 text-white'}`}>
                      {item.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 当前参数 */}
          <div className="col-span-full bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">当前参数</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">角色铸造</p>
                <p className="text-xl font-bold text-blue-600">{currentParams.warriorMintPrice} WAR</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">武器铸造</p>
                <p className="text-xl font-bold text-purple-600">{currentParams.weaponMintPrice} WAR</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">战斗奖励</p>
                <p className="text-xl font-bold text-green-600">{currentParams.baseBattleReward} WAR</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">基础经验</p>
                <p className="text-xl font-bold text-pink-600">{currentParams.baseExperience} EXP</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">体力消耗</p>
                <p className="text-xl font-bold text-red-600">{currentParams.staminaCost}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">冷却时间</p>
                <p className="text-xl font-bold text-orange-600">{currentParams.battleCooldown}s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 国库管理 */}
      {activeSection === 'treasury' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">国库信息</h3>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <p className="text-sm text-blue-600 mb-1">当前国库余额</p>
              <p className="text-4xl font-bold text-blue-700">{parseFloat(systemStats.treasuryBalance).toLocaleString()} WAR</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 充值 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">💰 充值国库</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.treasuryDeposit}
                    onChange={(e) => setFormData(prev => ({ ...prev, treasuryDeposit: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="输入 WAR 数量"
                  />
                  <button
                    onClick={depositToTreasury}
                    disabled={isLoading || !formData.treasuryDeposit}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    充值
                  </button>
                </div>
              </div>
              
              {/* 提取 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">🏧 提取资金</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.treasuryWithdraw}
                    onChange={(e) => setFormData(prev => ({ ...prev, treasuryWithdraw: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="输入 WAR 数量"
                  />
                  <button
                    onClick={withdrawFromTreasury}
                    disabled={isLoading || !formData.treasuryWithdraw}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    提取
                  </button>
                </div>
              </div>
            </div>
            
            {/* 紧急提取 */}
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">⚠️ 紧急提取</h4>
              <p className="text-sm text-red-600 mb-3">仅在紧急情况下使用，将提取国库中的所有资金到管理员账户。</p>
              <button
                onClick={emergencyWithdraw}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                执行紧急提取
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 铸造价格设置 */}
      {activeSection === 'prices' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">铸造价格设置</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">当前角色铸造价格</p>
              <p className="text-2xl font-bold text-blue-600">{currentParams.warriorMintPrice} WAR</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">当前武器铸造价格</p>
              <p className="text-2xl font-bold text-purple-600">{currentParams.weaponMintPrice} WAR</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新角色铸造价格 (WAR)
              </label>
              <input
                type="number"
                value={formData.warriorMintPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, warriorMintPrice: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新武器铸造价格 (WAR)
              </label>
              <input
                type="number"
                value={formData.weaponMintPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, weaponMintPrice: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 10"
              />
            </div>
          </div>
          
          <button
            onClick={updateMintPrices}
            disabled={isLoading || (!formData.warriorMintPrice && !formData.weaponMintPrice)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? '更新中...' : '更新铸造价格'}
          </button>
        </div>
      )}

      {/* 战斗参数设置 */}
      {activeSection === 'battle' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">战斗参数设置</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">基础战斗奖励</p>
              <p className="text-xl font-bold text-green-600">{currentParams.baseBattleReward} WAR</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">基础经验值</p>
              <p className="text-xl font-bold text-pink-600">{currentParams.baseExperience} EXP</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">体力消耗</p>
              <p className="text-xl font-bold text-red-600">{currentParams.staminaCost}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">冷却时间</p>
              <p className="text-xl font-bold text-orange-600">{currentParams.battleCooldown}s</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">最大体力</p>
              <p className="text-xl font-bold text-blue-600">{currentParams.maxStamina}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">体力恢复时间</p>
              <p className="text-xl font-bold text-purple-600">{currentParams.staminaRecoveryTime}s</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">基础战斗奖励 (WAR)</label>
              <input
                type="number"
                value={formData.baseBattleReward}
                onChange={(e) => setFormData(prev => ({ ...prev, baseBattleReward: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">基础经验值 (EXP)</label>
              <input
                type="number"
                value={formData.baseExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, baseExperience: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">战斗冷却 (秒)</label>
              <input
                type="number"
                value={formData.battleCooldown}
                onChange={(e) => setFormData(prev => ({ ...prev, battleCooldown: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">体力消耗</label>
              <input
                type="number"
                value={formData.staminaCost}
                onChange={(e) => setFormData(prev => ({ ...prev, staminaCost: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最大体力</label>
              <input
                type="number"
                value={formData.maxStamina}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStamina: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">体力恢复时间 (秒)</label>
              <input
                type="number"
                value={formData.staminaRecoveryTime}
                onChange={(e) => setFormData(prev => ({ ...prev, staminaRecoveryTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="例如: 300"
              />
            </div>
          </div>
          
          <button
            onClick={updateBattleParams}
            disabled={isLoading}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? '更新中...' : '更新战斗参数'}
          </button>
        </div>
      )}

      {/* 功能开关 */}
      {activeSection === 'features' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">功能开关</h3>
          
          <div className="space-y-4">
            {[
              { key: 'minting', label: '铸造功能', desc: '启用/禁用角色和武器铸造' },
              { key: 'battle', label: '战斗功能', desc: '启用/禁用战斗系统' },
              { key: 'marketplace', label: '市场功能', desc: '启用/禁用交易市场' }
            ].map(feature => (
              <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{feature.label}</p>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
                <button
                  onClick={() => toggleFeature(feature.key, !features[feature.key + 'Enabled'])}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    features[feature.key + 'Enabled']
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-400 hover:bg-gray-500 text-white'
                  }`}
                >
                  {features[feature.key + 'Enabled'] ? '已启用' : '已禁用'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 市场设置 */}
      {activeSection === 'market' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">市场设置</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              市场交易费率 (%)
            </label>
            <input
              type="number"
              value={formData.marketplaceFeeRate}
              onChange={(e) => setFormData(prev => ({ ...prev, marketplaceFeeRate: e.target.value }))}
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="例如: 1 (表示1%)"
              min="0"
              max="10"
              step="0.1"
            />
            <p className="text-sm text-gray-500 mt-1">最高 10%，设置 1 表示 1%</p>
          </div>
          
          <button
            onClick={updateMarketplaceFee}
            disabled={isLoading || !formData.marketplaceFeeRate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? '更新中...' : '更新费率'}
          </button>
        </div>
      )}

      {/* 权限管理 */}
      {activeSection === 'roles' && (
        <div className="space-y-6">
          {/* 授予角色 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">授予角色</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">钱包地址</label>
                <input
                  type="text"
                  value={formData.grantRoleAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, grantRoleAddress: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0x..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => grantRole('gameAdmin')}
                  disabled={isLoading || !formData.grantRoleAddress}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  授予游戏管理员
                </button>
                <button
                  onClick={() => grantRole('rewardDistributor')}
                  disabled={isLoading || !formData.grantRoleAddress}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  授予奖励分发权限
                </button>
              </div>
            </div>
          </div>
          
          {/* 合约地址参考 */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">合约地址参考</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>GameManager:</span> <code className="bg-gray-200 px-2 py-1 rounded">{CONTRACTS.GameManager}</code></div>
              <div className="flex justify-between"><span>Treasury:</span> <code className="bg-gray-200 px-2 py-1 rounded">{CONTRACTS.Treasury}</code></div>
              <div className="flex justify-between"><span>WarriorNFT:</span> <code className="bg-gray-200 px-2 py-1 rounded">{CONTRACTS.WarriorNFT}</code></div>
              <div className="flex justify-between"><span>WeaponNFT:</span> <code className="bg-gray-200 px-2 py-1 rounded">{CONTRACTS.WeaponNFT}</code></div>
              <div className="flex justify-between"><span>BattleSystem:</span> <code className="bg-gray-200 px-2 py-1 rounded">{CONTRACTS.BattleSystemLocal}</code></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
