/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import ErrorList from 'platform/ErrorList'
import * as validator from 'models/validator'
import tokenService from 'services/TokenService'

export default (values, props) => {
  const { token, wallet, balance } = props
  if (!token) {
    return
  }

  const amount = values.get('amount')
  const recipient = values.get('recipient')

  const amountFormatError = validator.currencyNumber(amount, token.decimals())
  const amountErrors = new ErrorList()
    .add(validator.required(amount))
    .add(amountFormatError)

  if (!amountFormatError) {
    // validate only numbers
    const amountWithDecimals = token.addDecimals(amount)
    amountErrors.add(balance.minus(amountWithDecimals).lt(0) ? 'error.notEnoughTokens' : null)
  }

  const tokenDAO = tokenService.getDAO(token.id())
  const addressValidator = tokenDAO
    ? tokenDAO.getAddressValidator()
    : () => ''

  return {
    recipient: new ErrorList()
      .add(validator.required(recipient))
      .add(addressValidator(recipient, true, token.blockchain()))
      .add(recipient === wallet.address() ? 'errors.cantSentToYourself' : null)
      .getErrors(),
    amount: amountErrors.getErrors(),
  }
}
