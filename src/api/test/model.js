'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const timestamps = require('mongoose-timestamp');
const flatten = require('lodash/flatten');

const VideoSubSchema = new mongoose.Schema({
  title: String,
  module: String,
  processing: Boolean,
  cover: {
    filename: String,
    uuid: String,
    url: String
  },
  video: {
    filename: String,
    uuid: String,
    url: String
  }
});

const Schema = new mongoose.Schema({
  client: { type: String, required: true },
  title: { type: String, required: true },
  nro: { type: String, required: true, unique: false },
  hours: {type: Number},
  dates: {type: String, required: true },
  description: {
    short: { type: String, required: true },
    long: String,
  },
  code: String,
  documents: [{
    name: String,
    documents: [{
      filename: String,
      uuid: String
    }]
  }],
  material: [{
    filename: String,
    uuid: String
  }],
  additionalMaterial: [{
    filename: String,
    uuid: String
  }],
  videos: [VideoSubSchema],
  visits: { type: Number, default: 0 },
  closingDate: { type: Date }
});

Schema.plugin(mongoosePaginate);
Schema.plugin(timestamps);

// Metodo para obtener los valores almacenados
Schema.statics.list = function({
  ids,
  client,
  page,
  paginate
}) {
  const query = {_id: {$in: ids}, client: client};
  const options = {
    page: page || 1,
    limit: paginate || 900,
    sort: { createdAt: -1 }
  };
  return this.paginate(query, options);
};

// Metodo para obtener un valor por id
Schema.statics.get = function(params) {
  const query = {_id: params.id};
  return this.findOne(query).exec();
};

// Metodo para descargar un documento por id
Schema.statics.document = function(params) {
  return this.get(params).then(doc => {
    const documents = flatten(doc.documents.map(x => x.documents));
    return documents.find(x => x.uuid === params.doc);
  });
};

// Metodo para obtener la cantidad total de documentos
Schema.virtual('documentsTotal').get(function () {
  return flatten(this.documents.map(x => x.documents)).length;
});

module.exports = {
  Test: mongoose.model('Test', Schema),
  Video: mongoose.model('Video', VideoSubSchema)
};

