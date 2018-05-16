/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { ModalDialog } from 'components'
import SendTokensForm, { ACTION_APPROVE, ACTION_TRANSFER, FORM_SEND_TOKENS } from 'components/dashboard/SendTokens/SendTokensForm'
import Amount from 'models/Amount'
import TokensCollection from 'models/tokens/TokensCollection'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { change, untouch } from 'redux-form'
import { mainApprove, mainTransfer } from 'redux/mainWallet/actions'
import { multisigTransfer } from 'redux/multisigWallet/actions'
import { DUCK_TOKENS, estimateGas } from 'redux/tokens/actions'
import MainWalletModel from 'models/wallet/MainWalletModel'
import MultisigWalletModel from 'models/wallet/MultisigWalletModel'
import DerivedWalletModel from 'models/wallet/DerivedWalletModel'

function mapDispatchToProps (dispatch) {
  return {
    multisigTransfer: (wallet, token, amount, recipient, feeMultiplier) => dispatch(multisigTransfer(wallet, token, amount, recipient, feeMultiplier)),
    mainApprove: (token, amount, spender, feeMultiplier) => dispatch(mainApprove(token, amount, spender, feeMultiplier)),
    mainTransfer: (wallet, token, amount, recipient, feeMultiplier) => dispatch(mainTransfer(wallet, token, amount, recipient, feeMultiplier)),
    estimateGas: (tokenId, params, callback, gasPriseMultiplier) => dispatch(estimateGas(tokenId, params, callback, gasPriseMultiplier)),
    resetForm: () => {
      dispatch(change(FORM_SEND_TOKENS, 'recipient', ''))
      dispatch(change(FORM_SEND_TOKENS, 'amount', ''))
      dispatch(untouch(FORM_SEND_TOKENS, 'recipient', 'amount'))
    },
  }
}

function mapStateToProps (state) {
  return {
    tokens: state.get(DUCK_TOKENS),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class SendTokens extends PureComponent {
  static propTypes = {
    wallet: PropTypes.oneOfType([
      PropTypes.instanceOf(MainWalletModel),
      PropTypes.instanceOf(MultisigWalletModel),
      PropTypes.instanceOf(DerivedWalletModel),
    ]),
    isModal: PropTypes.bool,
    mainApprove: PropTypes.func,
    mainTransfer: PropTypes.func,
    resetForm: PropTypes.func,
    multisigTransfer: PropTypes.func,
    tokens: PropTypes.instanceOf(TokensCollection),
    token: PropTypes.string,
    blockchain: PropTypes.string,
    address: PropTypes.string,
  }

  handleSubmit = (values) => {
    const { wallet, tokens } = this.props

    const { action, symbol, amount, recipient, feeMultiplier } = values.toJS()
    const token = tokens.item(symbol)

    const value = new Amount(token.addDecimals(amount), symbol)

    switch (action) {
      case ACTION_APPROVE:
        !wallet.isMultisig() && this.props.mainApprove(token, value, recipient, feeMultiplier)
        break
      case ACTION_TRANSFER:
        wallet.isMultisig()
          ? this.props.multisigTransfer(wallet, token, value, recipient, feeMultiplier)
          : this.props.mainTransfer(wallet, token, value, recipient, feeMultiplier)
    }
  }

  handleSubmitSuccess = () => {
    // this.props.resetForm()
  }

  render () {
    const { isModal, token } = this.props
    const initialValues = {
      feeMultiplier: 1,
      symbol: token,
    }

    if (isModal) {
      return (
        <ModalDialog>
          <SendTokensForm
            initialValues={initialValues}
            onSubmit={this.handleSubmit}
            onSubmitSuccess={this.handleSubmitSuccess}
            token={this.props.token}
            blockchain={this.props.blockchain}
            address={this.props.address}
          />
        </ModalDialog>
      )
    }

    return (
      <SendTokensForm
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        onSubmitSuccess={this.handleSubmitSuccess}
        token={this.props.token}
        blockchain={this.props.blockchain}
        address={this.props.address}
      />
    )
  }
}
