import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import {
  keccak256,
  defaultAbiCoder,
  getAddress,
  splitSignature,
  joinSignature,
} from 'ethers/lib/utils'
import { Wallet, Signature } from 'ethers'
import invariant from 'tiny-invariant'

import {
  Collateral,
  Collection,
  Strategy,
  StrategyLeafType,
  IPFSStrategyPayload,
  TypedData,
  UniV3Collateral,
} from '../types'
const ethSigUtil = require('eth-sig-util')
const stringify = require('json-stringify-deterministic')

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
      collateral.lien.liquidationInitialAsk,
    ]
  )

  return keccak256(encode)
}

export const hashUniV3Collateral = (collateral: UniV3Collateral): string => {
  invariant(collateral, 'hashUniV3Collateral: collateral must be defined')

  let encode = defaultAbiCoder.encode(
    [
      'uint8',
      'address',
      'address',

      'address',
      'address',
      'uint24',
      'int24',
      'int24',
      'uint128',
      'uint256',
      'uint256',

      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    [
      collateral.type,
      collateral.token,
      collateral.borrower,

      collateral.token0,
      collateral.token1,
      collateral.fee,
      collateral.tickLower,
      collateral.tickUpper,
      collateral.minLiquidity,
      collateral.amount0Min,
      collateral.amount1Min,

      collateral.lien.amount,
      collateral.lien.rate,
      collateral.lien.duration,
      collateral.lien.maxPotentialDebt,
      collateral.lien.liquidationInitialAsk,
    ]
  )

  return keccak256(encode)
}

export const hashCollection = (collection: Collection): string => {
  invariant(collection, 'hashCollection: collection must be defined')

  const encode = defaultAbiCoder.encode(
    [
      'uint8',
      'address',
      'address',

      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    [
      collection.type,
      collection.token,
      collection.borrower,

      collection.lien.amount,
      collection.lien.rate,
      collection.lien.duration,
      collection.lien.maxPotentialDebt,
      collection.lien.liquidationInitialAsk,
    ]
  )

  return keccak256(encode)
}

export type ParsedStrategyRow = Array<Collateral | Collection | UniV3Collateral>

export interface StrategyObjectFactory<RowType> {
  (rowData: string): RowType
}

export const createCollateralOrCollection: StrategyObjectFactory<
  Collateral | Collection | UniV3Collateral
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
          liquidationInitialAsk: BigNumber.from(
            String(row.liquidationInitialAsk)
          ),
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
          liquidationInitialAsk: BigNumber.from(
            String(row.liquidationInitialAsk)
          ),
        },
      }
    }

    case StrategyLeafType.UniV3Collateral: {
      return {
        type: StrategyLeafType.UniV3Collateral,
        token: getAddress(row.token.toLowerCase()),
        borrower: getAddress(row.borrower.toLowerCase()),
        token0: getAddress(row.token0.toLowerCase()),
        token1: getAddress(row.token1.toLowerCase()),
        fee: BigNumber.from(String(row.fee)),
        tickLower: BigNumber.from(String(row.tickLower)),
        tickUpper: BigNumber.from(String(row.tickUpper)),
        minLiquidity: BigNumber.from(String(row.minLiquidity)),
        amount0Min: BigNumber.from(String(row.amount0Min)),
        amount1Min: BigNumber.from(String(row.amount1Min)),
        lien: {
          amount: BigNumber.from(String(row.amount)),
          rate: BigNumber.from(String(row.rate)),
          duration: BigNumber.from(String(row.duration)),
          maxPotentialDebt: BigNumber.from(String(row.maxPotentialDebt)),
          liquidationInitialAsk: BigNumber.from(
            String(row.liquidationInitialAsk)
          ),
        },
      }
    }
  }

  throw Error('invalid row')
}
export const RE_STRATEGY_ROW =
  /^(?<type>\d+)[,]{1}(?<token>0x[a-fA-F0-9]{40})[,]{1}(?<tokenId>\d{0,78})[,]{0,1}(?<borrower>0x[a-fA-F0-9]{40})[,]{1}((?<token0>0x[a-fA-F0-9]{40})[,]{1}(?<token1>0x[a-fA-F0-9]{40})[,]{1}(?<fee>\d{1,8})[,]{1}(?<tickLower>-\d{1,8})[,]{1}(?<tickUpper>-\d{1,8})[,]{1}(?<minLiquidity>\d{1,39})[,]{1}(?<amount0Min>\d{0,78})[,]{1}(?<amount1Min>\d{0,78})[,]{1}){0,1}(?<amount>\d{0,78})[,]{1}(?<rate>\d{0,78})[,]{1}(?<duration>\d{1,20})[,]{1}(?<maxPotentialDebt>\d{0,78})[,]{1}(?<liquidationInitialAsk>\d{0,78})$/

const validateCollateralOrCollectionRow = (row: string): boolean =>
  row.length > 0 && RE_STRATEGY_ROW.test(row)

const trimAndSplitByLine = (csv: string): string[] =>
  csv.replaceAll(' ', '').replaceAll('\r', '').split('\n')

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
export const prepareLeaves = (
  csv: Array<Collateral | Collection | UniV3Collateral>
) => {
  csv.forEach((row: Collateral | Collection | UniV3Collateral) => {
    switch (row.type) {
      case StrategyLeafType.Collection: {
        row.leaf = hashCollection(row)
        break
      }

      case StrategyLeafType.Collateral: {
        row.leaf = hashCollateral(row)
        break
      }

      case StrategyLeafType.UniV3Collateral: {
        row.leaf = hashUniV3Collateral(row)
        break
      }
    }
  })
}

export const signRootRemote = async (
  typedData: TypedData,
  provider: JsonRpcProvider
) => {
  const signer = provider.getSigner()
  const account = await signer.getAddress()

  const signature = await signer.provider.send('eth_signTypedData_v4', [
    account,
    typedData,
  ])

  return splitSignature(signature)
}

export const signRootLocal = async (typedData: TypedData, wallet: Wallet) => {
  const privateKey = Uint8Array.from(
    Buffer.from(wallet.privateKey.replace('0x', ''), 'hex')
  )
  const signature = ethSigUtil.signTypedData(privateKey, {
    data: typedData,
  })

  return splitSignature(signature)
}

export const verifySignature = (typedData: TypedData, signature: Signature) => {
  const recovered = ethSigUtil.recoverTypedSignature({
    sig: joinSignature(signature),
    data: typedData,
  })

  return recovered
}

export const getTypedData = (
  strategy: Strategy,
  root: string,
  verifyingContract: string,
  chainId: number
): TypedData => {
  return {
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
      version: String(strategy.version),
      chainId: chainId,
      verifyingContract: verifyingContract,
    },
    message: {
      nonce: strategy.nonce.toHexString(),
      deadline: strategy.expiration.toHexString(),
      root: root,
    },
  }
}

export const encodeIPFSStrategyPayload = (
  typedData: TypedData,
  signature: Signature,
  csv: ParsedStrategyRow
): string => {
  const payload: IPFSStrategyPayload = {
    typedData: typedData,
    signature: signature,
    leaves: csv,
  }
  return stringify(payload)
}

export const decodeIPFSStrategyPayload = (
  strategy: string
): IPFSStrategyPayload => {
  return JSON.parse(strategy)
}
