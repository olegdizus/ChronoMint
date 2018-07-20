/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import BigNumber from 'bignumber.js'
import AbstractContractDAO from '../refactor/daos/lib/AbstractContractDAO'
import Amount from '../models/Amount'

export const TX_REQUIRE_TIME = 'sendTime'

export default class AssetDonatorDAO extends AbstractContractDAO {
  constructor ({ address, history, abi }) {
    super({ address, history, abi })
  }

  requireTIME (from) {
    return this._tx(
      TX_REQUIRE_TIME,
      [],
      new BigNumber(0),
      new BigNumber(0),
      {
        from: from,
        symbol: 'TIME',
        fields: {
          amount: {
            value: new Amount(1000000000, 'TIME'),
            description: 'donation',
            mark: 'plus',
          },
        },
      },
    )
  }

  isTIMERequired (account): Promise {
    return this.contract.methods.timeDonations(account).call()
  }

  subscribeOnReset () {
    this._web3Provider.onResetPermanent(() => this.handleWeb3Reset())
  }

  handleWeb3Reset () {
    if (this.contract) {
      this.contract = this._initContract()
    }
  }
}
