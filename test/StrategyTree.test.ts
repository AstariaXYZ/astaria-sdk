import { join } from 'path'
import { readFile } from 'fs/promises'

import { StrategyTree } from '../src/strategy/StrategyTree'

describe('StrategyTree', () => {
  test('parses CSV into BinaryTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = new StrategyTree(csv)

    expect(
      '0x607732e33fc4861447c6f09f439ac1483bf2b72f3af691b2493aefeafa5f53c4'
    ).toEqual(strategyTree.getHexRoot())
  })
})
