import { join } from 'path'
import { AddressZero } from '@ethersproject/constants'
import { readFile } from 'fs/promises'
import { Wallet, BigNumber } from 'ethers'
import { StrategyTree } from '../src/strategy/StrategyTree'

describe('StrategyTree', () => {
  test('test that all leaves are marshalled into StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = new StrategyTree(csv)
    const actual = strategyTree.getCSV.length
    const expected = 5
    expect(actual).toEqual(expected)
  })
  test('convert parsedStrategyRow to StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')
    const tempStrategyTree = new StrategyTree(csv)
    const strategyTree = StrategyTree.fromParsedStrategyRow(
      tempStrategyTree.getCSV
    )
    expect(strategyTree.getHexRoot()).toEqual(tempStrategyTree.getHexRoot())
    expect(strategyTree.getCSV).toEqual(tempStrategyTree.getCSV)
  })
  test('parses CSV into StrategyTree', async () => {
    const csv = await readFile(join(__dirname, '__mocks__/test.csv'), 'utf8')

    const strategyTree = new StrategyTree(csv)

    expect(
      '0x276a20acb0e3b40e3e98b20030585add5dd1c6c6f53b99b3bc0645809dd3eef0'
    ).toEqual(strategyTree.getHexRoot())
  })
})
