/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import validator from 'models/validator'
import ErrorList from 'platform/ErrorList'

export default function (values) {
  return {
    managerAddress: new ErrorList()
      .add(validator.address(values.get('managerAddress'), true))
      .getErrors(),
  }
}
