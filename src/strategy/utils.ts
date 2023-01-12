import { JsonRpcProvider } from '@ethersproject/providers'
import {
  keccak256,
  defaultAbiCoder,
  splitSignature,
  joinSignature,
} from 'ethers/lib/utils'
import {
  Wallet,
  Signature,
  Signer,
  ContractTransaction,
  BigNumber,
} from 'ethers'
import invariant from 'tiny-invariant'

import { parse as parseCSV } from 'papaparse'
import {
  Collateral,
  Collection,
  Strategy,
  StrategyLeafType,
  StrategyRow,
  StrategySchema,
  IPFSStrategyPayloadSchema,
  IPFSStrategyPayload,
  TypedData,
  StrategyDetails,
  UniV3Collateral,
  ProofServiceResponse,
  MerkleDataStruct,
  MerkleDataStructSchema,
  UniV3CollateralSchema,
  CollectionSchema,
  ProofServiceResponseSchema,
} from '../types'
import { AstariaRouter__factory } from '../contracts/factories/AstariaRouter__factory'
import { IAstariaRouter } from '../contracts/AstariaRouter'
import { ILienToken } from '../contracts/LienToken'
import axios from 'axios'
const ethSigUtil = require('eth-sig-util')
const stringify = require('json-stringify-deterministic')

export const encodeCollateral = (collateral: Collateral): string => {
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

  return encode
}

export const encodeUniV3Collateral = (collateral: UniV3Collateral): string => {
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

  return encode
}

export const encodeCollection = (collection: Collection): string => {
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

  return encode
}

export const getStrategyFromCSV = (csv: string): Strategy => {
  return StrategySchema.parse(
    parseCSV(csv, {
      header: true,
      skipEmptyLines: true,
    }).data.map((data: any) => {
      return {
        ...data,
        lien: {
          amount: data?.amount,
          rate: data?.rate,
          duration: data?.duration,
          maxPotentialDebt: data?.maxPotentialDebt,
          liquidationInitialAsk: data?.liquidationInitialAsk,
        },
      }
    })
  )
}
// hashes the parameters of the terms and collateral to produce a single bytes32 value to act as the root
export const prepareLeaves = (strategy: Strategy): string[] => {
  return strategy.map((row: StrategyRow) => {
    switch (row.type) {
      case StrategyLeafType.Collection: {
        row.leaf = keccak256(encodeCollection(row))
        break
      }

      case StrategyLeafType.Collateral: {
        row.leaf = keccak256(encodeCollateral(row))
        break
      }

      case StrategyLeafType.UniV3Collateral: {
        row.leaf = keccak256(encodeUniV3Collateral(row))
        break
      }
    }
    return row.leaf
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
  strategy: StrategyDetails,
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
      deadline: strategy.expiration.toString(),
      root: root,
    },
  }
}

export function encodeIPFSStrategyPayload(
  typedData: TypedData,
  signature: Signature,
  strategy: Strategy
): string {
  return stringify({
    typedData: typedData,
    signature: signature,
    strategy: strategy,
  })
}
export const decodeIPFSStrategyPayload = (
  ipfsStrategyPayload: string
): IPFSStrategyPayload => {
  return IPFSStrategyPayloadSchema.parse(JSON.parse(ipfsStrategyPayload))
}

export const commitToLiens = async (
  router: string,
  commitments: Array<IAstariaRouter.CommitmentStruct>,
  signer: Signer
): Promise<ContractTransaction> => {
  //get contract instance

  const contract = AstariaRouter__factory.connect(router, signer)
  console.log('Henlo')
  const gasLimit = await contract.callStatic.commitToLiens(commitments)
  console.log('Bark: ' + gasLimit)
  return await contract.commitToLiens(commitments)
}

export const getStackByCollateral = (
  token: string,
  id: BigNumber
): ILienToken.StackStruct[] => {
  // call to the subgraph to get the stack
  const stack: ILienToken.StackStruct[] = []
  return stack
}

export const convertProofServiceResponseToCommitment = (
  proofServiceResponse: ProofServiceResponse,
  collateral: StrategyRow,
  tokenId: BigNumber,
  amount: BigNumber,
  stack: ILienToken.StackStruct[]
): IAstariaRouter.CommitmentStruct => {
  let nlrDetails: string
  if (collateral.type === StrategyLeafType.Collateral) {
    nlrDetails = encodeCollateral(collateral)
  } else if (collateral.type === StrategyLeafType.Collection) {
    nlrDetails = encodeCollection(collateral)
  } else {
    nlrDetails = encodeUniV3Collateral(collateral)
  }

  const merkle = MerkleDataStructSchema.parse({
    root: proofServiceResponse.typedData.message.root,
    proof: proofServiceResponse.proof,
  })
  return {
    tokenContract: collateral.token,
    tokenId: tokenId,
    lienRequest: {
      strategy: {
        version: proofServiceResponse.typedData.domain.version,
        deadline: proofServiceResponse.typedData.message.deadline,
        vault: proofServiceResponse.typedData.domain.verifyingContract,
      },
      stack: stack,
      nlrDetails: nlrDetails,
      merkle: merkle,
      amount: amount,
      v: proofServiceResponse.signature.v,
      r: proofServiceResponse.signature.r,
      s: proofServiceResponse.signature.s,
    },
  }
}

const STRATEGY_BASE_URL = 'https://api.astaria.xyz/strategy/'

export const getOffersByCollateral = async (
  token: string,
  id: string,
  borrower: string
): Promise<StrategyRow[]> => {
  const OFFER_PATH = `offer/${token}/${id}/`

  const response = await axios.post(
    STRATEGY_BASE_URL + OFFER_PATH,
    { borrower: borrower },
    {
      headers: {
        'Accept-Encoding': 'gzip,deflate,compress',
        'Content-Type': 'application/json',
      },
    }
  )
  return response?.data?.forEach((offer: any) => {
    if (offer.type === StrategyLeafType.Collateral) {
      return CollectionSchema.parse(offer)
    } else if (offer.type === StrategyLeafType.Collection) {
      return CollectionSchema.parse(offer)
    }
    return UniV3CollateralSchema.parse(offer)
  })
}

export const getProofByCidAndLeaf = async (
  cid: string,
  leaf: string
): Promise<ProofServiceResponse> => {
  const PROOF_PATH = `proof/`

  const response = await axios.post(
    STRATEGY_BASE_URL + PROOF_PATH,
    { cid: cid, leaf: leaf },
    {
      headers: {
        'Accept-Encoding': 'gzip,deflate,compress',
        'Content-Type': 'application/json',
      },
    }
  )
  return ProofServiceResponseSchema.parse(response?.data)
}

export const getIsValidated = async (
  delegateAddress: string,
  cid: string
): Promise<string> => {
  const VALIDATED_PATH = `${delegateAddress}/${cid}/validated`
  const response = await axios.get(STRATEGY_BASE_URL + VALIDATED_PATH, {
    headers: {
      'Accept-Encoding': 'gzip,deflate,compress',
      'Content-Type': 'application/json',
    },
  })
  // valid, invalid, or pending
  return response?.data?.validated
}
