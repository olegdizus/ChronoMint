/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  accountDeselect,
} from '@chronobank/core/redux/persistAccount/actions'
import {
  navigateToSelectWallet,
} from '@chronobank/login-ui/redux/navigation'
import { DUCK_PERSIST_ACCOUNT } from '@chronobank/core/redux/persistAccount/constants'
import GenerateWallet from './GenerateWallet'

function mapStateToProps (state) {
  return {
    selectedWallet: state.get(DUCK_PERSIST_ACCOUNT).selectedWallet,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    onContinue: () => {
      dispatch(accountDeselect())
      dispatch(navigateToSelectWallet())
    },
  }
}

class GenerateWalletContainer extends Component {
  static propTypes = {
    selectedWallet: PropTypes.shape({
      name: PropTypes.string,
      encrypted: PropTypes.any,
    }),
    onContinue: PropTypes.func,
  }

  downloadWallet = () => {
    const { selectedWallet } = this.props

    if (typeof selectedWallet === 'undefined') return

    const walletName = selectedWallet.name || 'Wallet'
    const text = JSON.stringify(selectedWallet.encrypted.length > 1 ? selectedWallet.encrypted : selectedWallet.encrypted[0])
    const element = document.createElement('a')

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', `${walletName}.wlt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  render () {
    const { onContinue } = this.props

    return (
      <GenerateWallet
        downloadWallet={this.downloadWallet}
        onContinue={onContinue}
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GenerateWalletContainer)
