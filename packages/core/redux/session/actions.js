/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import networkService from '@chronobank/login/network/NetworkService'
import { getNetworkById, LOCAL_ID, LOCAL_PROVIDER_ID, NETWORK_MAIN_ID } from '@chronobank/login/network/settings'
import { DUCK_NETWORK } from '@chronobank/login/redux/network/constants'
import { push, replace } from '@chronobank/core-dependencies/router'
import ls from '@chronobank/core-dependencies/utils/LocalStorage'
import profileService from '@chronobank/login/network/ProfileService'
import { removeWatchersUserMonitor } from '@chronobank/core-dependencies/redux/ui/actions'
import { daoByType } from '../../redux/daos/selectors'
import web3Factory from '../../web3/index'
import { cbeWatcher, watcher } from '../watcher/actions'
import { watchStopMarket } from '../market/actions'
import { notify } from '../notifier/actions'
import { initEthereum } from '../ethereum/actions'
import {
  DUCK_PERSIST_ACCOUNT,
} from '../persistAccount/constants'
import {
  DEFAULT_CBE_URL,
  DEFAULT_USER_URL,
  DUCK_SESSION,
  GAS_SLIDER_MULTIPLIER_CHANGE,
  SESSION_CREATE,
  SESSION_DESTROY,
  SESSION_PROFILE,
  SET_PROFILE_SIGNATURE,
} from './constants'

export const changeGasSlideValue = (value, blockchain) => (dispatch) => dispatch({ type: GAS_SLIDER_MULTIPLIER_CHANGE, value, id: blockchain })

export const createSession = ({ account, provider, network, dispatch }) => {
  ls.createSession(account, provider, network)
  dispatch({ type: SESSION_CREATE, account })
}

export const destroySession = ({ lastURL, dispatch }) => {
  ls.setLastURL(lastURL)
  ls.destroySession()
  dispatch({ type: SESSION_DESTROY })
}

export const logout = () => async (dispatch, getState) => {
  try {
    const { selectedNetworkId } = getState().get(DUCK_NETWORK)
    dispatch(removeWatchersUserMonitor())
    await dispatch(watchStopMarket())
    await networkService.destroyNetworkSession(`${window.location.pathname}${window.location.search}`)
    await dispatch(push('/'))
    if (selectedNetworkId === NETWORK_MAIN_ID) {
      location.reload()
    } else {
      await dispatch(bootstrap(false))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('logout error:', e)
  }
}

export const login = (account) => async (dispatch, getState) => {
  let state = getState()

  const { customNetworksList } = state.get(DUCK_PERSIST_ACCOUNT)
  const { selectedNetworkId, selectedProviderId } = state.get(DUCK_NETWORK)
  if (!state.get(DUCK_SESSION).isSession) {
    // setup and check network first and create session
    throw new Error('Session has not been created')
  }

  let network = getNetworkById(selectedNetworkId, selectedProviderId)
  if (!network.id) {
    network = customNetworksList.find((network) => network.id === selectedNetworkId)
  }

  const web3 = typeof window !== 'undefined'
    ? web3Factory(network)
    : null

  await dispatch(initEthereum({ web3 }))
  await dispatch(watcher({ web3 }))

  const userManagerDAO = daoByType('UserManager')(getState())
  const [isCBE, profile /*memberId*/] = await Promise.all([
    userManagerDAO.isCBE(account),
    userManagerDAO.getMemberProfile(account, web3),
    userManagerDAO.getMemberId(account),
  ])

  // @todo Need to refactor PendingManagerDAO
  // TODO @bshevchenko: PendingManagerDAO should receive member id from redux state
  // const pmDAO = await contractsManagerDAO.getPendingManagerDAO()
  // pmDAO.setMemberId(memberId)

  dispatch({ type: SESSION_PROFILE, profile, isCBE })

  const defaultURL = isCBE ? DEFAULT_CBE_URL : DEFAULT_USER_URL
  isCBE && dispatch(cbeWatcher())

  dispatch(replace(ls.getLastURL() || defaultURL))
}

export const bootstrap = (relogin = true, isMetaMaskRequired = true, isLocalAccountRequired = true) => async (dispatch, getState) => {
  if (isMetaMaskRequired) {
    networkService.checkMetaMask()
  }
  if (networkService) {
    networkService
      .on('createSession', createSession)
      .on('destroySession', destroySession)
      .on('login', ({ account, dispatch }) => dispatch(login(account)))
  }

  if (!relogin) {
    return networkService
  }

  if (isLocalAccountRequired) {
    const localAccount = ls.getLocalAccount()
    const isPassed = await networkService.checkLocalSession(localAccount)
    if (isPassed) {
      await networkService.restoreLocalSession(localAccount, getState().get('ethMultisigWallet'))
      networkService.createNetworkSession(localAccount, LOCAL_PROVIDER_ID, LOCAL_ID)
      dispatch(login(localAccount))
    } else {
      // eslint-disable-next-line
      console.warn('Can\'t restore local session')
    }
  }

  return networkService
}

export const watchInitProfile = () => async (dispatch, getState) => {
  const userManagerDAO = daoByType('UserManager')(getState())
  return userManagerDAO.watchProfile((notice) => dispatch(notify(notice)))
}

export const setProfileSignature = (signature) => (dispatch) => {
  dispatch({ type: SET_PROFILE_SIGNATURE, signature })
}

export const getProfileSignature = (wallet) => async (dispatch) => {
  if (!wallet) {
    return
  }

  let signDataString = profileService.getSignData()
  let signData = wallet.sign(signDataString)
  let profileSignature = await profileService.getProfile(signData.signature)
  dispatch(setProfileSignature(profileSignature))

  return profileSignature
}

export const updateUserProfile = (profile) => async (dispatch, getState) => {
  const { profileSignature } = getState().get(DUCK_SESSION)
  const newProfile = await profileService.updateUserProfile({ ...profile }, profileSignature.token)

  dispatch(setProfileSignature({
    ...profileSignature,
    profile: newProfile,
  }))
}
