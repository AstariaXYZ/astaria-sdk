import { join } from 'path'
import { readFile } from 'fs/promises'

import { StrategyTree } from '../src/strategy/StrategyTree'

describe('StrategyTree', () => {
  test('parses CSV into BinaryTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = new StrategyTree(csv)

    expect(
      '0x414cd89c8a2d6724f47829348352a78687a99c57ee83a47933f2021c84f405b9'
    ).toEqual(strategyTree.getHexRoot())
  })
})
