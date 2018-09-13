/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Immutable from 'immutable'
import { combineReducers } from 'redux-immutable'
import { applyMiddleware, compose, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { persistReducer, PersistConfig } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { persistStore } from 'redux-persist-immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { i18nReducer, syncTranslationWithStore, setLocale } from 'react-redux-i18n'
import thunk from 'redux-thunk'
import coreReducers from '@chronobank/core/redux/ducks'
import loginReducers from '@chronobank/login/redux/ducks'
import { DUCK_PERSIST_ACCOUNT } from '@chronobank/core/redux/persistAccount/constants'
import { DUCK_WALLETS } from '@chronobank/core/redux/wallets/constants'
import transformer from '@chronobank/core/redux/serialize'
import ducks from './ducks'
import routingReducer from './routing'
import createHistory, { historyMiddleware } from './browserHistoryStore'
import { loadI18n } from './i18n/actions'

/**
 * Empty initial state
 */
const initialState = new Immutable.Map()

/**
 * Config for persisting i18n locale
 */
const i18nPersistConfig: PersistConfig = {
  key: 'i18n',
  storage,
  whitelist: ['locale'],
}

/**
 * Reducer combined from all app reducers
 */
const rootReducer = combineReducers({
  ...coreReducers,
  ...ducks,
  ...loginReducers,
  form: formReducer,
  i18n: persistReducer(i18nPersistConfig, i18nReducer),
  routing: routingReducer,
})

const isDevelopmentEnv = process.env.NODE_ENV === 'development'

const composeEnhancers = isDevelopmentEnv
  ? composeWithDevTools({ realtime: true })
  : compose

const middleware = [
  thunk,
  historyMiddleware,
]

const createStoreWithMiddleware = composeEnhancers(
  applyMiddleware(
    ...middleware,
  ),
)(createStore)

const persistorConfig: PersistConfig = {
  key: 'root',
  storage,
  whitelist: [DUCK_PERSIST_ACCOUNT, DUCK_WALLETS, 'i18n'],
  transforms: [transformer()],
}

export const store = createStoreWithMiddleware(
  persistReducer(persistorConfig, rootReducer),
  initialState,
)

export const persistor = persistStore(store)

export const history = createHistory(store)

export default { store, persistor, history }
syncTranslationWithStore(store)

store.dispatch(loadI18n('en'))
/** <<< i18n END */
