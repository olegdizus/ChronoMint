/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import bitcoin from 'bitcoinjs-lib'
import { selectCurrentNetworkBlockchains } from '@chronobank/nodes/redux/selectors'
import { getPersistAccount } from '../persistAccount/selectors'
import {
  WALLET_TYPE_MEMORY,
  WALLET_TYPE_METAMASK,
} from '../../models/constants/AccountEntryModel'
import {
  BLOCKCHAIN_DASH,
} from '../../dao/constants'
import MetamaskPlugin from '../../services/signers/MetamaskPlugin'

import DashMemoryDevice from '../../services/signers/DashMemoryDevice'

export const getDashSigner = (state) => {
  const account = getPersistAccount(state)
  const networkData = selectCurrentNetworkBlockchains(state)
  const network = bitcoin.networks[networkData[BLOCKCHAIN_DASH]]

  switch (account.decryptedWallet.entry.encrypted[0].type) {
    case WALLET_TYPE_MEMORY: {
      const privateKey = account.decryptedWallet.privateKey.slice(2, 66)
      return new DashMemoryDevice({ privateKey, network })
    }
    case WALLET_TYPE_METAMASK: {
      return new MetamaskPlugin()
    }
  }
}
