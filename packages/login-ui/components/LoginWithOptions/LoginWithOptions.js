/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import { MuiThemeProvider } from 'material-ui'
import React, { PureComponent } from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import Button from 'components/common/ui/Button/Button'

import {
  navigateToMnemonicImportMethod,
  navigateToPrivateKeyImportMethod,
  navigateToCreateAccount,
  initImportMethodsPage,
  navigateToCreateAccountWithoutImport,
  navigateToWalletUploadMethod,
} from '@chronobank/login/redux/network/actions'

import Trezor from 'assets/img/icons/trezor-white.svg'
import Ledger from 'assets/img/icons/ledger-nano-white.svg'
import Plugin from 'assets/img/icons/plugin-white.svg'
import Mnemonic from 'assets/img/icons/mnemonic-white.svg'
import Key from 'assets/img/icons/key-white.svg'
import Wallet from 'assets/img/icons/wallet-white.svg'
import Uport from 'assets/img/icons/uport.svg'

// import styles from 'layouts/Splash/styles'
import './LoginWithOptions.scss'

function mapDispatchToProps (dispatch) {
  return {
    navigateToMnemonicImportMethod: () => dispatch(navigateToMnemonicImportMethod()),
    navigateToPrivateKeyImportMethod: () => dispatch(navigateToPrivateKeyImportMethod()),
    navigateToCreateAccount: () => dispatch(navigateToCreateAccount()),
    navigateToCreateAccountWithoutImport: () => dispatch(navigateToCreateAccountWithoutImport()),
    initImportMethodsPage: () => dispatch(initImportMethodsPage()),
    navigateToWalletUploadMethod: () => dispatch(navigateToWalletUploadMethod()),
  }
}

@connect(null, mapDispatchToProps)
export default class ImportMethodsPage extends PureComponent {
  static propTypes = {
    navigateToMnemonicImportMethod: PropTypes.func,
    navigateToPrivateKeyImportMethod: PropTypes.func,
    initImportMethodsPage: PropTypes.func,
    navigateToCreateAccountWithoutImport: PropTypes.func,
    navigateToWalletUploadMethod: PropTypes.func,
  }

  componentWillMount(){
    this.props.initImportMethodsPage()
  }

  handleMnemonicLogin = () => this.props.navigateToMnemonicImportMethod()

  handlePrivateKeyLogin = () => this.props.navigateToPrivateKeyImportMethod()

  handleWalletFileLogin = () => this.props.navigateToWalletUploadMethod()

  handleCreateAccount = () => this.props.navigateToCreateAccountWithoutImport()

  render () {
    return (
      <MuiThemeProvider>
        <div styleName='page'>

          <div styleName='page-title'>
            <Translate value='LoginWithOptions.title' />
          </div>

          <div styleName='methods'>
            <Button styleName='button button-trezor' disabled>
              <img src={Trezor} alt='' />
              <br />
              Trezor
            </Button>

            <Button styleName='button button-ledger' disabled>
              <img src={Ledger} alt='' />
              <br />
              LedgerNano
            </Button>

            <Button styleName='button button-plugin' disabled>
              <img src={Plugin} alt='' />
              <br />
              Browser Plugin
            </Button>

            <Button
              styleName='button'
              onClick={this.handleMnemonicLogin}
            >
              <img src={Mnemonic} alt='' />
              <br />
              <Translate value='LoginWithOptions.mnemonicKey' />
            </Button>

            <Button
              styleName='button'
              onClick={this.handlePrivateKeyLogin}
            >
              <img src={Key} alt='' />
              <br />
              <Translate value='LoginWithOptions.privateKey' />
            </Button>

            <Button
              styleName='button'
              onClick={this.handleWalletFileLogin}
            >
              <img src={Wallet} alt='' />
              <br />
              <Translate value='LoginWithOptions.walletFile' />
            </Button>

            <Button
              styleName='button button-uport'
              disabled
            >
              <img src={Uport} alt='' />
              <br />
              Uport
            </Button>
          </div>

          <div styleName='actions'>
            <Translate value='LoginWithOptions.or' />
            <br />
            <Link to='/login/create-account' href styleName='link' onClick={this.handleCreateAccount}>
              <Translate value='LoginWithOptions.createAccount' />
            </Link>
          </div>

        </div>
      </MuiThemeProvider>
    )
  }
}