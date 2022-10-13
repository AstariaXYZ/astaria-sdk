import { signRoot } from '../src/strategy/utils'
import { Strategy } from '../src/types/index'
import { BigNumber, ethers } from 'ethers'
const ganache = require('ganache')

describe('util.signRoot', () => {
  test('signs merkle tree root', async () => {
    let options = {
      wallet: {
        seed: 'junk junk junk junk junk junk junk junk junk junk junk test',
      },
    }
    const provider = new ethers.providers.Web3Provider(
      ganache.provider(options)
    )
    const verifyingContract = '0x0000000000000000000000000000000000000000'
    const strategy: Strategy = {
      version: 0,
      strategist: '0x0000000000000000000000000000000000000000',
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: '0x0000000000000000000000000000000000000000',
    }
    const root =
      '0x451fad0e5b357b99cdde7ebe462ef028dbd5506e1db82b5937c0ebee78dcd3f0'

    let sig = await signRoot(strategy, provider, root, verifyingContract, 0)
    expect(
      '0xac6cdb8ea0aa950f51d369615cb111a7ef2fe0916261b73a70d122aa06ef4e9af14ad956c81b09b630e73c9df12bdb13551232199fa9e2b544fcc0ee1a3b2e0a'
    ).toEqual(sig.compact)
  })
})
