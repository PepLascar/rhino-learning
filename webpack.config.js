'use strict';

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
dotenv.config({silent: true});

module.exports = {
  entry: {
    index: path.join(__dirname, 'src', 'client', 'index.js'),
    testCreate: path.join(__dirname, 'src', 'client', 'test', 'create.js'),
    testEdit: path.join(__dirname, 'src', 'client', 'test', 'edit.js'),
    testDetail: path.join(__dirname, 'src', 'client', 'test', 'detail.js'),
    testDelete: path.join(__dirname, 'src', 'client', 'test', 'delete.js')
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'global.$': 'jquery',
      'root.jQuery': 'jquery'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    }),
    new BrowserSyncPlugin({
      files: ['src/client/**/*', 'src/views/**/*'],
      proxy: `http://localhost:${process.env.PORT || 3000}`,
      port: process.env.BS_PORT || 9000
    }),
    new ExtractTextPlugin('[name].css'),
    new CopyPlugin([
      { from: 'src/client/img/', to: 'img/' },
      { from: 'src/client/extra.css' }
    ],
    )
  ],
  module: {
    loaders: [
      {test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery'},
      {
        test: /\.jsx?$/, exclude: /(node_modules|bootstrap.config.js)/,
        loader: 'babel'
      },
      {test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css')},
      {
        test: /\.(ttf|eot|svg|png|jpg|woff(2)?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
          presets: ['@babel/preset-env']
        }
      },
      {
        test: /\.js$/,
        loader: 'babel',
        include: /node_modules\/hls\.js/
      }
    ]
  }
};
