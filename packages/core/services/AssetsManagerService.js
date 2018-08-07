/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import ChronoBankPlatformDAO from '../dao/ChronoBankPlatformDAO'
import FeeInterfaceDAO from '../dao/FeeInterfaceDAO'
import ChronoBankAssetDAO from '../dao/ChronoBankAssetDAO'
import {
  TX_ISSUE,
  TX_REVOKE,
  TX_OWNERSHIP_CHANGE,
} from '../dao/constants/ChronoBankPlatformDAO'

class AssetsManagerService extends EventEmitter {

  constructor () {
    super(...arguments)
    this._cache = {}
  }

  getChronoBankPlatformDAO (address, web3, history) {
    const daoId = `platform_${address}`
    if (!this._cache[daoId]) {
      const platformDAO = new ChronoBankPlatformDAO(address, history)
      platformDAO.connect(web3)
      this._cache[daoId] = platformDAO
    }
    return this._cache[daoId]

  }

  getFeeInterfaceDAO (address, web3, history) {
    const daoId = `fee_${address}`
    if (!this._cache[daoId]) {
      const feeInterfaceDAO = new FeeInterfaceDAO(address, history)
      feeInterfaceDAO.connect(web3)
      this._cache[daoId] = feeInterfaceDAO
    }
    return this._cache[daoId]
  }

  getChronoBankAssetDAO (address, web3, history) {
    const daoId = `asset_${address}`
    if (!this._cache[daoId]) {
      const chronoBankAssetDAO = new ChronoBankAssetDAO(address, history)
      chronoBankAssetDAO.connect(web3)
      this._cache[daoId] = chronoBankAssetDAO
    }
    return this._cache[daoId]

  }

  subscribeToChronoBankPlatformDAO (address): Promise {
    const dao = this.getChronoBankPlatformDAO(address)

    if (!dao) {
      // eslint-disable-next-line
      throw new Error('wallet not found with address:', address)
    }

    return Promise.all([
      dao.watchIssue((tx) => {
        this.emit(TX_ISSUE, tx)
      }),
      dao.watchRevoke((tx) => {
        this.emit(TX_REVOKE, tx)
      }),
      dao.watchManagers((tx) => {
        this.emit(TX_OWNERSHIP_CHANGE, tx)
      }),
    ])
  }
}

export default new AssetsManagerService()