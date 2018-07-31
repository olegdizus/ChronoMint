/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import networkService from '@chronobank/login/network/NetworkService'
import {
  getNetworkById,
  LOCAL_ID,
  LOCAL_PROVIDER_ID,
  NETWORK_MAIN_ID,
} from '@chronobank/login/network/settings'
import {
  DUCK_NETWORK,
} from '@chronobank/login/redux/network/constants'
import profileService from '@chronobank/login/network/ProfileService'
import { push, replace } from '@chronobank/core-dependencies/router'
import { removeWatchersUserMonitor } from '@chronobank/core-dependencies/redux/ui/actions'
import ls from '@chronobank/core-dependencies/utils/LocalStorage'
import web3Factory from '../../refactor/web3/index'
import { daoByType } from '../../refactor/redux/daos/selectors'
import { cbeWatcher, watcher } from '../watcher/actions'
import { watchStopMarket } from '../market/actions'
import { WEB3_SETUP } from '../web3/reducer'

import {
  DEFAULT_CBE_URL,
  DEFAULT_USER_URL,
  DUCK_SESSION,
  SESSION_CREATE,
  SESSION_DESTROY,
  SESSION_PROFILE,
  SET_PROFILE_SIGNATURE,
} from './constants'

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
    console.warn('logout error:', e)
  }
}

export const login = (account) => async (dispatch, getState) => {
  const { selectedNetworkId, selectedProviderId } = getState().get(DUCK_NETWORK)
  const isSession = getState().get(DUCK_SESSION) ? getState().get(DUCK_SESSION).isSession : null
  if (!isSession) {
    // setup and check network first and create session
    throw new Error('Session has not been created')
  }

  const network = getNetworkById(selectedNetworkId, selectedProviderId)

  const web3 = typeof window !== 'undefined'
    ? web3Factory(network)
    : null

  dispatch({ type: WEB3_SETUP, web3 })

  await dispatch(watcher({ web3 }))

  const userManagerDAO = daoByType('UserManager')(getState())
  const [isCBE, profile, memberId] = await Promise.all([
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

export const bootstrap = (relogin = true) => async (dispatch, getState) => {
  networkService.checkMetaMask()
  if (networkService) {
    networkService
      .on('createSession', createSession)
      .on('destroySession', destroySession)
      .on('login', ({ account, dispatch }) => dispatch(login(account)))
  }

  if (!relogin) {
    return
  }

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

export const updateUserProfile = (profile) => async (dispatch, getState) => {
  const { profileSignature } = getState().get(DUCK_SESSION)

  const newProfile = await profileService.updateUserProfile({ ...profile }, profileSignature.token)

  dispatch(setProfileSignature({
    ...profileSignature,
    profile: newProfile,
  }))
}

export const setProfileSignature = (signature) => ({
  type: SET_PROFILE_SIGNATURE,
  signature,
})

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to extract profileService and other logic from here
 */
export const getProfileSignature = (wallet) =>
  async (dispatch) => {
    if (wallet) {
      const signDataString = profileService.getSignData()
      const signData = wallet.sign(signDataString)
      const profileSignature = await profileService.getProfile(signData.signature)

      dispatch(setProfileSignature(profileSignature))
    }
  }
