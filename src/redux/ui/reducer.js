/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { REHYDRATE } from 'redux-persist'
import {
  CHANGE_WALLET_VIEW,
} from './constants'

const initialState = {
  isCompactWalletView: false,
  rehydrated: false,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        isCompactWalletView: action.isCompactWalletView || false,
        rehydrated: true,
      }
    }
    case CHANGE_WALLET_VIEW:
      return {
        ...state,
        isCompactWalletView: !state.isCompactWalletView,
      }
    default:
      return state
  }
}
