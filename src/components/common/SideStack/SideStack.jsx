/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { SidePanel } from 'layouts/partials'
import { DUCK_SIDES } from 'redux/sides/actions'

import './SideStack.scss'

export const PROFILE_SIDE_PANEL_KEY = 'ProfileSidePanelKey'
export const NOTIFICATION_SIDE_PANEL_KEY = 'NotificationSidePanelKey'

function mapStateToProps (state) {
  return {
    stack: state.get(DUCK_SIDES).stack,
  }
}

@connect(mapStateToProps)
class SideStack extends PureComponent {
  static propTypes = {
    stack: PropTypes.arrayOf(PropTypes.object),
  }

  render () {
    return (
      <div styleName='root'>
        { this.props.stack.map((panel) => (
          <SidePanel key={panel.panelKey} {...panel} />
        ))}
      </div>
    )
  }
}

export default SideStack
