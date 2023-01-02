import z from 'zod'
import { BigNumber } from 'ethers'

export const HexSchema = z.string().regex(/^0x[a-fA-F0-9]*$/)

export const AddressSchema = HexSchema.length(42)

export const ObjectToBigNumber = z
  .object({ hex: HexSchema, type: z.literal('BigNumber') })
  .transform((val, ctx) => {
    try {
      return BigNumber.from(val.hex)
    } catch (_) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Could not parse as BigNumber',
      })
      return z.NEVER
    }
  })

export const StringToBigNumber = z
  .string()
  .regex(/d*/)
  .transform((val, ctx) => {
    try {
      return BigNumber.from(val)
    } catch (_) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Could not parse as BigNumber',
      })
      return z.NEVER
    }
  })

export const BigNumberSchema = z.union([
  z.instanceof(BigNumber),
  ObjectToBigNumber,
  StringToBigNumber,
])

const UINT24MAX = BigNumber.from(2).pow(24).sub(1)
const INT24MIN = BigNumber.from(0).sub(UINT24MAX.div(2)).sub(1)
const INT24MAX = BigNumber.from(0).add(UINT24MAX.div(2))
const UINT128MAX = BigNumber.from(2).pow(128).sub(1)
const UINT256MAX = BigNumber.from(2).pow(256).sub(1)

export const Uint24Schema = BigNumberSchema.refine(
  (val) => val.lte(UINT24MAX),
  'Cannot exceed (2^24) - 1'
)

export const Uint128Schema = BigNumberSchema.refine(
  (val) => val.lte(UINT128MAX),
  'Cannot exceed (2^128) - 1'
)

export const Uint256Schema = BigNumberSchema.refine(
  (val) => val.lte(UINT256MAX),
  'Cannot exceed (2^256) - 1'
)
export const Uint256NonZeroSchema = Uint256Schema.refine(
  (val) => val.gt(0),
  'Cannot be zero'
)

export const TickToBigNumber = z
  .string()
  .regex(/^[-]{0,1}\d+$/)
  .transform((val, ctx) => {
    try {
      return BigNumber.from(val)
    } catch (_) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Could not parse as BigNumber',
      })
      return z.NEVER
    }
  })

export const TickSchema = z
  .union([z.instanceof(BigNumber), ObjectToBigNumber, TickToBigNumber])
  .refine(
    (val) => val.gte(INT24MIN) && val.lte(INT24MAX),
    'Invalid Int24 value'
  )
