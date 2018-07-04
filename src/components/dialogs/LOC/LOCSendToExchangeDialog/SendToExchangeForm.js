/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { Field, formPropTypes, reduxForm } from 'redux-form/immutable'
import PropTypes from 'prop-types'
import { Button } from 'components'
import React, { PureComponent } from 'react'
import { TextField } from 'redux-form-material-ui'
import { Translate } from 'react-redux-i18n'
import TokenValue from 'components/common/TokenValue/TokenValue'
import Amount from '@chronobank/core/models/Amount'
import validate from './validate'

import './SendToExchangeForm.scss'

const onSubmit = (values) => +values.get('sendAmount')

@reduxForm({ form: 'SendToExchangeForm', validate, onSubmit })
class SendToExchangeForm extends PureComponent {
  static propTypes = {
    handleSubmit: PropTypes.func,
    allowed: PropTypes.instanceOf(Amount),
    ...formPropTypes,
  }

  render () {
    const { handleSubmit, allowed, pristine, invalid } = this.props
    return (
      <form onSubmit={handleSubmit} name='SendToExchangeFormName' styleName='root'>

        <div styleName='subHeader'>
          <p><Translate value='forms.mustBeCoSigned' /></p><br />
          <p><Translate value='forms.correspondingFee' /></p><br />
          <p>Allowed to send: <TokenValue value={allowed} /></p>
        </div>

        <Field
          component={TextField}
          name='sendAmount'
          floatingLabelText='Amount to send'
        />

        <div styleName='footer'>
          <Button
            label={<Translate value='terms.send' />}
            disabled={pristine || invalid}
            onClick={handleSubmit}
          />
        </div>

      </form>
    )
  }
}

export default SendToExchangeForm