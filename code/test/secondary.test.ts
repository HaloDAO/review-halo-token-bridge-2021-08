import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SecondaryBridge } from '../typechain/SecondaryBridge'
import { solidity } from 'ethereum-waffle'

chai.use(solidity)

let bridge: any // Bridge
let mock: any
let owner: any
let addr1: any
let addr2: any
let addrs: any

const DEPOSIT_TX = '0xd6dc16e38f4db3ef12935d0a3f70d90bc4ceb18b124f3f5746ae60890d05f1b5'


describe('SecondaryBridge', () => {
	const CHAIN_ONE = 1

	before(async () => {
		;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()
		console.log('===================Deploying Contracts=====================')
		const MockToken = await ethers.getContractFactory('MockToken')
		mock = await MockToken.deploy()
		await mock.deployed()
		console.log(`mock contract deployed at ${mock.address}`)

		const Bridge = await ethers.getContractFactory('SecondaryBridge')
		bridge = await Bridge.deploy(mock.address, CHAIN_ONE)
		await bridge.deployed()
		console.log(`bridge contract deployed at ${bridge.address}`)

		expect(await mock.name()).to.equal('MockToken')
		expect(await mock.symbol()).to.equal('MT')
		expect(await bridge.bridgeToken()).to.equal(mock.address)

		const totalSupply = await mock.totalSupply()
		expect(Number(totalSupply)).to.equal(42)

		const ownerBalance = await mock.balanceOf(owner.address)
		expect(Number(ownerBalance)).to.equal(42)

		await mock.mint(addr1.address, 10)
	})

	it('should have no tokens issued on deploy', async () => {
		const amount = await bridge.amountIssued()
		expect(Number(amount)).to.equal(0)
	})

	describe('mint functions', () => {
		it('should not mint tokens from unauthorised account', async () => {
			await expect(bridge.connect(addr1).mint(addr2.address, 5, DEPOSIT_TX)).to.be.revertedWith(
				'Caller cannot excute this function'
			)
		})

		it('should not mint 0 tokens', async () => {
			await expect(bridge.mint(addr2.address, 0, DEPOSIT_TX)).to.be.revertedWith(
				'Amount must be greater than 0'
			)
		})

		it('should not mint to address 0', async () => {
			await expect(bridge.mint('0x0000000000000000000000000000000000000000', 5, DEPOSIT_TX)).to.be.revertedWith(
				'Address must be a valid address'
			)
		})

		it('should mint 10 tokens to addr1', async () => {
			let amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(0)

			const blockNumber = await ethers.provider.getBlockNumber()
			const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp

			expect(await bridge.mint(addr1.address, 10, DEPOSIT_TX))
				.to.emit(bridge, 'Minted')
				.withArgs(10, timestamp + 1, addr1.address, CHAIN_ONE, DEPOSIT_TX) // 1 milliseconds from block timestamp

			amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(10)

			const totalSupply = await mock.totalSupply()
			expect(Number(totalSupply)).to.equal(62)

			const actual = await mock.balanceOf(addr1.address)
			expect(Number(actual)).to.equal(20)
		})
	})

	describe('burn functions', () => {
		it('should not burn 0 tokens', async () => {
			await expect(bridge.burn(0)).to.be.revertedWith(
				'Amount must be greater than 0'
			)
		})

		it('should not burn more than the amount issued', async () => {
			await bridge.mint(addr1.address, 10, DEPOSIT_TX)
			const amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(20)

			await expect(bridge.burn(21)).to.be.revertedWith(
				'Amount must be less than or equal to the amount issued'
			)
		})

		it('should not burn 10 tokens from addr 1 without approval', async () => {
			let amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(20)

			let userBalance = await mock.balanceOf(addr1.address)
			expect(Number(userBalance)).to.equal(30)

			await expect(bridge.burn(1)).to.be.revertedWith(
				'ERC20: burn amount exceeds allowance'
			)
		})

		it('should burn 10 tokens from addr 1', async () => {
			let amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(20)

			await mock.connect(addr1).approve(bridge.address, 10)
			expect(await mock.allowance(addr1.address, bridge.address)).to.equal(10)

			let userBalance = await mock.balanceOf(addr1.address)
			expect(Number(userBalance)).to.equal(30)

			const blockNumber = await ethers.provider.getBlockNumber()
			const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp

			expect(await bridge.connect(addr1).burn(10))
				.to.emit(bridge, 'Burnt')
				.withArgs(10, timestamp + 1, addr1.address, CHAIN_ONE) // 1 milliseconds from block timestamp

			userBalance = await mock.balanceOf(addr1.address)
			expect(Number(userBalance)).to.equal(20)

			amount = await bridge.amountIssued()
			expect(Number(amount)).to.equal(10)
		})
	})
})