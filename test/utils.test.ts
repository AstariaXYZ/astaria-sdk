import { join } from 'path'
import { readFile } from 'fs/promises'
import { Wallet } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import { Web3Provider, ExternalProvider } from '@ethersproject/providers'
import { AddressZero } from '@ethersproject/constants'
import ganache from 'ganache'

import { StrategyTree } from '../src/strategy/StrategyTree'
import {
  signRootRemote,
  signRootLocal,
  encodeIPFSStrategyPayload,
  verifySignature,
  getTypedData,
} from '../src/strategy/utils'
import { Strategy } from '../src/types'

const Hash = require('ipfs-only-hash')

describe('util.signRoot using remote', () => {
  test('signs merkle tree root', async () => {
    const options = {
      wallet: {
        mnemonic: 'junk junk junk junk junk junk junk junk junk junk junk test',
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
      delegate: AddressZero,
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: AddressZero,
    }
    const root =
      '0x40c9e8c33c4cf5ff06180afea2e6a3bab45b6bfb4fafca7ec401e4201fded1a9'

    const sig = await signRootRemote(
      getTypedData(strategy, root, verifyingContract, 0),
      provider
    )

    expect(sig.compact).toEqual(
      '0x93df081d0c605b582487bf4425e0922e3faa99ebfc7a4b28d325fefac62e71a9711dc4b5f4e03220ee46e4792e6c774788d0fb70f2073589c7ac86f7842a7ea2'
    )
  })
  test('signs merkle tree root using local', async () => {
    const wallet = Wallet.fromMnemonic(
      'junk junk junk junk junk junk junk junk junk junk junk test'
    )
    const verifyingContract = AddressZero
    const strategy: Strategy = {
      version: 0,
      delegate: AddressZero,
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: AddressZero,
    }
    const root =
      '0x276a20acb0e3b40e3e98b20030585add5dd1c6c6f53b99b3bc0645809dd3eef0'

    const sig = await signRootLocal(
      getTypedData(strategy, root, verifyingContract, 0),
      wallet
    )

    expect(sig.compact).toEqual(
      '0xe0e39ac74826e1724bb789b2dbfb29ff923eac0bab8c9532267dd7b93af2e10020adf36573c078e9610263480e1648624729e015eab4b3db90fdc90a1af5d46a'
    )
  })
  test('encoding and hashing for IPFS deterministically', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')
    const expected = 'QmSsqABZ2U72yJ8riiuaK3LccmapmCYY1tY1WB1DsUowgD'
    const strategyTree = new StrategyTree(csv)

    const root = strategyTree.getHexRoot()
    const wallet = Wallet.fromMnemonic(
      'junk junk junk junk junk junk junk junk junk junk junk test'
    )
    const verifyingContract = AddressZero
    const strategy: Strategy = {
      version: 0,
      delegate: AddressZero,
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: AddressZero,
    }
    const typedData = getTypedData(strategy, root, verifyingContract, 0)
    const signature = await signRootLocal(typedData, wallet)
    const strategyPayload = encodeIPFSStrategyPayload(
      typedData,
      signature,
      strategyTree.getCSV
    )
    const actual = await Hash.of(strategyPayload)
    expect(actual).toEqual(expected)
  })
  test('signs merkle tree root using local then verifies', async () => {
    const wallet = Wallet.fromMnemonic(
      'junk junk junk junk junk junk junk junk junk junk junk test'
    )
    const verifyingContract = AddressZero
    const strategy: Strategy = {
      version: 0,
      delegate: AddressZero,
      expiration: BigNumber.from(0),
      nonce: BigNumber.from(0),
      vault: AddressZero,
    }
    const expected = wallet.address.toLowerCase()
    const root =
      '0x276a20acb0e3b40e3e98b20030585add5dd1c6c6f53b99b3bc0645809dd3eef0'

    const typedData = getTypedData(strategy, root, verifyingContract, 0)
    const signature = await signRootLocal(typedData, wallet)
    const actual = verifySignature(typedData, signature)

    expect(actual).toEqual(expected)
  })
})
