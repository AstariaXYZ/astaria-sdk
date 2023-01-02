import { join } from 'path'
import { readFile } from 'fs/promises'
import { StrategyTree } from '../src/strategy/StrategyTree'

describe('StrategyTree', () => {
  test('test that all leaves are marshalled into StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = StrategyTree.fromCSV(csv)
    const actual = strategyTree.getStrategy.length
    const expected = 5
    expect(actual).toEqual(expected)
  })
  test('convert Strategy to StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')
    const tempStrategyTree = StrategyTree.fromCSV(csv)
    const strategyTree = new StrategyTree(tempStrategyTree.getStrategy)
    expect(strategyTree.getHexRoot()).toEqual(tempStrategyTree.getHexRoot())
    expect(strategyTree.getStrategy).toEqual(tempStrategyTree.getStrategy)
  })
  test('parses CSV into StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')
    const strategyTree = StrategyTree.fromCSV(csv)

    expect(
      '0xcbeb8721b6594f56ddaa4fdac1ef416db4edd73b94d4be553ddb837dbe591d14'
    ).toEqual(strategyTree.getHexRoot())
  })
})
