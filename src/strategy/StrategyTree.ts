import { utils } from 'ethers'
import MerkleTree from 'merkletreejs'
import invariant from 'tiny-invariant'
import { StrategyRow, Strategy } from '../types/index'
import { getStrategyFromCSV, prepareLeaves } from './utils'

export class StrategyTree extends MerkleTree {
  private strategy: Strategy

  constructor(strategy: Strategy) {
    prepareLeaves(strategy)
    const leaves = strategy.map((row: StrategyRow) => row.leaf)
    super(leaves, utils.keccak256, { sort: true })

    this.strategy = strategy
  }

  static fromCSV(csv: string): StrategyTree {
    const strategy = getStrategyFromCSV(csv)
    invariant(
      strategy.length > 0,
      'StrategyTree: Provided csv string did not produce a valid StrategyTree value'
    )
    return new StrategyTree(strategy)
  }

  get getStrategy(): Strategy {
    return this.strategy
  }
}
