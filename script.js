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
            "MANTENIMIENTO/VARIOS": 15, "CRIOLLO": 28, "PAN MIGA/ARABE": 0
        };

        const tablaProveedores = document.getElementById('tablaProveedores');
        const proveedorInput = document.getElementById('proveedor');
        const numBolInput = document.getElementById('numBol');
        const formaPagoInput = document.getElementById('formaPago');
        const importeInput = document.getElementById('importe');
        const fechaInput = document.getElementById('fecha');
        const pagadoInput = document.getElementById('pagado');
        const currentIndexInput = document.getElementById('currentIndex');
        const btnBorrar = document.getElementById('btnBorrar');

        let proveedores = JSON.parse(localStorage.getItem('proveedores')) || [];

        function guardarProveedores() {
            localStorage.setItem('proveedores', JSON.stringify(proveedores));
        }

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

        function renderizarTabla() {
            proveedores.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            tablaProveedores.innerHTML = '';
            let totalVencidas = 0, totalNoVencidas = 0, totalPagado = 0, totalGeneral = 0;

            proveedores.forEach((p, index) => {
                const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
                const fila = document.createElement('tr');
                fila.onclick = () => cargarProveedorEnFormulario(index);
                fila.innerHTML = `
                    <td>${p.proveedor}</td>
                    <td>${p.numBol}</td>
                    <td>${p.formaPago}</td>
                    <td>$${p.importe.toLocaleString()}</td>
                    <td>${p.fecha}</td>
                    <td>$${p.pagado ? p.pagado.toLocaleString() : '0'}</td>
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
        }

        function agregarOActualizarProveedor() {
            const proveedor = proveedorInput.value.trim().toUpperCase();
            const numBol = numBolInput.value.trim();
            const formaPago = formaPagoInput.value;
            const importe = parseFloat(importeInput.value);
            const fecha = fechaInput.value;
            const pagado = parseFloat(pagadoInput.value) || 0;
            const currentIndex = parseInt(currentIndexInput.value, 10);

            if (!proveedoresData.hasOwnProperty(proveedor)) {
                alert('Proveedor no válido. Por favor, seleccione un proveedor de la lista.');
                return;
            }

            if (numBol.length !== 5) {
                alert('El número de boleta debe tener 5 dígitos.');
                return;
            }

            const isDuplicate = proveedores.some((p, index) => 
                p.proveedor === proveedor && p.numBol === numBol && index !== currentIndex
            );

            if (isDuplicate) {
                alert('Ya existe una boleta con ese número para este proveedor.');
                return;
            }

            if (proveedor && numBol && formaPago && !isNaN(importe) && fecha) {
                const data = { proveedor, numBol, formaPago, importe, fecha, pagado };
                if (!isNaN(currentIndex)) {
                    proveedores[currentIndex] = data;
                } else {
                    proveedores.push(data);
                }
                guardarProveedores();
                renderizarTabla();
                limpiarFormulario();
            } else {
                alert('Por favor, complete todos los campos obligatorios.');
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
        }

        function borrarProveedor() {
            const currentIndex = parseInt(currentIndexInput.value, 10);
            if (!isNaN(currentIndex)) {
                proveedores.splice(currentIndex, 1);
                guardarProveedores();
                renderizarTabla();
                limpiarFormulario();
            }
        }

        function limpiarFormulario() {
            proveedorInput.value = '';
            numBolInput.value = '';
            importeInput.value = '';
            fechaInput.value = '';
            pagadoInput.value = '';
            currentIndexInput.value = '';
            btnBorrar.style.display = 'none';
        }

        function guardarTxt() {
            let contenido = "PROVEEDOR\tN° BOLETA\tFORMA PAGO\tIMPORTE\tFECHA\tPAGADO\tESTADO\n";
            proveedores.forEach(p => {
                const estado = calcularEstado(p.fecha, proveedoresData[p.proveedor], p.importe, p.pagado);
                contenido += `${p.proveedor}\t${p.numBol}\t${p.formaPago}\t${p.importe}\t${p.fecha}\t${p.pagado || 0}\t${estado}\n`;
            });

            const hoy = new Date();
            const fechaFormato = `${hoy.getDate()}-${hoy.getMonth() + 1}-${hoy.getFullYear()}`;
            const nombreArchivo = `control-${fechaFormato}.txt`;

            const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
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
                    alert('Respaldo cargado exitosamente.');
                }
            };
            reader.readAsText(file);
        }

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

        document.addEventListener('DOMContentLoaded', () => {
            renderizarTabla();
            limpiarFormulario();
            autocomplete(document.getElementById("proveedor"), Object.keys(proveedoresData));
        });