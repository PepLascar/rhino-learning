'use strict';

const Invoicing = require('./model');
const { getTemporalURL: getTemporalURLS3, retrieve } = require('../../s3');
const path = require('path');
const fetch = require('node-fetch');
const config = require('../../config');
const fs = require('fs');
const util = require('util');
const Mailgun = require('mailgun-js');
const request = require('request');

exports.editNro = async (req, res, next) => {
  const nro = req.body.nro;
  const rut = req.body.rut;
  const curso = req.body.curso;
  const url = config.document.pdfReader;
  if (req.session.user.role !== 'admin') {
    res.render('400')
  } else {
    // Datos para registrar factura
    const invoicing = ({
      rut: rut,
      courseId: curso,
      invoiceNumber: parseInt(nro)
    });
    // POST una factura
    const responseFetch = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({invoicing:[invoicing]}),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if(responseFetch.status === 201 || responseFetch.status === 200 || responseFetch.status === 302){
      // Envío de email
      const title =req.body.title;
      const apiKey = config.email.api_key;
      const domain = config.email.domain;
      const url = config.amulenCoreUrl.concat('/api/user/rut-client?rut=',rut,'&client=',config.client)
      // Get hacia amulenCore para obtener los datos del usuario
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.session.user.token}`
        }
      })
      // Se guarda info del usuario
      const infoJson = await response.json()
      const infoUser = infoJson.message.docs
      const fullName = infoUser[0].name + ' ' + infoUser[0].lastname
      const rutFormat = rut.split('.').join('').split('-').join('')
      // Se guarda info de la factura
      const bodyGetInvo = {test: curso, rut: rutFormat}
      const infoInvo = await Invoicing.getInvoice(bodyGetInvo)
      if (!infoInvo){
        return res.render('404')
      } else {
        // Obtener documento pdf
        const fileName = path.join('undefined', infoInvo.uuid)
        const urlDocument = await getTemporalURLS3(fileName)
        const mailgun = new Mailgun({apiKey: apiKey, domain: domain})
        const file = request(`${urlDocument}`)
        const attch = new mailgun.Attachment({data: file, filename: `${infoInvo.fileName}`})
        // Opciones del correo
        const data = {
          from: config.email.from,
          to: infoUser[0].email,
          subject: `Facturación ${title}`,
          html: `<p>${fullName}, Se adjunta facturación del curso ${title}.</p><br>
                <p>En caso de requerir algún cambio en la facturación favor responder este correo indicando su solicitud o ingresar a sección Aula Virtual y realizar la solicitud directamente.</p><br>
                <span>Saludos cordiales,</span><br>
                <span>Equipo Aula Tributaria</span><br>
                <span>facturacion@aulatributaria.cl</span>`,
          attachment: attch
        }
        // Envío
        mailgun.messages().send(data);
        res.redirect(`/${curso}/students?permissions=elearning&permissionsValue=${curso}`);
      }
    } else {
      res.render('400')
    }
  }
}

exports.massiveInvoiceData = async (req, res, next) => {
  const archivo = req.files.fileMassiveInv;
  const courseId = req.body.curso;
  if (archivo === 'undefined') {
    next();
  } else {
    const readFile = util.promisify(fs.readFile);
    async function getData() {
      return readFile(archivo.tempFilePath, 'utf8');
    }
    const doc = await getData();
    const formatData = doc.replace(/\n/g, ',').split(',');
    const invoicing = formatData.map((value, index, array) => {
      if (index%2 === 0){
        if(value !== ''){
          const invoice = array[index+1];
          return {
            rut: value,
            courseId: courseId,
            invoiceNumber: parseInt(invoice)
          }
        }
      }
    })
    const re = /null,/gi;
    const dataToFetch = JSON.stringify({invoicing}).replace(re, '').replace(',null','');
    if (invoicing !== [] || invoicing !== undefined){
      const url = config.document.pdfReader;
      let response = await fetch( url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: dataToFetch
      })
      let data = await response.json();
      let status = data.statusCode;
      if (status == 400) {
        fs.unlink(archivo.tempFilePath);
        return res.redirect('/400');
      } else if (status == 500) {
        fs.unlink(archivo.tempFilePath);
        return res.redirect('/500');
      } else {
        res.redirect(`/${courseId}/students?permissions=elearning&permissionsValue=${courseId}`);
      }
    }
  }
  fs.unlink(archivo.tempFilePath);
};

const getUUIDOfFiles = (path) => {
  const fileArray = path.split('/')
  return fileArray[fileArray.length -1]
}

exports.addInvoicing = async (req, res) => {
  const file = req.file;
  const { test, invoiceNumber } = req.body
  let rut = req.body.rut
  if(rut.includes('K')){
    rut = req.body.rut.replace('K','k')
  }
  if(!file){
    res.send('Error: Debe disponer un archivo')
  } else if (!test || !rut || !invoiceNumber){
    res.send('Error: Debe disponer de id test, rut y nro de factura')
  } else {
    try {
      const fileName = file.originalname;
      const fileUrl = file.location;
      const uuid = getUUIDOfFiles(file.key);
      const inv = await Invoicing.create({
        fileName, fileUrl, uuid, rut, test, invoiceNumber
      })
      res.json(inv)
    } catch (err) {
      res.send(err.stack)
    }
  }
}

exports.downloadDocument = async (req, res, next) => {
  try {
    const body = {test: req.params.test, rut: req.params.rut };
    const doc = await Invoicing.getInvoice(body)
    if (!doc) return res.sendStatus(404);
    const filename = path.join('undefined', doc.uuid)
    const readStream = retrieve(filename);
    res.set({
      'Content-Disposition': `attachment; filename="${doc.fileName}"`
    });
    readStream.pipe(res)
  } catch (err) {
    next(err);
  }
};
