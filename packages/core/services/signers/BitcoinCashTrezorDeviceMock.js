/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import bitcoin from 'bitcoinjs-lib'

const MOCK_PRIVATE_KEY = 'cfc237b5d387c438cfdf647f686807ade5d6284cc7302d1ba5e4dd7e16b4e91b'

export default class BitcoinCashTrezorDeviceMock extends EventEmitter {

  constructor ({ network }) {
    super()
    this.privateKey = MOCK_PRIVATE_KEY
    this.network = network
    Object.freeze(this)
  }

  getAddress () {
    const keyPair = this.getKeyPair()
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: this.network })
    return address
  }

  async signTransaction (unsignedTxHex) {
    // tx object
    const txb = new bitcoin.TransactionBuilder
      .fromTransaction(bitcoin.Transaction.fromHex(unsignedTxHex), this.network)
    const keyPair = this.getKeyPair()
    const hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143

    for (let i = 0; i < txb.__inputs.length; i++) {
      txb.sign(i, keyPair, null, hashType, txb.__inputs[i])
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(txb.build().toHex())
      }, 5000)
    })
  }

  getKeyPair () {
    return new bitcoin.ECPair.fromPrivateKey(Buffer.from(this.privateKey, 'hex'), { network: this.network })
  }
}