import z from 'zod'
import {
  TickSchema,
  HexSchema,
  AddressSchema,
  Uint24Schema,
  Uint128Schema,
  Uint256Schema,
  Uint256NonZeroSchema,
} from './helpers'
import { AddressZero } from '@ethersproject/constants'

export enum StrategyLeafType {
  Collateral = 0,
  Collection = 1,
  UniV3Collateral = 2,
}

/**
 * StrategyDetails
 */
export const StrategyDetailsSchema = z.object({
  /** `uint8` - Version of strategy format (`0`) */
  version: z.number(),

  /** `uint256` - Date past which strategy is no longer considered valid */
  expiration: Uint256Schema,

  /** `uint256` - Value tracked on chain starting from 0 at the Vault opening. Incrementing the nonce on chain invalidates all lower strategies */
  nonce: Uint256Schema,

  /** `address` - Contract address of the vault, if the vault address is ZeroHex then this is the first merkle tree opening the vault */
  vault: AddressSchema,
})

/**
 * Lien
 */
export const LienSchema = z.object({
  /** `uint256` - Amount of $WETH in 10**18 that the borrower can borrow */
  amount: Uint256NonZeroSchema,

  /** `uint256` - Rate of interest accrual for the lien expressed as interest per second 10**18 */
  rate: Uint256Schema,

  /** `uint32` - Maximum life of the lien without refinancing in epoch seconds 10**18 */
  duration: Uint256NonZeroSchema,

  /** `uint256` - a maximum total value of all liens higher in the lien queue calculated using their rate and remaining duration. Value is `$WETH` expressed as `10**18`. A zero value indicates that the lien must be in the most senior position */
  maxPotentialDebt: Uint256Schema,

  /** `uint256` - the value used as the starting price in the event of a liquidation dutch auction */
  liquidationInitialAsk: Uint256NonZeroSchema,
})

const BaseDetailsSchema = z.object({
  /** `address` - Address of the underlying NFT Contract*/
  token: AddressSchema,

  /** `address` - Address of the borrower that can commit to the lien, If the value is `address(0)` then any borrower can commit to the lien */
  borrower: AddressSchema.optional().default(AddressZero),

  /** `Lien` - Lien data */
  lien: LienSchema,

  leaf: HexSchema.optional(),
})

export const CollateralSchema = BaseDetailsSchema.extend({
  /** `uint8` - Type of leaf format (`Collateral = 0`) */
  type: z.literal(StrategyLeafType.Collateral),

  /** `uint256` - Token ID of ERC721 inside the collection */
  tokenId: Uint256Schema,
})

export const CollectionSchema = BaseDetailsSchema.extend({
  /** `uint8` - Type of leaf format (`Collection = 1`) */
  type: z.literal(StrategyLeafType.Collection),
})

export const UniV3CollateralSchema = BaseDetailsSchema.extend({
  /** `uint8` - Type of leaf format (`UniV3Collateral = 2`) */
  type: z.literal(StrategyLeafType.UniV3Collateral),

  /** `address` - Token0*/
  token0: AddressSchema,

  /** `address` - Token1*/
  token1: AddressSchema,

  /** `uint24` - Fee*/
  fee: Uint24Schema,

  /** `int24` - TickLower*/
  tickLower: TickSchema,

  /** `int24` - TickUpper*/
  tickUpper: TickSchema,

  /** `uint128` - MinLiquidity*/
  minLiquidity: Uint128Schema,

  /** `uint256` - Amount0Min*/
  amount0Min: Uint256Schema,

  /** `uint256` - Amount1Min*/
  amount1Min: Uint256Schema,
})

export const StrategyRowSchema = z.discriminatedUnion('type', [
  CollateralSchema,
  CollectionSchema,
  UniV3CollateralSchema,
])

export const StrategySchema = z.array(StrategyRowSchema)

export const TypeSchema = z.object({
  name: z.string(),
  type: z.string(),
})

export const TypesSchema = z.object({
  EIP712Domain: z.array(TypeSchema),
  StrategyDetails: z.array(TypeSchema),
})

export const DomainSchema = z.object({
  version: z.string(),
  chainId: z.number(),
  verifyingContract: z.string(),
})

export const SignatureSchema = z.object({
  r: z.string(),
  s: z.string(),
  _vs: z.string(),
  recoveryParam: z.number(),
  v: z.number(),
  yParityAndS: z.string(),
  compact: z.string(),
})

export const MessageSchema = z.object({
  nonce: z.string(),
  deadline: z.string(),
  root: z.string(),
})

export const TypedDataSchema = z.object({
  types: TypesSchema,
  primaryType: z.string(),
  domain: DomainSchema,
  message: MessageSchema,
})

export const IPFSStrategyPayloadSchema = z.object({
  typedData: TypedDataSchema,
  signature: SignatureSchema,
  strategy: StrategySchema,
})

export type Lien = z.infer<typeof LienSchema>
export type Collection = z.infer<typeof CollectionSchema>
export type Collateral = z.infer<typeof CollateralSchema>
export type UniV3Collateral = z.infer<typeof UniV3CollateralSchema>
export type StrategyDetails = z.infer<typeof StrategyDetailsSchema>
export type StrategyRow = z.infer<typeof StrategyRowSchema>
export type Strategy = z.infer<typeof StrategySchema>
export type Type = z.infer<typeof TypeSchema>
export type Types = z.infer<typeof TypesSchema>
export type domain = z.infer<typeof DomainSchema>
export type message = z.infer<typeof MessageSchema>
export type TypedData = z.infer<typeof TypedDataSchema>
export type Signature = z.infer<typeof SignatureSchema>
export type IPFSStrategyPayload = z.infer<typeof IPFSStrategyPayloadSchema>
