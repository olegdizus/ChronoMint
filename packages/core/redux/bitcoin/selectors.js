/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { createSelector } from 'reselect'
import bitcoin from 'bitcoinjs-lib'
import { selectBlockchainNetworkId } from '@chronobank/nodes/redux/selectors'
import { DUCK_BITCOIN } from './constants'
import { getPersistAccount } from '../persistAccount/selectors'
import {
  WALLET_TYPE_TREZOR,
  WALLET_TYPE_TREZOR_MOCK,
  WALLET_TYPE_LEDGER,
  WALLET_TYPE_LEDGER_MOCK,
  WALLET_TYPE_MEMORY,
  WALLET_TYPE_METAMASK,
} from '../../models/constants/AccountEntryModel'
import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_LITECOIN,
} from '../../dao/constants'
import MetamaskPlugin from '../../services/signers/MetamaskPlugin'
import BitcoinMemoryDevice from '../../services/signers/BitcoinMemoryDevice'
import BitcoinLedgerDeviceMock from '../../services/signers/BitcoinLedgerDeviceMock'
import BitcoinTrezorDeviceMock from '../../services/signers/BitcoinTrezorDeviceMock'

import BitcoinCashMemoryDevice from '../../services/signers/BitcoinCashMemoryDevice'
import BitcoinCashLedgerDeviceMock from '../../services/signers/BitcoinCashLedgerDeviceMock'
import BitcoinCashTrezorDeviceMock from '../../services/signers/BitcoinCashTrezorDeviceMock'

export const bitcoinSelector = () => (state) =>
  state.get(DUCK_BITCOIN)

export const bitcoinPendingSelector = (blockchain) => createSelector(
  bitcoinSelector(),
  (scope) => scope[blockchain].pending,
)

export const pendingEntrySelector = (address, key, blockchain) => createSelector(
  bitcoinPendingSelector(blockchain),
  (pending) => {
    if (address in pending) {
      return pending[address][key] || null
    }
    return null
  },
)

export const getBitcoinSigner = (state) => {
  const account = getPersistAccount(state)
  const networkData = selectBlockchainNetworkId(BLOCKCHAIN_BITCOIN)(state)
  const network = bitcoin.networks[networkData]

  switch (account.decryptedWallet.entry.encrypted[0].type) {
    case WALLET_TYPE_MEMORY: {
      const privateKey = account.decryptedWallet.privateKey.slice(2, 66)
      return new BitcoinMemoryDevice({ privateKey, network })
    }
    case WALLET_TYPE_LEDGER_MOCK:
    case WALLET_TYPE_LEDGER: {
      return new BitcoinLedgerDeviceMock({ network })
    }
    case WALLET_TYPE_TREZOR_MOCK:
    case WALLET_TYPE_TREZOR: {
      return new BitcoinTrezorDeviceMock({ network })
    }
    case WALLET_TYPE_METAMASK: {
      return new MetamaskPlugin()
    }
  }
}

export const getBitcoinCashSigner = (state) => {
  const account = getPersistAccount(state)
  const networkData = selectBlockchainNetworkId(BLOCKCHAIN_BITCOIN_CASH)(state)
  const network = bitcoin.networks[networkData]

  switch (account.decryptedWallet.entry.encrypted[0].type) {
    case WALLET_TYPE_MEMORY: {
      const privateKey = account.decryptedWallet.privateKey.slice(2, 66)
      return new BitcoinCashMemoryDevice({ privateKey, network })
    }
    case WALLET_TYPE_LEDGER_MOCK:
    case WALLET_TYPE_LEDGER: {
      return new BitcoinCashLedgerDeviceMock({ network })
    }
    case WALLET_TYPE_TREZOR_MOCK:
    case WALLET_TYPE_TREZOR: {
      return new BitcoinCashTrezorDeviceMock({ network })
    }
    case WALLET_TYPE_METAMASK: {
      return new MetamaskPlugin()
    }
  }
}

export const getLitecoinSigner = (state) => {
  const account = getPersistAccount(state)
  const networkData = selectBlockchainNetworkId(BLOCKCHAIN_LITECOIN)(state)
  const network = bitcoin.networks[networkData]

  switch (account.decryptedWallet.entry.encrypted[0].type) {
    case WALLET_TYPE_MEMORY: {
      const privateKey = account.decryptedWallet.privateKey.slice(2, 66)
      return new BitcoinMemoryDevice({ privateKey, network })
    }
    case WALLET_TYPE_LEDGER_MOCK:
    case WALLET_TYPE_LEDGER: {
      return new BitcoinLedgerDeviceMock({ network })
    }
    case WALLET_TYPE_TREZOR_MOCK:
    case WALLET_TYPE_TREZOR: {
      return new BitcoinLedgerDeviceMock({ network })
    }
    case WALLET_TYPE_METAMASK: {
      return new MetamaskPlugin()
    }
  }
}

export const getSignerModalComponentName = (state) => {
  const { selectedWallet } = getPersistAccount(state)
  switch (selectedWallet.encrypted[0].type) {
    // feel free to add your components here. We have only one component at the moment
    case WALLET_TYPE_TREZOR_MOCK:
    case WALLET_TYPE_TREZOR:
    case WALLET_TYPE_LEDGER_MOCK:
    case WALLET_TYPE_LEDGER: {
      return 'ActionRequestDeviceDialog'
    }
    default:
      return null
  }
}
