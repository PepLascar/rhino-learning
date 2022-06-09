'use strict';

const rp = require('request-promise');
const config = require('./config');

const signin = data => {
  const client = config.client
  const options = {
    uri: `${config.amulenCoreUrl}/api/signin`,
    json: true,
    form: {...data, client},
    method: 'POST',
    simple: false
  };
  return rp(options);
};

const updateToken = data => {
  const options = {
    url: `${config.amulenCoreUrl}/api/token`,
    json: true,
    form: {email: data.email},
    headers: {
      'Authorization': `Bearer ${data.token}`
    },
    method: 'post'
  };
  return rp(options).then(body => body.token);
};

const addPermission = (userSession, courseId) => {
  const permissions = {
    elearning: [
      courseId
    ]
  }
  const options = {
    url: `${config.amulenCoreUrl}/api/user/permissions`,
    json: true,
    form: { id: userSession.id, permissions },
    headers: {
      Authorization: `Bearer ${userSession.token}`
    },
    method: 'post'
  }

  return rp(options)
}

const addCourseInElearningBackend = (userSession, course) => {
  const options = {
    url: `${config.elearningBackend}/api/course`,
    json: true,
    body: course,
    headers: {
      Authorization: `Bearer ${userSession.token}`
    },
    method: 'post'
  }
  return rp(options)
}

const updateCourseInElearningBackend = (userSession, id, course) => {
  const options = {
    url: `${config.elearningBackend}/api/course/${id}`,
    json: true,
    body: course,
    headers: {
      Authorization: `Bearer ${userSession.token}`
    },
    method: 'put'
  }
  return rp(options)
}

const getCourseInElearningBackendByCourseId = (userSession, courseId) => {
  const options = {
    url: `${config.elearningBackend}/api/course/${courseId}/byCourseId`,
    json: true,
    headers: {
      Authorization: `Bearer ${userSession.token}`
    },
    method: 'get'
  }
  return rp(options)
}

module.exports = {
  signin,
  updateToken,
  addPermission,
  addCourseInElearningBackend,
  updateCourseInElearningBackend,
  getCourseInElearningBackendByCourseId
};
