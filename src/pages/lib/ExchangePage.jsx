/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { CSSTransitionGroup } from 'react-transition-group'
import Partials from 'layouts/partials'
import React, { Component } from 'react'

import './ExchangePage.scss'

export default class ExchangePage extends Component {
  render () {
    return (
      <div styleName='root'>
        <Partials.BrandPartial />
        <CSSTransitionGroup
          transitionName='transition-opacity'
          transitionAppear
          transitionAppearTimeout={250}
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          <Partials.ExchangeContent />
        </CSSTransitionGroup>
        { !window.isMobile && <Partials.FooterPartial /> }
      </div>
    )
  }
}

