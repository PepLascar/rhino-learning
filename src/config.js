'use strict';

const path = require('path');
const url = require('url');
const dotenv = require('dotenv');
const dburi = require('config-dburi');
const ms = require('ms');
const pkg = require('../package.json');

dotenv.config({silent: true, path: path.join(__dirname, '..', '.env')});

function redisOptions(uri) {
  const redisUrl = url.parse(uri);
  const options = {
    host: redisUrl.hostname,
    port: redisUrl.port
  };
  if (redisUrl.auth) {
    const redisAuth = redisUrl.auth.split(':');
    options.user = redisAuth[0];
    options.pass = redisAuth[1];
  }
  return options;
}

/**
 * @returns {number}
 */
function getExpirationInSeconds() {
  const expirationInMilliseconds = ms(process.env.EXPIRATION || '15m');
  if (!expirationInMilliseconds) {
    return 15 * 60;
  }
  return expirationInMilliseconds / 1000;
}

module.exports = {
  name: pkg.name,
  env: process.env.NODE_ENV || 'development',
  db: dburi.mongo('elearning'),
  redis: dburi.redis(),
  port: process.env.PORT || 3000,
  secret: process.env.SECRET || 'my secret',
  noReply: process.env.NO_REPLY || 'habla.con@escaleno.cl',
  sessionStore: redisOptions(dburi.redis()),
  amulenCoreUrl: process.env.AMULEN_CORE_URL || 'http://localhost:3001',
  version: pkg.version,
  elearningBackend: process.env.ELEARNING_BACKEND_URL,
  aws: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET || 'amulen-elearnming',
    endpoint: process.env.AWS_ENDPOINT
  },
  email: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    from: process.env.MAILGUN_ACCOUNT
  },
  document: {
    pdfReader: process.env.LECTURA_PDF_URL,
    pdfToJson: process.env.PDFTOJSON_URL
  },
  extracss: process.env.EXTRACSS,
  client: process.env.CLIENTID,
  expirationInSeconds: getExpirationInSeconds()
};
