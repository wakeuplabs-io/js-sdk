import * as core from '@iden3/js-iden3-core';

export const OPID_METHOD = 'opid';

core.registerDidMethod(OPID_METHOD, 0b00000011);
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: 'optimism',
  chainId: 11155420,
  network: 'sepolia',
  networkFlag: 0b1000_0000 | 0b0000_0010
});
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: 'optimism',
  chainId: 10,
  network: 'main',
  networkFlag: 0b1000_0000 | 0b0000_0001
});