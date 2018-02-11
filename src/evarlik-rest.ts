import {EvResult} from "../modals/EvResult";

const _ = require('underscore');
const request = require('request');
import * as qs from 'querystring';
import * as assert from 'assert';
import {PriceModel} from "../modals/PriceModel";
import {CoinBalanceModel} from "../modals/CoinBalanceModel";
import {BookModel} from "../modals/BookModel";
import {CoinOrderModel} from "../modals/CoinOrderModel";
import {UserModel} from "../modals/UserModel";
import {isNullOrUndefined} from "util";

export class EvarlikRest {
    private static token: string;
    private static test: boolean;
    private static timeout: number;
    private static baseUrl: string;
    private static tokenOptions: {
        useAsyncStorage: boolean,
        tokenKey: string,
        asyncStorage: any
    };

    private constructor() {
    }

    static initializeApp(options: {
        token?: string, test: boolean, timeout: number, tokenOptions?: {
            useAsyncStorage: boolean,
            tokenKey: string,
            asyncStorage: any
        }
    }) {
        EvarlikRest.token = options.token;
        EvarlikRest.test = options.test;
        EvarlikRest.timeout = options.timeout;
        EvarlikRest.tokenOptions = options.tokenOptions;
        if (EvarlikRest.test == true) {
            EvarlikRest.baseUrl = 'http://evarlik-test.us-east-2.elasticbeanstalk.com/api/';
        } else {
            EvarlikRest.baseUrl = 'https://evarlik.com/api/';
        }
    }


    /**
     * Login call
     * @param {{mail: string; password: string}} body
     * @param callback
     * @returns {Promise<any>}
     */
    static login(body: { mail: string, password: string }, callback?) {
        return EvarlikRest.makeRequest({}, body, callback, 'user/login', false, 'POST');
    }

    static price(callback?): Promise<EvResult<PriceModel>> {
        return EvarlikRest.makeRequest<EvResult<PriceModel>>({}, null, callback, 'price/all', false, 'GET');
    }

    static allCoinBalance(callback?): Promise<EvResult<CoinBalanceModel[]>> {
        return EvarlikRest.makeRequest<EvResult<CoinBalanceModel[]>>({}, null, callback, 'UserCoinTransactionOrder/AllCoinBalance', true, 'GET');
    }

    static moneyBalance(callback?): Promise<EvResult<number>> {
        return EvarlikRest.makeRequest<EvResult<number>>({}, null, callback, 'UserCoinTransactionOrder/MoneyBalance', true, 'GET');
    }

    static allBalance(callback?): Promise<EvResult<CoinBalanceModel[]>> {
        return new Promise<EvResult<CoinBalanceModel[]>>((resolve, reject) => {
            EvarlikRest.allCoinBalance(callback).then(coinResult => {
                if (!coinResult.isSuccess) {
                    reject(coinResult)
                }
                EvarlikRest.moneyBalance(callback).then(balanceResult => {
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

    static bookList(query: { transactionType: string, coinType: string, limit: number }, callback?): Promise<EvResult<BookModel[]>> {
        return EvarlikRest.makeRequest<EvResult<BookModel[]>>(query, null, callback, 'UserCoinTransactionOrder/List', true, 'GET');
    }

    static coinOrderList(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return EvarlikRest.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'MainOrderLog/CoinOrder', true, 'GET');
    }

    static userRegister(user: {}, callback?): Promise<EvResult<any>> {
        return EvarlikRest.makeRequest<EvResult<any>>({}, user, callback, 'User/Register', true, 'POST');
    }

    static forgotPassword(user: { mail: string }, callback?): Promise<EvResult<any>> {
        return EvarlikRest.makeRequest<EvResult<UserModel>>({}, user, callback, 'User/ForgotPassword', true, 'POST');
    }


    static user(query: {}, callback?): Promise<EvResult<UserModel>> {
        return EvarlikRest.makeRequest<EvResult<UserModel>>(query, null, callback, 'User', true, 'GET');
    }

    static userUpdate(user: {}, callback?): Promise<EvResult<UserModel>> {
        return EvarlikRest.makeRequest<EvResult<UserModel>>({}, user, callback, 'User', true, 'POST');
    }

    static bank(query: {}, callback?): Promise<EvResult<any>> {
        return EvarlikRest.makeRequest<EvResult<any>>(query, null, callback, 'Bank', true, 'GET');
    }

    static bankOrder(query: {}, callback?): Promise<EvResult<any>> {
        return EvarlikRest.makeRequest<EvResult<any>>(query, null, callback, 'MainOrderLog/BankOrder', true, 'GET');
    }

    static wallet(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return EvarlikRest.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'User/Wallet', true, 'GET');
    }

    static walletOrder(query: { idCoinType: string }, callback?): Promise<EvResult<CoinOrderModel[]>> {
        return EvarlikRest.makeRequest<EvResult<CoinOrderModel[]>>(query, null, callback, 'MainOrderLog/WalletOrder', true, 'GET');
    }

    private static makeRequest<T>(query, body, callback, route, useToken, method): Promise<T> {
        assert(_.isUndefined(callback) || _.isFunction(callback), 'callback must be a function or undefined');
        assert(_.isObject(query), 'query must be an object');

        let queryString;
        const type = _.last(route.split('/')),
            options: any = {
                url: `${EvarlikRest.baseUrl}${route}`,
                timeout: EvarlikRest.timeout
            };

        queryString = qs.stringify(query);
        if (queryString) {
            options.url += '?' + queryString;
        }

        options.headers = {'Content-Type': `application/json`};
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

        if (useToken == false && EvarlikRest.tokenOptions.useAsyncStorage == false) {
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
        } else {
            return new Promise<T>((resolve, reject) => {
                EvarlikRest.tokenOptions.asyncStorage.getItem(EvarlikRest.tokenOptions.tokenKey).then(token => {
                    options.headers.Authorization = `Barear ${token}`;
                    action((err, payload: T) => {
                        if (err) {
                            if (payload === undefined) {
                                reject(err);
                            } else {
                                reject(payload);
                            }
                        } else {
                            resolve(payload as T);
                        }
                    });

                })
            });
        }
    }
}
