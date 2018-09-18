const { Card, Suggestion } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');

const admin = require("firebase-admin");
const serviceAccount = require("./xeon-abd9e-firebase-adminsdk-kvki5-66e0aa89db.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://xeon-abd9e.firebaseio.com"
});

const insertEvent = require('./gcalendar');

let ref = admin.database().ref("rate_drop");

ref.on('value', snapshot => {
  let val = snapshot.val();
  if (val != null) {
    let entries = Object.entries(val).filter(e => e[1].should_notify);
    for (let [key, rule] of entries) {
      console.log([key, rule])
      insertEvent(rule)
      ref.child(key).remove();
    }
  }
});

const xeClient = require('./xe-client');

const currLocation = [43.471519, -80.549411];

const atmA = {
  name: 'Scotiabank',
  loc: 'https://www.google.com/maps/dir/Engineering+7,+University+Avenue+West,+Waterloo,+ON/Scotiabank+ATM,+190+Westmount+Rd+N,+Waterloo,+ON+N2L+3G5/',
  locShort: 'Scotiabank ATM, 190 Westmount Rd N, Waterloo, ON N2L 3G5',
  fee_rate: 3.00
};

const atmB = {
  name: 'CIBC Branch ATM',
  loc: 'https://www.google.com/maps/dir/Engineering+7,+University+Avenue+West,+Waterloo,+ON/CIBC+Branch+with+ATM,+University+of+Waterloo,+200+University+Ave+W,+Waterloo,+ON+N2L+3G1/',
  locShort: 'CIBC Branch with ATM, University of Waterloo, 200 University Ave W, Waterloo, ON N2L 3G1',
  fee_rate: 5.00
};

const atmC = {
  name: 'CIBC ATM',
  loc: 'https://www.google.com/maps/dir/Engineering+7,+University+Avenue+West,+Waterloo,+ON/CIBC+ATM,+University+Of+Waterloo+-+William+Davis+Building,+200+University+Avenue,+Waterloo,+ON+N2L+3G1/',
  locShort: 'CIBC ATM, University Of Waterloo - William Davis Building, 200 University Avenue, Waterloo, ON N2L 3G1',
  fee_rate: 4.00
};

const ATMs = [atmA, atmB, atmC];
ATMs.sort((a, b) => a.fee_rate - b.fee_rate)

function closest_atm(agent) {
  let { fromCurrency, toCurrency } = agent.parameters;
  let bestAtm = ATMs[0];
  agent.add(`The ATM with the lowest fee exchange rate from ${fromCurrency} to ${toCurrency} is the ${bestAtm.name}, which is ${bestAtm.fee_rate}%.`);
  agent.add(`Here's the map directions to this ATM: ${bestAtm.loc}`);
}

async function convert_currency(agent) {
  let { amount, fromCurrency, toCurrency } = agent.parameters;
  let data = await xeClient.convertFromAsPromised(fromCurrency, toCurrency, amount);
  let convertedAmt = data.to[0].mid.toFixed(2);
  agent.add(`You can get ${convertedAmt} ${toCurrency} from ${amount} ${fromCurrency}.`);
}

async function rate_drop(agent) {
  let { amount, direction, fromCurrency, toCurrency } = agent.parameters;
  let data = await xeClient.convertFromAsPromised(fromCurrency, toCurrency, 1);
  let convertedAmt = data.to[0].mid.toFixed(2);

  ref.push({
    direction,
    src_amount: 1,
    dest_amount: amount,
    dest: toCurrency,
    src: fromCurrency,
    should_notify: false
  });

  agent.add(`Sure! I'll let you know when the target currency rate drops ${direction} ${amount} ${toCurrency}`);
}

let intentMap = new Map();
intentMap.set('closest atm', closest_atm);
intentMap.set('convert currency', convert_currency);
intentMap.set('rate drop', rate_drop)
module.exports = intentMap;