require('dotenv').config();

const xecdApiClient = require('@xe/xecd-rates-client');

const xecdConfig = {
  username: process.env.XE_ACCOUNT_ID,
  password: process.env.XE_ACCOUNT_API_KEY,
  apiUrl: 'https://xecdapi.xe.com/v1/'
};

const client = new xecdApiClient.XECD(xecdConfig);

const methods = [
  "accountInfo",
  "currencies",
  "convertFrom",
  "convertTo",
  "historicRate",
  "historicRatePeriod"
];

client.convertFromAsPromised = function(...args) {
  return new Promise((resolve, reject) => {
    client.convertFrom((err, data) => {
      if (err)
        reject(err);
      else
        resolve(data);
    }, ...args);
  });
}

module.exports = client;