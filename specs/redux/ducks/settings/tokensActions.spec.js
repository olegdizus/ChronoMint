import {Map} from 'immutable';
import * as modalActions from '../../../../src/redux/ducks/ui/modal';
import * as notifierActions from '../../../../src/redux/ducks/notifier/notifier';
import * as actions from '../../../../src/redux/ducks/settings/tokens';
import isEthAddress from '../../../../src/utils/isEthAddress';
import AppDAO from '../../../../src/dao/AppDAO';
import OrbitDAO from '../../../../src/dao/OrbitDAO';
import TokenContractModel from '../../../../src/models/contracts/TokenContractModel';
import {store} from '../../../init';

const accounts = AppDAO.web3.eth.accounts;
let token = null; /** @see TokenContractModel */
let token2 = null;
let holder = null;
let balance = null;

describe('settings tokens actions', () => {
    beforeAll(() => {
        return OrbitDAO.init(null, true);
    });

    it('should list tokens', () => {
        return store.dispatch(actions.listTokens()).then(() => {
            const list = store.getActions()[0].list;
            expect(store.getActions()).toEqual([{type: actions.TOKENS_LIST, list}]);
            expect(list instanceof Map).toBeTruthy();

            const address = list.keySeq().toArray()[0];
            token = list.get(address);
            token2 = list.get(list.keySeq().toArray()[1]);
            expect(token.address()).toEqual(address);
            expect(isEthAddress(token.address())).toBeTruthy();
        });
    });

    it('should list balances', () => {
        return store.dispatch(actions.listTokenBalances(token)).then(() => {
            expect(store.getActions()[0]).toEqual({
                type: actions.TOKENS_BALANCES,
                balances: new Map({'Loading...': null})
            });

            const num = store.getActions()[1];
            expect(num).toEqual({
                type: actions.TOKENS_BALANCES_NUM,
                num: num.num,
                pages: num.pages
            });

            const list = store.getActions()[2];
            const balances = list.balances;
            expect(list).toEqual({
                type: actions.TOKENS_BALANCES,
                balances
            });

            expect(num.num).toBeLessThanOrEqual(balances.size);
            expect(balances.size).toBeLessThanOrEqual(100);
            expect(num.pages).toEqual(Math.ceil(num.num / 100));

            holder = balances.keySeq().toArray()[0];
            balance = balances.get(holder);
        });
    });

    it('should list balances with address filter', () => {
        return store.dispatch(actions.listTokenBalances(token, 0, holder)).then(() => {
            expect(store.getActions()[1]).toEqual({
                type: actions.TOKENS_BALANCES_NUM, num: 1, pages: 1
            });

            let expected = new Map();
            expected = expected.set(holder, balance);
            expect(store.getActions()[2]).toEqual({
                type: actions.TOKENS_BALANCES,
                balances: expected
            });
        });
    });

    it('should not list balances with invalid address filter', () => {
        return store.dispatch(actions.listTokenBalances(token, 0, '0xinvalid')).then(() => {
            expect(store.getActions()[1]).toEqual({
                type: actions.TOKENS_BALANCES_NUM, num: 0, pages: 0
            });
            expect(store.getActions()[2]).toEqual({
                type: actions.TOKENS_BALANCES,
                balances: new Map()
            });
        });
    });

    it('should open view token modal', () => {
        return store.dispatch(actions.viewToken(token)).then(() => {
            const view = store.getActions()[0];
            expect(view).toEqual({
                type: actions.TOKENS_VIEW,
                token: view.token
            });
            expect(view.token.address()).toEqual(token.address());
            expect(view.token.name().length).toBeGreaterThan(0);
            expect(view.token.totalSupply()).toBeGreaterThanOrEqual(0);

            expect(store.getActions()[1]).toEqual({
                type: modalActions.MODAL_SHOW,
                payload: {modalType: modalActions.SETTINGS_TOKEN_VIEW_TYPE, modalProps: undefined}
            });
        });
    });

    it('should show token form', () => {
        store.dispatch(actions.formToken(token));

        const view = store.getActions()[0];
        expect(view).toEqual({type: actions.TOKENS_FORM, token});

        expect(store.getActions()[1]).toEqual({
            type: modalActions.MODAL_SHOW,
            payload: {modalType: modalActions.SETTINGS_TOKEN_TYPE, modalProps: undefined}
        });
    });

    it('should remove token', () => {
        return new Promise(resolve => {
            AppDAO.watchUpdateToken((revokedToken, ts, revoke) => {
                if (revoke) {
                    expect(revokedToken).toEqual(token2);
                    resolve();
                }
            }, accounts[0]);

            store.dispatch(actions.removeToken(token2, accounts[0])).then(() => {
                expect(store.getActions()).toEqual([
                    {type: actions.TOKENS_REMOVE_TOGGLE, token: null}
                ]);
            });
        });
    });

    it('should modify token', () => {
        return new Promise(resolve => {
            AppDAO.watchUpdateToken((updatedToken, ts, revoke) => {
                if (!revoke && updatedToken.address() === token2.address()) {
                    expect(updatedToken).toEqual(token2);
                    resolve();
                }
            }, accounts[0]);

            store.dispatch(actions.treatToken(token, token2.address(), accounts[0])).then(() => {
                expect(store.getActions()).toEqual([]);
            });
        });
    });

    it('should add token', () => {
        return new Promise(resolve => {
            AppDAO.watchUpdateToken((addedToken, ts, revoke) => {
                if (!revoke && addedToken.address() === token.address()) {
                    expect(addedToken).toEqual(token);
                    resolve();
                }
            }, accounts[0]);

            store.dispatch(actions.treatToken(new TokenContractModel(), token.address(), accounts[0])).then(() => {
                expect(store.getActions()).toEqual([]);
            });
        });
    });

    it('should not modify token address on already added token address', () => {
        return store.dispatch(actions.treatToken(token, token2.address(), accounts[0])).then(() => {
            expect(store.getActions()).toEqual([
                {type: actions.TOKENS_ERROR, address: token2.address()}
            ]);
        });
    });

    it('should create a notice and dispatch token when updated', () => {
        store.dispatch(actions.watchUpdateToken(token, null, false));
        expect(store.getActions()).toEqual([
            {type: notifierActions.NOTIFIER_MESSAGE, notice: store.getActions()[0].notice},
            {type: notifierActions.NOTIFIER_LIST, list: store.getActions()[1].list},
            {type: actions.TOKENS_UPDATE, token}
        ]);

        const notice = store.getActions()[0].notice;
        expect(notice.token).toEqual(token);
        expect(notice.revoke).toEqual(false);
        expect(store.getActions()[1].list.get(0)).toEqual(notice);
    });

    it('should create an action to show an error', () => {
        expect(actions.showTokenError(token.address())).toEqual({type: actions.TOKENS_ERROR, address: token.address()});
    });

    it('should create an action to hide an error', () => {
        expect(actions.hideTokenError()).toEqual({type: actions.TOKENS_HIDE_ERROR});
    });

    it('should create an action to toggle remove token dialog', () => {
        expect(actions.removeTokenToggle(token)).toEqual({type: actions.TOKENS_REMOVE_TOGGLE, token});
    });

    it('should create an action to update token balances num', () => {
        expect(actions.tokenBalancesNum(100, 1)).toEqual({type: actions.TOKENS_BALANCES_NUM, num: 100, pages: 1});
    });
});