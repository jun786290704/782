import { ethers } from 'ethers';

// 合约地址配置 - V5 部署 (2026-01-30 更新，全新部署)
export const CONTRACTS = {
  FiveElementsSystem: "0x69407ECC5f85b24391D086704b65418115cB89e2",
  WarToken: "0xc39Ecfd52984D25f554BA28cE5560FB692B47943",
  Treasury: "0x76564BCe24bAA0b4882F4cBeD7f32Ae5BaA5526E",
  WarriorNFT: "0x843f09f889A6eaA39B7f3c8d77B11FcDCD665324",
  WeaponNFT: "0xE8f314919a09d7F612231a6FDd5CeAE509145944",
  WeaponNFTV3: "0xE8f314919a09d7F612231a6FDd5CeAE509145944",
  PVEEnemyLibrary: "0x72F9A41f0398B0ebBE91e1bf56905cF732E9a74D",
  BattleSystemLocal: "0x28ce9fec4E72C9e0De31c572c087c33eb78999ff",
  Marketplace: "0xf9D2067aD9A20a38683f7975C325EA932539974F",
  MarketplaceV2: "0xf9D2067aD9A20a38683f7975C325EA932539974F",
  GameManager: "0xf69f91E1784574aDDCaCaf91b208428E5Be948f5",
  WeaponBatchMinter: "0x8D21C03E1C2524B3EEBb238a6637590E38f80178"
};

// 铸造价格配置 (使用 WarToken)
export const MINT_PRICES = {
  WarriorNFT: ethers.utils.parseEther("50"),  // 50 WAR
  WeaponNFT: ethers.utils.parseEther("10")    // 10 WAR
};

// 元素配置
export const ELEMENTS = {
  0: { name: 'Wood', cn: '木', color: 'bg-green-500', gradient: 'from-green-400 to-green-600', icon: '🌲' },
  1: { name: 'Fire', cn: '火', color: 'bg-red-500', gradient: 'from-red-400 to-red-600', icon: '🔥' },
  2: { name: 'Earth', cn: '土', color: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600', icon: '🌍' },
  3: { name: 'Metal', cn: '金', color: 'bg-gray-400', gradient: 'from-gray-300 to-gray-500', icon: '⚔️' },
  4: { name: 'Water', cn: '水', color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', icon: '💧' }
};

// 难度配置
export const DIFFICULTY = {
  0: { name: '简单', color: 'text-green-600', bg: 'bg-green-100' },
  1: { name: '普通', color: 'text-blue-600', bg: 'bg-blue-100' },
  2: { name: '中等', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  3: { name: '困难', color: 'text-orange-600', bg: 'bg-orange-100' },
  4: { name: 'BOSS', color: 'text-red-600', bg: 'bg-red-100' }
};

// 星级配置
export const STAR_NAMES = {
  0: { name: '普通', color: '#9E9E9E', stars: '⭐', bg: 'bg-gray-100' },
  1: { name: '优秀', color: '#4CAF50', stars: '⭐⭐', bg: 'bg-green-100' },
  2: { name: '稀有', color: '#2196F3', stars: '⭐⭐⭐', bg: 'bg-blue-100' },
  3: { name: '史诗', color: '#9C27B0', stars: '⭐⭐⭐⭐', bg: 'bg-purple-100' },
  4: { name: '传说', color: '#FFD700', stars: '⭐⭐⭐⭐⭐', bg: 'bg-yellow-100' }
};

export function getElementType(elementName) {
  const map = { 'Wood': 0, 'Fire': 1, 'Earth': 2, 'Metal': 3, 'Water': 4 };
  return map[elementName] || 0;
}

// 百家姓
const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈',
  '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许',
  '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏',
  '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章',
  '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦',
  '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳',
  '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺',
  '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
  '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余',
  '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹'
];

// 名字常用字（按元素属性分类）
const NAME_CHARS_BY_ELEMENT = {
  0: [ // 木 - 与植物、生长相关
    '森', '林', '木', '枝', '叶', '青', '翠', '芳', '芬', '茂',
    '荣', '华', '萱', '薇', '芷', '芸', '芊', '芙', '蓉', '柳',
    '松', '柏', '竹', '梅', '兰', '菊', '桃', '杏', '梨', '桐',
    '桦', '楠', '杉', '枫', '榆', '梓', '梧', '桐', '檬', '橙'
  ],
  1: [ // 火 - 与光明、热情相关
    '炎', '焱', '煜', '炜', '烨', '煊', '焕', '灿', '烁', '熠',
    '煌', '熙', '照', '曜', '明', '晖', '晴', '晓', '旭', '晨',
    '曦', '晶', '灵', '炽', '烈', '焰', '烨', '煊', '煦', '暄',
    '昊', '晟', '晗', '晞', '晢', '晴', '晶', '朗', '晰', '智'
  ],
  2: [ // 土 - 与大地、稳重相关
    '坤', '垚', '培', '基', '城', '垣', '壁', '垒', '坤', '均',
    '圣', '坚', '硕', '磊', '岩', '岳', '峰', '岭', '峦', '岗',
    '丘', '陵', '坡', '坦', '坤', '垚', '培', '垠', '境', '域',
    '圭', '璋', '瑜', '瑞', '珍', '珠', '玉', '璞', '琦', '玮'
  ],
  3: [ // 金 - 与金属、锐利相关
    '金', '鑫', '铭', '锐', '锋', '铮', '铄', '锦', '铮', '铠',
    '铖', '钰', '铭', '锐', '锋', '钢', '铁', '钧', '铎', '铃',
    '铮', '铿', '锵', '锡', '铅', '铜', '银', '镜', '钟', '鼎',
    '剑', '戟', '斧', '钺', '钩', '叉', '鞭', '锏', '锤', '戈'
  ],
  4: [ // 水 - 与水流、智慧相关
    '淼', '涵', '泽', '洋', '海', '江', '河', '湖', '泊', '溪',
    '流', '涛', '波', '浪', '潮', '润', '涵', '泽', '沐', '浴',
    '清', '澄', '澈', '洁', '淳', '淑', '湘', '潇', '澜', '漪',
    '漩', '涓', '涔', '滢', '滟', '潋', '澹', '渺', '淼', '浩'
  ]
};

// 通用名字字（所有元素都可用）
const COMMON_NAME_CHARS = [
  '文', '武', '英', '雄', '杰', '俊', '伟', '强', '勇', '毅',
  '刚', '正', '诚', '信', '义', '礼', '智', '仁', '德', '忠',
  '孝', '廉', '洁', '明', '亮', '辉', '耀', '光', '华', '彩',
  '美', '丽', '秀', '娟', '婷', '娜', '芳', '香', '雅', '静',
  '平', '安', '宁', '康', '健', '泰', '祥', '瑞', '福', '禄',
  '寿', '喜', '乐', '欣', '悦', '怡', '怡', '悦', '欢', '畅'
];

/**
 * 根据角色ID和元素生成角色名称
 * 使用ID作为随机种子，保证同一个角色总是生成相同的名字
 * @param {string|number} warriorId - 角色ID
 * @param {number} element - 元素类型 (0-4)
 * @returns {string} 生成的角色名称
 */
export function generateWarriorName(warriorId, element) {
  // 将ID转换为数字并作为种子
  const id = parseInt(warriorId) || 0;
  
  // 使用简单的伪随机算法，基于ID生成确定性的随机数
  const seed = id * 9301 + 49297;
  
  // 选择姓氏
  const surnameIndex = seed % SURNAMES.length;
  const surname = SURNAMES[surnameIndex];
  
  // 获取该元素的名字字库，混合通用字库
  const elementChars = NAME_CHARS_BY_ELEMENT[element] || NAME_CHARS_BY_ELEMENT[0];
  const allChars = [...elementChars, ...COMMON_NAME_CHARS];
  
  // 生成第一个名字字（与元素相关）
  const nameIndex1 = (seed * 16807) % elementChars.length;
  const nameChar1 = elementChars[nameIndex1];
  
  // 生成第二个名字字（通用）
  const nameIndex2 = (seed * 48271) % COMMON_NAME_CHARS.length;
  const nameChar2 = COMMON_NAME_CHARS[nameIndex2];
  
  // 根据ID决定是单字名还是双字名
  const isDoubleName = (id % 3) !== 0; // 约66%概率双字名
  
  if (isDoubleName) {
    return surname + nameChar1 + nameChar2;
  } else {
    return surname + nameChar1;
  }
}

// 合约 ABI
export const ABI = {
  Treasury: [
    "function distributeReward(address recipient, uint256 amount, string calldata reason) returns (bool)",
    "function deposit(uint256 amount) returns (bool)",
    "function withdraw(uint256 amount) returns (bool)",
    "function grantDistributorRole(address account)",
    "function revokeDistributorRole(address account)",
    "function emergencyWithdraw()",
    "function warToken() view returns (address)",
    "function dailyRewardLimit() view returns (uint256)",
    "function todayRewarded() view returns (uint256)",
    "function totalDistributed() view returns (uint256)",
    "function lastRewardDay() view returns (uint256)",
    "function getTreasuryBalance() view returns (uint256)",
    "function getRemainingDailyLimit() view returns (uint256)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function REWARD_DISTRIBUTOR_ROLE() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "event RewardDistributed(address indexed recipient, uint256 amount, string reason, uint256 day)",
    "event Deposited(address indexed sender, uint256 amount)",
    "event Withdrawn(address indexed recipient, uint256 amount)",
    "event DistributorRoleGranted(address indexed account)",
    "event DistributorRoleRevoked(address indexed account)",
    "event EmergencyWithdrawal(uint256 amount, uint256 timestamp)"
  ],
  WarToken: [
    // ERC20 标准
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    // 升级合约额外函数
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "function burnFrom(address account, uint256 amount)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function getRoleMemberCount(bytes32 role) view returns (uint256)",
    "function getRoleMember(bytes32 role, uint256 index) view returns (address)",
    "function getRoleAdmin(bytes32 role) view returns (bytes32)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function renounceRole(bytes32 role, address account)",
    "function MINTER_ROLE() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function renounceOwnership()",
    "function upgradeTo(address newImplementation)",
    "function upgradeToAndCall(address newImplementation, bytes memory data)",
    "function proxiableUUID() view returns (bytes32)",
    // 事件
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    "event Upgraded(address indexed implementation)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
  ],
  WarriorNFT: [
    // ERC721 标准
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenByIndex(uint256 index) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    // 游戏功能
    "function mintWarrior() returns (uint256)",
    "function mintPrice() view returns (uint256)",
    "function getMintPrice() view returns (uint256)",
    "function warToken() view returns (address)",
    "function fiveElementsSystem() view returns (address)",
    "function getWarriorInfo(uint256 tokenId) view returns (uint256 level, uint256 power, uint256 experience, uint256 stamina, string memory elementName, uint256 battlesWon, uint256 battlesLost, uint256 requiredExp, uint256 progressPercentage)",
    "function getWarriorElement(uint256 tokenId) view returns (uint8)",
    "function getWarriorPower(uint256 tokenId) view returns (uint256)",
    "function getWarriorsByOwner(address owner) view returns (uint256[] memory)",
    "function getContractStats() view returns (uint256 totalMinted, uint256 currentPrice)",
    "function setGameManager(address _gameManager)",
    "function setBattleSystem(address _battleSystem)",
    "function gameManager() view returns (address)",
    "function battleSystem() view returns (address)",
    // 访问控制
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function getRoleMemberCount(bytes32 role) view returns (uint256)",
    "function getRoleMember(bytes32 role, uint256 index) view returns (address)",
    "function getRoleAdmin(bytes32 role) view returns (bytes32)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function renounceRole(bytes32 role, address account)",
    "function MINTER_ROLE() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    // 拥有权
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function renounceOwnership()",
    // 升级
    "function upgradeTo(address newImplementation)",
    "function upgradeToAndCall(address newImplementation, bytes memory data)",
    "function proxiableUUID() view returns (bytes32)",
    // 事件
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "event WarriorMinted(uint256 indexed tokenId, address indexed owner, uint8 element)",
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    "event Upgraded(address indexed implementation)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
  ],
  WeaponNFT: [
    // ERC1155 标准
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[] memory)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address account, address operator) view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)",
    "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)",
    "function uri(uint256 tokenId) view returns (string memory)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    // 游戏功能
    "function mintWeapon(uint256 seed) returns (uint256)",
    "function mintWeaponsBatch(uint256 count, uint256 seed) returns (uint256[] memory)",
    "function mintPrice() view returns (uint256)",
    "function getMintPrice() view returns (uint256)",
    "function warToken() view returns (address)",
    "function fiveElementsSystem() view returns (address)",
    "function getWeaponInfo(uint256 weaponId) view returns (string memory name, string memory elementName, uint8 stars, uint16 stat1, uint16 stat2, uint16 stat3, uint8 level, uint256 basePower, uint256 equippedBy, string memory weaponType, uint8 currentDurability, uint8 maxDurability, bool broken)",
    "function getDurabilityPoints(uint256 weaponId) view returns (uint8)",
    "function drainDurability(uint256 weaponId, uint8 amount, bool allowNegative)",
    "function repairWeapon(uint256 weaponId) payable",
    "function getWeaponPowerBonus(uint256 weaponId, uint8 warriorElement) view returns (uint256)",
    "function getWeaponsByOwner(address owner) view returns (uint256[] memory)",
    "function equipWeapon(uint256 weaponId, uint256 warriorId)",
    "function unequipWeapon(uint256 weaponId)",
    "function burn(uint256 weaponId)",
    "function reforge(uint256 burnId, uint256 targetId)",
    "function reforgeWithDust(uint256 weaponId, uint32 lowDust, uint32 fourDust, uint32 fiveDust)",
    "function getDustSupplies(address user) view returns (uint32 low, uint32 four, uint32 five)",
    "function burnDust(address) view returns (uint256)",
    "function weapons(uint256) view returns (uint256 id, uint8 element, uint8 stars, uint16 stat1, uint16 stat2, uint16 stat3, uint8 level, uint256 basePower, uint256 equippedBy, uint256 durabilityTimestamp, uint8 durabilityPoints, bool broken)",
    "function burnPoints(uint256) view returns (uint32 lowStarPoints, uint32 fourStarPoints, uint32 fiveStarPoints)",
    "function calculatePowerMultiplier(uint256 weaponId) view returns (uint256)",
    "function calculateElementBonus(uint8 weaponElement, uint8 warriorElement) view returns (uint256)",
    "function getFightData(uint256 weaponId, uint8 warriorElement) view returns (uint256 basePower, uint256 multiplier, uint256 totalPower, uint8 element, bool busy)",
    "function getWeaponsByOwner(address owner) view returns (uint256[] memory)",
    "function isWeaponBusy(uint256 weaponId) view returns (bool)",
    "function nftVars(uint256) view returns (uint256)",
    "function NFTVAR_BUSY() view returns (uint256)",
    "function nextTokenId() view returns (uint256)",
    "function gameManager() view returns (address)",
    "function setGameManager(address _gameManager)",
    // 访问控制
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function getRoleMemberCount(bytes32 role) view returns (uint256)",
    "function getRoleMember(bytes32 role, uint256 index) view returns (address)",
    "function getRoleAdmin(bytes32 role) view returns (bytes32)",
    "function grantRole(bytes32 role, address account)",
    "function revokeRole(bytes32 role, address account)",
    "function renounceRole(bytes32 role, address account)",
    "function MINTER_ROLE() view returns (bytes32)",
    "function GAME_ADMIN() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    // 拥有权
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function renounceOwnership()",
    // 升级
    "function upgradeTo(address newImplementation)",
    "function upgradeToAndCall(address newImplementation, bytes memory data)",
    "function proxiableUUID() view returns (bytes32)",
    // ERC1155 事件
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
    "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
    "event URI(string value, uint256 indexed id)",
    // 游戏事件
    "event WeaponMinted(uint256 indexed weaponId, address indexed owner, uint8 element, uint8 stars, uint256 seed)",
    "event Burned(address indexed owner, uint256 indexed weaponId, uint256 dustGained, uint32 lowPoints, uint32 fourPoints, uint32 fivePoints)",
    "event Reforged(address indexed owner, uint256 indexed burnId, uint256 indexed targetId, uint32 lowPoints, uint32 fourPoints, uint32 fivePoints)",
    "event ReforgedWithDust(address indexed owner, uint256 indexed weaponId, uint256 dustUsed, uint32 lowPoints, uint32 fourPoints, uint32 fivePoints)",
    "event DurabilityConsumed(uint256 indexed weaponId, uint8 pointsConsumed, uint8 remainingPoints)",
    "event WeaponEquipped(uint256 indexed weaponId, uint256 indexed warriorId, address owner)",
    "event WeaponUnequipped(uint256 indexed weaponId, uint256 indexed warriorId, address owner)",
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    "event Upgraded(address indexed implementation)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
  ],
  BattleSystemLocal: [
    // 核心战斗函数
    "function startBattle(uint256 warriorId, uint256 weaponId, uint256 enemyId) nonReentrant returns (uint256 battleId)",
    "function getBattlePreview(uint256 warriorId, uint256 weaponId, uint256 enemyId) view returns (uint256 playerPower, uint256 enemyPower, uint256 winProbability, uint256 potentialReward, uint256 potentialExperience, string memory elementRelation, string memory adjustmentReason)",
    "function getCurrentStamina(uint256 warriorId) view returns (uint256)",
    "function getBattleStatistics(address player) view returns (uint256 totalBattles, uint256 wins, uint256 losses, uint256 totalRewards, uint256 totalExperience)",
    "function getRecommendedEnemies(uint256 warriorId) view returns (uint256[] memory)",
    "function getPlayerBattleHistory(address player) view returns (tuple(address player, uint256 warriorId, uint256 weaponId, uint256 enemyId, bool victory, uint256 playerPower, uint256 enemyPower, uint256 elementMultiplier, uint256 reward, uint256 experienceGained, uint256 timestamp, uint256 winProbability, string memory elementRelation, uint256 randomSeed)[] memory)",
    // 状态变量
    "function nextBattleId() view returns (uint256)",
    "function staminaCost() view returns (uint256)",
    "function baseReward() view returns (uint256)",
    "function battleCooldown() view returns (uint256)",
    "function baseExperience() view returns (uint256)",
    "function gameManager() view returns (address)",
    // 配置函数
    "function getContractConfig() view returns (uint256 reward, uint256 cooldown, uint256 stamina, uint256 experience)",
    "function setBaseExperience(uint256 newBaseExperience)",
    "function setBaseReward(uint256 newReward)",
    "function setStaminaCost(uint256 newCost)",
    "function setBattleCooldown(uint256 newCooldown)",
    "function setGameManager(address _gameManager)",
    // 事件
    "event BattleStarted(uint256 indexed battleId, address indexed player, uint256 warriorId, uint256 weaponId, uint256 enemyId)",
    "event BattleCompleted(uint256 indexed battleId, address indexed player, bool victory, uint256 playerPower, uint256 enemyPower, uint256 reward, uint256 experienceGained, uint256 randomSeed)",
    "event EnemyDefeated(uint256 enemyId, address player, uint256 reward)",
    "event ExperienceDistributed(uint256 indexed warriorId, uint256 amount)"
  ],
  PVEEnemyLibrary: [
    "function getEnemyDetails(uint256 enemyId) view returns (tuple(uint256 id, uint8 difficulty, uint8 element, uint256 basePower, uint256 rewardMultiplier, uint256 experienceReward, bool active))",
    "function calculateEnemyPower(uint256 enemyId, uint256 playerTotalPower) view returns (uint256)",
    "function calculateFinalWinRate(uint256 playerTotalPower, uint8 playerElement, uint256 enemyId) view returns (uint256 finalWinRate, uint256 baseWinRate, uint256 elementAdjustment, string adjustmentReason)",
    "function previewRandomEnemies(uint256 playerTotalPower, uint256 count, uint256 seed) view returns (tuple(uint256 id, uint8 difficulty, uint8 element, uint256 basePower, uint256 rewardMultiplier, uint256 experienceReward, bool active)[], uint256[] calculatedPowers)",
    "function getRandomEnemiesForPlayer(uint256 playerTotalPower, uint256 count, uint256 seed) returns (tuple(uint256 id, uint8 difficulty, uint8 element, uint256 basePower, uint256 rewardMultiplier, uint256 experienceReward, bool active)[], uint256[] calculatedPowers)",
    "function getEnemyCount() view returns (uint256)"
  ],
  GameManager: [
    // 角色管理
    "function grantGameAdmin(address account)",
    "function revokeGameAdmin(address account)",
    "function isGameAdmin(address account) view returns (bool)",
    "function GAME_ADMIN() view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    
    // 合约地址管理
    "function setWarriorNFT(address _warriorNFT)",
    "function setWeaponNFT(address _weaponNFT)",
    "function setBattleSystem(address _battleSystem)",
    "function setMarketplace(address _marketplace)",
    "function warriorNFT() view returns (address)",
    "function weaponNFT() view returns (address)",
    "function battleSystem() view returns (address)",
    "function marketplace() view returns (address)",
    
    // 铸造费用管理
    "function setWarriorMintPrice(uint256 newPrice)",
    "function setWeaponMintPrice(uint256 newPrice)",
    "function params() view returns (uint256 warriorMintPrice, uint256 weaponMintPrice, uint256 baseBattleReward, uint256 battleCooldown, uint256 staminaCost, uint256 maxStamina, uint256 staminaRecoveryTime)",
    "function getGameParameters() view returns (tuple(uint256 warriorMintPrice, uint256 weaponMintPrice, uint256 baseBattleReward, uint256 battleCooldown, uint256 staminaCost, uint256 maxStamina, uint256 staminaRecoveryTime))",
    
    // 战斗参数管理
    "function setBaseBattleReward(uint256 newReward)",
    "function setBattleCooldown(uint256 newCooldown)",
    "function setStaminaCost(uint256 newCost)",
    "function setStaminaParams(uint256 _maxStamina, uint256 _recoveryTime)",
    
    // 功能开关
    "function setMintingEnabled(bool enabled)",
    "function setBattleEnabled(bool enabled)",
    "function setMarketplaceEnabled(bool enabled)",
    "function mintingEnabled() view returns (bool)",
    "function battleEnabled() view returns (bool)",
    "function marketplaceEnabled() view returns (bool)",
    "function getFeatureStatus() view returns (bool _mintingEnabled, bool _battleEnabled, bool _marketplaceEnabled)",
    "function isMintingAvailable() view returns (bool)",
    "function isBattleAvailable() view returns (bool)",
    "function isMarketplaceAvailable() view returns (bool)",
    
    // 市场费率
    "function setMarketplaceFeeRate(uint256 newFeeRate)",
    "function marketplaceFeeRate() view returns (uint256)",
    
    // 批量更新
    "function batchUpdateParams(tuple(uint256 warriorMintPrice, uint256 weaponMintPrice, uint256 baseBattleReward, uint256 battleCooldown, uint256 staminaCost, uint256 maxStamina, uint256 staminaRecoveryTime) newParams)",
    
    // 暂停功能
    "function pause()",
    "function unpause()",
    "function paused() view returns (bool)",
    
    // 事件
    "event WarriorMintPriceUpdated(uint256 newPrice)",
    "event WeaponMintPriceUpdated(uint256 newPrice)",
    "event BattleRewardUpdated(uint256 newReward)",
    "event BattleCooldownUpdated(uint256 newCooldown)",
    "event StaminaCostUpdated(uint256 newCost)",
    "event FeatureToggled(string feature, bool enabled)",
    "event MarketplaceFeeUpdated(uint256 newFeeRate)",
    "event ContractAddressUpdated(string contractName, address newAddress)"
  ],
  WeaponBatchMinter: [
    "function mintWeaponsBatch(uint256 count, uint256 seed) returns (uint256[] memory)",
    "function weaponNFT() view returns (address)",
    "function setWeaponNFT(address _weaponNFT)",
    "function withdrawWarToken(address token)",
    "event WeaponsBatchMinted(address indexed user, uint256 count, uint256[] weaponIds, uint256 totalCost)"
  ]
};
