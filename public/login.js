$(document).ready(function() {
    $('#loginForm').submit(function(event) {
        event.preventDefault();

        const nombre = $('#nombreUsuario').val();
        const password = $('#passwordUsuario').val();

        fetch('/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error al iniciar sesión:', data.error);
                return;
            }
            localStorage.setItem('token', data.token);
            window.location.href = 'perfil.html';
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
