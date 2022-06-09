/* eslint-disable no-console */
'use strict';

const {Test, Video} = require('./model');
const Config = require('../setting/model');
const Certificate = require('../certificate/model');
const Invoicing = require('../invoicing/model');
const path = require('path');
const configEnv = require('../../config');
const {
  deleteElements,
  emptyDirectoryInBucket,
  getTemporalURL: getTemporalURLS3,
  retrieve,
  s3,
  uploadFromPath
} = require('../../s3');
const utils = require('../../utils');
const {isMongoId} = require('validator').default;
const moment = require('moment');
const { aulaLogo } = require('../../common/base64/aula-logo');
const { bordeCertificado  } = require('../../common/base64/bordes');
const { firma } = require('../../common/base64/firma');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const pug = require('pug');
const through2 = require('through2');
const request = require('request');

exports.list = async (req, res, next) => {
  try {
    const ids = req.session.user.permissions.filter(permission => isMongoId(permission));
    const body = {
      client: req.session.user.client,
      ids
    };
    const tests = await Test.list(body);
    res.render('tests', {tests, conf: configEnv.extracss});
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const client = configEnv.client;
    const conf = await Config.getSetting();
    const cert = await Certificate.find();
    const body = {client: req.session.user.client, id: req.params.id};
    const test = await Test.get(body);
    if (!test) return res.sendStatus(404);
    const inv = await Invoicing.find();
    const fechaCierre = test.closingDate;
    const today = moment().format();
    const caducado = moment(fechaCierre).isBefore(today, 'day');
    const videoId = req.query.videoId;
    res.render('details', {test: test, inv, caducado, videoId, conf, cert, client, config: configEnv.extracss});
  } catch (error) {
    next(error);
  }
};

exports.document = async (req, res, next) => {
  try {
    const body = {client: req.session.user.client, id: req.params.id, doc: req.params.doc};
    const doc = await Test.document(body);
    if (!doc) return res.sendStatus(404);
    const filename = path.join(req.params.id, doc.uuid);
    const readStream = retrieve(filename);
    res.set({
      'Content-Disposition': `attachment; filename="${doc.filename}"`
    });
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    //Download Invoice
    const body = {test: req.params.test, rut: req.params.rut, title: req.params.title};
    const doc = await Invoicing.getInvoice(body);
    if (!doc) return res.sendStatus(404);
    const filename = path.join('undefined', doc.uuid);
    const readStream = retrieve(filename);
    res.set({
      'Content-Disposition': `attachment; filename="${doc.fileName}"`
    });
    readStream.pipe(res);

    // //Send Email with Invoice
    // const fullName = req.session.user.fullName;
    // const title =req.params.title;
    // const apiKey = configEnv.email.api_key;
    // const domain = configEnv.email.domain;
    // const urlDocument = await getTemporalURLS3(filename);
    // const mailgun = new Mailgun({apiKey: apiKey, domain: domain});
    // const file = request(`${urlDocument}`);
    // const attch = new mailgun.Attachment({data: file, filename: `${doc.fileName}`});
    // const data = {
    //   from: configEnv.email.from,
    //   to: req.session.user.email,
    //   subject: `Facturación ${title}`,
    //   html: `<p>${fullName}, Se adjunta facturación del curso ${title}.</p><br>
    //         <p>En caso de requerir algún cambio en la facturación favor responder este correo indicando su solicitud o ingresar a sección Aula Virtual y realizar la solicitud directamente.</p><br>
    //         <span>Saludos cordiales,</span><br>
    //         <span>Equipo Aula Tributaria</span><br>
    //         <span>facturacion@aulatributaria.cl</span>`,
    //   attachment: attch
    // }
    // mailgun.messages().send(data);
  } catch (error) {
    if (error.statusCode == '400') res.redirect('/400');
    else if (error.statusCode == '500') res.redirect('/500');
    else next(error);
  }
};

exports.certificatePDF = (req, res, next)=> {
  const dataPDF = { ...req.body, aulaLogo, bordeCertificado, firma };
  // const filename = fullname.replace(' ','-').toUpperCase();
  const html = pug.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf.pug'), dataPDF);
  const url = configEnv.document.pdfToJson;
  const passThrough = through2();
  request.post({
    url: url,
    headers: {'Content-Type': 'application/json'},
    json: {content: html , no_options: true, only_content: true, orientation: 'landscape'}
  }, err => {
    if(err)next(err);
  }).pipe(passThrough).pipe(res);
};

/* SERVICIOS DE ADMINISTRADOR */
exports.toCreate = (req, res) => {
  if (req.session.user.role !== 'admin') {
    res.redirect('400');
  } else {
    res.render('create', {conf: configEnv.extracss});
  }
};

exports.create = async (req, res) => {
  const {price, ...body} = req.body;
  const client = configEnv.client;
  const documents = [
    {
      name: 'Material del curso',
      documents: []
    },
    {
      name: 'Material adicional',
      documents: []
    }
  ];
  const test = await Test.create({...body, client, documents});

  await utils.addCourseInElearningBackend(req.session.user, {
    title: test.title,
    courseId: test._id.toString(),
    price: parseInt(price)
  });

  await utils.addPermission(req.session.user, test._id.toString());
  res.locals.permissions.push(test._id.toString());
  res.json(test);
};

exports.toUpdate = async (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    res.redirect('/400');
  } else {
    try {
      const _id = req.params.id;
      const testBd = await Test.findOne({_id}).exec();
      if (!testBd) return res.sendStatus(404);
      const {closingDate, ...test} = testBd.toObject();
      const closingDateToSave = moment(closingDate).format('yyyy-MM-DD');
      // const course = await utils.getCourseInElearningBackendByCourseId(req.session.user, _id)
      res.render('edit', {test: {...test, closingDate: closingDateToSave}, conf: configEnv.extracss});
    } catch (error) {
      next(error);
    }
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = req.body;
    const _id = req.params.id;
    const test = await Test.updateOne({_id}, body).exec();
    const course = await utils.getCourseInElearningBackendByCourseId(req.session.user, _id);
    await utils.updateCourseInElearningBackend(req.session.user, course._id, {
      title: body.title
    });
    res.json(test);
  } catch (error) {
    next(next);
  }
};

exports.listAll = async (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    res.redirect('400');
  } else {
    try {
      const body = {
        client: req.session.user.client,
        ids: req.session.user.permissions.filter(permission => isMongoId(permission))
      };

      const tests = await Test.list(body);
      res.render('list', {tests: tests, conf: configEnv.extracss});
    } catch (error) {
      next(error);
    }
  }
};

const getUUIDOfFiles = (path) => {
  const fileArray = path.split('/');
  return fileArray[fileArray.length - 1];
};

exports.uploadVideos = async (req, res, next) => {
  try {
    const files = req.files;
    if (!files) {
      return res.sendStatus(400);
    }
    // Debe venir el video y siempre la imagen
    else if (!files['video'] || !files['image']) {
      return res.sendStatus(400);
    }

    const image = files['image'][0];
    const video = files['video'][0];

    const videoObj = new Video({
      title: req.body.title,
      module: req.body.module,
      processing: true,
      cover: {
        filename: image.originalname,
        uuid: uuidv4()
      },
      video: {
        filename: video.originalname,
        uuid: uuidv4()
      }
    });

    const test = await Test.findOneAndUpdate(
      {_id: req.params.id},
      {
        '$push':
          {
            videos: videoObj
          }
      },
      {new: true}
    );

    processVideo(req.params.id, video, image, videoObj);

    res.json({test});
  } catch (error) {
    next(error);
  }
};

exports.uploadMaterial = async (req, res, next) => {
  try {
    const test = await Test.updateOne(
      {_id: req.params.id, 'documents.name': 'Material del curso'},
      {
        '$push':
          {
            'documents.$.documents': {filename: req.file.originalname, uuid: getUUIDOfFiles(req.file.key)}
          }
      }
    ).exec();
    res.json({test});
  } catch (error) {
    next(error);
  }
};

async function processVideo(id, videoFile, imageFile, doc) {
  uploadFromPath(imageFile.path, `${id}/${doc._doc.cover.uuid}`)
    .then(() => {
      console.log(`Image preview "${imageFile.path}" uploaded`);
    }).catch(() => {
      console.error(`Image preview "${imageFile.path}" could not be uploaded`);
    }).finally(() => {
      fs.unlink(imageFile.path, (err) => {
        if (err) {
          console.error(`Can't delete file "${imageFile.path}"`);
          return;
        }

        console.log(`File "${imageFile.path}" deleted`);
      });
    });

  const resolutions = [
    // {
    //   width: 1920,
    //   height: 1080
    // },
    {
      width: 1280,
      height: 720
    },
    {
      width: 854,
      height: 480
    },
    // {
    //   width: 640,
    //   height: 360
    // }
  ];

  const masterManifest = ['#EXTM3U',
    '#EXT-X-STREAM-INF:BANDWIDTH=750000,RESOLUTION=854x480',
    `/${id}/play/${doc._doc.video.uuid}-480.m3u8`,
    '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720',
    `/${id}/play/${doc._doc.video.uuid}-720.m3u8`].join('\n');

  s3.putObject({
    Bucket: configEnv.aws.bucket,
    Key: `${id}/${doc._doc.video.uuid}-master.m3u8`,
    Body: masterManifest
  }).promise().then(() => {
    console.log(`Master manifest "${id}/${doc._doc.video.uuid}-master.m3u8" uploaded`);
  }).catch(() => {
    console.error(`Master manifest "${id}/${doc._doc.video.uuid}-master.m3u8" could not be uploaded`);
  });

  for (let resolution of resolutions) {
    const tempDir = path.join(__dirname, '..', '..', 'uploads', '__temp', `${doc._doc.video.uuid}-${resolution.height}`);
    fs.mkdir(tempDir, {recursive: true}, (err) => {
      if (err) {
        throw err;
      }
      console.log(`Directory "${tempDir}" created successfully!`);

      ffmpeg(videoFile.path)
        .format('hls')
        .outputOptions([
          '-profile:v high',
          '-level 4.0',
          `-s ${resolution.width}x${resolution.height}`,
          '-hls_playlist_type vod',
          '-hls_time 10',
          '-hls_list_size 0',
          `-hls_segment_filename ${tempDir}/${doc._doc.video.uuid}-${resolution.height}-%03d.ts`,
          `-hls_base_url /${id}/play/`
        ]).output(`${tempDir}/${doc._doc.video.uuid}-${resolution.height}.m3u8`)
        .on('progress', function (progress) {
          console.log(`Processing "${doc._doc.video.uuid}-${resolution.height}.m3u8" ${progress.timemark} ${progress.frames} frames ${parseFloat(progress.percent).toFixed(2)}% done`);
        })
        .on('end', function (err) {
          if (err) {
            console.error(`Error converting "${videoFile}" in HLS format`);
            throw err;
          }
          console.log(`Finished processing "${videoFile.path}"`);

          fs.unlink(videoFile.path, (err) => {
            if (err) {
              console.error(`Can't delete file "${videoFile.path}"`);
              return;
            }

            console.log(`File "${videoFile.path}" deleted`);
          });

          fs.readdir(tempDir, (err, files) => {
            if (err) {
              console.log(`Can't read dir "${tempDir}", ${err}`);
              return;
            }

            const promisedFiles = files.map(file => {
              return uploadFromPath(path.join(tempDir, file), `${id}/${file}`);
            });

            Promise.all(promisedFiles).finally(() => {
              Test.findById(id, function (err, result) {
                if (!err) {
                  if (!result) {
                    console.warn(`Test id "${id}" not found`);
                  } else {
                    let updateVideo = false;
                    result.videos = result.videos.map(video => {
                      console.log(`[DEBUG] video.id=${video._id}, doc._doc._id=${doc._doc._id}`);
                      if (video._id == doc._doc._id) {
                        console.log('[DEBUG] updateVideo');
                        video.processing = false;
                        updateVideo = true;
                      }
                      return video;
                    });
                    if (updateVideo) {
                      console.log('[DEBUG] update doc');
                      result.markModified('videos');
                      result.save(function (saveerr) {
                        if (!saveerr) {
                          console.error(`Error saving test document id "${doc._doc._id}"`);
                        }
                      });
                    }
                  }
                } else {
                  console.error(`Error finding test document id "${doc._doc._id}"`);
                }
              });

              fs.stat(tempDir, (err, stat) => {
                if (err) {
                  console.error(`Error accessing folder "${tempDir}"`);
                  return;
                }

                if (stat.isDirectory()) {
                  fs.rmdir(tempDir, {recursive: true}, (err) => {
                    if (err) {
                      console.error(`Error deleting folder "${tempDir}"`);
                      return;
                    }
                    console.log(`Folder "${tempDir}" deleted`);
                  });
                }
              });
            });
          });
        })
        .run();
    });
  }
}

exports.uploadAdditionalMaterial = async (req, res, next) => {
  try {
    const test = await Test.updateOne(
      {_id: req.params.id, 'documents.name': 'Material adicional'},
      {
        '$push':
          {
            'documents.$.documents': {filename: req.file.originalname, uuid: getUUIDOfFiles(req.file.key)}
          }
      }
    ).exec();
    res.json({test});
  } catch (error) {
    next(error);
  }
};

exports.students = async (req, res, next) => {
  const permissions = req.query.permissions;
  const permissionsValue = req.query.permissionsValue;
  const user = req.session.user;
  const body = {client: req.session.user.client, id: req.params.id};
  const cert = await Certificate.find();
  const test = await Test.get(body);
  const inv = await Invoicing.find({test: test._id});
  if (req.session.user.role !== 'admin') {
    res.redirect('/400');
  } else {
    if (!test) return res.sendStatus(404);
    try {
      const params = {permissions: permissions, permissionsValue: permissionsValue, limit: 5000};
      const url = `${configEnv.amulenCoreUrl}/api/user?`;
      let response = await fetch(url + new URLSearchParams(params), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.session.user.token}`
        }
      });
      let data = await response.json();
      let users = data.message.docs;
      const newUsers = users.map(element => {
        return {
          nombre: element.name + ' ' + element.lastname,
          rut: element.rut,
          correo: element.email
        };
      });
      res.render('students', {test, user, inv, cert, usuarios: newUsers, conf: configEnv.extracss});
    } catch (error) {
      next(error);
    }
  }
};

exports.deleteVideoByIdOfVideo = async (req, res) => {
  const _id = req.params.id;
  const videoId = req.params.videoId;

  const test = await Test.findOneAndUpdate({_id}, {
    $pull: {videos: {_id: videoId}}
  })
    .exec();

  if (!test) {
    res.json({message: 'video do not found'});
  }
  const keys = [];
  const video = test.videos.find(video => video._id.toString() === videoId);
  const directory = _id;

  if (video) {
    if (video.video && video.video.uuid) {
      keys.push(`${directory}${video.video.uuid}`);
    }

    if (video.cover && video.cover.uuid) {
      keys.push(`${directory}${video.cover.uuid}`);
    }

    if (keys.length > 0) {
      await deleteElements(keys);
    }
  }
  res.json({message: 'video deleted'});
};

exports.deleteTest = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.sendStatus(404);
    }
    const id = req.params.id;
    await Test.deleteOne({_id: id});
    await emptyDirectoryInBucket(id);
    res.json({message: 'successfully removed'});
  } catch (error) {
    next(error);
  }
};

exports.getTemporalURL = async (req, res) => {
  const filename = path.join(req.params.id, req.params.doc);
  const url = await getTemporalURLS3(filename);
  res.redirect(url);
};

exports.play = async (req, res, next) => {
  if (!req.params.id || !req.params.video) {
    return res.sendStatus(404);
  }

  const fullPath = path.join(req.params.id, req.params.video);

  try {
    s3.getObject({
      Bucket: configEnv.aws.bucket,
      Key: fullPath
    }).createReadStream().pipe(res);

  } catch (err) {
    return next(err);
  }
};
// ../check/:id_certificado (BD: certificates)
exports.checkQr = async (req, res, next) => {
  try {
    const params = {
      id: req.params.id
    };
    const cert = await Certificate.find();
    const certificate = await Certificate.findCertificate(params);
    const idCert = certificate.test;
    const body = { id: idCert };
    const test = await Test.get(body);

    moment.locale('es');
    const fechaCertificado = certificate.createdAt;
    const date = moment(fechaCertificado).format('lll');
    if (!certificate) return res.sendStatus(404);
    res.render('qr', { test: test, certificate, date, cert });
  } catch (err) {
    next(err);
  }
};
