/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import TrezorWalletSubproviderFactory from 'ledger-wallet-provider'
import Web3 from 'web3'
import ProviderEngine from 'web3-provider-engine'
import FilterSubprovider from 'web3-provider-engine/subproviders/filters'
import Web3Subprovider from 'web3-provider-engine/subproviders/web3'
import EthereumEngine from './EthereumEngine'
import HardwareWallet from './HardwareWallet'
import { byEthereumNetwork } from './NetworkProvider'

const DEFAULT_DERIVATION_PATH = `44'/60'/0'/0/0`

class TrezorProvider extends EventEmitter {
  constructor () {
    super()
    this._derivationPath = DEFAULT_DERIVATION_PATH
    this._trezorSubprovider = null
    this._trezor = null
    this._engine = null
    this._wallet = null

    this._isInited = false
  }

  async init () {
    if (this._isInited) {
      return
    }
    try {
      this._engine = new ProviderEngine()
      this._web3 = new Web3(this._engine)
      this._trezorSubprovider = await TrezorWalletSubproviderFactory(this._derivationPath, this._web3, 'trezor')
      this._trezor = this._trezorSubprovider.trezor
      this._isInited = true
    } catch (e) {
      // eslint-disable-next-line
      console.error('Trezor init error', e.message)
      this._isInited = false
    }
    return this._isInited
  }

  setupAndStart (providerURL) {
    this._engine.addProvider(this._trezorSubprovider)
    this._engine.addProvider(new FilterSubprovider())
    this._engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerURL)))
    this._engine.start()
  }

  isU2F () {
    return true
  }

  async fetchAccount () {
    return new Promise((resolve) => {
      let timer = setInterval(() => {
        clearInterval(timer)
        this._trezor.getAccounts((error, accounts) => {
          if (error) {
            resolve(null)
          }
          this._wallet = new HardwareWallet(accounts[0])
          resolve(accounts)
        })
      }, 200)
    })
  }

  stop () {
    this.removeAllListeners()
  }

  getWeb3 () {
    return this._web3
  }

  getProvider () {
    return this._engine
  }

  getNetworkProvider ({ url, network } = {}) {
    return {
      networkCode: byEthereumNetwork(network),
      ethereum: new EthereumEngine(this._wallet, network, url, this._engine),
    }
  }
}

export default new TrezorProvider()
