'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Setting = Schema({
  client: { type: String, required: true },
  name: String,
  value: String
});

//Obtener config
Setting.statics.getSetting = function() {
  return this.find().exec();
};

module.exports = mongoose.model('Setting', Setting);
