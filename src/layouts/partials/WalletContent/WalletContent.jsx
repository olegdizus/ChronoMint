/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { isTestingNetwork } from '@chronobank/login/network/settings'
import { DUCK_NETWORK } from '@chronobank/login/redux/network/actions'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DUCK_WALLET } from '@chronobank/core/redux/wallet/actions'
import WalletWidgetDetail from 'components/wallet/WalletWidgetDetail/WalletWidgetDetail'
import TokensListWidget from 'components/wallet/TokensListWidget/TokensListWidget'
import PendingTxWidget from 'components/wallet/PendingTxWidget/PendingTxWidget'
import OwnersListWidget from 'components/wallet/OwnersListWidget/OwnersListWidget'
import { getTransactionsForWallet, goToWallets } from '@chronobank/core/redux/mainWallet/actions'
import { getWalletInfo } from 'components/wallet/WalletWidgetMini/selectors'
import TransactionsListWidget from 'components/wallet/TransactionsListWidget/TransactionsListWidget'
import { PTWallet } from '@chronobank/core/redux/wallet/types'

import './WalletContent.scss'

function makeMapStateToProps (state) {
  const { blockchain, address } = state.get(DUCK_WALLET)
  const getWallet = getWalletInfo(blockchain, address)
  const mapStateToProps = (ownState) => {
    const network = state.get(DUCK_NETWORK)
    return {
      wallet: getWallet(ownState),
      selectedNetworkId: network.selectedNetworkId,
      selectedProviderId: network.selectedProviderId,
      isTesting: isTestingNetwork(network.selectedNetworkId, network.selectedProviderId),
    }
  }
  return mapStateToProps
}

function mapDispatchToProps (dispatch) {
  return {
    goToWallets: () => dispatch(goToWallets()),
    getTransactions: (params) => dispatch(getTransactionsForWallet(params)),
  }
}

@connect(makeMapStateToProps, mapDispatchToProps)
export default class WalletContent extends Component {
  static propTypes = {
    isTesting: PropTypes.bool,
    selectedNetworkId: PropTypes.number,
    selectedProviderId: PropTypes.number,
    goToWallets: PropTypes.func,
    getTransactions: PropTypes.func,
    address: PropTypes.string,
    blockchain: PropTypes.string,
    wallet: PTWallet,
  }

  constructor (props) {
    super(props)

    if (!props.wallet.blockchain || !props.wallet.address) {
      props.goToWallets()
    }
  }

  componentDidMount () {
    this.handleGetTransactions(true)
  }

  handleGetTransactions = (forcedOffset) => {
    const { wallet, address, blockchain } = this.props
    this.props.getTransactions({ wallet, address, blockchain, forcedOffset })
  }

  render () {
    const { wallet } = this.props

    return (
      <div styleName='root'>
        <WalletWidgetDetail wallet={wallet} />

        <TokensListWidget wallet={wallet} />

        <PendingTxWidget walletInfo={wallet} />

        <OwnersListWidget wallet={wallet} />

        <TransactionsListWidget wallet={wallet} />
      </div>
    )
  }
}