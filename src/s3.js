const aws = require('aws-sdk');
const config = require('./config');
const fs = require('fs');

const s3 = new aws.S3({
  endpoint: config.aws.endpoint,
  credentials: new aws.Credentials({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.secret
  })
});

const retrieve = (key) => {
  const file = s3
    .getObject({Bucket: process.env.AWS_BUCKET, Key: key})
    .createReadStream();
  return file;
};

const deleteElements = async (keys) => {
  const bucket = config.aws.bucket;

  if (keys.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: {Objects: []}
  };

  keys.forEach(key => {
    deleteParams.Delete.Objects.push({Key: key});
  });
  await s3.deleteObjects(deleteParams).promise();
};

const emptyDirectoryInBucket = async (directory) => {
  if (!directory || directory === '' || directory.length === 0) return;
  const bucket = config.aws.bucket;
  const listParams = {
    Bucket: bucket,
    Prefix: directory
  };
  const listedObjects = await s3.listObjectsV2(listParams).promise();
  if (listedObjects.Contents.length === 0) return;
  const deleteParams = {
    Bucket: bucket,
    Delete: {Objects: []}
  };
  listedObjects.Contents.forEach(({Key}) => {
    deleteParams.Delete.Objects.push({Key});
  });
  await s3.deleteObjects(deleteParams).promise();
};

const getTemporalURL = async (key) => {
  const fileUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: config.aws.bucket,
    Key: key,
    Expires: 60 * 300 //En segundos
  });
  return fileUrl;
};

function uploadFromPath(path, key) {
  const stream = fs.createReadStream(path);

  return s3.putObject({
    Bucket: config.aws.bucket,
    Key: key,
    Body: stream
  }).promise();
}

module.exports = {
  s3,
  emptyDirectoryInBucket,
  deleteElements,
  getTemporalURL,
  retrieve,
  uploadFromPath
};
