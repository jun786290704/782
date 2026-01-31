import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { CONTRACTS, ELEMENTS, STAR_NAMES } from '../utils/contracts';
import toast from 'react-hot-toast';

const MARKETPLACE_ABI = [
  "function addListing(address _tokenAddress, uint256 _id, uint256 _price, uint256 _quantity)",
  "function cancelListing(address _tokenAddress, uint256 _id)",
  "function purchaseListing(address _tokenAddress, uint256 _id, uint256 _maxPrice)",
  "function changeListingPrice(address _tokenAddress, uint256 _id, uint256 _newPrice)",
  "function getSellerPrice(address _tokenAddress, uint256 _id) view returns (uint256)",
  "function getFinalPrice(address _tokenAddress, uint256 _id) view returns (uint256)",
  "function getTaxOnListing(address _tokenAddress, uint256 _id) view returns (uint256)",
  "function getSellerOfNftID(address _tokenAddress, uint256 _tokenId) view returns (address)",
  "function isTokenAllowed(address _tokenAddress) view returns (bool)",
  "function getListingIDs(address _tokenAddress) view returns (uint256[])",
  "function getNumberOfListingsForToken(address _tokenAddress) view returns (uint256)",
  "function getListingIDsBySeller(address _tokenAddress, address _seller) view returns (uint256[])",
  "function getCharacterListingsPage(uint8 _limit, uint256 _pageNumber, uint8 _element, uint8 _minLevel, uint8 _maxLevel) view returns (uint256[])",
  "function getWeaponListingsPage(uint8 _limit, uint256 _pageNumber, uint8 _element, uint8 _rarity) view returns (uint256[])",
  "function getCharacterListingsCount(uint8 _element, uint8 _minLevel, uint8 _maxLevel) view returns (uint256)",
  "function getWeaponListingsCount(uint8 _element, uint8 _rarity) view returns (uint256)",
  "function defaultTaxPercent() view returns (uint256)"
];

const ITEMS_PER_PAGE = 12;

export function Marketplace({ warriors, weapons }) {
  const { provider, signer, account, contracts } = useWeb3();
  const [marketplace, setMarketplace] = useState(null);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [filters, setFilters] = useState({
    nftType: 'all',
    element: 255,
    minLevel: 0,
    maxLevel: 0,
    rarity: 0
  });
  
  const [marketStats, setMarketStats] = useState({
    transactionFee: 100,
    totalListings: 0,
    isWarriorAllowed: false,
    isWeaponAllowed: false
  });
  
  const [activeTab, setActiveTab] = useState('browse');
  const [isLoading, setIsLoading] = useState(false);
  
  const [sellForm, setSellForm] = useState({
    nftType: 'warrior',
    tokenId: '',
    price: '',
    quantity: '1'
  });
  
  const [editPriceModal, setEditPriceModal] = useState({
    isOpen: false,
    item: null,
    newPrice: ''
  });

  useEffect(() => {
    if (provider && CONTRACTS.Marketplace) {
      const mp = new ethers.Contract(CONTRACTS.Marketplace, MARKETPLACE_ABI, signer || provider);
      setMarketplace(mp);
    }
  }, [provider, signer]);

  const checkTokenAllowance = React.useCallback(async () => {
    if (!marketplace) return;
    try {
      const [warriorAllowed, weaponAllowed] = await Promise.all([
        marketplace.isTokenAllowed(CONTRACTS.WarriorNFT),
        marketplace.isTokenAllowed(CONTRACTS.WeaponNFT)
      ]);
      setMarketStats(prev => ({ ...prev, isWarriorAllowed: warriorAllowed, isWeaponAllowed: weaponAllowed }));
    } catch (error) {
      console.error('检查白名单失败:', error);
    }
  }, [marketplace]);

  const loadMarketStats = React.useCallback(async () => {
    if (!marketplace) return;
    try {
      const taxPercent = await marketplace.defaultTaxPercent();
      const warriorCount = await marketplace.getNumberOfListingsForToken(CONTRACTS.WarriorNFT);
      const weaponCount = await marketplace.getNumberOfListingsForToken(CONTRACTS.WeaponNFT);
      setMarketStats(prev => ({
        ...prev,
        transactionFee: taxPercent.toString(),
        totalListings: (parseInt(warriorCount) + parseInt(weaponCount)).toString()
      }));
    } catch (error) {
      console.error('加载市场统计失败:', error);
    }
  }, [marketplace]);

  const fetchNFTInfo = React.useCallback(async (nftContract, tokenId) => {
    try {
      const [seller, price, tax, finalPrice] = await Promise.all([
        marketplace.getSellerOfNftID(nftContract, tokenId),
        marketplace.getSellerPrice(nftContract, tokenId),
        marketplace.getTaxOnListing(nftContract, tokenId),
        marketplace.getFinalPrice(nftContract, tokenId)
      ]);

      let info = { seller, nftContract, tokenId: tokenId.toString(), price: price.toString(), tax: tax.toString(), finalPrice: finalPrice.toString() };

      if (nftContract.toLowerCase() === CONTRACTS.WarriorNFT.toLowerCase() && contracts.warriorNFT) {
        const warriorInfo = await contracts.warriorNFT.getWarriorInfo(tokenId);
        info = { ...info, name: `角色 #${tokenId}`, element: getElementType(warriorInfo.elementName), power: warriorInfo.power.toString(), level: warriorInfo.level.toString(), stars: 0, type: 'warrior' };
      } else if (nftContract.toLowerCase() === CONTRACTS.WeaponNFT.toLowerCase() && contracts.weaponNFT) {
        const weaponInfo = await contracts.weaponNFT.getWeaponInfo(tokenId);
        const isArray = Array.isArray(weaponInfo);
        const getValue = (index, name) => isArray ? weaponInfo[index] : weaponInfo[name];
        info = { ...info, name: getValue(0, 'name'), element: getElementType(getValue(1, 'elementName')), stars: parseInt(getValue(2, 'stars')), power: getValue(7, 'basePower').toString(), type: 'weapon' };
      }
      return info;
    } catch (e) {
      return { seller: ethers.constants.AddressZero };
    }
  }, [marketplace, contracts]);

  const getElementType = (elementName) => {
    const map = { 'Wood': 0, 'Fire': 1, 'Earth': 2, 'Metal': 3, 'Water': 4 };
    return map[elementName] || 0;
  };


  const loadFilteredListings = React.useCallback(async () => {
    if (!marketplace) return;
    setIsLoading(true);
    try {
      let tokenIds = [];
      let count = 0;
      
      if (filters.nftType === 'warrior' || filters.nftType === 'all') {
        const warriorIds = await marketplace.getCharacterListingsPage(ITEMS_PER_PAGE, currentPage, filters.element, filters.minLevel, filters.maxLevel);
        const warriorCount = await marketplace.getCharacterListingsCount(filters.element, filters.minLevel, filters.maxLevel);
        for (const id of warriorIds) {
          const info = await fetchNFTInfo(CONTRACTS.WarriorNFT, id);
          if (info.seller && info.seller !== ethers.constants.AddressZero) tokenIds.push({ ...info, id: `warrior-${id}` });
        }
        count += parseInt(warriorCount);
      }
      
      if (filters.nftType === 'weapon' || filters.nftType === 'all') {
        const weaponIds = await marketplace.getWeaponListingsPage(ITEMS_PER_PAGE, currentPage, filters.element, filters.rarity);
        const weaponCount = await marketplace.getWeaponListingsCount(filters.element, filters.rarity);
        for (const id of weaponIds) {
          const info = await fetchNFTInfo(CONTRACTS.WeaponNFT, id);
          if (info.seller && info.seller !== ethers.constants.AddressZero) tokenIds.push({ ...info, id: `weapon-${id}` });
        }
        count += parseInt(weaponCount);
      }
      
      setListings(tokenIds);
      setTotalCount(count);
    } catch (error) {
      console.error('加载市场数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [marketplace, filters, currentPage, fetchNFTInfo]);

  const loadMyListings = React.useCallback(async () => {
    if (!marketplace || !account) return;
    try {
      const myListings = [];
      const myWarriorIds = await marketplace.getListingIDsBySeller(CONTRACTS.WarriorNFT, account);
      for (const tokenId of myWarriorIds) {
        const info = await fetchNFTInfo(CONTRACTS.WarriorNFT, tokenId);
        myListings.push({ ...info, id: `warrior-${tokenId}` });
      }
      const myWeaponIds = await marketplace.getListingIDsBySeller(CONTRACTS.WeaponNFT, account);
      for (const tokenId of myWeaponIds) {
        const info = await fetchNFTInfo(CONTRACTS.WeaponNFT, tokenId);
        myListings.push({ ...info, id: `weapon-${tokenId}` });
      }
      setMyListings(myListings);
    } catch (error) {
      console.error('加载我的上架失败:', error);
    }
  }, [marketplace, account, fetchNFTInfo]);

  useEffect(() => {
    if (marketplace) {
      checkTokenAllowance();
      loadMarketStats();
    }
  }, [marketplace, checkTokenAllowance, loadMarketStats]);

  useEffect(() => {
    if (marketplace && activeTab === 'browse') loadFilteredListings();
  }, [marketplace, activeTab, loadFilteredListings]);

  useEffect(() => {
    if (marketplace && activeTab === 'my') loadMyListings();
  }, [marketplace, activeTab, loadMyListings]);

  const listItem = async () => {
    if (!account) { toast.error('请先连接钱包'); return; }
    if (sellForm.nftType === 'warrior' && !marketStats.isWarriorAllowed) { toast.error('角色NFT暂不允许交易'); return; }
    if (sellForm.nftType === 'weapon' && !marketStats.isWeaponAllowed) { toast.error('武器NFT暂不允许交易'); return; }

    const { nftType, tokenId, price, quantity } = sellForm;
    if (!tokenId || !price) { toast.error('请填写完整信息'); return; }

    try {
      const nftContract = nftType === 'weapon' ? CONTRACTS.WeaponNFT : CONTRACTS.WarriorNFT;
      const priceWei = ethers.utils.parseEther(price);
      const qty = parseInt(quantity) || 1;

      toast.loading('授权NFT中...', { id: 'approve' });
      if (nftType === 'weapon') {
        const isApproved = await contracts.weaponNFT.isApprovedForAll(account, CONTRACTS.Marketplace);
        if (!isApproved) {
          const approveTx = await contracts.weaponNFT.setApprovalForAll(CONTRACTS.Marketplace, true);
          await approveTx.wait();
        }
      } else {
        const approved = await contracts.warriorNFT.getApproved(tokenId);
        if (approved.toLowerCase() !== CONTRACTS.Marketplace.toLowerCase()) {
          const approveTx = await contracts.warriorNFT.approve(CONTRACTS.Marketplace, tokenId);
          await approveTx.wait();
        }
      }
      toast.success('授权成功', { id: 'approve' });

      toast.loading('上架中...', { id: 'list' });
      const tx = await marketplace.addListing(nftContract, tokenId, priceWei, qty);
      await tx.wait();

      toast.success('上架成功！', { id: 'list' });
      setSellForm({ nftType: 'warrior', tokenId: '', price: '', quantity: '1' });
      loadFilteredListings();
      loadMarketStats();
    } catch (error) {
      toast.error('上架失败: ' + error.message, { id: 'list' });
    }
  };

  const buyItem = async (item) => {
    if (!marketplace || !account) { toast.error('请先连接钱包'); return; }
    if (item.seller.toLowerCase() === account.toLowerCase()) { toast.error('不能购买自己的物品'); return; }

    try {
      const currentAllowance = await contracts.warToken.allowance(account, CONTRACTS.Marketplace);
      if (currentAllowance.lt(item.finalPrice)) {
        toast.loading('授权WAR代币中...', { id: 'approve' });
        const approveTx = await contracts.warToken.approve(CONTRACTS.Marketplace, ethers.utils.parseEther('1000000'));
        await approveTx.wait();
        toast.success('授权成功', { id: 'approve' });
      }

      toast.loading('购买中...', { id: 'buy' });
      const tx = await marketplace.purchaseListing(item.nftContract, item.tokenId, item.finalPrice);
      await tx.wait();
      toast.success('购买成功！', { id: 'buy' });
      loadFilteredListings();
      loadMarketStats();
    } catch (error) {
      toast.error('购买失败: ' + error.message, { id: 'buy' });
    }
  };

  const changePrice = async () => {
    if (!editPriceModal.item || !editPriceModal.newPrice) return;
    try {
      const newPriceWei = ethers.utils.parseEther(editPriceModal.newPrice);
      toast.loading('修改价格中...', { id: 'changePrice' });
      const tx = await marketplace.changeListingPrice(editPriceModal.item.nftContract, editPriceModal.item.tokenId, newPriceWei);
      await tx.wait();
      toast.success('价格修改成功！', { id: 'changePrice' });
      setEditPriceModal({ isOpen: false, item: null, newPrice: '' });
      loadMyListings();
      loadFilteredListings();
    } catch (error) {
      toast.error('修改价格失败: ' + error.message, { id: 'changePrice' });
    }
  };

  const cancelListing = async (item) => {
    if (!marketplace) return;
    try {
      toast.loading('取消上架中...', { id: 'cancel' });
      const tx = await marketplace.cancelListing(item.nftContract, item.tokenId);
      await tx.wait();
      toast.success('取消成功！', { id: 'cancel' });
      loadMyListings();
      loadFilteredListings();
      loadMarketStats();
    } catch (error) {
      toast.error('取消失败: ' + error.message, { id: 'cancel' });
    }
  };

  const resetFilters = () => {
    setFilters({ nftType: 'all', element: 255, minLevel: 0, maxLevel: 0, rarity: 0 });
    setCurrentPage(0);
  };

  const getSellableItems = () => sellForm.nftType === 'weapon' ? weapons.filter(w => w.equippedBy === '0' || w.equippedBy === 0) : warriors;
  const sellableItems = getSellableItems();
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderMarketItem = (item, isMyListing = false) => {
    const element = ELEMENTS[item.element];
    const isOwner = item.seller.toLowerCase() === account?.toLowerCase();
    
    return (
      <div key={item.id} className="glass rounded-xl p-4 card-hover">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{element?.icon}</span>
            <span className="font-bold text-white">{item.name}</span>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${item.type === 'warrior' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
            {item.type === 'warrior' ? '角色' : '武器'}
          </span>
        </div>
        
        <div className="space-y-1 text-sm text-gray-400 mb-3">
          {item.level && <div>等级: {item.level}</div>}
          {item.stars > 0 && <div>稀有度: {'⭐'.repeat(item.stars + 1)}</div>}
          <div>战力: {item.power}</div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">售价</span>
            <span className="text-lg font-bold text-green-400">{ethers.utils.formatEther(item.price)} WAR</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">税费</span>
            <span className="text-sm text-yellow-400">{ethers.utils.formatEther(item.tax)} WAR</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">总计</span>
            <span className="text-lg font-bold text-gradient">{ethers.utils.formatEther(item.finalPrice)} WAR</span>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          {!isMyListing && !isOwner && (
            <button onClick={() => buyItem(item)} className="flex-1 btn-primary py-2 text-sm">
              购买
            </button>
          )}
          {isMyListing && (
            <>
              <button 
                onClick={() => setEditPriceModal({ isOpen: true, item, newPrice: ethers.utils.formatEther(item.price) })} 
                className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                改价
              </button>
              <button onClick={() => cancelListing(item)} className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg text-white">
                取消
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
        <div className="glass rounded-lg md:rounded-xl p-2 md:p-4 text-center">
          <div className="text-gray-400 text-xs mb-0.5 md:mb-1">上架数</div>
          <div className="text-lg md:text-2xl font-bold text-gradient">{marketStats.totalListings}</div>
        </div>
        <div className="glass rounded-lg md:rounded-xl p-2 md:p-4 text-center">
          <div className="text-gray-400 text-xs mb-0.5 md:mb-1">税费</div>
          <div className="text-lg md:text-2xl font-bold text-green-400">{marketStats.transactionFee / 100}%</div>
        </div>
        <div className="glass rounded-lg md:rounded-xl p-2 md:p-4 text-center">
          <div className="text-gray-400 text-xs mb-0.5 md:mb-1">角色</div>
          <div className={`text-lg md:text-2xl font-bold ${marketStats.isWarriorAllowed ? 'text-green-400' : 'text-red-400'}`}>
            {marketStats.isWarriorAllowed ? '✅' : '❌'}
          </div>
        </div>
        <div className="glass rounded-lg md:rounded-xl p-2 md:p-4 text-center">
          <div className="text-gray-400 text-xs mb-0.5 md:mb-1">武器</div>
          <div className={`text-lg md:text-2xl font-bold ${marketStats.isWeaponAllowed ? 'text-green-400' : 'text-red-400'}`}>
            {marketStats.isWeaponAllowed ? '✅' : '❌'}
          </div>
        </div>
      </div>

      <div className="flex space-x-1 md:space-x-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'browse', label: '🛒 浏览', fullLabel: '🛒 浏览市场' },
          { id: 'my', label: '📋 我的', fullLabel: '📋 我的上架' },
          { id: 'sell', label: '💰 出售', fullLabel: '💰 出售物品' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(0); }}
            className={`py-2 px-3 md:px-4 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="md:hidden">{tab.label}</span>
            <span className="hidden md:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-3 md:space-y-4">
          <div className="glass rounded-xl p-3 md:p-4">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">类型</label>
                <select value={filters.nftType} onChange={(e) => { setFilters({ ...filters, nftType: e.target.value }); setCurrentPage(0); }} className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm">
                  <option value="all">全部</option>
                  <option value="warrior">角色</option>
                  <option value="weapon">武器</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">元素</label>
                <select value={filters.element} onChange={(e) => { setFilters({ ...filters, element: parseInt(e.target.value) }); setCurrentPage(0); }} className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm">
                  <option value={255}>全部</option>
                  {Object.entries(ELEMENTS).map(([key, el]) => (
                    <option key={key} value={key}>{el.icon} <span className="hidden md:inline">{el.cn}</span></option>
                  ))}
                </select>
              </div>
              {(filters.nftType === 'warrior' || filters.nftType === 'all') && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">最低Lv</label>
                    <input type="number" min="0" value={filters.minLevel} onChange={(e) => { setFilters({ ...filters, minLevel: parseInt(e.target.value) || 0 }); setCurrentPage(0); }} className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm w-14 md:w-20" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">最高Lv</label>
                    <input type="number" min="0" value={filters.maxLevel} onChange={(e) => { setFilters({ ...filters, maxLevel: parseInt(e.target.value) || 0 }); setCurrentPage(0); }} className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm w-14 md:w-20" />
                  </div>
                </>
              )}
              {(filters.nftType === 'weapon' || filters.nftType === 'all') && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">稀有度</label>
                  <select value={filters.rarity} onChange={(e) => { setFilters({ ...filters, rarity: parseInt(e.target.value) }); setCurrentPage(0); }} className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm">
                    <option value={0}>全部</option>
                    {Object.entries(STAR_NAMES).map(([key, star]) => (
                      <option key={key} value={key}>{star.stars} <span className="hidden md:inline">{star.name}</span></option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={resetFilters} className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs md:text-sm text-gray-400 transition-colors self-end">重置</button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>共找到 {totalCount} 个物品</span>
            {totalPages > 1 && <span>第 {currentPage + 1} / {totalPages} 页</span>}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h4 className="text-xl font-bold text-white mb-2">暂无上架物品</h4>
              <p className="text-gray-400">试试调整筛选条件或稍后再来看看</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(item => renderMarketItem(item))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white">← 上一页</button>
                  <span className="px-4 py-2 text-gray-400">{currentPage + 1} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white">下一页 →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'my' && (
        <div>
          {myListings.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h4 className="text-xl font-bold text-white mb-2">暂无上架物品</h4>
              <p className="text-gray-400 mb-4">在"出售物品"页面上架你的NFT</p>
              <button onClick={() => setActiveTab('sell')} className="btn-primary">去出售 →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map(item => renderMarketItem(item, true))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="max-w-lg mx-auto px-0 md:px-0">
          <div className="glass rounded-xl p-4 md:p-6 space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-bold text-gradient mb-2 md:mb-4">出售物品</h3>
            
            {(!marketStats.isWarriorAllowed && !marketStats.isWeaponAllowed) && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                <div className="text-red-400 font-medium mb-1">⚠️ 市场暂停交易</div>
                <p className="text-sm text-red-300">角色和武器NFT交易暂未开放</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">选择类型</label>
              <select value={sellForm.nftType} onChange={(e) => setSellForm({ ...sellForm, nftType: e.target.value, tokenId: '' })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                <option value="warrior">🧙‍♂️ 角色 (ERC721)</option>
                <option value="weapon">⚔️ 武器 (ERC1155)</option>
              </select>
              {sellForm.nftType === 'warrior' && !marketStats.isWarriorAllowed && <p className="text-xs text-red-400 mt-1">❌ 角色NFT暂不允许交易</p>}
              {sellForm.nftType === 'weapon' && !marketStats.isWeaponAllowed && <p className="text-xs text-red-400 mt-1">❌ 武器NFT暂不允许交易</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">选择{sellForm.nftType === 'weapon' ? '武器' : '角色'}</label>
              <select value={sellForm.tokenId} onChange={(e) => setSellForm({ ...sellForm, tokenId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                <option value="">请选择</option>
                {sellableItems.map((item) => {
                  const element = ELEMENTS[item.element];
                  const stars = item.stars !== undefined ? STAR_NAMES[item.stars]?.stars : '';
                  const power = item.power || item.basePower || '?';
                  return (
                    <option key={item.id} value={item.id}>
                      {element?.icon} {item.name || `${sellForm.nftType === 'weapon' ? '武器' : '角色'} #${item.id}`} {stars} (战力:{power})
                    </option>
                  );
                })}
              </select>
              {sellableItems.length === 0 && <p className="text-sm text-red-400 mt-2">没有可出售的{sellForm.nftType === 'weapon' ? '武器' : '角色'}{sellForm.nftType === 'weapon' ? '（武器需先卸下）' : ''}</p>}
            </div>

            {sellForm.nftType === 'weapon' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">数量</label>
                <input type="number" min="1" value={sellForm.quantity} onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">价格 (WAR)</label>
              <input type="number" step="0.001" min="0" value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="输入价格..." />
              {sellForm.price && (
                <div className="mt-2 text-xs text-gray-400">
                  <div>售价: {sellForm.price} WAR</div>
                  <div>税费 ({marketStats.transactionFee/100}%): {(parseFloat(sellForm.price) * marketStats.transactionFee / 10000).toFixed(4)} WAR</div>
                  <div className="text-green-400">您将收到: {(parseFloat(sellForm.price) * (1 - marketStats.transactionFee / 10000)).toFixed(4)} WAR</div>
                </div>
              )}
            </div>

            <button onClick={listItem} disabled={!sellForm.tokenId || !sellForm.price || (sellForm.nftType === 'warrior' ? !marketStats.isWarriorAllowed : !marketStats.isWeaponAllowed)} className="w-full btn-success disabled:opacity-50">确认上架</button>
          </div>
        </div>
      )}

      {editPriceModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-4 md:p-6 max-w-md w-full mx-4">
            <h3 className="text-lg md:text-xl font-bold text-gradient mb-3 md:mb-4">修改价格</h3>
            <p className="text-gray-400 text-sm md:text-base mb-3 md:mb-4">{editPriceModal.item?.name} #{editPriceModal.item?.tokenId}</p>
            <div className="mb-3 md:mb-4">
              <label className="block text-sm text-gray-400 mb-1.5 md:mb-2">新价格 (WAR)</label>
              <input type="number" step="0.001" value={editPriceModal.newPrice} onChange={(e) => setEditPriceModal({ ...editPriceModal, newPrice: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-3 text-white text-sm md:text-base" />
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <button onClick={() => setEditPriceModal({ isOpen: false, item: null, newPrice: '' })} className="flex-1 py-2.5 md:py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-sm md:text-base">取消</button>
              <button onClick={changePrice} disabled={!editPriceModal.newPrice} className="flex-1 btn-primary text-sm md:text-base">确认修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
