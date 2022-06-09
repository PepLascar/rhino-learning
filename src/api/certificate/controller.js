'use strict';

const Certificate = require('./model');
const objectId = require('mongodb').ObjectId;
const { rutTools } = require('prettyutils');

function validator(params){
  const validTest = objectId.isValid(params.test);
  const validRut = rutTools.validate(params.rut);
  const validId = objectId.isValid(params.id);
  const validClient = objectId.isValid(params.client);
  const err = [];
  if(params.rut && !validRut) {
    err.push({
      error: 400,
      mensaje: `Formato de rut incorrecto o rut no existe (${params.rut})`
    });
  }
  if(params.test && !validTest) {
    err.push({
      error: 400,
      mensaje: `Formato de test incorrecto (${params.test})`
    });
  }
  if(params.id && !validId) {
    err.push({
      error: 400,
      mensaje: `Formato de id incorrecto (${params.id})`
    });
  }
  if(!params.client){
    err.push({
      error: 401,
      mensaje: 'Debe iniciar sesión'
    });
  }
  if(params.client && !validClient){
    err.push({
      error: 400,
      mensaje: 'Formato de client incorrecto'
    });
  }
  return err;
}

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return docs with certificates and paginator
 */
exports.list = async (req, res, next) => {
  try{
    const queries = {
      client: req.session.user.client,
      limit: parseInt(req.query.limit),
      page: req.query.page
    };
    const certificates = await Certificate.list(queries);
    return res.send(certificates);
  }catch(err){
    next(err);
  }
};

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return doc by id.
 */
exports.retrieve = async (req, res, next) => {
  try{
    const params = {
      id: req.params.id,
      client: req.session.user.client
    };
    const certificate = await Certificate.retrieveCertificate(params);
    if (!certificate) return res.sendStatus(404);
    return res.send(certificate);
  }catch(err){
    next(err);
  }
};

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return doc by test id and rut id.
 */
exports.retrieveByTestRut = async (req, res, next) => {
  try{
    const test = req.params.test;
    const rut = req.params.rut;
    const client = req.session.user.client;
    const valida = validator({rut,test,client});
    if (valida.length) return res.json(valida);
    const certificate = await Certificate.retrieveByTestRut({
      rut,
      test,
      client
    });
    if (!certificate) return res.sendStatus(404);
    return res.send(certificate);
  }catch(err){
    next(err);
  }
};

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return doc create certificate.
 */
exports.create = async (req, res, next) => {
  try{
    const test = req.body.test;
    const rut = req.body.rut;
    const fullName = req.body.fullName;
    const client = req.session.user.client;
    const curso = req.body.curso;
    const valida = validator({rut, test, client});
    if(valida.length) return res.json(valida);
    const findCert = await Certificate.findOne({test, rut, client});
    if(findCert){
      const body = {rut, test};
      await Certificate.updateOne({_id: findCert._id}, body);
      return res.redirect(`/${curso}/students?permissions=elearning&permissionsValue=${curso}`);
    }else {
      await Certificate.create({ test, rut, fullName, client});
      return res.redirect(`/${curso}/students?permissions=elearning&permissionsValue=${curso}`);
    }
  }catch(err){
    next(err);
  }
};

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return doc delete certificate.
 */
exports.delete = async (req, res, next) => {
  try{
    const test = req.params.test;
    const rut = req.params.rut;
    const client = req.session.user.client;
    const valida = validator({rut, test, client});
    if(valida.length) return res.json(valida);
    const certificate = await Certificate.deleteOne({ test, rut,  client});
    if(certificate.deletedCount == 0) {
      return res.json({
        status: 404,
        message: 'No se encuentra el certificado'
      });
    }
    return res.redirect(`/${test}/students?permissions=elearning&permissionsValue=${test}`);
  }catch(err){
    next(err);
  }
};

/**
 *
 * @param {any} req - Valores de entrada.
 * @param {object} res  - Valor de salida.
 * @return {object} - Return message massive load certificate.
 *
 *  Ejemplo body
 * [{
        "rut": "19.886.949-K",
        "test": "5fb6ab81aa8dc5c84e8f694e"
    },
    {
        "rut": "10.937.033-9",
        "test": "5fb6ab81aa8dc5c84e8f694e"
    }]
 */
exports.massive = async (req, res, next) => {
  try{
    const body = req.body;
    const isArray = Array.isArray(body);
    if (!isArray) {
      return res.status(400).json({
        'error': 400,
        'message': 'Debe ingresar un array'
      });
    }
    if(isArray && !body.length){
      return res.status(400).json({
        'error': 400,
        'message': 'Debe ingresar un array con datos'
      });
    }else {
      let err = 0;
      const prom = new Promise((resolve) =>{
        body.forEach(async(b, index) => {
          const rut = b.rut;
          const test = b.test;
          const client = req.session.user.client;
          const valida = validator({rut, test, client});
          if(valida.length) return res.json(valida);
          const findCert = await Certificate.findOne({test, rut, client});
          if (findCert) {
            const body = { rut, test };
            const update = await Certificate.updateOne({_id: findCert._id}, body);
            if (update.ok !== 1) err = err + 1;
          } else {
            const certificate = await Certificate.create({ test, rut, client});
            if (!certificate) err = err + 1;
          }
          if(index === body.length - 1) resolve(err);
        });
      });
      prom.then((err) => {
        if (!err) {
          return res.status(200).json({
            'status': 200,
            'message': 'Certificados cargados correctamente'
          });
        } else {
          return res.status(200).json({
            'message': 'Error cargando certificados',
            'errors': err
          });
        }
      });
    }
  } catch(err) {
    next(err);
  }
};
