const moment = require('moment');
const {put} = require('axios').default;
const swal = require('sweetalert');

// Edit test data
const form = document.getElementById('formEdit');
form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const id = document.getElementById('btnSubmitTest').value;
  const url = `/${id}`;

  const title = document.getElementById('title').value;
  const shortDescription = document.getElementById('shortDescription').value;
  const longDescription = document.getElementById('longDescription').value;
  const closingDateValue = document.getElementById('closingDate').value;
  const dates = document.getElementById('dates').value;
  const nro = document.getElementById('nro').value;
  const hours = document.getElementById('hours').value;

  const closingDate = moment(closingDateValue);

  const body = JSON.stringify({
    title,
    description: {
      short: shortDescription,
      long: longDescription
    },
    hours,
    nro,
    dates,
    closingDate
  });
  fetch(url, {
    method: 'PUT',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.text())
    .then(res => {
      res = swal({
        title: '¡Curso editado!',
        icon: 'success'
      });
      return res;
    });
});


// Delete videos
function deleteVideo(value) {
  const {id, videoId} = JSON.parse(value);
  const url = `/${id}/video/${videoId}`;
  fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.text())
    .then(res => {
      res = swal({
        title: '¡Video eliminado!',
        icon: 'success'
      });
      return res;
    }
    );
}

const deleteVideoButtonClickListener = () => {
  const deleteVideoButton = document.getElementsByClassName('deleteVideoButton');
  if (deleteVideoButton.length > 0) {
    for (let index = 0; index < deleteVideoButton.length; index++) {
      deleteVideoButton[index].addEventListener('click', () => {
        deleteVideo(deleteVideoButton[index].value);
      });
    }
  }
};
deleteVideoButtonClickListener();

const validateVideo = () => {
  const video = document.getElementById('video');
  if (video) {
    video.addEventListener('change', () => {
      if (video.files.length > 0) {
        console.log(video.files.length);
        video.required = false;
      } else if (video.files.length === 0) {
        video.required = true;
      }
    });
  }
};
validateVideo();

// Add videos
const formVideo = document.getElementById('formVideo');
formVideo.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const button = document.getElementById('btnSubmitVideo');
  const id = button.value;
  button.disabled = true;
  const url = `/${id}/videos`;
  const image = document.getElementById('image');
  const video = document.getElementById('video');
  const titleVideo = document.getElementById('titleVideo').value;
  const moduleVideo = document.getElementById('moduleVideo').value;

  if (video.files.length === 0) {
    video.required = true;
  }
  const formData = new FormData();
  formData.append('image', image.files[0]);
  formData.append('video', video.files[0]);
  formData.append('title', titleVideo);
  formData.append('module', moduleVideo);

  const videoProgressParent = document.getElementById('videoProgressParent');
  const videoProgress = document.getElementById('videoProgress');
  const videoProgressText = document.getElementById('videoProgressText');
  videoProgressParent.style.display = 'block';

  const config = {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      videoProgress.style.width = `${percentCompleted}%`;
      videoProgressText.innerHTML = `cargando ${percentCompleted}%`;
    }
  };

  put(url, formData, config)
    .then(response => {
      response = swal({
        title: '¡Curso editado!',
        icon: 'success'
      });

      return response;
    })
    .then((willReload) => {
      if (willReload) {
        location.reload();
      }
    })
    .catch(err => err);
});

// Add material
const formMaterial = document.getElementById('formMaterial');
formMaterial.addEventListener('submit', (ev) => {
  ev.preventDefault();

  const button = document.getElementById('btnSubmitMaterial');
  const id = button.value;
  button.disabled = true;
  const url = `/${id}/material`;

  const file = document.getElementById('materialFile');
  const formData = new FormData();
  formData.append('file', file.files[0]);
  fetch(url, {
    method: 'PUT',
    body: formData
  })
    .then(res => {
      res = swal({
        title: '¡Curso editado!',
        icon: 'success'
      });
      return res;
    })
    .finally(() => button.disabled = false);
});

// Add aditional material
const formAditionalMaterial = document.getElementById('formAditionalMaterial');
formAditionalMaterial.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const button = document.getElementById('btnSubmitAdditionalMaterial');
  const id = button.value;
  button.disabled = true;
  const url = `/${id}/aditional-material`;

  const file = document.getElementById('aditionalMaterialFile');
  const formData = new FormData();
  formData.append('file', file.files[0]);
  fetch(url, {
    method: 'PUT',
    body: formData
  })
    .then(res => {
      res = swal({
        title: '¡Curso editado!',
        icon: 'success'
      });
      return res;
    })
    .finally(() => button.disabled = false);
});
