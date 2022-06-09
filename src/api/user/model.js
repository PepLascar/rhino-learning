'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const timestamps = require('mongoose-timestamp');

const Schema = new mongoose.Schema({
  client: {type: String, required: true},
  title: {type: String, required: true},
  description: {
    short: {type: String, required: true},
    long: String,
  },
  code: String
});

Schema.plugin(mongoosePaginate);
Schema.plugin(timestamps);

// Metodo para obtener los valores almacenados
Schema.statics.list = function(params) {
  const query = {client: params.client};
  const options = {
    page: params.page || 1,
    limit: params.paginate || 10,
    sort: {title: 1}
  };
  return this.paginate(query, options);
};

// Metodo para obtener un valor por id
Schema.statics.get = function(params) {
  const query = {client: params.client, _id: params.id};
  return this.findOne(query).exec();
};

module.exports = mongoose.model('User', Schema);
