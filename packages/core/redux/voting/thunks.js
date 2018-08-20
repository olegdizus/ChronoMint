/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import BigNumber from 'bignumber.js'
import votingService from '../../services/VotingService'
import type PollNoticeModel from '../../models/notices/PollNoticeModel'
import PollDetailsModel from '../../models/PollDetailsModel'
import { notify } from '../notifier/actions'
import { PTPoll } from './types'
import { getSelectedPollFromDuck, selectPollsList } from './selectors/models'
import { daoByType } from '../daos/selectors'
import PollModel from '../../models/PollModel'
import {
  handlePollCreated,
  handlePollRemoved,
  handlePollUpdated,
  pollsList,
  pollsLoad,
  pollsVoteLimit,
} from './actions'

import {
  DUCK_SESSION,
} from '../session/constants'
import {
  IS_ACTIVATED,
  IS_CREATED,
  IS_ENDED,
  IS_REMOVED,
  IS_UPDATED,
  IS_VOTED,
} from '../../models/constants/PollNoticeModel'
import {
  EVENT_POLL_ACTIVATED,
  EVENT_POLL_CREATED,
  EVENT_POLL_ENDED,
  EVENT_POLL_REMOVED,
  EVENT_POLL_VOTED,
} from '../../dao/constants/PollEmitterDAO'
import {
  DUCK_VOTING,
} from './constants'
import { executeTransaction } from '../ethereum/actions'

const PAGE_SIZE = 20

export const watchPoll = (notice: PollNoticeModel) => async (dispatch) => {
  switch (notice.status()) {
    case IS_CREATED:
      dispatch(handlePollRemoved(notice.transactionHash()))
      dispatch(handlePollCreated(notice.poll()))
      break
    case IS_REMOVED:
      dispatch(handlePollRemoved(notice.pollId()))
      break
    case IS_ACTIVATED:
    case IS_ENDED:
    case IS_VOTED:
    case IS_UPDATED:
      dispatch(handlePollUpdated(notice.poll()))
      break
  }
  dispatch(notify(notice))
}

export const updateVoteLimit = () => async (dispatch, getState) => {
  const votingDAO = daoByType('VotingManager')(getState())
  // eslint-disable-next-line prefer-const
  let [voteLimitInTIME, voteLimitInPercent] = await Promise.all([
    votingDAO.getVoteLimit(),
    votingDAO.getVoteLimitInPercent(),
  ])
  voteLimitInPercent = new BigNumber(voteLimitInPercent).div(100)
  dispatch(pollsVoteLimit(voteLimitInTIME, voteLimitInPercent))
}

export const watchInitPolls = () => async (dispatch, getState) => {
  const callback = (notice) => dispatch(watchPoll(notice))
  const { account } = getState().get(DUCK_SESSION)
  const votingManagerDAO = daoByType('VotingManager')(getState())
  votingService
    .setVotingManager(votingManagerDAO)
  votingService
    .subscribeToVoting(account)

  votingService
    .on(EVENT_POLL_CREATED, callback)
    .on(EVENT_POLL_REMOVED, callback)
    .on(EVENT_POLL_ACTIVATED, callback)
    .on(EVENT_POLL_ENDED, callback)
    .on(EVENT_POLL_VOTED, callback)

  return Promise.all([
    dispatch(updateVoteLimit()),
  ])
}

export const createPoll = (poll: PollDetailsModel) => async (dispatch, getState) => {
  const votingDAO = daoByType('VotingManager')(getState())

  try {
    const tx = await votingDAO.createPoll(poll.poll)
    if (tx) {
      dispatch(executeTransaction({ tx }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('createPoll error: ', e)
  }
}

export const removePoll = (pollObject: PTPoll) => (dispatch, getState) => {
  const state = getState()
  const votingDAO = daoByType('VotingManager')(getState())

  const poll = pollObject && pollObject.id
    ? selectPollsList(state).item(pollObject.id)
    : getSelectedPollFromDuck(state)

  try {
    dispatch(handlePollRemoved(poll.id))
    const dao = votingDAO.pollInterfaceManagerDAO.getPollInterfaceDAO(poll.id)

    const tx = dao.removePoll()
    if (tx) {
      dispatch(executeTransaction({ tx }))
    }

  } catch (e) {
    // eslint-disable-next-line
    console.error('removePoll error: ', e)
    dispatch(handlePollCreated(poll))
    throw e
  }
}

export const vote = (choice: Number) => async (dispatch, getState) => {

  const poll = getSelectedPollFromDuck(getState())
  const votingDAO = daoByType('VotingManager')(getState())

  try {
    dispatch(handlePollUpdated(poll.isFetching(true)))
    const options = poll.voteEntries()
    const dao = await votingDAO.pollInterfaceManagerDAO.getPollInterfaceDAO(poll.id)
    const tx = dao.vote(choice, options.get(choice), { symbol: 'TIME' })
    if (tx) {
      dispatch(executeTransaction({ tx }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('Vote poll error: ', e)
    dispatch(handlePollUpdated(poll))
    throw e
  }
}

export const activatePoll = (pollObject: PTPoll) => async (dispatch, getState) => {

  const state = getState()
  const votingDAO = daoByType('VotingManager')(getState())

  const poll = pollObject && pollObject.id
    ? selectPollsList(state).item(pollObject.id)
    : getSelectedPollFromDuck(state)

  try {
    dispatch(handlePollUpdated(poll.mutate({ poll: new PollModel({ ...poll.poll, active: true, isFetching: true }) })))

    const dao = await votingDAO.pollInterfaceManagerDAO.getPollInterfaceDAO(poll.id)
    const tx = dao.activatePoll({ symbol: 'TIME' })
    if (tx) {
      dispatch(executeTransaction({ tx }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('Active poll error: ', e)
    dispatch(handlePollUpdated(poll))
  }
}

export const endPoll = (pollObject: PTPoll) => async (dispatch, getState) => {
  const state = getState()
  const poll = selectPollsList(state).item(pollObject.id)
  const votingDAO = daoByType('VotingManager')(getState())

  try {
    dispatch(handlePollUpdated(
      poll
        .mutate({
          poll: poll.poll.mutate({
            active: false,
            status: false,
            isFetching: true,
          }),
        }),
    ))
    const dao = await votingDAO.pollInterfaceManagerDAO.getPollInterfaceDAO(poll.id)
    const tx = dao.endPoll()
    if (tx) {
      dispatch(executeTransaction({ tx }))
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('End poll error: ', e)
    dispatch(handlePollUpdated(poll))
  }
}

export const listPolls = () => async (dispatch) => {
  dispatch(pollsLoad())
  const list = await dispatch(getNextPage())
  dispatch(pollsList(list))
}

export const getNextPage = () => async (dispatch, getState) => {
  const dao = daoByType('VotingManager')(getState())

  const votingState = getState().get(DUCK_VOTING)
  const { account } = getState().get(DUCK_SESSION)
  return dao.getPollsPaginated(votingState.lastPoll(), PAGE_SIZE, account)
}