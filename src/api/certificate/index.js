'use strict';

const express = require('express');
const controller = require('./controller');
const { requiresLogin } = require('../../middlewares');

const router = new express.Router();

router.get('/list', requiresLogin, controller.list);
router.get('/:test/:rut', requiresLogin, controller.retrieveByTestRut);
router.get('/:id', requiresLogin, controller.retrieve);
router.post('/add', requiresLogin, controller.create);
router.get('/delete/:test/:rut', requiresLogin, controller.delete);
router.post('/massive', requiresLogin, controller.massive);

module.exports = router;
