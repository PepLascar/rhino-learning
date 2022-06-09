'use strict';

const test = require('./api/test');
const user = require('./api/user');
const invoicing = require('./api/invoicing');
const certificate = require('./api/certificate');
const auth = require('./middlewares');

module.exports = (app, clientRedis) => {
  auth.setClientRedis(clientRedis);
  app.use('/', test);
  app.use('/certificate', certificate);
  app.use('/auth', user);
  app.use('/inv', invoicing);
};
