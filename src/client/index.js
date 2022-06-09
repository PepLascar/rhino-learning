'use strict';

// Themes
require('bootstrap/dist/css/bootstrap.css');
require('bootstrap/dist/js/bootstrap.js');
require('font-awesome/css/font-awesome.css');
require('inspinia');
require('./app.css');

// Scripts
require('jquery');
require('bootstrap/dist/js/bootstrap.js');

const rut = require('fi-rut');

// Logo
let logo = document.getElementById('logo');
logo.src = require('./img/logo.png');

const txtRut = document.getElementById('rut');
const btnSubmit = document.getElementById('btnSubmit');
const rutError = document.getElementById('rutError');

if(txtRut){
  txtRut.addEventListener('focusout', function() {
    if (!rut.validate(this.value)) {
      this.parentElement.className += ' has-warning';
      btnSubmit.disabled = true;
      rutError.innerHTML = 'RUT incorrecto';
    } else {
      this.parentElement.className = 'form-group';
      btnSubmit.disabled = false;
      rutError.innerHTML = '';
      this.value = rut.format(this.value);
    }
  });
}

