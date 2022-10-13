import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import {
  keccak256,
  defaultAbiCoder,
  getAddress,
  splitSignature,
} from 'ethers/lib/utils'
import invariant from 'tiny-invariant'

import { Collateral, Collection, Strategy, StrategyLeafType } from '../types'

export const hashCollateral = (collateral: Collateral): string => {
  invariant(collateral, 'hashCollateral: collateral must be defined')

  let encode = defaultAbiCoder.encode(
    [
      'uint8',
      'address',
      'uint256',
      'address',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    [
      collateral.type,
      collateral.token,
      collateral.tokenId,
      collateral.borrower,
      collateral.lien.amount,
      collateral.lien.rate,
      collateral.lien.duration,
      collateral.lien.maxPotentialDebt,
    ]
  )

  return keccak256(encode)
}

export const hashCollection = (collection: Collection): string => {
  invariant(collection, 'hashCollection: collection must be defined')

  const encode = defaultAbiCoder.encode(
    ['uint8', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
    [
      collection.type,
      collection.token,
      collection.borrower,
      collection.lien.amount,
      collection.lien.rate,
      collection.lien.duration,
      collection.lien.maxPotentialDebt,
    ]
  )

  return keccak256(encode)
}

export type ParsedStrategyRow = Array<Collateral | Collection>

export interface StrategyObjectFactory<RowType> {
  (rowData: string): RowType
}

export const createCollateralOrCollection: StrategyObjectFactory<
  Collateral | Collection
> = (rowData) => {
  const row: any = RE_STRATEGY_ROW.exec(rowData)?.groups

  switch (parseInt(row.type, 10)) {
    case StrategyLeafType.Collateral: {
      return {
        type: StrategyLeafType.Collateral,
        token: getAddress(row.token.toLowerCase()),
        tokenId: BigNumber.from(String(row.tokenId)),
        borrower: getAddress(row.borrower.toLowerCase()),
        lien: {
          amount: BigNumber.from(String(row.amount)),
          rate: BigNumber.from(String(row.rate)),
          duration: BigNumber.from(String(row.duration)),
          maxPotentialDebt: BigNumber.from(String(row.maxPotentialDebt)),
        },
      }
    }

    case StrategyLeafType.Collection: {
      return {
        type: StrategyLeafType.Collection,
        token: getAddress(row.token.toLowerCase()),
        borrower: getAddress(row.borrower.toLowerCase()),
        lien: {
          amount: BigNumber.from(String(row.amount)),
          rate: BigNumber.from(String(row.rate)),
          duration: BigNumber.from(String(row.duration)),
          maxPotentialDebt: BigNumber.from(String(row.maxPotentialDebt)),
        },
      }
    }
  }

  throw Error('invalid row')
}

export const RE_STRATEGY_ROW = /^(?<type>\d+)[,]{1}(?<token>0x[a-fA-F0-9]{40})[,]{1}(?<tokenId>\d{0,78})[,]{0,1}(?<borrower>0x[a-fA-F0-9]{40})[,]{1}(?<amount>\d{0,78})[,]{1}(?<rate>\d{0,78})[,]{1}(?<duration>\d{1,20})[,]{1}(?<maxPotentialDebt>\d{0,78})$/

const validateCollateralOrCollectionRow = (row: string): boolean =>
  row.length > 0 && RE_STRATEGY_ROW.test(row)

const trimAndSplitByLine = (csv: string): string[] =>
  csv
    .replaceAll(' ', '')
    .replaceAll('\r', '')
    .split('\n')

interface ValidateStrategyCSV {
  (csv: string): ParsedStrategyRow
}

export const validate: ValidateStrategyCSV = (csv: string) => {
  const rows = trimAndSplitByLine(csv)

  const parsed = rows
    .filter(validateCollateralOrCollectionRow)
    .map(createCollateralOrCollection)

  return parsed
}

// hashes the parameters of the terms and collateral to produce a single bytes32 value to act as the root
export const prepareLeaves = (csv: Array<Collateral | Collection>) => {
  const leaves: string[] = []

  csv.forEach((row: Collateral | Collection) => {
    switch (row.type) {
      case StrategyLeafType.Collection: {
        leaves.push(hashCollection(row))
        break
      }

      case StrategyLeafType.Collateral: {
        leaves.push(hashCollateral(row))
        break
      }
    }
  })

  return leaves
}

export const signRoot = async (
  strategy: Strategy,
  provider: JsonRpcProvider,
  root: string,
  verifyingContract: string,
  chainId: number
) => {
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      StrategyDetails: [
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'root', type: 'bytes32' },
      ],
    },
    primaryType: 'StrategyDetails' as const,
    domain: {
      version: strategy.version,
      chainId: chainId,
      verifyingContract: verifyingContract,
    },
    message: {
      nonce: strategy.nonce.toHexString(),
      deadline: strategy.expiration.toHexString(),
      root: root,
    },
  }

  const signer = provider.getSigner()
  const account = await signer.getAddress()

  const signature = await signer.provider.send('eth_signTypedData_v4', [
    account,
    typedData,
  ])

  return splitSignature(signature)
}
