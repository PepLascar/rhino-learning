'use strict';

const http = require('http');
const path = require('path');

const bodyParser = require('body-parser');
const connectRedis = require('connect-redis');
const cookieParser = require('cookie-parser');
const express = require('express');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const redis = require('redis');
const session = require('express-session');
const winston = require('winston');
const flash = require('connect-flash');
const bluebird = require('bluebird');

const config = require('./config');

bluebird.promisifyAll(redis.RedisClient.prototype);

// Conexion de mongodb
mongoose.connect(config.db);
mongoose.Promise = global.Promise;

// Instancia de express
const app = express();
const server = http.Server(app);

if (typeof process.env.SENTRY_DSN !== 'undefined') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: `${config.name}${process.env.SENTRY_RELEASE || config.version}`,
    serverName: process.env.SENTRY_NAME,
    environment: process.env.SENTRY_ENVIRONMENT || config.env,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app })
    ],
    tracesSampleRate: Number(process.env.SENTRY_TRACE_SAMPLE_RATE) || 0.1
  })
}

// Plantillas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Cookies
app.use(cookieParser(config.secret));

// Parser de peticiones POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());

// Sesion
const RedisStore = connectRedis(session);
app.use(session({
  store: new RedisStore(config.sessionStore),
  secret: config.secret,
  resave: true,
  saveUninitialized: true
}));

// Mensajes a las plantillas
app.use(flash());

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

// Estaticos
app.use(express.static(path.join(__dirname, '..', 'build')));

// Token
app.locals.token = config.token;

// Version
app.locals.version = config.version;

// Redis
const clientRedis = redis.createClient(config.redis);

// Rutas
require('./routes')(app, clientRedis);

// Error logger
app.use(Sentry.Handlers.errorHandler())
app.use((err, req, res, next) => {
  if (err.message && (~err.message.indexOf('not found') || (~err.message.indexOf('Cast to ObjectId failed')))) {
    next();
  } else {
    winston.error(err);
    res.status(500).render('500');
  }
});
app.use((req, res) => res.status(404).render('404'));
app.use((req, res, next) => {
  clientRedis.on('error', (err) => next(err));
});

server.listen(config.port, () => {
  winston.info(`Express app started on port ${config.port}`);
});

module.exports = server;
