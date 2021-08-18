import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { PrimaryBridge } from '../typechain/PrimaryBridge'
import { solidity } from 'ethereum-waffle'
import { RNBW_TOKEN_ADDRESS } from '../scripts/constants/addresses'
import exp from 'constants'

chai.use(solidity)

let bridge: any // Bridge
let mock: any
let owner: any
let addr1: any
let addr2: any
let addrs: any

const BURN_TX = '0xd6dc16e38f4db3ef12935d0a3f70d90bc4ceb18b124f3f5746ae60890d05f1b5'


describe('PrimaryBridge', () => {
	const CHAIN_ONE = 1
	const CHAIN_TWO = 2

	before(async () => {
		;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()
		console.log('===================Deploying Contracts=====================')
		const MockToken = await ethers.getContractFactory('MockToken')
		mock = await MockToken.deploy()
		await mock.deployed()
		console.log(`mock contract deployed at ${mock.address}`)

		const Bridge = await ethers.getContractFactory('PrimaryBridge')
		bridge = await Bridge.deploy(mock.address)
		await bridge.deployed()
		console.log(`Primary bridge contract deployed at ${bridge.address}`)

		expect(await mock.name()).to.equal('MockToken')
		expect(await mock.symbol()).to.equal('MT')
		expect(await bridge.bridgeToken()).to.equal(mock.address)

		const totalSupply = await mock.totalSupply()
		expect(Number(totalSupply)).to.equal(42)

		const ownerBalance = await mock.balanceOf(owner.address)
		expect(Number(ownerBalance)).to.equal(42)

		await mock.mint(addr1.address, 10)

		const addr1Balance = await mock.balanceOf(addr1.address)
		expect(Number(addr1Balance)).to.equal(10)
	})

	it('should have no tokens held on deploy', async () => {
		const amount = await bridge.amountHeld()
		expect(Number(amount)).to.equal(0)
	})

	it('should not be able to deposit 0 tokens', async () => {
		await expect(bridge.deposit(0, CHAIN_ONE)).to.be.revertedWith(
			'Amount must be greater than 0'
		)
	})

	it('should deposit 10 tokens from addr 1 on chain 1 and release 5 back', async () => {
		// should be 42 at the start
		let ownerBalance = await mock.balanceOf(owner.address)
		expect(Number(ownerBalance)).to.equal(42)

		// should be 0 at the start
		let bridgeBalance = await mock.balanceOf(bridge.address)
		expect(Number(bridgeBalance)).to.equal(0)

		// should be 10 at the start
		let addr1Balance = await mock.balanceOf(addr1.address)
		expect(Number(addr1Balance)).to.equal(10)

		// allow bridge to pull tokens from address 1
		await mock.connect(addr1).approve(bridge.address, 20)
		expect(await mock.allowance(addr1.address, bridge.address)).to.equal(20)

		let blockNumber = await ethers.provider.getBlockNumber()
		let timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp

		expect(await bridge.connect(addr1).deposit(10, 1))
			.to.emit(bridge, 'DepositReceived')
			.withArgs(10, CHAIN_ONE, timestamp + 1, addr1.address) // 1 milliseconds from block timestamp

		// should now have 10 tokens held
		let amountHeld = await bridge.amountHeld()
		expect(Number(amountHeld)).to.equal(10)

		// should now have a 10 token balance
		let chainOneBalance = await bridge.balanceOf(CHAIN_ONE)
		expect(Number(chainOneBalance)).to.equal(10)

		// should not have changed
		ownerBalance = await mock.balanceOf(owner.address)
		expect(Number(ownerBalance)).to.equal(42)

		// should now be reduced by 10
		addr1Balance = await mock.balanceOf(addr1.address)
		expect(Number(addr1Balance)).to.equal(0)

		// should now have a balance of 10
		bridgeBalance = await mock.balanceOf(bridge.address)
		expect(Number(bridgeBalance)).to.equal(10)

		blockNumber = await ethers.provider.getBlockNumber()
		timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp
		

		// should release 5 tokens to addr1 from the contract via the owner / server on chain 1
		expect(await bridge.connect(owner).release(5, addr1.address, CHAIN_ONE, BURN_TX))
			.to.emit(bridge, 'Released')
			.withArgs(5, CHAIN_ONE, timestamp + 1, addr1.address, BURN_TX) // 1 millisecond from block timestamp

		// should now have 5 tokens held
		amountHeld = await bridge.amountHeld()
		expect(Number(amountHeld)).to.equal(5)

		// should now have a 5 token balance
		chainOneBalance = await bridge.balanceOf(CHAIN_ONE)
		expect(Number(chainOneBalance)).to.equal(5)
		
		// should now have a balance of 5
		bridgeBalance = await mock.balanceOf(bridge.address)
		expect(Number(bridgeBalance)).to.equal(5)

		// should now have a balance of 5
		addr1Balance = await mock.balanceOf(addr1.address)
		expect(Number(addr1Balance)).to.equal(5)
	})

	it('should not release tokens from unauthorised account', async () => {
		await expect(bridge.connect(addr1).release(5, addr2.address, CHAIN_ONE, BURN_TX)).to.be.revertedWith(
			'Caller cannot excute this function'
		)
	})

	it('should revert when trying to release 0 tokens', async () => {
		await expect(bridge.release(0, addr1.address, CHAIN_ONE, BURN_TX)).to.be.revertedWith(
			'Amount must be greater than 0'
		)
	})

	it('should revert if chain balance is insufficent', async () => {
		await expect(bridge.release(1, addr1.address, CHAIN_TWO, BURN_TX)).to.be.revertedWith(
			'Amount must be greater than or equal to chain balance'
		)
	})
})