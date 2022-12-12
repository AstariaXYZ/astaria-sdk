import { BigNumber } from '@ethersproject/bignumber'
import { Web3Provider, ExternalProvider } from '@ethersproject/providers'
import { AddressZero } from '@ethersproject/constants'
import ganache from 'ganache'
import { Wallet } from 'ethers'
import { join } from 'path'
import { readFile } from 'fs/promises'

import { StrategyTree } from '../src/strategy/StrategyTree'
import {
  signRootRemote,
  signRootLocal,
  getTypedData,
  encodeIPFSStrategyPayload,
} from '../src/strategy/utils'
import { Strategy } from '../src/types'

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
      strategy,
      provider,
      root,
      verifyingContract,
      0
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
      '0x414cd89c8a2d6724f47829348352a78687a99c57ee83a47933f2021c84f405b9'

    const sig = await signRootLocal(
      strategy,
      wallet,
      root,
      verifyingContract,
      0
    )

    expect(sig.compact).toEqual(
      '0xfee8d5aa9e98505b528922f6549b80c098cd686882522df7c71a807e28c1c39018fb09c76031f9804b3af6a7cb0a8e50e038b48bc252c8403e59ecd2026f43b1'
    )
  })
  test('encoding and decoding for IPFS', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')
    const expected = await readFile(
      join(__dirname, '__mocks__/encode.json'),
      'utf8'
    )

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
    const signature = await signRootLocal(
      strategy,
      wallet,
      root,
      verifyingContract,
      0
    )
    const strategyPayload = encodeIPFSStrategyPayload(
      typedData,
      signature,
      strategyTree.getCSV
    )

    expect(strategyPayload).toEqual(expected)
  })
})
