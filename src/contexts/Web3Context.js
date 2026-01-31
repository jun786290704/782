import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, ABI } from '../utils/contracts';
import toast from 'react-hot-toast';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 初始化合约
  const initContracts = useCallback((signerInstance) => {
    const contractInstances = {
      warToken: new ethers.Contract(CONTRACTS.WarToken, ABI.WarToken, signerInstance),
      warriorNFT: new ethers.Contract(CONTRACTS.WarriorNFT, ABI.WarriorNFT, signerInstance),
      weaponNFT: new ethers.Contract(CONTRACTS.WeaponNFT, ABI.WeaponNFT, signerInstance),
      battleSystem: new ethers.Contract(CONTRACTS.BattleSystemLocal, ABI.BattleSystemLocal, signerInstance),
      enemyLibrary: new ethers.Contract(CONTRACTS.PVEEnemyLibrary, ABI.PVEEnemyLibrary, signerInstance),
      gameManager: new ethers.Contract(CONTRACTS.GameManager, ABI.GameManager, signerInstance),
      weaponBatchMinter: CONTRACTS.WeaponBatchMinter ? new ethers.Contract(CONTRACTS.WeaponBatchMinter, ABI.WeaponBatchMinter, signerInstance) : null
    };
    setContracts(contractInstances);
    return contractInstances;
  }, []);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    // 检查 MetaMask 是否安装
    if (typeof window === 'undefined') {
      toast.error('请在浏览器中运行');
      return false;
    }

    if (!window.ethereum) {
      toast.error('请安装 MetaMask 钱包');
      return false;
    }

    setIsLoading(true);
    try {
      // 请求用户授权连接
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        toast.error('用户拒绝了连接请求');
        return false;
      }

      const providerInstance = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const signerInstance = providerInstance.getSigner();
      const accountAddress = accounts[0];

      // 检查网络
      const network = await providerInstance.getNetwork();
      console.log('当前网络:', {
        name: network.name,
        chainId: network.chainId,
        ensAddress: network.ensAddress
      });
      
      if (network.chainId !== 97) {
        toast.error(`请切换到 BSC Testnet (链ID: 97)，当前链ID: ${network.chainId}`);
        setIsLoading(false);
        return false;
      }

      setProvider(providerInstance);
      setSigner(signerInstance);
      setAccount(accountAddress);
      setIsConnected(true);
      initContracts(signerInstance);

      toast.success('钱包连接成功 (BSC Testnet)');
      return true;
    } catch (error) {
      console.error('连接钱包失败:', error);
      if (error.code === 4001) {
        toast.error('用户拒绝了连接请求');
      } else if (error.code === -32002) {
        toast.error('请检查 MetaMask 弹窗');
      } else {
        toast.error('连接钱包失败: ' + (error.message || '未知错误'));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initContracts]);

  // 断开连接
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContracts({});
    setIsConnected(false);
    toast.success('已断开连接');
  }, []);

  // 监听账户变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connectWallet, disconnect]);

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts && accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('检查连接状态失败:', error);
        }
      }
    };
    checkConnection();
  }, [connectWallet]);

  const value = {
    provider,
    signer,
    account,
    contracts,
    isConnected,
    isLoading,
    connectWallet,
    disconnect
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
