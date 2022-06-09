'use strict';

const express = require('express');
const controller = require('./controller');
const middleware = require('../../middlewares');
const multer = require('multer');
const path = require('path');

const router = new express.Router();

router.get('/', middleware.requiresLogin, controller.list);
router.get('/:id', middleware.requiresLogin, middleware.setVisits, middleware.hasTest, controller.get);
router.get('/:id/document/:doc', middleware.requiresLogin, middleware.hasTest, controller.document);
router.post('/:id/pdf/:student', controller.certificatePDF);
router.get('/check/:id', controller.checkQr);
router.get('/:id/play/:video', middleware.requiresLogin, controller.play);
router.post('/:id/play/:video', middleware.requiresLogin, controller.play);
router.get('/:test/invoice/:rut/:title', middleware.requiresLogin, controller.downloadInvoice);

/* SERVICIOS DE ADMINISTRADOR */
router.get('/test/to-create', middleware.requiresLogin, controller.toCreate);
router.get('/:id/students', middleware.requiresLogin, controller.students);
router.post('/', middleware.requiresLogin, controller.create);
router.put('/:id', middleware.requiresLogin, middleware.hasTest, controller.update);
router.get('/list/all', middleware.requiresLogin, controller.listAll);
router.get('/to-edit/:id', middleware.requiresLogin, middleware.hasTest, controller.toUpdate);
router.put('/:id/videos', multer({dest: path.join(__dirname, '..', '..', 'uploads')}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), controller.uploadVideos);
router.put('/:id/material', middleware.upload.single('file'), middleware.requiresLogin, middleware.hasTest, controller.uploadMaterial);
router.put('/:id/aditional-material', middleware.requiresLogin, middleware.hasTest, middleware.upload.single('file'), controller.uploadAdditionalMaterial);
router.delete('/:id/video/:videoId', middleware.requiresLogin, middleware.hasTest, controller.deleteVideoByIdOfVideo);
router.delete('/:id', middleware.requiresLogin, middleware.hasTest, controller.deleteTest);
router.post('/get-url-file', controller.getTemporalURL);
router.get('/:id/document/:doc/signed-url', middleware.requiresLogin, middleware.hasTest, controller.getTemporalURL);

module.exports = router;
