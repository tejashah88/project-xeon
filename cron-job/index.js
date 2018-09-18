require('dotenv').config();

const admin = require("firebase-admin");
const serviceAccount = require("./xeon-abd9e-firebase-adminsdk-kvki5-66e0aa89db.json");

let app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://xeon-abd9e.firebaseio.com"
});

const xeClient = require('./xe-client');

let ref = admin.database().ref("rate_drop");

async function checkValueChange({ direction, src_amount, dest_amount, dest, src, should_notify }, ref) {
  let data = await xeClient.convertFromAsPromised(src, dest, src_amount);
  let convertedAmt = data.to[0].mid;
  ref.update({
    should_notify: direction == "more" ? dest_amount < convertedAmt : dest_amount > convertedAmt
  });
}

async function handle() {
  let snapshot = await ref.once('value');
  let val = snapshot.val();
  if (val != null) {
    let entries = Object.entries(val);
    for (let [key, rule] of entries) {
      console.log([key, rule])
      await checkValueChange(rule, snapshot.ref.child(key));
    }
    await app.delete();
  }
}

exports.handler = async function(event, context) {
  handle()
};

handle();