import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { WarriorCard } from '../components/WarriorCard';
import toast from 'react-hot-toast';

export function Warriors({ warriors, loadWarriors, loadWarBalance }) {
  const { contracts } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);

  const mintWarrior = async () => {
    if (!contracts.warriorNFT || !contracts.warToken) {
      toast.error('合约未初始化');
      return;
    }

    // 调试信息
    console.log('WarToken 地址:', contracts.warToken.address);
    console.log('WarriorNFT 地址:', contracts.warriorNFT.address);
    console.log('Provider:', contracts.warToken.provider);

    setIsMinting(true);
    try {
      // 先检查 WAR Token 合约是否可调用
      try {
        const name = await contracts.warToken.name();
        console.log('WarToken 名称:', name);
      } catch (e) {
        console.error('无法获取 WarToken 名称:', e);
        toast.error('WAR Token 合约连接失败，请检查网络设置');
        return;
      }

      // 从 GameManager 获取铸造价格
      let mintPrice;
      try {
        mintPrice = await contracts.warriorNFT.getMintPrice();
      } catch (e) {
        // 如果失败，使用默认价格 50 WAR
        mintPrice = ethers.utils.parseEther('50');
      }
      
      const priceInEth = ethers.utils.formatEther(mintPrice);
      
      // 检查授权状态
      const userAddress = await contracts.warToken.signer.getAddress();
      console.log('用户地址:', userAddress);
      
      const allowance = await contracts.warToken.allowance(
        userAddress,
        contracts.warriorNFT.address
      );
      
      // 如果授权不足，进行授权
      if (allowance.lt(mintPrice)) {
        toast.loading('授权 WAR Token...', { id: 'mintWarrior' });
        const approveTx = await contracts.warToken.approve(
          contracts.warriorNFT.address,
          mintPrice
        );
        await approveTx.wait();
      }
      
      // 估算gas并添加缓冲
      let gasLimit;
      try {
        const estimatedGas = await contracts.warriorNFT.estimateGas.mintWarrior();
        gasLimit = estimatedGas.mul(150).div(100); // 增加50%缓冲
      } catch (e) {
        gasLimit = 500000;
      }

      toast.loading(`铸造中，消耗 ${priceInEth} WAR...`, { id: 'mintWarrior' });
      const tx = await contracts.warriorNFT.mintWarrior({ gasLimit });
      const receipt = await tx.wait();

      // 解析事件获取新角色ID
      const event = receipt.events?.find(e => e.event === 'WarriorMinted');
      if (event) {
        const newId = event.args.tokenId.toString();
        toast.success(`🎉 新角色 #${newId} 已铸造！`, { id: 'mintWarrior' });
      } else {
        toast.success('🎉 新角色已铸造！', { id: 'mintWarrior' });
      }

      // 刷新数据
      setTimeout(async () => {
        await loadWarriors();
        await loadWarBalance();
      }, 1000);
    } catch (error) {
      console.error('铸造失败:', error);
      toast.error('❌ 铸造失败: ' + error.message, { id: 'mintWarrior' });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gradient mb-1">我的角色</h3>
          <p className="text-gray-400 text-xs md:text-sm">收集五行角色，组建你的战斗队伍</p>
        </div>
        <button
          onClick={mintWarrior}
          disabled={isMinting}
          className="btn-success flex items-center space-x-2 whitespace-nowrap text-sm md:text-base"
        >
          {isMinting ? (
            <>
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>铸造中...</span>
            </>
          ) : (
            <>
              <span className="text-lg md:text-xl">🧙‍♂️</span>
              <span className="hidden sm:inline">铸造角色 (50 WAR)</span>
              <span className="sm:hidden">铸造 (50)</span>
            </>
          )}
        </button>
      </div>

      {/* 角色列表 */}
      {warriors.length === 0 ? (
        <div className="glass rounded-2xl p-6 md:p-12 text-center">
          <div className="text-6xl md:text-8xl mb-4 md:mb-6 float-animation">🧙‍♂️</div>
          <h4 className="text-lg md:text-xl font-bold text-white mb-2">还没有角色</h4>
          <p className="text-gray-400 text-sm mb-4 md:mb-6">铸造你的第一个五行角色，开始冒险之旅</p>
          <button
            onClick={mintWarrior}
            disabled={isMinting}
            className="btn-success text-sm md:text-base"
          >
            + 立即铸造
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {warriors.map((warrior) => (
            <WarriorCard key={warrior.id} warrior={warrior} />
          ))}
        </div>
      )}
    </div>
  );
}
