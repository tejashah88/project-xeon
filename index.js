'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require("dialogflow-fulfillment");

// allow async/await usage in express
require('express-async-errors');

const server = express();
server.use(bodyParser.json());
const PORT = process.env.PORT || 8080;

const intentMap = require('./action-handlers');

server.post('/chat', (req, res) => {
  let agent = new WebhookClient({ request: req, response: res });
  console.log(`Executing action ${agent.action}...`)
  agent.handleRequest(intentMap);
});

server.use((error, req, res, next) => {
  logger.error(error.stack);
  if (res.headersSent)
    return next(error);
  else
    return res.status(500).json({ error });
});

server.listen(PORT, () => console.log(`project-xeon initiated! Server listening on port ${PORT}!`));
