// Configuración de proveedores con días de vencimiento
const proveedoresData = {
    "ACHURAS": 7, "ALFAJORES/OTROS": 7, "BARRAZA": 28, "BODEGA LA RURAL": 30,
    "CAR. DOS SANTOS": 15, "CHAMPIÑON": 0, "GASEOSA COCA": 0, "HELADOS": 15,
    "HIELO": 20, "HUEVOS": 1, "LIMPIEZA": 1, "LUSTROL": 30,
    "MEDIALUNAS": 28, "PAPELERIA": 28, "PASTAS": 4, "PROVOLETA": 0,
    "QUILMES": 0, "SODA/AGUA": 7, "TAMALES": 7, "TAPAS EMPANADAS": 3,
    "VARIOS": 0, "VERONICA": 4, "MAXIREST": 0, "SAN HUBERTO": 30,
    "CARBON/LEÑA": 30, "SANDWICH": 28, "MERMELADAS": 15, "FUMIGACION": 15,
    "L. CAMPANA": 15, "PESCA": 0, "SEPTIMA VINOS": 30, "GASEOSA PIPA": 15,
    "TEC. YAROS": 7, "CAR. ACONCAGUA": 28, "DON ENRIQUE": 28, "CAMPO IMAVA": 28,
    "ALQUILER ARREGUI": 30, "ALQUILER CANTINA": 30, "ALQUILER ALLBOYS": 30, "TEQUEÑOS": 0,
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

// Elementos del DOM adicionales
const btnTogglePanel = document.getElementById('btnTogglePanel');
const sidePanel = document.getElementById('sidePanel');
const btnClosePanel = document.getElementById('btnClosePanel');
const btnVerProveedores = document.getElementById('btnVerProveedores');

// IndexedDB
const DB_NAME = 'proveedoresDB';
const STORE_NAME = 'proveedores';
let db;

function initDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => {
            reject('Error al abrir la base de datos', event.target.error);
        };
    });
}

function getProveedores() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject('Error al obtener los proveedores', event.target.error);
        };
    });
}

function saveProveedores() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            let count = 0;
            if (proveedores.length === 0) {
                resolve();
                return;
            }
            proveedores.forEach(proveedor => {
                const addRequest = store.add(proveedor);
                addRequest.onsuccess = () => {
                    count++;
                    if (count === proveedores.length) {
                        resolve();
                    }
                };
                addRequest.onerror = (event) => {
                    reject('Error al guardar el proveedor', event.target.error);
                };
            });
        };
        clearRequest.onerror = (event) => {
            reject('Error al limpiar la base de datos', event.target.error);
        };
    });
}

// Variables globales
let proveedores = [];
let proveedoresFiltrados = [];
let ordenActual = { columna: 'fecha', direccion: 'asc' };

// Configuración inicial
document.addEventListener('DOMContentLoaded', async () => {
    await initDb();
    proveedores = await getProveedores();
    renderizarTabla();
    limpiarFormulario();
    cargarProveedoresDropdown();
    autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
    configurarEventos();
    actualizarContadorRegistros();
});

// Configuración de eventos
function configurarEventos() {
    searchInput.addEventListener('input', debounce(aplicarFiltros, 300));
    estadoFilter.addEventListener('change', aplicarFiltros);
    proveedorFilter.addEventListener('change', aplicarFiltros);
    importeInput.addEventListener('input', validarImporte);
    pagadoInput.addEventListener('input', validarPagado);
    fechaInput.addEventListener('change', validarFecha);
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.closest('.form-container')) {
            agregarOActualizarProveedor();
        }
    });
    if (btnTogglePanel) {
        btnTogglePanel.addEventListener('click', togglePanel);
    }
    if (btnClosePanel) {
        btnClosePanel.addEventListener('click', togglePanel);
    }
    if (btnVerProveedores) {
        btnVerProveedores.addEventListener('click', mostrarTodosLosProveedores);
    }
    document.addEventListener('click', (e) => {
        if (sidePanel && sidePanel.classList.contains('active') && 
            !sidePanel.contains(e.target) && 
            btnTogglePanel && !btnTogglePanel.contains(e.target)) {
            togglePanel();
        }
    });
}

function togglePagado() {
    const pagadoCheckbox = document.getElementById('pagadoCheckbox');
    const pagadoInput = document.getElementById('pagado');
    const importeInput = document.getElementById('importe');
    if (pagadoCheckbox && pagadoInput && importeInput) {
        if (pagadoCheckbox.checked) {
            pagadoInput.value = importeInput.value;
            pagadoInput.disabled = true;
        } else {
            pagadoInput.value = '';
            pagadoInput.disabled = false;
        }
    }
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
    // Fix for date timezone issue - parse the date string manually to avoid timezone conversion
    const dateParts = fechaInput.value.split('-');
    let fechaSeleccionada;
    if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed in JavaScript
        const day = parseInt(dateParts[2]);
        fechaSeleccionada = new Date(year, month, day);
    } else {
        // Fallback to original method if date format is unexpected
        fechaSeleccionada = new Date(fechaInput.value);
    }
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
    // Fix for date timezone issue - parse the date string manually to avoid timezone conversion
    const dateParts = fecha.split('-');
    if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed in JavaScript
        const day = parseInt(dateParts[2]);
        const fechaEntrada = new Date(year, month, day);
        const fechaVencimiento = new Date(fechaEntrada);
        fechaVencimiento.setDate(fechaEntrada.getDate() + dias);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (hoy > fechaVencimiento) return 'Vencido';
        if (pagado > 0) return 'Pendiente';
        return 'No Vencido';
    }
    // Fallback to original method if date format is unexpected
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
                // Fix for date timezone issue - parse the date string manually to avoid timezone conversion
                const datePartsA = a.fecha.split('-');
                const datePartsB = b.fecha.split('-');
                if (datePartsA.length === 3 && datePartsB.length === 3) {
                    const yearA = parseInt(datePartsA[0]);
                    const monthA = parseInt(datePartsA[1]) - 1;
                    const dayA = parseInt(datePartsA[2]);
                    const yearB = parseInt(datePartsB[0]);
                    const monthB = parseInt(datePartsB[1]) - 1;
                    const dayB = parseInt(datePartsB[2]);
                    valorA = new Date(yearA, monthA, dayA);
                    valorB = new Date(yearB, monthB, dayB);
                } else {
                    // Fallback to original method if date format is unexpected
                    valorA = new Date(a.fecha);
                    valorB = new Date(b.fecha);
                }
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
    if (tablaProveedores) {
        tablaProveedores.innerHTML = '';
    }
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
        if (tablaProveedores) {
            tablaProveedores.appendChild(fila);
        }
        totalGeneral += p.importe;
        if (p.pagado) totalPagado += p.pagado;
        const restante = p.importe - (p.pagado || 0);
        if (estado === 'Vencido') totalVencidas += restante;
        if (estado === 'No Vencido' || estado === 'Pendiente') totalNoVencidas += restante;
    });
    if (document.getElementById('totalVencidas')) {
        document.getElementById('totalVencidas').textContent = `$${totalVencidas.toLocaleString()}`;
    }
    if (document.getElementById('totalNoVencidas')) {
        document.getElementById('totalNoVencidas').textContent = `$${totalNoVencidas.toLocaleString()}`;
    }
    if (document.getElementById('totalPagado')) {
        document.getElementById('totalPagado').textContent = `$${totalPagado.toLocaleString()}`;
    }
    if (document.getElementById('totalGeneral')) {
        document.getElementById('totalGeneral').textContent = `$${totalGeneral.toLocaleString()}`;
    }
    actualizarContadorRegistros();
    actualizarFiltrosProveedores();
}

function actualizarContadorRegistros() {
    const total = proveedoresFiltrados.length > 0 ? proveedoresFiltrados.length : proveedores.length;
    if (registrosCount) {
        registrosCount.textContent = `${total} registro${total !== 1 ? 's' : ''}`;
    }
}

function actualizarFiltrosProveedores() {
    const proveedoresUnicos = [...new Set(proveedores.map(p => p.proveedor))];
    const opcionesActuales = Array.from(proveedorFilter.options).map(opt => opt.value);
    proveedoresUnicos.forEach(proveedor => {
        if (!opcionesActuales.includes(proveedor)) {
            const option = document.createElement('option');
            option.value = proveedor;
            option.textContent = proveedor;
            if (proveedorFilter) {
                proveedorFilter.appendChild(option);
            }
        }
    });
}

// Funciones principales
async function agregarOActualizarProveedor() {
    const proveedor = proveedorInput.value.trim().toUpperCase();
    const numBol = numBolInput.value.trim();
    const formaPago = formaPagoInput.value;
    const importe = parseFloat(importeInput.value);
    const fecha = fechaInput.value;
    const pagadoCheckbox = document.getElementById('pagadoCheckbox');
    const pagado = pagadoCheckbox && pagadoCheckbox.checked ? importe : (parseFloat(pagadoInput.value) || 0);
    const currentIndex = parseInt(currentIndexInput.value, 10);
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
        await saveProveedores();
        renderizarTabla();
        limpiarFormulario();
    } else {
        mostrarToast('Por favor, complete todos los campos obligatorios.', 'error');
    }
}

function cargarProveedorEnFormulario(index) {
    const p = proveedores[index];
    if (proveedorInput) proveedorInput.value = p.proveedor;
    if (numBolInput) numBolInput.value = p.numBol;
    if (formaPagoInput) formaPagoInput.value = p.formaPago;
    if (importeInput) importeInput.value = p.importe;
    if (fechaInput) fechaInput.value = p.fecha;
    if (pagadoInput) pagadoInput.value = p.pagado || '';
    if (currentIndexInput) currentIndexInput.value = index;
    if (btnBorrar) btnBorrar.style.display = 'block';
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

async function borrarProveedor() {
    const currentIndex = parseInt(currentIndexInput.value, 10);
    if (!isNaN(currentIndex)) {
        if (confirm('¿Está seguro de que desea eliminar este proveedor?')) {
            proveedores.splice(currentIndex, 1);
            await saveProveedores();
            renderizarTabla();
            limpiarFormulario();
            mostrarToast('Proveedor eliminado exitosamente', 'success');
        }
    }
}

function limpiarFormulario() {
    if (proveedorInput) proveedorInput.value = '';
    if (numBolInput) numBolInput.value = '';
    if (formaPagoInput) formaPagoInput.value = '';
    if (importeInput) importeInput.value = '';
    if (fechaInput) fechaInput.value = '';
    if (pagadoInput) pagadoInput.value = '';
    if (currentIndexInput) currentIndexInput.value = '';
    if (btnBorrar) btnBorrar.style.display = 'none';
    const pagadoCheckbox = document.getElementById('pagadoCheckbox');
    if (pagadoCheckbox) pagadoCheckbox.checked = false;
    if (pagadoInput) pagadoInput.disabled = false;
    const formInputs = document.querySelectorAll('.form-container input, .form-container select');
    formInputs.forEach(input => {
        input.classList.remove('error');
    });
}

function cargarProveedoresDropdown() {
    const proveedoresUnicos = [...new Set(proveedores.map(p => p.proveedor))];
    if (aporteProveedorInput) {
        aporteProveedorInput.innerHTML = '<option value="">Seleccione un proveedor</option>';
    }
    proveedoresUnicos.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        if (aporteProveedorInput) {
            aporteProveedorInput.appendChild(option);
        }
    });
}

async function aportarDinero() {
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
        .sort((a, b) => {
            // Fix for date timezone issue - parse the date string manually to avoid timezone conversion
            const datePartsA = a.fecha.split('-');
            const datePartsB = b.fecha.split('-');
            if (datePartsA.length === 3 && datePartsB.length === 3) {
                const yearA = parseInt(datePartsA[0]);
                const monthA = parseInt(datePartsA[1]) - 1;
                const dayA = parseInt(datePartsA[2]);
                const yearB = parseInt(datePartsB[0]);
                const monthB = parseInt(datePartsB[1]) - 1;
                const dayB = parseInt(datePartsB[2]);
                return new Date(yearA, monthA, dayA) - new Date(yearB, monthB, dayB);
            }
            // Fallback to original method if date format is unexpected
            return new Date(a.fecha) - new Date(b.fecha);
        });
    if (facturasPendientes.length === 0) {
        mostrarToast(`No hay facturas pendientes para pagar para ${selectedProvider}.`, 'warning');
        return;
    }
    let totalPagadoEnAporte = 0;
    let resumenPagos = `Resumen de pagos para ${selectedProvider}:\\n`;
    for (const factura of facturasPendientes) {
        if (montoAporte <= 0) break;
        const deuda = factura.importe - (factura.pagado || 0);
        const montoAPagar = Math.min(montoAporte, deuda);
        const pOriginal = proveedores[factura.originalIndex];
        pOriginal.pagado = (pOriginal.pagado || 0) + montoAPagar;
        montoAporte -= montoAPagar;
        totalPagadoEnAporte += montoAPagar;
        resumenPagos += `- Boleta N°${factura.numBol}: $${montoAPagar.toLocaleString()} pagados.\\n`;
    }
    if (totalPagadoEnAporte > 0) {
        await saveProveedores();
        renderizarTabla();
        mostrarToast(`${resumenPagos}\\nTotal pagado: $${totalPagadoEnAporte.toLocaleString()}`, 'success');
    }
    if (aporteMontoInput) aporteMontoInput.value = '';
    if (aporteProveedorInput) aporteProveedorInput.value = '';
}

async function borrarTodo() {
    if (confirm('¿Está seguro de que desea borrar toda la información guardada? Esta acción no se puede deshacer.')) {
        proveedores = [];
        await saveProveedores();
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
    let contenido = "Proveedor,N\u00b0 Boleta,Forma de Pago,Importe,Fecha,Pagado,Estado\n";
    // Function to properly escape CSV values
    const escapeCSV = (value) => {
        if (typeof value === 'string') {
            // If value contains comma, newline or quote, wrap in quotes and escape quotes
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }
        return value;
    };
    proveedores.forEach(p => {
        const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
        contenido += `${escapeCSV(p.proveedor)},${escapeCSV(p.numBol)},${escapeCSV(p.formaPago)},${p.importe},"${p.fecha}",${p.pagado || 0},${escapeCSV(estado)}\n`;
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

async function cargarTxt(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result;
        const lineas = content.split('\n').filter(linea => linea.trim() !== '');
        if (lineas.length > 1) {
            const nuevosProveedores = [];
            // Check if it's a CSV file (Excel export) or TXT file
            const isCSV = lineas[0].includes(',');
            
            for (let i = 1; i < lineas.length; i++) {
                let columnas;
                if (isCSV) {
                    // Parse CSV line (handle quoted fields)
                    columnas = parseCSVLine(lineas[i]);
                } else {
                    // Split by actual tab characters for TXT files
                    columnas = lineas[i].split('\t');
                }
                
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
            await saveProveedores();
            renderizarTabla();
            mostrarToast('Respaldo cargado exitosamente.', 'success');
        }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
}

// Helper function to parse CSV lines properly
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Double quotes inside quoted field -> treat as single quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Comma outside quotes -> end of field
            result.push(current);
            current = '';
        } else {
            // Regular character
            current += char;
        }
    }
    
    // Push the last field
    result.push(current);
    return result;
}

// Funciones de utilidad
function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    // Fix for date timezone issue - parse the date string manually to avoid timezone conversion
    const dateParts = fecha.split('-');
    if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed in JavaScript
        const day = parseInt(dateParts[2]);
        return new Date(year, month, day).toLocaleDateString('es-ES', opciones);
    }
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
    if (toast) {
        toast.textContent = mensaje;
        toast.className = 'toast ' + tipo + ' show';
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Autocomplete mejorado
function autocomplete(inp, arr) {
    let currentFocus;
    if (!inp) return;
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
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
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

// Funciones del panel deslizante
function togglePanel() {
    if (sidePanel) {
        sidePanel.classList.toggle('active');
    }
}

function mostrarTodosLosProveedores() {
    togglePanel();
    mostrarModoEdicionProveedores();
}

function mostrarModoEdicionProveedores() {
    const contenidoPrincipal = document.getElementById('contenidoPrincipal');
    const modoEdicion = document.getElementById('modoEdicionProveedores');
    const btnCerrarEdicion = document.getElementById('btnCerrarEdicion');
    if (contenidoPrincipal && modoEdicion) {
        contenidoPrincipal.style.display = 'none';
        modoEdicion.style.display = 'block';
        cargarListaProveedoresEdicion();
        if (btnCerrarEdicion) {
            btnCerrarEdicion.addEventListener('click', cerrarModoEdicionProveedores);
        }
        const buscador = document.getElementById('buscadorProveedores');
        if (buscador) {
            buscador.addEventListener('input', filtrarProveedoresEdicion);
        }
        const btnAgregar = document.getElementById('btnAgregarNuevoProveedor');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', agregarNuevoProveedor);
        }
    }
}

function cerrarModoEdicionProveedores() {
    const contenidoPrincipal = document.getElementById('contenidoPrincipal');
    const modoEdicion = document.getElementById('modoEdicionProveedores');
    if (contenidoPrincipal && modoEdicion) {
        contenidoPrincipal.style.display = 'block';
        modoEdicion.style.display = 'none';
    }
}

function cargarListaProveedoresEdicion() {
    const contenedor = document.getElementById('listaProveedoresEdicion');
    if (!contenedor) return;
    const proveedoresOrdenados = [...Object.keys(proveedoresData)].sort();
    let html = '';
    proveedoresOrdenados.forEach(proveedor => {
        const dias = proveedoresData[proveedor];
        html += `
            <div class="proveedor-edicion-item" data-proveedor="${proveedor}">
                <div class="proveedor-edicion-info">
                    <strong>${proveedor}</strong>
                    <span class="proveedor-edicion-dias">${dias} días de vencimiento</span>
                </div>
                <div class="proveedor-edicion-actions">
                    <button class="btn-editar-edicion" data-proveedor="${proveedor}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-eliminar-edicion" data-proveedor="${proveedor}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;
    document.querySelectorAll('.btn-editar-edicion').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const proveedor = e.target.closest('button').dataset.proveedor;
            mostrarFormularioEdicionProveedor(proveedor);
        });
    });
    document.querySelectorAll('.btn-eliminar-edicion').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const proveedor = e.target.closest('button').dataset.proveedor;
            eliminarProveedorEdicion(proveedor);
        });
    });
}

function filtrarProveedoresEdicion() {
    const buscador = document.getElementById('buscadorProveedores');
    const termino = buscador.value.toLowerCase();
    const items = document.querySelectorAll('.proveedor-edicion-item');
    items.forEach(item => {
        const proveedor = item.dataset.proveedor.toLowerCase();
        if (proveedor.includes(termino)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function mostrarFormularioEdicionProveedor(proveedor) {
    const overlay = document.createElement('div');
    overlay.className = 'formulario-edicion-overlay';
    overlay.id = 'formularioEdicionOverlay';
    const formulario = document.createElement('div');
    formulario.className = 'formulario-edicion-flotante';
    formulario.id = 'formularioEdicionProveedor';
    formulario.innerHTML = `
        <div class="formulario-edicion-header">
            <h4>Editar Proveedor: ${proveedor}</h4>
            <button class="btn-cerrar-formulario" id="btnCerrarFormulario">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <input type="text" id="nombreProveedorEdicion" value="${proveedor}" class="form-input" disabled>
        <input type="number" id="diasProveedorEdicion" value="${proveedoresData[proveedor]}" class="form-input" placeholder="Días de vencimiento">
        <div class="formulario-edicion-buttons">
            <button id="btnGuardarEdicion" class="btn-guardar-proveedor">Guardar</button>
            <button id="btnCancelarEdicion" class="btn-cancelar-proveedor">Cancelar</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(formulario);
    document.getElementById('btnCerrarFormulario').addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(formulario);
    });
    document.getElementById('btnCancelarEdicion').addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(formulario);
    });
    document.getElementById('btnGuardarEdicion').addEventListener('click', () => {
        const nuevosDias = parseInt(document.getElementById('diasProveedorEdicion').value);
        if (!isNaN(nuevosDias) && nuevosDias >= 0) {
            proveedoresData[proveedor] = nuevosDias;
            mostrarToast(`Proveedor ${proveedor} actualizado correctamente`, 'success');
            document.body.removeChild(overlay);
            document.body.removeChild(formulario);
            cargarListaProveedoresEdicion();
            autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
        } else {
            mostrarToast('Por favor, ingrese un número válido de días', 'error');
        }
    });
    document.addEventListener('keydown', function cerrarConEsc(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
            document.body.removeChild(formulario);
            document.removeEventListener('keydown', cerrarConEsc);
        }
    });
}

function eliminarProveedorEdicion(nombre) {
    if (!confirm(`¿Está seguro de que desea eliminar el proveedor ${nombre}?`)) {
        return;
    }
    const tieneRegistros = proveedores.some(p => p.proveedor === nombre);
    if (tieneRegistros) {
        if (!confirm(`Este proveedor tiene registros asociados. ¿Está seguro de que desea eliminarlo? Esto podría afectar los cálculos de vencimiento.`)) {
            return;
        }
    }
    delete proveedoresData[nombre];
    autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
    mostrarToast(`Proveedor ${nombre} eliminado correctamente`, 'success');
    cargarListaProveedoresEdicion();
}

function agregarNuevoProveedor() {
    const nombreInput = document.getElementById('nombreNuevoProveedor');
    const diasInput = document.getElementById('diasNuevoProveedor');
    const nombre = nombreInput.value.trim().toUpperCase();
    const dias = parseInt(diasInput.value);
    if (!nombre) {
        mostrarToast('Por favor, ingrese el nombre del proveedor', 'error');
        return;
    }
    if (isNaN(dias) || dias < 0) {
        mostrarToast('Por favor, ingrese un número válido de días', 'error');
        return;
    }
    if (proveedoresData.hasOwnProperty(nombre)) {
        mostrarToast('Ya existe un proveedor con ese nombre', 'error');
        return;
    }
    proveedoresData[nombre] = dias;
    autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
    mostrarToast(`Proveedor ${nombre} agregado correctamente`, 'success');
    nombreInput.value = '';
    diasInput.value = '';
    cargarListaProveedoresEdicion();
}
