const swal = require('sweetalert')
function deleteTest(id) {
    const url = `/${id}`
    fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response)
    .catch(err => err)
    .finally(() => {
      location.reload();
    })
  }

const deleteAction = document.getElementsByClassName('deleteAction');

if (deleteAction.length > 0){
    for (let index = 0; index < deleteAction.length; index++) {
        deleteAction[index].addEventListener('click', (ev) => {
          swal({
            title: '',
            text: '¿Está seguro/a que desea eliminar el curso?',
            icon: "warning",
            buttons: ["Cancelar", "Si, eliminar"],
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
              deleteTest(deleteAction[index].value)
              swal({
                title: "¡Curso eliminado!",
                icon: "success"
              });
            }
          });
      })
    }
}
