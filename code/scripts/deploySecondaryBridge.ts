import { xRNBW_TOKEN_ADDRESS } from './constants/addresses'
import { ethers } from 'hardhat'
const hre = require('hardhat')

const POLYGON_MUMBAI_CHAIN_ID = 80001

const deploySecondaryBridge = async (tokenAddress: string, chainId: number) => {
	const Secondary = await ethers.getContractFactory('SecondaryBridge')
	const secondary = await Secondary.deploy(tokenAddress, chainId)
	await secondary.deployed()
	console.log(`Secondary Bridge deployed at: ${secondary.address}`)

	// auto verify secondary contract
	console.log('verifying secondaryBridge')
	await hre.run('verify:verify', {
		address: secondary.address,
		constructorArguments: [tokenAddress],
	})
}

export default deploySecondaryBridge(xRNBW_TOKEN_ADDRESS.polygon_mumbai, POLYGON_MUMBAI_CHAIN_ID)
