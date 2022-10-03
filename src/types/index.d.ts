export * from './contracts'

declare var __DEV__: boolean

/**
 * Strategy
 *
 * Each strategy will have a `Strategy` leaf in index 0
 * to provide configuration data. Any format with `Strategy`
 * outside index 0 will be considered invalid and can result
 * in undesired behavior although the schema is uneforceable.
 */
export interface Strategy {
  /** `uint8` - Type of leaf format (`Strategy = 0`) */
  type: StrategyLeafType.Strategy
  /** `uint8` - Version of strategy format (`0`) */
  version: number
  /** `address` - EOA of the strategist opening the vault, cannot be reassigned */
  strategist: string
  /** `address` - EOA that can sign new strategy roots after Vault is initiated. Role cannot be reassigned without a new transaction. New strategies can be signed without needing a transaction. */
  delegate: string
  /** `boolean` - Indicates if a vault is public. Cannot be modified after vault opening. */
  public: boolean
  /** `uint256` - Date past which strategy is no longer considered valid */
  expiration: number
  /** `uint256` - Value tracked on chain starting from 0 at the Vault opening. Incrementing the nonce on chain invalidates all lower strategies */
  nonce: number
  /** `address` - Contract address of the vault, if the vault address is ZeroAddress then this is the first merkle tree opening the vault */
  vault: string
}

/**
 * Lien
 *
 * `Lien` is a subtype, so the value will not be preceded with a type
 * value as it can only be nested in `Collateral` or `Collection` leaves.
 */
export interface Lien {
  /** `uint256` - Amount of $WETH in 10**18 that the borrower can borrow */
  amount: number
  /** `uint256` - Rate of interest accrual for the lien expressed as interest per second 10**18 */
  rate: number
  /** `uint256` - Maximum life of the lien without refinancing in epoch seconds 10**18 */
  duration: number
  /** `uint256` - Maximum total value of all liens higher in the lien queue. Exceeding this value at any time during the lien will start a liquidation flow. Value is $WETH expressed as 10**18. A zero value indicates that the lien is in the most senior position */
  maxSeniorLiens: number
  /** `uint256` - Maximum accruable interest during the life of the lien expressed as an annual rate proportion 10**18. For example the value 100000000000000000 (0.10 or 10%) on a lien amount of 1000000000000000000 (1 $WETH) would enter into liquidation at 1100000000000000000 (1.1 $WETH). Value can be 0 indicating no schedule */
  schedule: number
}

/**
 * StrategyRow
 */
export interface StrategyRow {
  /** `uint8` - Type of leaf format */
  type: StrategyLeafType.Collateral | StrategyLeafType.Collection
  /** `address` - Address of ERC721 collection */
  token: string
  /** `uint256` - Token ID of ERC721 inside the collection */
  tokenId?: number
  /** `address` - Address of the borrower that can commit to the lien, If the value is `address(0)` then any borrower can commit to the lien */
  borrower: string
  /** `Lien` - Lien data */
  lien: Lien
}

/**
 * Collateral
 */
export interface Collateral extends StrategyRow {
  /** `uint8` - Type of leaf format (`Collateral = 1`) */
  type: StrategyLeafType.Collateral
  /** `uint256` - Token ID of ERC721 inside the collection */
  tokenId: number
}

/**
 * Collection
 */
export interface Collection extends StrategyRow {
  /** `uint8` - Type of leaf format (`Collection = 2`) */
  type: StrategyLeafType.Collection
}