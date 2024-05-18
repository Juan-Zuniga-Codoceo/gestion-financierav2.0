$(document).ready(function() {
    function obtenerDatosUsuario() {
        fetch('/usuario/perfil', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error al obtener los datos del usuario:', data.error);
                return;
            }
            mostrarDatosUsuario(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function mostrarDatosUsuario(usuario) {
        $('#usuarioInfo').html(`
            <p><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p><strong>Presupuesto:</strong> $${usuario.presupuesto.toFixed(2)}</p>
        `);

        let ingresosGastosHTML = '';
        usuario.transacciones.forEach(transaccion => {
            ingresosGastosHTML += `<p>${transaccion.tipo}: $${transaccion.monto.toFixed(2)} - ${transaccion.descripcion}</p>`;
        });
        $('#ingresosGastos').html(ingresosGastosHTML);
    }

    obtenerDatosUsuario();
});
