const fs = require('fs-extra');
const readline = require('readline-promise').default;
const {google} = require('googleapis');
const { promisify } = require('util');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = './token.json';

// Load client secrets from a local file.
let content = fs.readFileSync('credentials.json');

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function insertEvent(auth) {
  const calendar = google.calendar({version: 'v3', auth});

  let eventDetails = {
    'summary': 'Exchange ATM Funds',
    'start': {
      'dateTime': new Date(),
      'timeZone': 'America/New_York',
    },
    'end': {
      'dateTime': new Date(),
      'timeZone': 'America/New_York',
    },
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 1},
        {'method': 'sms', 'minutes': 1},
        {'method': 'popup', 'minutes': 1},
      ],
    },
  };

  calendar.events.insert({
    auth: auth,
    calendarId: 'bgpeont8f0g0ia1mkgjmi09kk8@group.calendar.google.com',
    resource: eventDetails,
  }, console.log);
}

module.exports = function(rule) {
  authorize(JSON.parse(content), insertEvent);
}