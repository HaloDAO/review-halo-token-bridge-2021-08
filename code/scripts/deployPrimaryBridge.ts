import { RNBW_TOKEN_ADDRESS } from './constants/addresses'
import { ethers } from 'hardhat'
const hre = require('hardhat')

const deployPrimaryBridge = async (tokenAddress: string) => {
	const [deployer] = await ethers.getSigners()
	console.log(`Deploying with account: ${deployer.address}`)

	const Primary = await ethers.getContractFactory('PrimaryBridge')
	const primary = await Primary.deploy(tokenAddress)
	await primary.deployed()
	console.log(`Primary Bridge deployed at: ${primary.address}`)

	// auto verify primary contract
    console.log('verifying primaryBridge')
    await hre.run('verify:verify', {
      address: primary.address,
      constructorArguments: [tokenAddress]
    })
}

export default deployPrimaryBridge(RNBW_TOKEN_ADDRESS.kovan)
