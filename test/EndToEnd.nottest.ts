import { join } from 'path'
import { readFile } from 'fs/promises'
import { ethers, Wallet } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import { AstariaRouter__factory } from '../src/contracts/factories/AstariaRouter__factory'
import * as utils from '../src/strategy/utils'
import { ProofServiceResponseSchema, CollectionSchema } from '../src/types'

// test file name is changed to prevent running in the CI
describe('Get response from proof service and execute on chain', () => {
  test('signs merkle tree root using local', async () => {
    const jsonOffers = await readFile(
      join(__dirname, '__mocks__/offers.json'),
      'utf8'
    )
    const responseOffers = JSON.parse(jsonOffers)

    const jsonProof = await readFile(
      join(__dirname, '__mocks__/proof_service.json'),
      'utf8'
    )
    const responseProof = JSON.parse(jsonProof)

    //don't worry there isn't any real money here
    const privateKey =
      '95067b810f517769c5074b9b7977252154ec273cef5e79f65a7544b69a136836'

    const network = 'goerli'
    const apiKey = 'ALCHEMY_API_KEY'
    const provider = new ethers.providers.AlchemyProvider(network, apiKey)
    const wallet = new Wallet(privateKey, provider)

    const router = '0x0E8B3968C56b4D54831fD7E0fd3Db63CCAa4DBBC'

    // nft contract address
    const token = '0xd6ef92fa2ef2cb702f0bfff54b111b076ac0237d'
    // nft token id
    const id = BigNumber.from('208')
    const amount = BigNumber.from('500')

    const proofServiceResponse = ProofServiceResponseSchema.parse(responseProof)

    const collateral = CollectionSchema.parse(responseOffers[1])
    const stack = utils.getStackByCollateral(token, id)

    const commitment = utils.convertProofServiceResponseToCommitment(
      proofServiceResponse,
      collateral,
      id,
      amount,
      stack
    )

    const contract = AstariaRouter__factory.connect(router, wallet)
    const txn = await contract.commitToLiens([commitment])
  })
})
