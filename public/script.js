$(document).ready(function() {
    let presupuestoInicial = 0;
    let gastos = [];

    function mostrarPresupuestoInicial() {
        $('#presupuestoInicial').text(`$${presupuestoInicial}`);
    }

    function mostrarPresupuestoFinal() {
        const totalGastos = calcularTotalGastos();
        const ingresoExtra = parseFloat($('#ingresoExtra').val()) || 0;
        const presupuestoFinal = presupuestoInicial + ingresoExtra - totalGastos;
        $('#presupuestoFinal').text(`$${presupuestoFinal.toFixed(2)}`);
    }

    function calcularTotalGastos() {
        return gastos.reduce((total, gasto) => total + gasto.costo, 0);
    }

    function mostrarGastos() {
        const listaGastos = $('#listaGastos');
        listaGastos.empty();

        gastos.forEach((gasto, index) => {
            const fechaTexto = gasto.fecha ? ` (${gasto.fecha})` : '';
            const listItem = $('<li>').addClass('list-group-item').text(`${gasto.nombre} - $${gasto.costo.toFixed(2)} (${gasto.categoria})${fechaTexto}`);

            const modificarBtn = $('<button>').addClass('btn btn-warning btn-sm ml-2').text('Modificar');
            const eliminarBtn = $('<button>').addClass('btn btn-danger btn-sm ml-2').text('Eliminar');

            modificarBtn.click(() => modificarGasto(index));
            eliminarBtn.click(() => eliminarGasto(index));

            listItem.append(modificarBtn).append(eliminarBtn);
            listaGastos.append(listItem);
        });

        const totalGastos = calcularTotalGastos();
        $('#totalGastos').text(`Total: $${totalGastos.toFixed(2)}`);

        mostrarPresupuestoFinal();
        mostrarGastosClasificados();
    }

    function mostrarGastosClasificados() {
        const clasificados = gastos.reduce((acc, gasto) => {
            if (!acc[gasto.categoria]) {
                acc[gasto.categoria] = 0;
            }
            acc[gasto.categoria] += gasto.costo;
            return acc;
        }, {});

        const listaGastosClasificados = $('#listaGastosClasificados');
        listaGastosClasificados.empty();

        for (const categoria in clasificados) {
            const listItem = $('<li>').addClass('list-group-item').text(`${categoria}: $${clasificados[categoria].toFixed(2)}`);
            listaGastosClasificados.append(listItem);
        }

        $('#totalGastosClasificados').text(`Total Clasificados: $${calcularTotalGastos().toFixed(2)}`);
    }

    function modificarGasto(index) {
        const gastoActual = gastos[index];
        const nuevoNombre = prompt('Ingrese el nuevo nombre del gasto:', gastoActual.nombre);
        const nuevoCosto = parseFloat(prompt('Ingrese el nuevo costo del gasto:', gastoActual.costo));
        const nuevaFecha = prompt('Ingrese la nueva fecha del gasto (YYYY-MM-DD):', gastoActual.fecha);

        if (isNaN(nuevoCosto) || nuevoCosto <= 0) {
            alert('Por favor, ingrese un costo válido.');
            return;
        }

        gastos[index] = { ...gastoActual, nombre: nuevoNombre, costo: nuevoCosto, fecha: nuevaFecha };

        mostrarGastos();
    }

    function eliminarGasto(index) {
        gastos.splice(index, 1);
        mostrarGastos();
    }

    $('#ingresarGastoForm').submit(function(event) {
        event.preventDefault();

        const nombre = $('#nombreGasto').val();
        const costo = parseFloat($('#costoGasto').val());
        const categoria = $('#categoriaGasto').val();
        const fecha = $('#fechaGasto').val();

        if (isNaN(costo) || costo <= 0) {
            alert('Por favor, ingrese un costo válido.');
            return;
        }

        const nuevoGasto = { nombre, costo, categoria, fecha };
        gastos.push(nuevoGasto);

        mostrarGastos();
        this.reset();
    });

    $('#ingresarIngresoExtraForm').submit(function(event) {
        event.preventDefault();
        mostrarPresupuestoFinal();
    });

    $('#registroUsuarioForm').on('submit', function(e) {
        e.preventDefault();

        const nombre = $('#nombreUsuario').val();
        const password = $('#passwordUsuario').val();
        const presupuesto = parseFloat($('#presupuestoUsuario').val());

        const usuario = { nombre, password, presupuesto };

        fetch('/usuarios/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuario),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Usuario registrado correctamente:', data);
            presupuestoInicial = data.presupuesto;
            mostrarPresupuestoInicial();
            mostrarPresupuestoFinal();
            $('#registroModal').modal('hide');
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    $('#loginUsuarioForm').on('submit', function(e) {
        e.preventDefault();

        const nombre = $('#loginNombreUsuario').val();
        const password = $('#loginPasswordUsuario').val();

        fetch('/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, password }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Usuario inició sesión correctamente:', data);
            localStorage.setItem('token', data.token);
            presupuestoInicial = data.presupuesto; // Actualiza el presupuesto inicial con el valor recibido
            mostrarPresupuestoInicial();
            mostrarPresupuestoFinal();
            $('#loginModal').modal('hide');
            obtenerPerfil();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    function obtenerPerfil() {
        const token = localStorage.getItem('token');

        fetch('/usuario/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Perfil del usuario:', data);
            presupuestoInicial = data.presupuesto;
            mostrarPresupuestoInicial();
            mostrarPresupuestoFinal();
            gastos = data.gastos;
            mostrarGastos();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    $('#btnRegistro').on('click', function() {
        $('#registroModal').modal('show');
    });

    $('#btnLogin').on('click', function() {
        $('#loginModal').modal('show');
    });

    $('#btnPerfil').on('click', function() {
        obtenerPerfil();
    });

    $('#registroModal').modal('show');
});
