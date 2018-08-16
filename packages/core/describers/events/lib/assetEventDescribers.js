import { EventDescriber, findEventABI } from '../EventDescriber'
import LogEventModel from '../../../models/LogEventModel'
import { ChronoBankPlatformEmitterABI } from '../../../dao/abi'

export const EVENT_ISSUE = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'Issue'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'Issue',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'Asset created',
      message: params.proxy,
      target: null,
    })
  },
)

export const EVENT_REVOKE = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'Revoke'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'Revoke',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'Revoke',
      message: params.proxy,
      target: null,
    })
  },
)

export const EVENT_OWNERSHIP_CHANGE = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'OwnershipChange'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'OwnershipChange',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'OwnershipChange',
      message: params.proxy,
      target: null,
    })
  },
)

export const EVENT_APPROVE = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'Approve'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'Approve',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'Approve',
      message: params.proxy,
      target: null,
    })
  },
)

export const EVENT_RECOVERY = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'Recovery'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'Recovery',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'Recovery',
      message: params.proxy,
      target: null,
    })
  },
)

export const EVENT_OWNERSHIP_RECOVERY = new EventDescriber(
  findEventABI(ChronoBankPlatformEmitterABI, 'Recovery'),
  ({ log, block }, context, { params }) => {

    return new LogEventModel({
      key: `${log.blockHash}/${log.transactionIndex}/${log.logIndex}`,
      type: 'event',
      name: 'Transfer',
      date: new Date(block.timestamp * 1000),
      icon: 'event',
      title: 'Transfer',
      message: params.proxy,
      target: null,
    })
  },
)
