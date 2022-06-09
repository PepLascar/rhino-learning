'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const app = require('../src');
const helper = require('./helper');

describe('Test', () => {
  let test = null;
  before(done => {
    helper.load()
      .then(tests => {
        test = tests[0];
        done();
      })
      .catch(err => done(err));
  });

  describe('Test', () => {
    it('should get all test', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(3);
          expect(res.body[0]._id.toString()).to.eql(test._id.toString());
          expect(res.body[0].title).to.eql(test.title);
          expect(res.body[0].description.short).to.eql(test.description.short);
          expect(res.body[0].description.long).to.eql(test.description.long);
          expect(res.body[0].code).to.eql(test.code);
          expect(res.body[0].client).to.eql(test.client);
          done();
        }).catch(err => done(err));
    });

    it('should get one test', (done) => {
      request(app)
        .get(`/${test._id.toString()}`)
        .expect(200)
        .then((res) => {
          expect(res.body._id.toString()).to.eql(test._id.toString());
          expect(res.body.title).to.eql(test.title);
          expect(res.body.description.short).to.eql(test.description.short);
          expect(res.body.description.long).to.eql(test.description.long);
          expect(res.body.code).to.eql(test.code);
          expect(res.body.client).to.eql(test.client);
          done();
        }).catch(err => done(err));
    });
  });

  after(done => {
    helper.clear()
      .then(() => done())
      .catch(err => done(err));
  });
});
