const fs = require('fs-extra');
const c2c = require('./code-to-country.json');

let df = c2c.map(e => {
  return {
    value: e.code,
    synonyms: [
      e.code,
      e.currency
    ]
  }
});

fs.outputFileSync('dialogflow-cc-entities.json', JSON.stringify(df, null, 2));