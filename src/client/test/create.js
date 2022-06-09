const moment = require('moment');
const swal = require('sweetalert');

// Create test
const form = document.getElementById('formCreate');
form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const title = document.getElementById('title').value;
  const shortDescription = document.getElementById('shortDescription').value;
  const longDescription = document.getElementById('longDescription').value;
  const closingDateValue = document.getElementById('closingDate').value;
  const price = document.getElementById('price').value;
  const dates = document.getElementById('dates').value;
  const nro =  document.getElementById('nro').value;
  const hours = document.getElementById('hours').value;

  const closingDate = moment(closingDateValue);

  const body = JSON.stringify({
    title,
    price,
    dates,
    nro,
    hours,
    description : {
      short : shortDescription,
      long : longDescription
    },
    closingDate
  });
  fetch('/', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    return res.json();
  })
  .then(res => {
    swal({
      title: '¡Curso creado!',
      icon: 'success'
    })
    .then((willRedirect) => {
      if (willRedirect) {
        window.location.href = `/to-edit/${res._id}`;
      }
    });
  })
  .catch(err => {
    return alert(err);
  });
});
