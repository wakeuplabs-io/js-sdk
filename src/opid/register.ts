import * as core from '@iden3/js-iden3-core';

export const OPID_METHOD = 'opid';
export const OPID_BLOCKCHAIN = 'optimism';
export const OPID_CHAIN_ID_MAIN = 10;
export const OPID_CHAIN_ID_SEPOLIA = 11155420;
export const OPID_NETWORK_MAIN = 'main';
export const OPID_NETWORK_SEPOLIA = 'sepolia';

core.registerDidMethod(OPID_METHOD, 0b00000011);
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: OPID_BLOCKCHAIN,
  chainId: OPID_CHAIN_ID_SEPOLIA,
  network: OPID_NETWORK_SEPOLIA,
  networkFlag: 0b1000_0000 | 0b0000_0010
});
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: OPID_BLOCKCHAIN,
  chainId: OPID_CHAIN_ID_MAIN,
  network: OPID_NETWORK_MAIN,
  networkFlag: 0b1000_0000 | 0b0000_0001
});
