'use strict';

const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const Certificate = Schema({
  rut: {type: String, require},
  fullName: {type: String, require},
  test: { type: Schema.ObjectId, ref: 'Test', require},
  client: { type: String, required: true }
});

Certificate.plugin(timestamps);
Certificate.plugin(mongoosePaginate);

//Obtener certificado por rut y curso
Certificate.statics.retrieveByTestRut = function(params) {
  const query = { rut: params.rut, test: params.test, client: params.client };
  return this.findOne(query).exec();
};

//Obtener certificado por id
Certificate.statics.retrieveCertificate = function(params) {
  const query = { _id: params.id, client: params.client };
  return this.findOne(query).exec();
};

//Obtener certificado solo por id
Certificate.statics.findCertificate = function(params) {
  const query = { _id: params.id };
  return this.findOne(query).exec();
};

// Obtener todos los certificados almacenados con paginador.
Certificate.statics.list = function({
  page,
  limit,
  client,
}) {
  const query = {client: client};
  const options = {
    page: page || 1,
    limit: limit || 900,
    sort: { createdAt: -1 }
  };
  return this.paginate(query, options);
};

module.exports = mongoose.model('Certificate', Certificate);
