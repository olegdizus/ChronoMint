/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  AccountCustomNetwork,
} from '../../models/wallet/persistAccount'
import {
  CUSTOM_NETWORKS_LIST_ADD,
  CUSTOM_NETWORKS_LIST_RESET,
  CUSTOM_NETWORKS_LIST_UPDATE,
  WALLETS_ADD,
  WALLETS_DESELECT,
  WALLETS_SELECT,
  WALLETS_UPDATE,
  WALLETS_UPDATE_LIST,
  WALLETS_LOAD,
} from './constants'

export const accountUpdate = (wallet) => ({
  type: WALLETS_UPDATE,
  wallet,
})

export const accountAdd = (wallet) => ({
  type: WALLETS_ADD,
  wallet,
})

export const accountSelect = (wallet) => ({
  type: WALLETS_SELECT,
  wallet,
})

export const accountDeselect = (wallet) => ({
  type: WALLETS_DESELECT,
  wallet,
})

export const accountLoad = (wallet) => ({
  type: WALLETS_LOAD,
  wallet,
})

export const accountUpdateList = (walletList) => ({
  type: WALLETS_UPDATE_LIST,
  walletList,
})

export const customNetworksListAdd = (network: AccountCustomNetwork) => ({
  type: CUSTOM_NETWORKS_LIST_ADD,
  network,
})

export const customNetworksListUpdate = (list) => ({
  type: CUSTOM_NETWORKS_LIST_UPDATE,
  list,
})

export const customNetworksListReset = () => ({
  type: CUSTOM_NETWORKS_LIST_RESET,
})
