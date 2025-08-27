// Configuración de proveedores con días de vencimiento
const proveedoresData = {
    "ACHURAS": 7, "ALFAJORES/OTROS": 7, "BARRAZA": 28, "BODEGA LA RURAL": 30,
    "CAR. DOS SANTOS": 15, "CHAMPIÑON": 0, "GASEOSA COCA": 0, "HELADOS": 15,
    "HIELO": 20, "HUEVOS": 1, "LIMPIEZA BARBARA": 1, "LUSTROL": 30,
    "MEDIALUNAS": 28, "PAPELERIA": 28, "PASTAS": 4, "PROVOLETA": 0,
    "QUILMES": 0, "SODA/AGUA": 7, "TAMALES": 7, "TAPAS EMPANADAS": 3,
    "VARIOS": 0, "VERONICA": 4, "MAXIREST": 0, "SAN HUMBERTO": 30,
    "CARBON/LEÑA": 30, "SANDWICH": 28, "MERMELADAS": 15, "FUMIGACION": 15,
    "L. CAMPANA": 15, "PESCA": 0, "SEPTIMA VINOS": 30, "GASEOSA PIPA": 15,
    "TEC. YAROS": 7, "CAR. ACONCAGUA": 28, "DON ENRIQUE": 28, "CAMPO IMAVA": 28,
    "ALQUILER ARREGUI": 30, "ALQUILER CANTINA": 30, "TEQUEÑOS": 0,
    "MANTENIMIENTO/VARIOS": 15, "CRIOLLO": 28, "PAN MIGA/ARABE": 0,
    "FARMACIA": 0, "FERRETERIA": 0, "IMPRENTA": 0
};

// Elementos del DOM
const tablaProveedores = document.getElementById('tablaProveedores');
const proveedorInput = document.getElementById('proveedor');
const numBolInput = document.getElementById('numBol');
const formaPagoInput = document.getElementById('formaPago');
const importeInput = document.getElementById('importe');
const fechaInput = document.getElementById('fecha');
const pagadoInput = document.getElementById('pagado');
const currentIndexInput = document.getElementById('currentIndex');
const btnBorrar = document.getElementById('btnBorrar');
const aporteMontoInput = document.getElementById('aporteMonto');
const aporteProveedorInput = document.getElementById('aporteProveedor');
const searchInput = document.getElementById('searchInput');
const estadoFilter = document.getElementById('estadoFilter');
const proveedorFilter = document.getElementById('proveedorFilter');
const registrosCount = document.getElementById('registrosCount');

// Variables globales
let proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];
let proveedoresFiltrados = [];
let ordenActual = { columna: 'fecha', direccion: 'asc' };

// Configuración inicial
document.addEventListener('DOMContentLoaded', () => {
    renderizarTabla();
    limpiarFormulario();
    cargarProveedoresDropdown();
    autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
    configurarEventos();
    actualizarContadorRegistros();
});

// Configuración de eventos
function configurarEventos() {
    // Filtros
    searchInput.addEventListener('input', debounce(aplicarFiltros, 300));
    estadoFilter.addEventListener('change', aplicarFiltros);
    proveedorFilter.addEventListener('change', aplicarFiltros);
    
    // Validaciones en tiempo real
    importeInput.addEventListener('input', validarImporte);
    pagadoInput.addEventListener('input', validarPagado);
    fechaInput.addEventListener('change', validarFecha);
    
    // Enter key en formulario
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.closest('.form-container')) {
            agregarOActualizarProveedor();
        }
    });
}

function togglePagado() {
    const pagadoCheckbox = document.getElementById('pagadoCheckbox');
    const pagadoInput = document.getElementById('pagado');
    const importeInput = document.getElementById('importe');

    if (pagadoCheckbox.checked) {
        pagadoInput.value = importeInput.value;
        pagadoInput.disabled = true;
    } else {
        pagadoInput.value = '';
        pagadoInput.disabled = false;
    }
}

// Funciones de persistencia
function guardarProveedores() {
    localStorage.setItem('proveedores', JSON.stringify(proveedores));
}

// Funciones de validación
function validarImporte() {
    const valor = parseFloat(importeInput.value);
    if (valor < 0) {
        importeInput.value = 0;
        mostrarToast('El importe no puede ser negativo', 'warning');
    }
}

function validarPagado() {
    const valor = parseFloat(pagadoInput.value);
    const importe = parseFloat(importeInput.value);
    
    if (valor < 0) {
        pagadoInput.value = 0;
        mostrarToast('El monto pagado no puede ser negativo', 'warning');
    } else if (valor > importe) {
        pagadoInput.value = importe;
        mostrarToast('El monto pagado no puede exceder el importe', 'warning');
    }
}

function validarFecha() {
    const fechaSeleccionada = new Date(fechaInput.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada > hoy) {
        mostrarToast('La fecha no puede ser futura', 'warning');
        fechaInput.value = '';
    }
}

// Funciones de cálculo
function calcularEstado(fecha, dias, importe, pagado) {
    if (pagado >= importe) return 'Pagado';
    const fechaEntrada = new Date(fecha + 'T00:00:00');
    const fechaVencimiento = new Date(fechaEntrada);
    fechaVencimiento.setDate(fechaEntrada.getDate() + dias);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (hoy > fechaVencimiento) return 'Vencido';
    if (pagado > 0) return 'Pendiente';
    return 'No Vencido';
}

// Funciones de filtrado y búsqueda
function aplicarFiltros() {
    const busqueda = searchInput.value.toLowerCase();
    const estadoSeleccionado = estadoFilter.value;
    const proveedorSeleccionado = proveedorFilter.value;
    
    proveedoresFiltrados = proveedores.filter(p => {
        const cumpleBusqueda = !busqueda || 
            p.proveedor.toLowerCase().includes(busqueda) ||
            p.numBol.includes(busqueda) ||
            p.formaPago.toLowerCase().includes(busqueda);
        
        const cumpleEstado = !estadoSeleccionado || 
            calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado) === estadoSeleccionado;
        
        const cumpleProveedor = !proveedorSeleccionado || 
            p.proveedor === proveedorSeleccionado;
        
        return cumpleBusqueda && cumpleEstado && cumpleProveedor;
    });
    
    renderizarTabla();
}

function limpiarFiltros() {
    searchInput.value = '';
    estadoFilter.value = '';
    proveedorFilter.value = '';
    proveedoresFiltrados = [];
    renderizarTabla();
    mostrarToast('Filtros limpiados', 'info');
}

// Funciones de ordenamiento
function ordenarTabla(columna) {
    if (ordenActual.columna === columna) {
        ordenActual.direccion = ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    } else {
        ordenActual.columna = columna;
        ordenActual.direccion = 'asc';
    }
    
    renderizarTabla();
    actualizarIconosOrdenamiento();
}

function actualizarIconosOrdenamiento() {
    const headers = document.querySelectorAll('.sortable i');
    headers.forEach(icono => {
        icono.className = 'fas fa-sort';
    });
    
    const headerActual = document.querySelector(`th[onclick="ordenarTabla('${ordenActual.columna}')"] i`);
    if (headerActual) {
        headerActual.className = `fas fa-sort-${ordenActual.direccion === 'asc' ? 'up' : 'down'}`;
    }
}

// Función principal de renderizado
function renderizarTabla() {
    const datosAMostrar = proveedoresFiltrados.length > 0 ? proveedoresFiltrados : proveedores;
    
    // Ordenar datos
    datosAMostrar.sort((a, b) => {
        let valorA, valorB;
        
        switch (ordenActual.columna) {
            case 'proveedor':
            case 'numBol':
            case 'formaPago':
                valorA = a[ordenActual.columna].toLowerCase();
                valorB = b[ordenActual.columna].toLowerCase();
                break;
            case 'importe':
            case 'pagado':
                valorA = a[ordenActual.columna] || 0;
                valorB = b[ordenActual.columna] || 0;
                break;
            case 'fecha':
                valorA = new Date(a.fecha);
                valorB = new Date(b.fecha);
                break;
            case 'estado':
                valorA = calcularEstado(a.fecha, proveedoresData[a.proveedor], a.importe, a.pagado);
                valorB = calcularEstado(b.fecha, proveedoresData[b.proveedor], b.importe, b.pagado);
                break;
            default:
                valorA = a[ordenActual.columna];
                valorB = b[ordenActual.columna];
        }
        
        if (valorA < valorB) return ordenActual.direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenActual.direccion === 'asc' ? 1 : -1;
        return 0;
    });
    
    tablaProveedores.innerHTML = '';
    let totalVencidas = 0, totalNoVencidas = 0, totalPagado = 0, totalGeneral = 0;

    datosAMostrar.forEach((p, index) => {
        const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
        const fila = document.createElement('tr');
        fila.onclick = () => cargarProveedorEnFormulario(proveedores.indexOf(p));
        fila.innerHTML = `
            <td><i class="fas fa-truck"></i> ${p.proveedor}</td>
            <td><i class="fas fa-receipt"></i> ${p.numBol}</td>
            <td><i class="fas fa-credit-card"></i> ${p.formaPago}</td>
            <td><i class="fas fa-dollar-sign"></i> ${p.importe.toLocaleString()}</td>
            <td><i class="fas fa-calendar"></i> ${formatearFecha(p.fecha)}</td>
            <td><i class="fas fa-money-bill-wave"></i> ${p.pagado ? p.pagado.toLocaleString() : '0'}</td>
            <td><span class="estado ${estado.toLowerCase().replace(' ', '-')}">${estado}</span></td>
        `;
        tablaProveedores.appendChild(fila);

        totalGeneral += p.importe;
        if (p.pagado) totalPagado += p.pagado;
        const restante = p.importe - (p.pagado || 0);
        if (estado === 'Vencido') totalVencidas += restante;
        if (estado === 'No Vencido' || estado === 'Pendiente') totalNoVencidas += restante;
    });

    document.getElementById('totalVencidas').textContent = `$${totalVencidas.toLocaleString()}`;
    document.getElementById('totalNoVencidas').textContent = `$${totalNoVencidas.toLocaleString()}`;
    document.getElementById('totalPagado').textContent = `$${totalPagado.toLocaleString()}`;
    document.getElementById('totalGeneral').textContent = `$${totalGeneral.toLocaleString()}`;
    
    actualizarContadorRegistros();
    actualizarFiltrosProveedores();
}

function actualizarContadorRegistros() {
    const total = proveedoresFiltrados.length > 0 ? proveedoresFiltrados.length : proveedores.length;
    registrosCount.textContent = `${total} registro${total !== 1 ? 's' : ''}`;
}

function actualizarFiltrosProveedores() {
    const proveedoresUnicos = [...new Set(proveedores.map(p => p.proveedor))];
    const opcionesActuales = Array.from(proveedorFilter.options).map(opt => opt.value);
    
    proveedoresUnicos.forEach(proveedor => {
        if (!opcionesActuales.includes(proveedor)) {
            const option = document.createElement('option');
            option.value = proveedor;
            option.textContent = proveedor;
            proveedorFilter.appendChild(option);
        }
    });
}

// Funciones principales
function agregarOActualizarProveedor() {
    const proveedor = proveedorInput.value.trim().toUpperCase();
    const numBol = numBolInput.value.trim();
    const formaPago = formaPagoInput.value;
    const importe = parseFloat(importeInput.value);
    const fecha = fechaInput.value;
    const pagadoCheckbox = document.getElementById('pagadoCheckbox');
    const pagado = pagadoCheckbox.checked ? importe : (parseFloat(pagadoInput.value) || 0);
    const currentIndex = parseInt(currentIndexInput.value, 10);

    // Validaciones mejoradas
    if (!proveedoresData.hasOwnProperty(proveedor)) {
        mostrarToast('Proveedor no válido. Por favor, seleccione un proveedor de la lista.', 'error');
        return;
    }

    if (numBol.length !== 5) {
        mostrarToast('El número de boleta debe tener exactamente 5 dígitos.', 'error');
        return;
    }

    if (importe <= 0) {
        mostrarToast('El importe debe ser mayor a 0.', 'error');
        return;
    }

    if (pagado > importe) {
        mostrarToast('El monto pagado no puede exceder el importe.', 'error');
        return;
    }

    const isDuplicate = proveedores.some((p, index) => 
        p.proveedor === proveedor && p.numBol === numBol && index !== currentIndex
    );

    if (isDuplicate) {
        mostrarToast('Ya existe una boleta con ese número para este proveedor.', 'error');
        return;
    }

    if (proveedor && numBol && formaPago && !isNaN(importe) && fecha) {
        const data = { proveedor, numBol, formaPago, importe, fecha, pagado };
        if (!isNaN(currentIndex)) {
            proveedores[currentIndex] = data;
            mostrarToast('Proveedor actualizado exitosamente', 'success');
        } else {
            proveedores.push(data);
            mostrarToast('Proveedor agregado exitosamente', 'success');
        }
        guardarProveedores();
        renderizarTabla();
        limpiarFormulario();
    } else {
        mostrarToast('Por favor, complete todos los campos obligatorios.', 'error');
    }
}

function cargarProveedorEnFormulario(index) {
    const p = proveedores[index];
    proveedorInput.value = p.proveedor;
    numBolInput.value = p.numBol;
    formaPagoInput.value = p.formaPago;
    importeInput.value = p.importe;
    fechaInput.value = p.fecha;
    pagadoInput.value = p.pagado || '';
    currentIndexInput.value = index;
    btnBorrar.style.display = 'block';
    
    // Scroll suave al formulario
    document.querySelector('.form-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

function borrarProveedor() {
    const currentIndex = parseInt(currentIndexInput.value, 10);
    if (!isNaN(currentIndex)) {
        if (confirm('¿Está seguro de que desea eliminar este proveedor?')) {
            proveedores.splice(currentIndex, 1);
            guardarProveedores();
            renderizarTabla();
            limpiarFormulario();
            mostrarToast('Proveedor eliminado exitosamente', 'success');
        }
    }
}

function limpiarFormulario() {
    proveedorInput.value = '';
    numBolInput.value = '';
    formaPagoInput.value = '';
    importeInput.value = '';
    fechaInput.value = '';
    pagadoInput.value = '';
    currentIndexInput.value = '';
    btnBorrar.style.display = 'none';
    document.getElementById('pagadoCheckbox').checked = false;
    pagadoInput.disabled = false;
    
    // Limpiar validaciones visuales
    document.querySelectorAll('.form-container input, .form-container select').forEach(input => {
        input.classList.remove('error');
    });
}

function cargarProveedoresDropdown() {
    const proveedoresUnicos = [...new Set(proveedores.map(p => p.proveedor))];
    aporteProveedorInput.innerHTML = '<option value="">Seleccione un proveedor</option>';
    proveedoresUnicos.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        aporteProveedorInput.appendChild(option);
    });
}

function aportarDinero() {
    let montoAporte = parseFloat(aporteMontoInput.value);
    const selectedProvider = aporteProveedorInput.value;

    if (!selectedProvider) {
        mostrarToast('Por favor, seleccione un proveedor.', 'error');
        return;
    }

    if (isNaN(montoAporte) || montoAporte <= 0) {
        mostrarToast('Por favor, ingrese un monto de aporte válido.', 'error');
        return;
    }

    const facturasPendientes = proveedores
        .map((p, index) => ({...p, originalIndex: index}))
        .filter(p => p.proveedor === selectedProvider && (p.pagado || 0) < p.importe)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (facturasPendientes.length === 0) {
        mostrarToast(`No hay facturas pendientes para pagar para ${selectedProvider}.`, 'warning');
        return;
    }

    let totalPagadoEnAporte = 0;
    let resumenPagos = `Resumen de pagos para ${selectedProvider}:\n`;

    for (const factura of facturasPendientes) {
        if (montoAporte <= 0) break;

        const deuda = factura.importe - (factura.pagado || 0);
        const montoAPagar = Math.min(montoAporte, deuda);

        const pOriginal = proveedores[factura.originalIndex];
        pOriginal.pagado = (pOriginal.pagado || 0) + montoAPagar;
        
        montoAporte -= montoAPagar;
        totalPagadoEnAporte += montoAPagar;

        resumenPagos += `- Boleta N°${factura.numBol}: $${montoAPagar.toLocaleString()} pagados.\n`;
    }

    if (totalPagadoEnAporte > 0) {
        guardarProveedores();
        renderizarTabla();
        mostrarToast(`${resumenPagos}\nTotal pagado: $${totalPagadoEnAporte.toLocaleString()}`, 'success');
    }

    aporteMontoInput.value = '';
    aporteProveedorInput.value = '';
}

function borrarTodo() {
    if (confirm('¿Está seguro de que desea borrar toda la información guardada? Esta acción no se puede deshacer.')) {
        proveedores = [];
        guardarProveedores();
        renderizarTabla();
        cargarProveedoresDropdown();
        limpiarFiltros();
        mostrarToast('Toda la información ha sido borrada.', 'success');
    }
}

// Funciones de exportación
function guardarTxt() {
    let contenido = "PROVEEDOR\tN° BOLETA\tFORMA PAGO\tIMPORTE\tFECHA\tPAGADO\tESTADO\n";
    proveedores.forEach(p => {
        const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
        contenido += `${p.proveedor}\t${p.numBol}\t${p.formaPago}\t${p.importe}\t${p.fecha}\t${p.pagado || 0}\t${estado}\n`;
    });

    const hoy = new Date();
    const fechaFormato = `${hoy.getDate()}-${hoy.getMonth() + 1}-${hoy.getFullYear()}`;
    const nombreArchivo = `control-proveedores-${fechaFormato}.txt`;

    descargarArchivo(contenido, nombreArchivo, 'text/plain');
    mostrarToast('Archivo TXT descargado exitosamente', 'success');
}

function guardarExcel() {
    // Crear contenido CSV (compatible con Excel)
    let contenido = "Proveedor,N° Boleta,Forma de Pago,Importe,Fecha,Pagado,Estado\n";
    proveedores.forEach(p => {
        const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
        contenido += `"${p.proveedor}","${p.numBol}","${p.formaPago}",${p.importe},"${p.fecha}",${p.pagado || 0},"${estado}"\n`;
    });

    const hoy = new Date();
    const fechaFormato = `${hoy.getDate()}-${hoy.getMonth() + 1}-${hoy.getFullYear()}`;
    const nombreArchivo = `control-proveedores-${fechaFormato}.csv`;

    descargarArchivo(contenido, nombreArchivo, 'text/csv');
    mostrarToast('Archivo Excel (CSV) descargado exitosamente', 'success');
}

function descargarArchivo(contenido, nombreArchivo, tipo) {
    const blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function cargarTxt(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lineas = content.split('\n').filter(linea => linea.trim() !== '');
        if (lineas.length > 1) {
            const nuevosProveedores = [];
            for (let i = 1; i < lineas.length; i++) {
                const columnas = lineas[i].split('\t');
                if (columnas.length >= 6) {
                    const proveedor = columnas[0];
                    const numBol = columnas[1];
                    const formaPago = columnas[2];
                    const importe = parseFloat(columnas[3]);
                    const fecha = columnas[4];
                    const pagado = parseFloat(columnas[5]);
                    
                    if (proveedoresData.hasOwnProperty(proveedor)) {
                        nuevosProveedores.push({ proveedor, numBol, formaPago, importe, fecha, pagado });
                    }
                }
            }
            proveedores = nuevosProveedores;
            guardarProveedores();
            renderizarTabla();
            mostrarToast('Respaldo cargado exitosamente.', 'success');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpiar input
}

// Funciones de utilidad
function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sistema de notificaciones Toast
function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = `toast ${tipo} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Autocomplete mejorado
function autocomplete(inp, arr) {
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // down
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // up
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // enter
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}