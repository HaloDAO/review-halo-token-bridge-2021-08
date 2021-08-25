require('dotenv').config()

import '@typechain/hardhat'
import '@openzeppelin/hardhat-upgrades'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import "solidity-coverage"

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || ''
const MNEMONIC_SEED = process.env.MNEMONIC_SEED || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''

export default {
  gasReporter: {
    gasPrice: 21,
    enabled: true
  },
  solidity: '0.8.6',
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 42,
      accounts: {
        mnemonic: MNEMONIC_SEED,
      },
    },
    localhost: {
      chainId: 1337,
      url: 'http://127.0.0.1:8545/',
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 1,
      accounts: {
        mnemonic: MNEMONIC_SEED,
      },
    },
  },
}
