import { BigNumber } from '@ethersproject/bignumber'
import { Web3Provider, ExternalProvider } from '@ethersproject/providers'
import { AddressZero } from '@ethersproject/constants'
import ganache from 'ganache'

import { signRoot } from '../src/strategy/utils'
import { Strategy } from '../src/types'

describe('util.signRoot', () => {
  test('signs merkle tree root', async () => {
    const options = {
      wallet: {
        seed: 'junk junk junk junk junk junk junk junk junk junk junk test',
      },
      logging: {
        quiet: true,
      },
    }

    const ganacheProvider: unknown = ganache.provider<'ethereum'>(options)
    const provider = new Web3Provider(ganacheProvider as ExternalProvider)

    const verifyingContract = AddressZero
    const strategy: Strategy = {
      version: 0,
      strategist: AddressZero,
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: AddressZero,
    }
    const root =
      '0x451fad0e5b357b99cdde7ebe462ef028dbd5506e1db82b5937c0ebee78dcd3f0'

    const sig = await signRoot(strategy, provider, root, verifyingContract, 0)

    expect(
      '0xac6cdb8ea0aa950f51d369615cb111a7ef2fe0916261b73a70d122aa06ef4e9af14ad956c81b09b630e73c9df12bdb13551232199fa9e2b544fcc0ee1a3b2e0a'
    ).toEqual(sig.compact)
  })
})
