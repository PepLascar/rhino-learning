'use strict';

const moment = require('moment');
const utils = require('./utils');
const querystring = require('querystring');
const multer = require ('multer');
const multerS3 = require ('multer-s3');
const { s3 } = require('./s3')
const {v4: uuidv4} = require('uuid');
const { Test } = require('./api/test/model');
const config = require('./config')

let clientRedis = null;

const setClientRedis = _clientRedis => {
  clientRedis = _clientRedis;
};

const getClientRedis = () => clientRedis;

const requiresLogin = (req, res, next) => {
  if (!req.session.user) {
    if (req.xhr) {
      return res.sendStatus(401);
    } else {
      return res.redirect(`/auth/signin?next=${req.originalUrl}`);
    }
  }
  return clientRedis.getAsync(req.session.user.rut).then(replay => {
    if (!replay) {
      if (req.xhr) {
        res.sendStatus(401);
      } else {
        res.redirect(`/auth/signin?next=${req.originalUrl}`);
      }
    } else {
      const data = JSON.parse(replay);
      const created = moment(data.created);
      const now = moment();
      if (created.diff(now, 'minutes') < 5) {
        return utils.updateToken({email: req.session.user.email, token: data.token}).then(token => {
          if (!token) return res.redirect(`/auth/signin?next=${req.originalUrl}`);
          clientRedis.set(req.session.user.rut, JSON.stringify({token: token, created: moment().add(config.expirationInSeconds, 'seconds').toDate()}));
          clientRedis.expire(req.session.user.rut, config.expirationInSeconds);
          req.session.user.token = token;
          res.locals.user = {rut: req.session.user.rut, fullName: req.session.user.fullName, role: req.session.user.role, email: req.session.user.email, client: req.session.user.client };
          res.locals.permissions = req.session.user.permissions;
          next();
        }).catch(err => next(err));
      } else {
        res.locals.user = {rut: req.session.user.rut, fullName: req.session.user.fullName, role: req.session.user.role, email: req.session.user.email, client: req.session.user.client };
        res.locals.permissions = req.session.user.permissions;
        next();
      }
    }
  }).catch(err => next(err));
};

const pagination = (req, res, next) => {
  res.locals.paginate = req.query.paginate > 0 ? req.query.paginate : 25;
  res.locals.page = req.query.page > 0 ? req.query.page : 1;
  res.locals.search = req.query.q ? req.query.q : '';
  const query = req.query;
  delete query.page;
  res.locals.query = querystring.stringify(query);
  next();
};

const setVisits = async (req, res, next) => {
  try {
    await Test.updateOne({_id: req.params.id}, {$inc: { visits: 1}}).exec()
    next()
  } catch (error) {
    next(error)
  }
};


const hasTest = (req, res, next) => {
  const permissions = req.session.user.permissions || [];
  if (permissions.indexOf(req.params.id) === -1) return res.sendStatus(404);
  next();
};

const upload = multer({
  storage: multerS3({
    acl: 'private',
    s3,
    bucket: config.aws.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${req.params.id}/${uuidv4()}`);
    },
  }),
});

module.exports = {
  requiresLogin: requiresLogin,
  pagination: pagination,
  setClientRedis: setClientRedis,
  getClientRedis: getClientRedis,
  setVisits: setVisits,
  hasTest: hasTest,
  upload
};
