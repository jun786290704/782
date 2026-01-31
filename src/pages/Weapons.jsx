import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { WeaponCard } from '../components/WeaponCard';
import { ELEMENTS, STAR_NAMES } from '../utils/contracts';
import toast from 'react-hot-toast';

export function Weapons({ 
  weapons, 
  warriors, 
  dustBalance, 
  loadWeapons, 
  loadDustBalance,
  loadWarBalance 
}) {
  const { contracts } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);
  const [showDustModal, setShowDustModal] = useState(false);
  const [reforgeTarget, setReforgeTarget] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [dustInput, setDustInput] = useState({ low: 0, four: 0, five: 0 });
  
  // 筛选和排序状态
  const [filterStars, setFilterStars] = useState('');
  const [filterElement, setFilterElement] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('stars');
  const [sortDesc, setSortDesc] = useState(true);

  // 铸造单把武器
  const mintWeapon = async () => {
    await mintWeaponsBatch(1);
  };

  // 批量铸造武器（使用辅助合约）
  const mintWeaponsBatch = async (count) => {
    if (!contracts.weaponBatchMinter || !contracts.warToken || !contracts.weaponNFT) {
      toast.error('合约未初始化');
      return;
    }

    setIsMinting(true);
    const mintToastId = count === 1 ? 'mintWeapon' : 'mintWeaponsBatch';
    
    try {
      // 从合约获取铸造价格
      let mintPrice;
      try {
        mintPrice = await contracts.weaponNFT.getMintPrice();
      } catch (e) {
        mintPrice = ethers.utils.parseEther('10');
      }
      
      const totalPrice = mintPrice.mul(count);
      const totalPriceInEth = ethers.utils.formatEther(totalPrice);
      
      // 检查对辅助合约的授权状态
      const userAddress = await contracts.warToken.signer.getAddress();
      const batchMinterAddress = contracts.weaponBatchMinter.address;
      const allowance = await contracts.warToken.allowance(
        userAddress,
        batchMinterAddress
      );
      
      // 如果授权不足，进行授权
      if (allowance.lt(totalPrice)) {
        toast.loading(`授权 ${totalPriceInEth} WAR...`, { id: mintToastId });
        const approveTx = await contracts.warToken.approve(
          batchMinterAddress,
          totalPrice
        );
        await approveTx.wait();
      }

      toast.loading(
        count === 1
          ? `铸造中...`
          : `批量铸造 ${count} 把武器...`,
        { id: mintToastId }
      );

      // 使用辅助合约批量铸造
      const seed = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
      
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponBatchMinter.estimateGas.mintWeaponsBatch(count, seed);
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 5000000; // 批量铸造需要更多gas
      }

      const tx = await contracts.weaponBatchMinter.mintWeaponsBatch(count, seed, { gasLimit });
      const receipt = await tx.wait();

      // 解析铸造结果
      const event = receipt.events?.find(e => e.event === 'WeaponsBatchMinted');
      let mintedCount = count;
      if (event) {
        mintedCount = event.args.count.toNumber();
      }

      // 显示结果
      if (count === 1) {
        toast.success(
          `武器铸造成功！`,
          { id: mintToastId }
        );
      } else {
        toast.success(
          `成功铸造 ${mintedCount} 把武器！共消耗 ${totalPriceInEth} WAR`,
          { id: mintToastId, duration: 5000 }
        );
      }

      setTimeout(async () => {
        await loadWeapons();
        await loadWarBalance();
      }, 1000);
    } catch (error) {
      console.error('铸造失败:', error);
      toast.error('铸造失败: ' + error.message, { id: mintToastId });
    } finally {
      setIsMinting(false);
    }
  };

  // 铸造10把武器
  const mintTenWeapons = async () => {
    if (!window.confirm('确认铸造10把武器？\n每把消耗10 WAR，共计100 WAR')) {
      return;
    }
    await mintWeaponsBatch(10);
  };

  // 装备武器
  const equipWeapon = async (weaponId) => {
    if (warriors.length === 0) {
      toast.error('请先铸造角色');
      return;
    }

    if (warriors.length === 1) {
      await doEquipWeapon(weaponId, warriors[0].id);
      return;
    }

    // 多个角色时选择
    const warriorId = window.prompt(
      `选择要装备的角色ID:\n${warriors.map(w => `#${w.id} - Lv.${w.level} ${w.elementName}`).join('\n')}`
    );
    if (warriorId) {
      await doEquipWeapon(weaponId, warriorId);
    }
  };

  const doEquipWeapon = async (weaponId, warriorId) => {
    try {
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.equipWeapon(weaponId, warriorId);
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 300000;
      }

      const tx = await contracts.weaponNFT.equipWeapon(weaponId, warriorId, { gasLimit });
      toast.loading('装备中...', { id: 'equip' });
      await tx.wait();
      
      toast.success(`武器 #${weaponId} 已装备到角色 #${warriorId}`, { id: 'equip' });
      setTimeout(() => loadWeapons(), 1000);
    } catch (error) {
      toast.error('装备失败: ' + error.message, { id: 'equip' });
    }
  };

  // 卸下武器
  const unequipWeapon = async (weaponId) => {
    try {
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.unequipWeapon(weaponId);
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 200000;
      }

      const tx = await contracts.weaponNFT.unequipWeapon(weaponId, { gasLimit });
      toast.loading('卸下中...', { id: 'unequip' });
      await tx.wait();
      
      toast.success(`武器 #${weaponId} 已卸下`, { id: 'unequip' });
      setTimeout(() => loadWeapons(), 1000);
    } catch (error) {
      toast.error('卸下失败: ' + error.message, { id: 'unequip' });
    }
  };

  // 修理武器
  const repairWeapon = async (weaponId) => {
    try {
      const info = await contracts.weaponNFT.getWeaponInfo(weaponId);
      const isArray = Array.isArray(info);
      const getValue = (index, name) => isArray ? info[index] : info[name];
      const currentDurability = parseInt(getValue(10, 'currentDurability'));
      const maxDurability = 20;
      const repairCost = (maxDurability - currentDurability) * 0.001;

      if (!window.confirm(`修理武器 #${weaponId} 需要 ${repairCost.toFixed(3)} ETH\n确认修理吗？`)) {
        return;
      }

      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.repairWeapon(weaponId, {
          value: ethers.utils.parseEther(repairCost.toString())
        });
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 300000;
      }

      const tx = await contracts.weaponNFT.repairWeapon(weaponId, {
        value: ethers.utils.parseEther(repairCost.toString()),
        gasLimit
      });
      
      toast.loading('修理中...', { id: 'repair' });
      await tx.wait();
      
      toast.success(`武器 #${weaponId} 已修复！`, { id: 'repair' });
      setTimeout(() => loadWeapons(), 1000);
    } catch (error) {
      toast.error('修理失败: ' + error.message, { id: 'repair' });
    }
  };

  // 燃烧武器
  const burnWeapon = async (weaponId) => {
    if (!window.confirm(`⚠️ 警告：燃烧武器 #${weaponId}\n\n燃烧后将永久销毁该武器，获得锻造灰尘。\n此操作不可撤销！\n\n确认燃烧吗？`)) {
      return;
    }

    try {
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.burn(weaponId);
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 300000;
      }

      const tx = await contracts.weaponNFT.burn(weaponId, { gasLimit });
      toast.loading('燃烧中...', { id: 'burn' });
      const receipt = await tx.wait();

      const event = receipt.events?.find(e => e.event === 'Burned');
      if (event) {
        const dustGained = event.args.dustGained.toString();
        toast.success(`武器已燃烧！获得灰尘: ${dustGained}`, { id: 'burn' });
      } else {
        toast.success('武器已燃烧！', { id: 'burn' });
      }

      setTimeout(async () => {
        await loadWeapons();
        await loadDustBalance();
      }, 1000);
    } catch (error) {
      toast.error('燃烧失败: ' + error.message, { id: 'burn' });
    }
  };

  // 重铸武器
  const reforgeWeapon = async (burnId) => {
    const availableTargets = weapons.filter(w =>
      w.id !== burnId && w.stars >= 2 && w.equippedBy === '0'
    );

    if (availableTargets.length === 0) {
      toast.error('没有可用的重铸目标武器（需要2星以上且未装备）');
      return;
    }

    const targetId = window.prompt(
      `选择目标武器:\n${availableTargets.map(w => `#${w.id} - ${w.name} ${STAR_NAMES[w.stars]?.stars || ''}`).join('\n')}\n\n输入目标武器ID:`
    );

    if (!targetId) return;

    if (!window.confirm(`确认将武器 #${burnId} 重铸到武器 #${targetId}？\n源武器将被燃烧，点数转移到目标武器。`)) {
      return;
    }

    try {
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.reforge(burnId, targetId);
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 400000;
      }

      const tx = await contracts.weaponNFT.reforge(burnId, targetId, { gasLimit });
      toast.loading('重铸中...', { id: 'reforge' });
      await tx.wait();

      toast.success(`武器 #${burnId} 已重铸到 #${targetId}！`, { id: 'reforge' });
      setTimeout(() => loadWeapons(), 1000);
    } catch (error) {
      toast.error('重铸失败: ' + error.message, { id: 'reforge' });
    }
  };

  // 灰尘重铸
  const executeDustReforge = async () => {
    if (!reforgeTarget) {
      toast.error('请选择要重铸的武器');
      return;
    }
    if (dustInput.low === 0 && dustInput.four === 0 && dustInput.five === 0) {
      toast.error('请至少投入一种灰尘');
      return;
    }
    if (dustInput.low > dustBalance.low) {
      toast.error('低星灰尘不足');
      return;
    }
    if (dustInput.four > dustBalance.four) {
      toast.error('四星灰尘不足');
      return;
    }
    if (dustInput.five > dustBalance.five) {
      toast.error('五星灰尘不足');
      return;
    }

    try {
      let gasLimit;
      try {
        const estimatedGas = await contracts.weaponNFT.estimateGas.reforgeWithDust(
          reforgeTarget, dustInput.low, dustInput.four, dustInput.five
        );
        gasLimit = estimatedGas.mul(150).div(100);
      } catch (e) {
        gasLimit = 500000;
      }

      const tx = await contracts.weaponNFT.reforgeWithDust(
        reforgeTarget, dustInput.low, dustInput.four, dustInput.five, { gasLimit }
      );
      toast.loading('重铸中...', { id: 'dustReforge' });
      await tx.wait();

      toast.success(`武器 #${reforgeTarget} 重铸成功！`, { id: 'dustReforge' });
      setShowDustModal(false);
      setDustInput({ low: 0, four: 0, five: 0 });
      setReforgeTarget(null);
      setTimeout(() => loadWeapons(), 1000);
    } catch (error) {
      toast.error('重铸失败: ' + error.message, { id: 'dustReforge' });
    }
  };

  // 筛选和排序
  const filteredWeapons = useMemo(() => {
    let filtered = weapons.filter(w => {
      if (filterStars !== '' && w.stars !== parseInt(filterStars)) return false;
      if (filterElement !== '' && w.element !== parseInt(filterElement)) return false;
      if (filterStatus === 'equipped' && w.equippedBy === '0') return false;
      if (filterStatus === 'unequipped' && w.equippedBy !== '0') return false;
      if (filterStatus === 'broken' && !w.broken) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'stars':
          valA = a.stars;
          valB = b.stars;
          break;
        case 'power':
          valA = parseInt(a.basePower);
          valB = parseInt(b.basePower);
          break;
        case 'durability':
          valA = a.currentDurability;
          valB = b.currentDurability;
          break;
        default:
          valA = parseInt(a.id);
          valB = parseInt(b.id);
      }
      return sortDesc ? valB - valA : valA - valB;
    });

    return filtered;
  }, [weapons, filterStars, filterElement, filterStatus, sortBy, sortDesc]);

  // 统计
  const stats = useMemo(() => ({
    total: filteredWeapons.length,
    equipped: filteredWeapons.filter(w => w.equippedBy !== '0').length,
    broken: filteredWeapons.filter(w => w.broken).length,
    highStar: filteredWeapons.filter(w => w.stars >= 2).length,
    totalPower: filteredWeapons.reduce((sum, w) => sum + parseInt(w.basePower || 0), 0)
  }), [filteredWeapons]);

  // 计算重铸预览
  const reforgePreview = useMemo(() => {
    if (!reforgeTarget || !selectedWeapon) return null;
    const currentPower = parseInt(selectedWeapon.basePower);
    const powerGain = dustInput.low + dustInput.four * 10 + dustInput.five * 100;
    return {
      currentPower,
      powerGain,
      newPower: currentPower + powerGain
    };
  }, [reforgeTarget, selectedWeapon, dustInput]);

  const availableReforgeTargets = weapons.filter(w => w.stars >= 2 && w.equippedBy === '0');

  return (
    <div className="p-3 md:p-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold">我的武器</h3>
          <div className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-2 md:gap-3">
            <span className="bg-gray-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs" title="低星灰尘">
              🔹{dustBalance.low}
            </span>
            <span className="bg-gray-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs" title="四星灰尘">
              🔸{dustBalance.four}
            </span>
            <span className="bg-gray-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs" title="五星灰尘">
              🔺{dustBalance.five}
            </span>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowDustModal(true)}
            className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-sm md:text-base"
          >
            <span className="hidden md:inline">⚒️ 灰尘重铸</span>
            <span className="md:hidden">⚒️ 重铸</span>
          </button>
          <button
            onClick={mintTenWeapons}
            disabled={isMinting}
            className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 text-white font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap text-sm md:text-base"
          >
            {isMinting ? '铸造中...' : <><span className="md:hidden">+10 (100)</span><span className="hidden md:inline">+ 铸造10把 (100 WAR)</span></>}
          </button>
          <button
            onClick={mintWeapon}
            disabled={isMinting}
            className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:bg-gray-400 text-white font-medium py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap text-sm md:text-base"
          >
            {isMinting ? '铸造中...' : <><span className="md:hidden">+1 (10)</span><span className="hidden md:inline">+ 铸造1把 (10 WAR)</span></>}
          </button>
        </div>
      </div>

      {/* 筛选工具栏 - 移动端更紧凑 */}
      <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
          <div className="flex items-center gap-1 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">星级:</label>
            <select
              value={filterStars}
              onChange={(e) => setFilterStars(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
            >
              <option value="">全部</option>
              <option value="0">⭐</option>
              <option value="1">⭐⭐</option>
              <option value="2">⭐⭐⭐</option>
              <option value="3">⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐⭐</option>
            </select>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">元素:</label>
            <select
              value={filterElement}
              onChange={(e) => setFilterElement(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
            >
              <option value="">全部</option>
              {Object.entries(ELEMENTS).map(([key, el]) => (
                <option key={key} value={key}>{el.icon} <span className="hidden md:inline">{el.cn}</span></option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">状态:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
            >
              <option value="">全部</option>
              <option value="equipped">🔒</option>
              <option value="unequipped">🔓</option>
              <option value="broken">💔</option>
            </select>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
            >
              <option value="stars">⭐</option>
              <option value="power">⚔️</option>
              <option value="durability">🔋</option>
              <option value="id">#</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="text-gray-600 hover:text-gray-800 px-1 py-1 text-sm"
            >
              {sortDesc ? '⬇️' : '⬆️'}
            </button>
          </div>
        </div>
      </div>

      {/* 统计 - 移动端2列 */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 mb-4 text-xs md:text-sm">
        <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center">
          <div className="text-gray-600 text-xs">总武器</div>
          <div className="text-lg md:text-xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center">
          <div className="text-gray-600 text-xs">已装备</div>
          <div className="text-lg md:text-xl font-bold text-green-600">{stats.equipped}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 md:p-3 text-center">
          <div className="text-gray-600 text-xs">损坏</div>
          <div className="text-lg md:text-xl font-bold text-red-600">{stats.broken}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 md:p-3 text-center hidden md:block">
          <div className="text-gray-600">高星武器</div>
          <div className="text-lg md:text-xl font-bold text-purple-600">{stats.highStar}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-2 md:p-3 text-center hidden md:block">
          <div className="text-gray-600">总战力</div>
          <div className="text-lg md:text-xl font-bold text-amber-600">{stats.totalPower.toLocaleString()}</div>
        </div>
      </div>

      {/* 武器列表 */}
      {filteredWeapons.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-6xl mb-4">⚔️</div>
          <p>暂无武器，点击上方按钮铸造</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWeapons.map((weapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              onEquip={equipWeapon}
              onUnequip={unequipWeapon}
              onRepair={repairWeapon}
              onBurn={burnWeapon}
              onReforge={reforgeWeapon}
            />
          ))}
        </div>
      )}

      {/* 灰尘重铸弹窗 */}
      {showDustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">⚒️ 使用灰尘重铸武器</h3>
              <button 
                onClick={() => {
                  setShowDustModal(false);
                  setReforgeTarget(null);
                  setSelectedWeapon(null);
                  setDustInput({ low: 0, four: 0, five: 0 });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择要重铸的武器
                </label>
                <select 
                  value={reforgeTarget || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setReforgeTarget(id);
                    setSelectedWeapon(weapons.find(w => w.id === id));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择武器（需2星以上）</option>
                  {availableReforgeTargets.map(w => (
                    <option key={w.id} value={w.id}>
                      #{w.id} - {w.name} {STAR_NAMES[w.stars]?.stars} (战力:{w.basePower})
                    </option>
                  ))}
                </select>
                {availableReforgeTargets.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    没有可用的武器（需要2星以上且未装备）
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">投入灰尘</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🔹 低星灰尘 (每点+1力量)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">拥有: {dustBalance.low}</span>
                      <input
                        type="number"
                        min="0"
                        max={dustBalance.low}
                        value={dustInput.low}
                        onChange={(e) => setDustInput({...dustInput, low: parseInt(e.target.value) || 0})}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🔸 四星灰尘 (每点+10力量)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">拥有: {dustBalance.four}</span>
                      <input
                        type="number"
                        min="0"
                        max={dustBalance.four}
                        value={dustInput.four}
                        onChange={(e) => setDustInput({...dustInput, four: parseInt(e.target.value) || 0})}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🔺 五星灰尘 (每点+100力量)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">拥有: {dustBalance.five}</span>
                      <input
                        type="number"
                        min="0"
                        max={dustBalance.five}
                        value={dustInput.five}
                        onChange={(e) => setDustInput({...dustInput, five: parseInt(e.target.value) || 0})}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {reforgePreview && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">重铸预览</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">当前战力:</span>
                      <span className="font-bold">{reforgePreview.currentPower}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">预计增加:</span>
                      <span className="font-bold text-green-600">+{reforgePreview.powerGain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">重铸后战力:</span>
                      <span className="font-bold text-purple-600">{reforgePreview.newPower}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
                💡 提示: 每点低星灰尘+1力量，四星灰尘+10力量，五星灰尘+100力量
              </div>

              <button
                onClick={executeDustReforge}
                disabled={!reforgeTarget}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                确认重铸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
