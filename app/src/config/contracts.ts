export const PURCHASE_CONTRACT = {
  address: "0x194eC920B6d7e887F63e2Ea77ca743bAEE9b94fd" as `0x${string}`,
  abi: require("../contracts/BrewFiPurchaseABI.json")
};

export const BREWFI_CONTRACT = {
  address: "0x9a13d88490e21809Fac732C18ff13EB4849e4630" as `0x${string}`,
  abi: require("../contracts/BrewFiTokenABI.json")
};

// USDC token on Avalanche Fuji Testnet
export const USDC_CONTRACT = {
  address: "0x5425890298aed601595a70AB815c96711a31Bc65" as `0x${string}`,
  abi: require("../contracts/ERC20ABI.json")
};

// USDT token on Avalanche Fuji Testnet
export const USDT_CONTRACT = {
  address: "0x9a01bf917477dD9F5D715D188618fc8B7350cd22" as `0x${string}`,
  abi: require("../contracts/ERC20ABI.json")
};