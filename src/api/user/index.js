'use strict';

const express = require('express');
const controller = require('./controller');

const router = new express.Router();

router.get('/signin', controller.login);
router.post('/signin', controller.signin);
router.get('/signout', controller.signout);

module.exports = router;
