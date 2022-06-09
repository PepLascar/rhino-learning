'use strict';

const express = require('express');
const controller = require('./controller');
const middleware = require('../../middlewares');
const fileUpload = require('express-fileupload');

const router = new express.Router();

router.post('/add', middleware.upload.single('file'), controller.addInvoicing);
router.get('/:test/doc/:rut', middleware.requiresLogin, controller.downloadDocument);
router.post('/massiveInvoice-data', middleware.requiresLogin, fileUpload({useTempFiles: true}), controller.massiveInvoiceData);
router.post('/editNro', middleware.requiresLogin, controller.editNro);
module.exports = router;
