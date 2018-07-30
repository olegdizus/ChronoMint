/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'

export default class ContractsManagerDAO extends EventEmitter {
  constructor ({ address, abi }) {
    super()
    this.address = address
    this.abi = abi
  }

  connect (web3, options = {}) {
    if (this.isConnected) {
      this.disconnect()
    }
    // eslint-disable-next-line no-console
    console.log('[ContractsManagerDAO] Connect')
    this.contract = new web3.eth.Contract(this.abi.abi, this.address, options)
    this.web3 = web3
  }

  disconnect () {
    if (this.isConnected) {
      // eslint-disable-next-line no-console
      console.log('[ContractsManagerDAO] Disconnect')
      this.contract = null
      this.web3 = null
    }
  }

  async getContractAddressByType (type: string) {
    return this.contract.methods.getContractAddressByType(this.web3.utils.stringToHex(type)).call()
  }

  async isExists (address: string) {
    return this.contract.methods.isExists(address).call()
  }
}
