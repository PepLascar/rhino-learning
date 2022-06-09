'use strict';

const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const Schema = mongoose.Schema;

const Invoincing = Schema({
  rut: {type: String, require},
  invoiceNumber: {type: String, require, unique: false},
  uuid: String,
  fileUrl: String,
  fileName: String,
  test: { type: Schema.ObjectId, ref: 'Test', require}
});

Invoincing.plugin(timestamps);

//Obtener factura por id
Invoincing.statics.getInvoice = function(params) {
  const query = {test: params.test, rut: params.rut };
  return this.findOne(query).exec();
}

//Obtener factura por curso y alumno
Invoincing.statics.getByTestStudent = function(params) {
  const query = { rut: params.rut, test: params.test };
  return this.findOne(query).exec();
}

module.exports = mongoose.model('Invoicing', Invoincing);
