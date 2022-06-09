'use strict';

const mongoose = require('mongoose');
const { Test } = require('../src/api/test/model');

const load = () => {
  const conn = mongoose.createConnection('mongodb://localhost/elearning-test'); // eslint-disable-line
  const tests = [
    new Test({
      title: 'Title 1',
      description: {short: 'Short Description 1', long: 'Long Description 1'},
      code: '1',
      client: '1'
    }),
    new Test({
      title: 'Title 2',
      description: {short: 'Short Description 2', long: 'Long Description 2'},
      code: '2',
      client: '1'
    }),
    new Test({
      title: 'Title 3',
      description: {short: 'Short Description 3', long: 'Long Description 3'},
      code: '3',
      client: '1'
    })
  ];
  const promises = tests.map(x => x.save());
  return Promise.all(promises);
};

const clear = () => {
  return Test.remove({}).then(() => {
    mongoose.disconnect();
  });
};

module.exports = {
  load: load,
  clear: clear
};
