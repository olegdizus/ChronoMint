/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  bccProvider,
  btcProvider,
  btgProvider,
  ltcProvider,
} from '@chronobank/login/network/BitcoinProvider'
import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_LITECOIN,
} from '@chronobank/login/network/constants'
import { nemProvider } from '@chronobank/login/network/NemProvider'
import { wavesProvider } from '@chronobank/login/network/WavesProvider'
import { ethereumProvider } from '@chronobank/login/network/EthereumProvider'
import WalletModel from '../../models/wallet/WalletModel'
import { subscribeOnTokens } from '../tokens/actions'
import TokenModel from '../../models/tokens/TokenModel'
import tokenService from '../../services/TokenService'
import Amount from '../../models/Amount'
import { BLOCKCHAIN_ETHEREUM } from '../../dao/constants'
import { EE_MS_WALLET_ADDED } from '../../dao/constants/WalletsManagerDAO'
import { getAccount } from '../session/selectors'
import { updateEthMultisigWalletBalance } from '../multisigWallet/actions'
import contractsManagerDAO from '../../dao/ContractsManagerDAO'
import ethDAO from '../../dao/ETHDAO'
import { getMainEthWallet, getWallets } from './selectors/models'
import MultisigEthWalletModel from '../../models/wallet/MultisigEthWalletModel'
import { notifyError } from '../notifier/actions'
import { DUCK_SESSION } from '../session/actions'
import { AllowanceCollection } from '../../models'
import { web3Selector } from '../ethereum/selectors'
import { executeTransaction } from '../ethereum/actions'

import {
  WALLETS_SET,
  WALLETS_UPDATE_BALANCE,
  WALLETS_TWO_FA_CONFIRMED,
} from './constants'

let walletsManagerDAO
const isOwner = (wallet, account) => {
  return wallet.owners().items().filter((owner) => owner === account).length > 0
}

export const get2FAEncodedKey = (callback) => () => {
  return ethereumProvider.get2FAEncodedKey(callback)
}

export const check2FAChecked = () => async (dispatch) => {
  const result = await dispatch(get2FAEncodedKey())
  let twoFAConfirmed
  if (typeof result === 'object' && result.code) {
    twoFAConfirmed = true
  } else {
    twoFAConfirmed = false
  }
  dispatch({ type: WALLETS_TWO_FA_CONFIRMED, twoFAConfirmed })
}

export const initWallets = () => (dispatch) => {

  dispatch(initWalletsFromKeys())
  dispatch(initDerivedWallets())
}

const initWalletsFromKeys = () => (dispatch) => {
  const providers = [
    bccProvider,
    btgProvider,
    ltcProvider,
    btcProvider,
    nemProvider,
    wavesProvider,
    ethereumProvider,
  ]

  providers.map((provider) => {
    const wallet = new WalletModel({
      address: provider.getAddress(),
      blockchain: provider.id(),
      isMain: true,
    })

    dispatch({ type: WALLETS_SET, wallet })
    dispatch(updateWalletBalance({ wallet }))
  })
}

const initDerivedWallets = () => async (dispatch, getState) => {
  const { account } = getAccount(getState())
  const wallets = getWallets(getState())

  Object.values(wallets).map((wallet: WalletModel) => {
    if (wallet.isDerived && !wallet.isMain && isOwner(wallet, account)) {
      dispatch(updateWalletBalance({ wallet }))

      switch (wallet.blockchain) {
        case BLOCKCHAIN_BITCOIN:
          btcProvider.createNewChildAddress(wallet.deriveNumber)
          btcProvider.subscribeNewWallet(wallet.address)
          break
        case BLOCKCHAIN_BITCOIN_CASH:
          bccProvider.createNewChildAddress(wallet.deriveNumber)
          bccProvider.subscribeNewWallet(wallet.address)
          break
        case BLOCKCHAIN_BITCOIN_GOLD:
          btgProvider.createNewChildAddress(wallet.deriveNumber)
          btgProvider.subscribeNewWallet(wallet.address)
          break
        case BLOCKCHAIN_LITECOIN:
          ltcProvider.createNewChildAddress(wallet.deriveNumber)
          ltcProvider.subscribeNewWallet(wallet.address)
          break
        case BLOCKCHAIN_ETHEREUM:
          // dispatch(subscribeOnTokens(getTokensBalancesAndWatch(wallet.address(), wallet.blockchain(), wallet.customTokens())))
          break
        default:
      }
    }
  })
}

export const initMultisigWallets = () => async (dispatch) => {

  walletsManagerDAO = await contractsManagerDAO.getWalletsManagerDAO()
  walletsManagerDAO
    .on(EE_MS_WALLET_ADDED, async (walletModel: MultisigEthWalletModel) => {
      const wallet = new WalletModel({
        address: walletModel.address(),
        blockchain: walletModel.blockchain(),
        name: walletModel.name(),
        owners: walletModel.owners().items().map((ownerModel) => ownerModel.address()),
        isMultisig: true,
      })

      dispatch({ type: WALLETS_SET, wallet })
    })

  // TODO implement this method
  // dispatch(subscribeOnMultisigWalletService())

  // TODO implement this method
  dispatch(check2FAChecked())

  // all ready, start fetching
  walletsManagerDAO.fetchWallets()
}

const updateWalletBalance = ({ wallet }) => async (dispatch) => {
  const updateBalance = (token: TokenModel) => async () => {
    if (token.blockchain() === wallet.blockchain) {
      const dao = tokenService.getDAO(token)
      let balance = await dao.getAccountBalance(wallet.address)
      if (balance) {
        await dispatch({
          type: WALLETS_UPDATE_BALANCE,
          walletId: wallet.id,
          balance: new Amount(balance, token.symbol(), true),
        })
      }
    }
  }

  dispatch(subscribeOnTokens(updateBalance))
}

export const subscribeWallet = ({ wallet }) => async (dispatch) => {
  const listener = function (data) {
    const checkedFrom = data.from ? data.from.toLowerCase() === wallet.address.toLowerCase() : false
    const checkedTo = data.to ? data.to.toLowerCase() === wallet.address.toLowerCase() : false
    if (checkedFrom || checkedTo) {
      if (wallet.isMain) {
        dispatch(updateWalletBalance({ wallet }))
      }
      if (wallet.isMultisig) {
        dispatch(updateEthMultisigWalletBalance({ wallet }))
      }
    }
  }
  switch (wallet.blockchain) {
    case BLOCKCHAIN_ETHEREUM:
      ethDAO.on('tx', listener)
      return listener
    default:
      return
  }

}

export const unsubscribeWallet = ({ wallet, listener }) => async (/*dispatch, getState*/) => {
  switch (wallet.blockchain) {
    case BLOCKCHAIN_ETHEREUM:
      ethDAO.removeListener('tx', listener)
      return listener
    default:
      return
  }
}

const updateAllowance = (allowance) => (dispatch, getState) => {
  const wallet = getMainEthWallet(getState())
  if (allowance) {
    dispatch({
      type: WALLETS_UPDATE_WALLET,
      wallet: new WalletModel({
        ...wallet,
        allowances: new AllowanceCollection({
          list: {
            ...wallet.allowances.list,
            [allowance.id()]: allowance,
          },
        }),
      }),
    })
  }
}

export const mainTransfer = (wallet: WalletModel, token: TokenModel, amount: Amount, recipient: string, feeMultiplier: Number = 1) => async (dispatch, getState) => {
  const state = getState()
  const tokenDAO = tokenService.getDAO(token.id())
  const web3 = web3Selector()(state)
  const tx = tokenDAO.transfer(wallet.address, recipient, amount)

  if (tx) {
    await dispatch(executeTransaction({ tx, web3, options: { feeMultiplier } }))
  }
}

export const mainApprove = (token: TokenModel, amount: Amount, spender: string, feeMultiplier: Number) => async (dispatch, getState) => {
  const state = getState()
  const wallet = getMainEthWallet(state)
  const allowance = wallet.allowances.list[`${spender}-${token.id()}`]
  const { account } = state.get(DUCK_SESSION)

  try {
    allowance && dispatch(updateAllowance(allowance.isFetching(true)))
    const tokenDAO = tokenService.getDAO(token)
    const web3 = web3Selector()(state)
    const tx = tokenDAO.approve(spender, amount, account)
    if (tx) {
      await dispatch(executeTransaction({ tx, web3, options: { feeMultiplier } }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log('mainRevoke approve: ', e)
    dispatch(notifyError(e, 'mainApprove'))
    allowance && dispatch(updateAllowance(allowance.isFetching(false)))
  }
}

export const mainRevoke = (token: TokenModel, spender: string, feeMultiplier: Number = 1) => async (dispatch, getState) => {
  const state = getState()
  const wallet = getMainEthWallet(state)
  const allowance = wallet.allowances.list[`${spender}-${token.id()}`]
  dispatch(updateAllowance(allowance.isFetching(true)))

  const { account } = state.get(DUCK_SESSION)
  try {
    dispatch(updateAllowance(allowance.isFetching(true)))
    const web3 = web3Selector()(state)
    const tokenDAO = tokenService.getDAO(token)
    const tx = tokenDAO.revoke(spender, token.symbol(), account)
    if (tx) {
      await dispatch(executeTransaction({ tx, web3, options: { feeMultiplier } }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log('mainRevoke error: ', e)
    dispatch(notifyError(e, 'mainRevoke'))
    dispatch(updateAllowance(allowance.isFetching(false)))
  }
}
