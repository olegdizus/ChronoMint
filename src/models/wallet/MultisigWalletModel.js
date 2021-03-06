/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Immutable from 'immutable'
import BalancesCollection from 'models/tokens/BalancesCollection'
import AddressesCollection from 'models/wallet/AddressesCollection'
import MultisigWalletPendingTxCollection from 'models/wallet/MultisigWalletPendingTxCollection'
import TransactionsCollection from 'models/wallet/TransactionsCollection'
import { abstractFetchingModel } from '../AbstractFetchingModel'
import OwnerCollection from './OwnerCollection'

export default class MultisigWalletModel extends abstractFetchingModel({
  address: null, //
  balances: new BalancesCollection(),
  tokens: new Immutable.Map(), //
  isMultisig: true, //
  transactions: new TransactionsCollection(),
  owners: new OwnerCollection(),
  requiredSignatures: 0,
  pendingTxList: new MultisigWalletPendingTxCollection(),
  is2FA: false,
  addresses: new AddressesCollection(),
  releaseTime: new Date(0),
}) {
  id () {
    return this.get('transactionHash') || this.get('address')
  }

  owners (value) {
    return this._getSet('owners', value)
  }

  // shortcut for eth-address
  address () {
    return this.get('address')
  }

  balances (value) {
    return this._getSet('balances', value)
  }

  isNew () {
    return !this.address()
  }

  requiredSignatures (value) {
    return this._getSet('requiredSignatures', value)
  }

  pendingTxList (value) {
    return this._getSet('pendingTxList', value)
  }

  pendingCount () {
    return this.pendingTxList().size()
  }

  /**
   * @deprecated
   */
  tokens (value) {
    return this._getSet('tokens', value)
  }

  isMultisig () {
    return this.get('isMultisig')
  }

  transactions (value) {
    return this._getSet('transactions', value)
  }

  txSummary () {
    return {
      owners: this.ownersArray(),
      requiredSignatures: this.requiredSignatures(),
    }
  }

  ownersArray () {
    return this.owners().items().map((items) => items.address())
  }

  isTimeLocked () {
    return this.releaseTime().getTime() >= Date.now()
  }

  releaseTime () {
    return this.get('releaseTime')
  }

  addresses (value) {
    return this._getSet('addresses', value)
  }

  // forms

  toAddFormJS () {
    const time = this.releaseTime().getTime() === 0 ? new Date() : this.releaseTime()

    return {
      requiredSignatures: this.requiredSignatures(),
      owners: this.ownersArray(),
      timeLockDate: time,
      timeLockTime: time,
    }
  }

  toCreateWalletTx () {
    const data = {
      requiredSignatures: this.requiredSignatures(),
      owners: this.ownersArray(),
    }

    if (this.isTimeLocked()) {
      data.releaseTime = this.releaseTime()
      data.isTimeLocked = true
    }

    return data
  }

  toRequiredSignaturesFormJS () {
    return {
      ownersCount: this.owners().size(),
      requiredSignatures: this.requiredSignatures(),
    }
  }
}
