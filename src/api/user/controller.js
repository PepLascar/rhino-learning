'use strict';

const utils = require('../../utils');
const moment = require('moment');
const auth = require('../../middlewares');
const { config } = require('aws-sdk');
const conf = require('../../config')

exports.login = (req, res) => {
  res.render('signin', {
    messages: req.flash('info'),
    next: req.query.next ? req.originalUrl.split('next=')[1] : '',
    conf: conf.extracss
  });
};

exports.signin = (req, res, next) => {
  req.body.ip = req.headers['X-Forwarded-For'] || req.headers['x-forwarded-for'] || req.client.remoteAddress;
  req.body.browser = req.headers['user-agent'];
  return utils.signin(req.body).then(data => {
    if (!data.token) {
      req.flash('info', 'Credenciales incorrectas');
      res.redirect('/auth/signin');
    } else {
      const clientRedis = auth.getClientRedis();
      clientRedis.set(
        req.body.user,
        JSON.stringify({
          token: data.token,
          created: moment().add(conf.expirationInSeconds, 'seconds').toDate()
        })
      );
      clientRedis.expire(req.body.user, conf.expirationInSeconds);
      req.session.user = {
        rut: req.body.user,
        token: data.token,
        id: data.id,
        permissions: data.permissions.elearning || [],
        client: data.client,
        fullName: `${data.name} ${data.lastname}`,
        email: data.email,
        role: data.permissions.elearningProfile
      };
      res.locals.user = {rut: req.session.user.rut};
      if (req.body.next) return res.redirect(req.body.next);
      res.redirect('/');
    }
  }).catch(err => next(err));
};

exports.signout = (req, res) => {
  const clientRedis = auth.getClientRedis();
  clientRedis.del(req.session.user.rut);
  delete req.session.user;
  res.redirect('/auth/signin');
};
