import { join } from 'path'
import { readFile } from 'fs/promises'

import { StrategyTree } from '../src/strategy/StrategyTree'

describe('StrategyTree', () => {
  test('parses CSV into BinaryTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = new StrategyTree(csv)

    expect(
      '0x40c9e8c33c4cf5ff06180afea2e6a3bab45b6bfb4fafca7ec401e4201fded1a9'
    ).toEqual(strategyTree.getHexRoot())
  })
})
