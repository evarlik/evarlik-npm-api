import {EvarlikRest} from "../src/evarlik-rest";


var assert = require('assert');
describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});

const restApi = new EvarlikRest({
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJJZCI6NTIsIlRva2VuIjpudWxsLCJDcmVhdGVkQXQiOiIyMDE4LTAyLTExVDEzOjQxOjUwLjQwNzEyMyswMDowMCIsIk5hbWUiOiJUZXN0IiwiU3VybmFtZSI6IlRzdCIsIklzQXBwcm92ZWQiOmZhbHNlLCJJc0F1dGhlbnRpY2F0ZWQiOmZhbHNlLCJNYWlsIjoidGVzdEB0ZXN0LmNvbSIsIlBhc3N3b3JkIjpudWxsLCJPdHAiOm51bGx9.TUU7JEUnxX8goyFy12R33HCeR4kqakCxH2dtoDfLb7Q',
    timeout: 15000,
    test: true
});

describe('evarlil-rest', () => {

    it('login', () => {
        restApi.login({mail: 'test@test.com', password: 'testtest'}).then((res: any) => {
            //   expect(res.isSuccess).toBe(true);
        }).catch(err => {
            console.log('Err 2', err);
            expect(false).toBe(true);
        })
    });

});
