import {PriceModel} from "./modals/PriceModel";

const _ = require('underscore');

const request = require('request');
import {EvResult} from './modals/EvResult';
import * as qs from 'querystring';
import * as assert from 'assert';
import {CoinBalanceModel} from "./modals/CoinBalanceModel";
import {BookModel} from "./modals/BookModel";
import {CoinOrderModel} from "./modals/CoinOrderModel";
import {UserModel} from "./modals/UserModel";

export class EvarlikRest {
    private token: string;
    private test: boolean;
    private timeout: number;
    private baseUrl: string;

    constructor(options: { token: string, test: boolean, timeout: number }) {
        this.token = options.token;
        this.test = options.test;
        this.timeout = options.timeout;
        if (this.test == true) {
            this.baseUrl = 'http://evarlik-test.us-east-2.elasticbeanstalk.com/api/';
        } else {
            this.baseUrl = 'https://evarlik.com/api/';
        }
    }

    /**
     *
     * @param {{mail: string; password: string}} body
     * @param callback
     * @returns {Promise<any>}
     */
    login(body: { mail: string, password: string }, callback?) {
        return this.makeRequest({}, body, callback, 'user/login', false, 'POST');
    }

    /**
     *
     * @param callback
     * @returns {Promise<EvResult<PriceModel>>}
     */
    price(callback?): Promise<EvResult<PriceModel>> {
        return this.makeRequest<EvResult<PriceModel>>({}, null, callback, 'price/all', false, 'GET');
    }

    /**
     *
     * @param callback
     * @returns {Promise<EvResult<CoinBalanceModel[]>>}
     */
    allCoinBalance(callback?): Promise<EvResult<CoinBalanceModel[]>> {
        return this.makeRequest<EvResult<CoinBalanceModel[]>>({}, null, callback, 'UserCoinTransactionOrder/AllCoinBalance', true, 'GET');
    }

    moneyBalance(callback?): Promise<EvResult<number>> {
        return this.makeRequest<EvResult<number>>({}, null, callback, 'UserCoinTransactionOrder/MoneyBalance', true, 'GET');
    }

    allBalance(callback?): Promise<EvResult<CoinBalanceModel[]>> {
        return new Promise<EvResult<CoinBalanceModel[]>>((resolve, reject) => {
            this.allCoinBalance(callback).then(coinResult => {
                if (!coinResult.isSuccess) {
                    reject(coinResult)
                }
                this.moneyBalance(callback).then(balanceResult => {
                    if (!balanceResult.isSuccess) {
                        reject(balanceResult);
                    }
                    coinResult.data.push({
                        idCoinType: 'TRY',
                        balance: balanceResult.data
                    });
                    resolve(coinResult);
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    bookList(query: { transactionType: string, coinType: string, limit: number }, callback?): Promise<EvResult<BookModel[]>> {
        return this.makeRequest<EvResult<BookModel[]>>(query, null, callback, 'UserCoinTransactionOrder/List', true, 'GET');
    }

    coinOrderList(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return this.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'MainOrderLog/CoinOrder', true, 'GET');
    }

    userRegister(user: {}, callback?): Promise<EvResult<any>> {
        return this.makeRequest<EvResult<any>>({}, user, callback, 'User/Register', true, 'POST');
    }

    forgotPassword(user: { mail: string }, callback?): Promise<EvResult<any>> {
        return this.makeRequest<EvResult<UserModel>>({}, user, callback, 'User/ForgotPassword', true, 'POST');
    }


    user(query: {}, callback?): Promise<EvResult<UserModel>> {
        return this.makeRequest<EvResult<UserModel>>(query, null, callback, 'User', true, 'GET');
    }

    userUpdate(user: {}, callback?): Promise<EvResult<UserModel>> {
        return this.makeRequest<EvResult<UserModel>>({}, user, callback, 'User', true, 'POST');
    }

    bank(query: {}, callback?): Promise<EvResult<any>> {
        return this.makeRequest<EvResult<any>>(query, null, callback, 'Bank', true, 'GET');
    }

    bankOrder(query: {}, callback?): Promise<EvResult<any>> {
        return this.makeRequest<EvResult<any>>(query, null, callback, 'MainOrderLog/BankOrder', true, 'GET');
    }

    wallet(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return this.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'User/Wallet', true, 'GET');
    }

    walletOrder(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return this.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'MainOrderLog/WalletOrder', true, 'GET');
    }

    private makeRequest<T>(query, body, callback, route, useToken, method): Promise<T> {
        assert(_.isUndefined(callback) || _.isFunction(callback), 'callback must be a function or undefined');
        assert(_.isObject(query), 'query must be an object');

        let queryString;
        const type = _.last(route.split('/')),
            options: any = {
                url: `${this.baseUrl}${route}`,
                timeout: this.timeout
            };

        queryString = qs.stringify(query);
        if (queryString) {
            options.url += '?' + queryString;
        }

        options.headers = {'Content-Type': `application/json`};
        if (useToken == true) {
            options.headers.Authorization = `Barear ${this.token}`;
        }
        if (method) {
            options.method = method;
        }

        if (body) {
            options.body = body;
            options.json = true;
        }

        const action = cb => {
            request(options, (err, response, body) => {
                let payload: T;
                try {
                    payload = JSON.parse(body);
                } catch (e) {
                    payload = body;
                }
                if (err) {
                    cb(err, payload);
                } else if (response.statusCode < 200 || response.statusCode > 299) {
                    cb(new Error(`Response code ${response.statusCode}`), payload);
                } else {
                    cb(err, payload);
                }
            });
        };
        return new Promise<T>((resolve, reject) => action((err, payload: T) => {
            if (err) {
                if (payload === undefined) {
                    reject(err);
                } else {
                    reject(payload);
                }
            } else {
                resolve(payload as T);
            }
        }));
    }


}
