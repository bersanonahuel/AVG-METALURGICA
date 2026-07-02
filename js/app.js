/**
 * APP LOGIC - INTERACCIÓN DE UI
 */

const UI = {
    currentRole: null, // 'admin' o 'employee'
    loggedUser: null, // Guardará la info del empleado logueado
    currentViewedEmployee: null, // Datos del empleado actual para exportar PDF

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Tabs de Login
        document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                const target = document.getElementById(e.target.dataset.target);
                target.classList.add('active');
            });
        });

        // FORMULARIOS LOGIN
        const formAdminLogin = document.getElementById('form-login-admin');
        if (formAdminLogin) formAdminLogin.addEventListener('submit', this.handleAdminLogin.bind(this));
        
        const formEmpLogin = document.getElementById('form-login-employee');
        if (formEmpLogin) formEmpLogin.addEventListener('submit', this.handleEmployeeLogin.bind(this));
        
        // CERRAR SESIÓN Y BACKUP
        document.getElementById('btn-logout-admin').addEventListener('click', () => this.logout());
        document.getElementById('btn-backup-admin').addEventListener('click', () => this.handleBackup());
        document.getElementById('btn-logout-employee').addEventListener('click', () => this.logout());

        // NAVEGACIÓN SIDEBARS
        document.querySelectorAll('.sidebar-nav .nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const navBtns = e.target.closest('.sidebar-nav').querySelectorAll('.nav-btn');
                navBtns.forEach(b => b.classList.remove('active'));
                
                const targetBtn = e.target.closest('.nav-btn');
                targetBtn.classList.add('active');
                
                const sections = document.querySelectorAll('.dashboard-section');
                sections.forEach(s => s.classList.add('hidden'));
                
                const viewTarget = document.getElementById(targetBtn.dataset.view);
                if(viewTarget) viewTarget.classList.remove('hidden');
            });
        });

        // MODALES (Cerrar)
        document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('modal-overlay').classList.add('hidden');
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            });
        });

        // EXPORT PDF
        const btnPdf = document.getElementById('btn-export-pdf');
        if(btnPdf) btnPdf.addEventListener('click', this.exportEmployeePDF.bind(this));

        // FORMULARIOS ADMIN - DATOS
        const formAddEmp = document.getElementById('form-add-employee');
        if (formAddEmp) formAddEmp.addEventListener('submit', this.handleAddEmployee.bind(this));

        const formEditEmp = document.getElementById('form-edit-employee');
        if (formEditEmp) formEditEmp.addEventListener('submit', this.handleEditEmployee.bind(this));
        
        const formHours = document.getElementById('form-add-hours');
        if (formHours) formHours.addEventListener('submit', this.handleAddHours.bind(this));

        const formPay = document.getElementById('form-add-payment');
        if (formPay) formPay.addEventListener('submit', this.handleAddPayment.bind(this));

        const formExp = document.getElementById('form-add-expense');
        if (formExp) formExp.addEventListener('submit', this.handleAddExpense.bind(this));

        const formOvt = document.getElementById('form-add-overtime');
        if (formOvt) formOvt.addEventListener('submit', this.handleAddOvertime.bind(this));

        const formAdv = document.getElementById('form-add-advance');
        if (formAdv) formAdv.addEventListener('submit', this.handleAddAdvance.bind(this));

        // EDIT FORMS
        const formEH = document.getElementById('form-edit-hour');
        if (formEH) formEH.addEventListener('submit', this.handleEditHour.bind(this));
        
        const formEP = document.getElementById('form-edit-payment');
        if (formEP) formEP.addEventListener('submit', this.handleEditPayment.bind(this));
        
        const formEE = document.getElementById('form-edit-expense');
        if (formEE) formEE.addEventListener('submit', this.handleEditExpense.bind(this));

        const formEditOvt = document.getElementById('form-edit-overtime');
        if (formEditOvt) formEditOvt.addEventListener('submit', this.handleEditOvertime.bind(this));

        // AUTO-CÁLCULO EN FORMULARIO OVERTIME (nuevo + editar)
        const ovtEmpSelect = document.getElementById('ovt-emp-id');
        const ovtQty = document.getElementById('ovt-qty');
        const ovtRate = document.getElementById('ovt-rate');
        if (ovtQty && ovtRate) {
            const calcOvt = () => this.calcOvertimeTotal('ovt-qty', 'ovt-rate', 'ovt-total-display');
            ovtQty.addEventListener('input', calcOvt);
            ovtRate.addEventListener('input', calcOvt);
        }
        if (ovtEmpSelect) {
            ovtEmpSelect.addEventListener('change', () => this.onOvertimeEmpChange());
        }
        const editOvtQty = document.getElementById('edit-ovt-qty');
        const editOvtRate = document.getElementById('edit-ovt-rate');
        if (editOvtQty && editOvtRate) {
            const calcEditOvt = () => this.calcOvertimeTotal('edit-ovt-qty', 'edit-ovt-rate', 'edit-ovt-total-display');
            editOvtQty.addEventListener('input', calcEditOvt);
            editOvtRate.addEventListener('input', calcEditOvt);
        }
    },

    // --- AUTENTICACIÓN ---
    handleAdminLogin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value.trim().toLowerCase();
        const pass = document.getElementById('admin-pass').value.trim();
        
        if (user === 'cristian lujan' && pass === '191504') {
            this.showToast('Bienvenido Administrador', 'success');
            this.switchView('admin-view');
            this.loadAdminData();
        } else {
            this.showToast('Credenciales incorrectas', 'error');
        }
    },

    async handleEmployeeLogin(e) {
        e.preventDefault();
        const nom = document.getElementById('emp-nombre').value;
        const ape = document.getElementById('emp-apellido').value;
        const dni = document.getElementById('emp-dni').value;

        const emp = await Store.loginEmployee(nom, ape, dni);
        if (emp) {
            this.loggedUser = emp;
            this.showToast(`Bienvenido/a ${emp.nombre}`, 'success');
            
            document.getElementById('logged-emp-name').innerText = `${emp.nombre} ${emp.apellido}`;
            document.getElementById('logged-emp-dni').innerText = emp.dni;
            document.getElementById('welcome-name').innerText = emp.nombre;

            // CARGAR SUS HORAS Y PAGOS REALES!
            this.loadEmployeeDashboardData();

            this.switchView('employee-view');
        } else {
            this.showToast('No se encontró el empleado. Verifique sus datos.', 'error');
        }
    },

    logout() {
        this.currentRole = null;
        this.loggedUser = null;
        this.switchView('login-view');
        document.getElementById('form-login-admin').reset();
        document.getElementById('form-login-employee').reset();
    },

    async handleBackup() {
        try {
            const btn = document.getElementById('btn-backup-admin');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
            btn.disabled = true;

            const data = await Store.exportBackup();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `AVF_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (error) {
            console.error("Error al generar backup:", error);
            alert("Ocurrió un error al generar el backup.");
            const btn = document.getElementById('btn-backup-admin');
            btn.innerHTML = '<i class="fa-solid fa-download"></i> Guardar Backup';
            btn.disabled = false;
        }
    },

    // --- HELPERS QUINCENAS ---
    getQuincenasList(hours, payments, advances, overtime) {
        const set = new Set();
        const process = (arr) => {
            (arr || []).forEach(item => {
                if(item.fecha) {
                    const [y, m, d] = item.fecha.split('T')[0].split('-');
                    const q = parseInt(d) <= 15 ? 1 : 2;
                    set.add(`${y}-${m}-${q}`);
                }
            });
        };
        process(hours); process(payments); process(advances); process(overtime);
        
        const sorted = Array.from(set).sort((a,b) => b.localeCompare(a));
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        return sorted.map(key => {
            const [y, m, q] = key.split('-');
            const mName = months[parseInt(m) - 1];
            return { key, label: `${mName} ${y} - ${q === '1' ? '1ra' : '2da'} Quincena` };
        });
    },

    filterByQuincena(arr, qKey) {
        if(qKey === 'ALL') return arr || [];
        return (arr || []).filter(item => {
            if(!item.fecha) return false;
            const [y, m, d] = item.fecha.split('T')[0].split('-');
            const q = parseInt(d) <= 15 ? 1 : 2;
            return `${y}-${m}-${q}` === qKey;
        });
    },

    // --- HELPERS UI ---
    switchView(viewId) {
        document.querySelectorAll('section.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById(viewId).classList.add('active');
    },

    showModal(modalId) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById(modalId).classList.remove('hidden');
    },

    hideModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    },

    showToast(message, type = 'success') {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: type,
            title: message,
            showConfirmButton: false,
            timer: 3000,
            background: 'var(--glass-bg)',
            color: 'var(--text-main)'
        });
    },

    // --- EMPLEADO DATA LOAD ---
    async loadEmployeeDashboardData() {
        const allHours = await Store.getHoursByEmployee(this.loggedUser.id);
        const allPayments = await Store.getPaymentsByEmployee(this.loggedUser.id);
        const allAdvances = await Store.getAdvancesByEmployee(this.loggedUser.id);
        const allOvertime = await Store.getOvertimeByEmployee(this.loggedUser.id);
        
        const select = document.getElementById('emp-history-quincena');
        if (select) {
            const quincenas = this.getQuincenasList(allHours, allPayments, allAdvances, allOvertime);
            select.innerHTML = '<option value="ALL">Todo el historial</option>' + quincenas.map(q => `<option value="${q.key}">${q.label}</option>`).join('');
            
            select.onchange = () => {
                this.renderEmployeeDashboardFiltered(allHours, allPayments, allAdvances, allOvertime, select.value);
            };
        }

        this.renderEmployeeDashboardFiltered(allHours, allPayments, allAdvances, allOvertime, 'ALL');

        // Auto-seleccionar quincena actual si existe
        const currentQ = this.getCurrentQuincenaKey();
        if (select) {
            const opts = Array.from(select.options);
            const match = opts.find(o => o.value === currentQ);
            if (match) {
                select.value = currentQ;
                this.renderEmployeeDashboardFiltered(allHours, allPayments, allAdvances, allOvertime, currentQ);
            }
        }
    },

    renderEmployeeDashboardFiltered(allHours, allPayments, allAdvances, allOvertime, qKey) {
        const hours = this.filterByQuincena(allHours, qKey);
        const payments = this.filterByQuincena(allPayments, qKey);
        const advances = this.filterByQuincena(allAdvances, qKey);
        const overtime = this.filterByQuincena(allOvertime, qKey);

        const tHours = hours.reduce((sum, h) => sum + Number(h.cantidad), 0);
        const tPayments = payments.reduce((sum, p) => sum + Number(p.monto), 0);
        const tOvertimeVal = overtime.reduce((sum, o) => sum + Number(o.valorTotal), 0);
        const tAdvances = advances.reduce((sum, a) => sum + Number(a.monto), 0);

        const totalGenerado = (tHours * Number(this.loggedUser.valorHora)) + tOvertimeVal;
        const deuda = totalGenerado - tPayments - tAdvances;

        document.getElementById('emp-stat-hours').innerText = tHours + ' hrs (Formales)';
        
        let lastPayText = "0.00";
        if(payments.length > 0) {
            lastPayText = `$${payments[0].monto}`; 
        }
        document.getElementById('emp-stat-lastpay').innerText = lastPayText;
        document.getElementById('emp-stat-debt').innerText = `$${deuda.toFixed(2)}`;

        // Historial Tablas Empleado
        const tbodyH = document.getElementById('table-emp-hours-history');
        if(tbodyH) {
            tbodyH.innerHTML = hours.map(h => `<tr><td>${h.fecha}</td><td>${h.ingreso || '-'} a ${h.egreso || '-'}</td><td>${h.cantidad} hrs</td></tr>`).join('');
        }

        const tbodyP = document.getElementById('table-emp-payments-history');
        if(tbodyP) {
            tbodyP.innerHTML = payments.map(p => `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>$${p.monto}</td></tr>`).join('');
        }

        const tbodyAdv = document.getElementById('table-emp-advances-history');
        if(tbodyAdv) {
            tbodyAdv.innerHTML = advances.map(a => `<tr><td>${new Date(a.fecha).toLocaleDateString()}</td><td>${a.descripcion}</td><td>$${a.monto}</td></tr>`).join('');
        }

        const tbodyOvt = document.getElementById('table-emp-overtime-history');
        if(tbodyOvt) {
            tbodyOvt.innerHTML = overtime.map(o => `<tr><td>${o.fecha}</td><td>${o.cantidad} hrs</td><td>$${o.valorTotal}</td></tr>`).join('');
        }
    },

    // --- ADMIN DATA LOAD ---
    async loadAdminData() {
        const employees = await Store.getEmployees();
        const payments = await Store.getAllPayments();
        const expenses = await Store.getExpenses();
        const allHours = await Store.getAllHours();
        const allOvertime = await Store.getAllOvertime();
        const allAdvances = await Store.getAllAdvances();

        // Stats Dashboard
        document.getElementById('stat-emp-count').innerText = employees.length;
        const totalPagado = payments.reduce((sum, p) => sum + Number(p.monto), 0);
        document.getElementById('stat-total-paid').innerText = `$${totalPagado}`;
        const totalGastos = expenses.reduce((sum, ex) => sum + Number(ex.monto), 0);
        const totalAdelantos = allAdvances.reduce((sum, a) => sum + Number(a.monto), 0);
        
        // Sumamos gastos generales + adelantos para mostrar el total de salidas de dinero no-sueldo
        document.getElementById('stat-total-exp').innerText = `$${(totalGastos + totalAdelantos).toFixed(2)}`;
        
        let globalDebt = 0;

        // ---------------- TABLA EMPLEADOS ----------------
        const tbody = document.getElementById('table-employees');
        tbody.innerHTML = '';
        
        const selectHours = document.getElementById('hour-emp-id');
        const selectPay = document.getElementById('pay-emp-id');
        const selectOvt = document.getElementById('ovt-emp-id');
        const selectAdv = document.getElementById('adv-emp-id');

        if (selectHours && selectPay) {
            selectHours.innerHTML = `<option value="">Seleccione Empleado...</option>`;
            selectPay.innerHTML = `<option value="">Seleccione Empleado...</option>`;
            if(selectOvt) selectOvt.innerHTML = `<option value="">Seleccione Empleado...</option>`;
            if(selectAdv) selectAdv.innerHTML = `<option value="">Seleccione Empleado...</option>`;
        }

        employees.forEach(emp => {
            // Calcular deuda para este empleado (Horas Normales + Horas Extras - Pagos - Adelantos)
            const eHours = allHours.filter(h => h.empId === emp.id).reduce((s, h) => s + Number(h.cantidad), 0);
            const ePays = payments.filter(p => p.empId === emp.id).reduce((s, p) => s + Number(p.monto), 0);
            const eOvt = allOvertime.filter(o => o.empId === emp.id).reduce((s, o) => s + Number(o.valorTotal), 0);
            const eAdv = allAdvances.filter(a => a.empId === emp.id).reduce((s, a) => s + Number(a.monto), 0);
            
            const deudaEmp = (eHours * Number(emp.valorHora)) + eOvt - ePays - eAdv;
            globalDebt += deudaEmp;

            // Escapar los datos del empleado para usarlos con string en el boton Edit
            const encodedEmp = encodeURIComponent(JSON.stringify(emp));
            tbody.innerHTML += `
                <tr>
                    <td>${emp.nombre} ${emp.apellido}</td>
                    <td>${emp.dni}</td>
                    <td>$${emp.valorHora}</td>
                    <td>$${emp.valorHoraExtra || '0'}</td>
                    <td>${eHours} hrs</td>
                    <td style="color: ${deudaEmp > 0 ? 'var(--warning)' : 'var(--text-muted)'}">${deudaEmp >= 0 ? '' : '-'}$${Math.abs(deudaEmp).toFixed(2)}</td>
                    <td>${new Date(emp.fechaIngreso).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px; background-color: var(--secondary); color: white;" onclick="UI.openViewEmployee('${encodedEmp}')" title="Ver Detalles">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px;" onclick="UI.openEditEmployee('${encodedEmp}')" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeleteEmployee('${emp.id}', '${emp.nombre}', '${emp.apellido}')" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;

            if (selectHours && selectPay) {
                const opt = `<option value="${emp.id}">${emp.nombre} ${emp.apellido} (DNI ${emp.dni})</option>`;
                selectHours.innerHTML += opt;
                selectPay.innerHTML += opt;
                if(selectOvt) selectOvt.innerHTML += opt;
                if(selectAdv) selectAdv.innerHTML += opt;
            }
        });

        // Actualizar UI del balance de deuda
        const debtUI = document.getElementById('stat-total-debt');
        if(debtUI) debtUI.innerText = `$${globalDebt.toFixed(2)}`;

        // ---------------- TABLAS DE HISTORIAL EN SECCIONES ----------------
        const lookupEmp = id => { const e = employees.find(x => x.id === id); return e ? `${e.nombre} ${e.apellido}` : 'Desconocido'; };

        const thHours = document.getElementById('table-admin-hours');
        if(thHours) {
            thHours.innerHTML = allHours.map(h => `<tr>
                <td>${lookupEmp(h.empId)}</td>
                <td>${h.fecha}</td>
                <td>${h.ingreso || '-'} a ${h.egreso || '-'}</td>
                <td>${h.cantidad} hrs</td>
                <td>
                    <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px;" onclick="UI.openEditHour('${encodeURIComponent(JSON.stringify(h))}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeleteHour('${h.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
        }

        const thPays = document.getElementById('table-admin-payments');
        if(thPays) {
            thPays.innerHTML = payments.map(p => `<tr>
                <td>${lookupEmp(p.empId)}</td>
                <td>$${p.monto}</td>
                <td>${new Date(p.fecha).toLocaleDateString()}</td>
                <td>
                    <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px;" onclick="UI.openEditPayment('${encodeURIComponent(JSON.stringify(p))}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeletePayment('${p.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
        }

        const thExp = document.getElementById('table-admin-expenses');
        if(thExp) {
            thExp.innerHTML = expenses.map(ex => `<tr>
                <td>${ex.descripcion}</td>
                <td>$${ex.monto}</td>
                <td>${new Date(ex.fecha).toLocaleDateString()}</td>
                <td>
                    <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px;" onclick="UI.openEditExpense('${encodeURIComponent(JSON.stringify(ex))}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeleteExpense('${ex.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
        }

        const thOvt = document.getElementById('table-admin-overtime');
        if(thOvt) {
            thOvt.innerHTML = allOvertime.map(o => {
                const rate = o.cantidad > 0 ? (Number(o.valorTotal) / Number(o.cantidad)).toFixed(2) : '0';
                return `<tr>
                <td>${lookupEmp(o.empId)}</td>
                <td>${o.fecha}</td>
                <td>${o.cantidad} hrs</td>
                <td>$${rate}</td>
                <td>$${o.valorTotal}</td>
                <td>
                    <button class="btn-primary" style="padding: 5px 10px; margin-right: 5px;" onclick="UI.openEditOvertime('${encodeURIComponent(JSON.stringify(o))}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeleteOvertime('${o.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
            }).join('');
        }

        const thAdv = document.getElementById('table-admin-advances');
        if(thAdv) {
            thAdv.innerHTML = allAdvances.map(a => `<tr>
                <td>${lookupEmp(a.empId)}</td>
                <td>${a.descripcion}</td>
                <td>$${a.monto}</td>
                <td>${new Date(a.fecha).toLocaleDateString()}</td>
                <td>
                    <button class="btn-danger-outline" style="padding: 5px 10px;" onclick="UI.handleDeleteAdvance('${a.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
        }
    },

    async openViewEmployee(encodedStr) {
        const emp = JSON.parse(decodeURIComponent(encodedStr));
        
        const allHours = await Store.getHoursByEmployee(emp.id);
        const allPayments = await Store.getPaymentsByEmployee(emp.id);
        const allAdvances = await Store.getAdvancesByEmployee(emp.id);
        const allOvertime = await Store.getOvertimeByEmployee(emp.id);
        
        const select = document.getElementById('admin-view-emp-quincena');
        if (select) {
            const quincenas = this.getQuincenasList(allHours, allPayments, allAdvances, allOvertime);
            select.innerHTML = '<option value="ALL">Todo el historial</option>' + quincenas.map(q => `<option value="${q.key}">${q.label}</option>`).join('');
            
            select.onchange = () => {
                this.renderAdminEmployeeViewFiltered(emp, allHours, allPayments, allAdvances, allOvertime, select.value);
            };
        }

        this.renderAdminEmployeeViewFiltered(emp, allHours, allPayments, allAdvances, allOvertime, 'ALL');

        // Auto-seleccionar quincena actual si existe
        const currentQ = this.getCurrentQuincenaKey();
        if (select) {
            const opts = Array.from(select.options);
            const match = opts.find(o => o.value === currentQ);
            if (match) {
                select.value = currentQ;
                this.renderAdminEmployeeViewFiltered(emp, allHours, allPayments, allAdvances, allOvertime, currentQ);
            }
        }

        this.showModal('modal-view-employee');
    },

    renderAdminEmployeeViewFiltered(emp, allHours, allPayments, allAdvances, allOvertime, qKey) {
        const hours = this.filterByQuincena(allHours, qKey);
        const payments = this.filterByQuincena(allPayments, qKey);
        const advances = this.filterByQuincena(allAdvances, qKey);
        const overtime = this.filterByQuincena(allOvertime, qKey);

        const tHours = hours.reduce((sum, h) => sum + Number(h.cantidad), 0);
        const tPayments = payments.reduce((sum, p) => sum + Number(p.monto), 0);
        const tOvertimeHrs = overtime.reduce((sum, o) => sum + Number(o.cantidad), 0);
        const tOvertimeVal = overtime.reduce((sum, o) => sum + Number(o.valorTotal), 0);
        const tAdvances = advances.reduce((sum, a) => sum + Number(a.monto), 0);

        const valHorasNormales = tHours * Number(emp.valorHora);
        const deuda = valHorasNormales + tOvertimeVal - tPayments - tAdvances;

        document.getElementById('view-emp-nombre').innerText = `${emp.nombre} ${emp.apellido}`;
        document.getElementById('view-emp-dni').innerText = emp.dni;
        document.getElementById('view-emp-valor').innerText = emp.valorHora;
        document.getElementById('view-emp-valor-extra').innerText = emp.valorHoraExtra || '0';

        document.getElementById('view-emp-horas-n').innerText = tHours.toFixed(2);
        document.getElementById('view-emp-val-n').innerText = valHorasNormales.toFixed(2);
        
        document.getElementById('view-emp-horas-e').innerText = tOvertimeHrs.toFixed(2);
        document.getElementById('view-emp-val-e').innerText = tOvertimeVal.toFixed(2);
        
        document.getElementById('view-emp-pagos').innerText = tPayments.toFixed(2);
        document.getElementById('view-emp-adelantos').innerText = tAdvances.toFixed(2);
        
        document.getElementById('view-emp-saldo').innerText = `$${deuda.toFixed(2)}`;

        // Renderizar Tablas
        const tbodyH = document.getElementById('view-emp-table-hours');
        if(tbodyH) {
            if(hours.length === 0) {
                tbodyH.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay horas cargadas</td></tr>';
            } else {
                tbodyH.innerHTML = hours.map(h => `<tr><td>${h.fecha}</td><td>${h.ingreso || '-'} a ${h.egreso || '-'}</td><td>${h.cantidad} hrs</td></tr>`).join('');
            }
        }

        const tbodyP = document.getElementById('view-emp-table-payments');
        if(tbodyP) {
            if(payments.length === 0) {
                tbodyP.innerHTML = '<tr><td colspan="2" style="text-align:center;">No hay pagos registrados</td></tr>';
            } else {
                tbodyP.innerHTML = payments.map(p => `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>$${p.monto}</td></tr>`).join('');
            }
        }

        this.currentViewedEmployee = {
            emp, hours, payments, advances, overtime,
            tHours, tPayments, tOvertimeHrs, tOvertimeVal, tAdvances, valHorasNormales, deuda
        };
    },

    exportEmployeePDF() {
        try {
            if (!this.currentViewedEmployee) return;
            
            const data = this.currentViewedEmployee;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            // ── MARCA DE AGUA (logo centrado semitransparente) ──
            if (typeof AVF_LOGO_B64 !== 'undefined') {
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.08 }));
                const wmSize = 120;
                doc.addImage(AVF_LOGO_B64, 'PNG',
                    (pageW - wmSize) / 2,
                    (pageH - wmSize) / 2,
                    wmSize, wmSize);
                doc.restoreGraphicsState();
            }

            // ── BANDA SUPERIOR roja ──
            doc.setFillColor(204, 0, 0);
            doc.rect(0, 0, pageW, 28, 'F');

            // ── LOGO en header ──
            if (typeof AVF_LOGO_B64 !== 'undefined') {
                doc.addImage(AVF_LOGO_B64, 'PNG', 8, 2, 24, 24);
            }

            // ── TÍTULO en header ──
            doc.setFontSize(20);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text("AVF METALURGICA", 38, 13);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const select = document.getElementById('admin-view-emp-quincena');
            const selectedQ = select ? select.options[select.selectedIndex].text : "Todo el historial";
            doc.text(`Reporte de Empleado - ${selectedQ}`, 38, 22);

            // Fecha a la derecha
            doc.setFontSize(9);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageW - 14, 22, { align: 'right' });

            // ── BLOQUE DATOS PERSONALES ──
            doc.setFillColor(245, 245, 245);
            doc.rect(10, 34, pageW - 20, 30, 'F');
            doc.setDrawColor(204, 0, 0);
            doc.setLineWidth(0.8);
            doc.rect(10, 34, pageW - 20, 30, 'S');

            doc.setFont(undefined, 'bold');
            doc.setFontSize(13);
            doc.setTextColor(20, 20, 20);
            doc.text(`${data.emp.nombre} ${data.emp.apellido}`, 15, 44);

            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`DNI: ${data.emp.dni}`, 15, 52);
            doc.text(`Valor por Hora: $${data.emp.valorHora}`, 15, 59);
            doc.text(`Valor Hora Extra: $${data.emp.valorHoraExtra || '0'}`, pageW / 2, 59);

            // ── SECCIÓN BALANCE ──
            doc.setFillColor(204, 0, 0);
            doc.rect(10, 70, pageW - 20, 8, 'F');
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text("BALANCE FINANCIERO", 15, 76);

            // Items del balance
            const balanceItems = [
                [`Horas Normales (${data.tHours.toFixed(2)} hrs)`, `$${data.valHorasNormales.toFixed(2)}`, [30, 30, 30]],
                [`Horas Extras (${data.tOvertimeHrs.toFixed(2)} hrs)`, `+$${data.tOvertimeVal.toFixed(2)}`, [0, 130, 0]],
                [`Adelantos`, `-$${data.tAdvances.toFixed(2)}`, [180, 0, 0]],
                [`Pagos Efectuados`, `-$${data.tPayments.toFixed(2)}`, [180, 0, 0]],
            ];

            let yb = 86;
            balanceItems.forEach(([label, value, color]) => {
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                doc.text(label, 15, yb);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...color);
                doc.text(value, pageW - 15, yb, { align: 'right' });
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(15, yb + 2, pageW - 15, yb + 2);
                yb += 9;
            });

            // SALDO TOTAL destacado
            doc.setFillColor(30, 30, 30);
            doc.rect(10, yb + 1, pageW - 20, 12, 'F');
            doc.setFont(undefined, 'bold');
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text("SALDO A PAGAR:", 15, yb + 9);
            doc.setTextColor(255, 80, 80);
            doc.text(`$${data.deuda.toFixed(2)}`, pageW - 15, yb + 9, { align: 'right' });

            let startY = yb + 22;

            // ── TABLAS ──
            const tableHeadStyle = { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' };
            const tableStyles = { fontSize: 9, cellPadding: 3 };
            const altRowStyle = { fillColor: [252, 240, 240] };

            if (data.hours.length > 0) {
                doc.setFillColor(204, 0, 0);
                doc.rect(10, startY, pageW - 20, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text("HISTORIAL DE HORAS NORMALES", 15, startY + 5);
                startY += 8;
                doc.autoTable({
                    startY,
                    head: [['Fecha', 'Ingreso', 'Egreso', 'Horas']],
                    body: data.hours.map(h => [h.fecha, h.ingreso || '-', h.egreso || '-', `${h.cantidad} hrs`]),
                    theme: 'grid',
                    headStyles: tableHeadStyle,
                    styles: tableStyles,
                    alternateRowStyles: altRowStyle,
                    margin: { left: 10, right: 10 }
                });
                startY = doc.lastAutoTable.finalY + 8;
            }

            if (data.overtime.length > 0) {
                doc.setFillColor(204, 0, 0);
                doc.rect(10, startY, pageW - 20, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text("HORAS EXTRAS", 15, startY + 5);
                startY += 8;
                doc.autoTable({
                    startY,
                    head: [['Fecha', 'Horas Extras', 'Valor Total']],
                    body: data.overtime.map(o => [o.fecha, `${o.cantidad} hrs`, `$${o.valorTotal}`]),
                    theme: 'grid',
                    headStyles: tableHeadStyle,
                    styles: tableStyles,
                    alternateRowStyles: altRowStyle,
                    margin: { left: 10, right: 10 }
                });
                startY = doc.lastAutoTable.finalY + 8;
            }

            if (data.advances.length > 0) {
                doc.setFillColor(204, 0, 0);
                doc.rect(10, startY, pageW - 20, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text("ADELANTOS", 15, startY + 5);
                startY += 8;
                doc.autoTable({
                    startY,
                    head: [['Fecha', 'Descripcion', 'Monto']],
                    body: data.advances.map(a => [new Date(a.fecha).toLocaleDateString(), a.descripcion || '-', `$${a.monto}`]),
                    theme: 'grid',
                    headStyles: tableHeadStyle,
                    styles: tableStyles,
                    alternateRowStyles: altRowStyle,
                    margin: { left: 10, right: 10 }
                });
                startY = doc.lastAutoTable.finalY + 8;
            }

            if (data.payments.length > 0) {
                doc.setFillColor(204, 0, 0);
                doc.rect(10, startY, pageW - 20, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text("PAGOS REALIZADOS", 15, startY + 5);
                startY += 8;
                doc.autoTable({
                    startY,
                    head: [['Fecha', 'Monto Pagado']],
                    body: data.payments.map(p => [new Date(p.fecha).toLocaleDateString(), `$${p.monto}`]),
                    theme: 'grid',
                    headStyles: tableHeadStyle,
                    styles: tableStyles,
                    alternateRowStyles: altRowStyle,
                    margin: { left: 10, right: 10 }
                });
            }

            // ── PIE DE PÁGINA ──
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFillColor(30, 30, 30);
                doc.rect(0, pageH - 12, pageW, 12, 'F');
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                doc.setTextColor(180, 180, 180);
                doc.text("AVF METALURGICA - Reporte generado automaticamente", 15, pageH - 5);
                doc.text(`Pagina ${i} de ${totalPages}`, pageW - 15, pageH - 5, { align: 'right' });
            }

            doc.save(`Reporte_${data.emp.nombre}_${data.emp.apellido}.pdf`);
            this.showToast('PDF generado correctamente', 'success');
        } catch (err) {
            console.error(err);
            alert("Error al generar PDF: " + err.message);
        }
    },

    openEditEmployee(encodedStr) {
        const emp = JSON.parse(decodeURIComponent(encodedStr));
        document.getElementById('edit-emp-id').value = emp.id;
        document.getElementById('edit-emp-nombre').value = emp.nombre;
        document.getElementById('edit-emp-apellido').value = emp.apellido;
        document.getElementById('edit-emp-dni').value = emp.dni;
        document.getElementById('edit-emp-valor').value = emp.valorHora;
        document.getElementById('edit-emp-valor-extra').value = emp.valorHoraExtra || '';
        this.showModal('modal-edit-employee');
    },

    async handleEditEmployee(e) {
        e.preventDefault();
        const id = document.getElementById('edit-emp-id').value;
        const nom = document.getElementById('edit-emp-nombre').value;
        const ape = document.getElementById('edit-emp-apellido').value;
        const dni = document.getElementById('edit-emp-dni').value;
        const valor = document.getElementById('edit-emp-valor').value;
        const valorExtra = document.getElementById('edit-emp-valor-extra').value;

        try {
            await Store.updateEmployee(id, { nombre: nom, apellido: ape, dni, valorHora: valor, valorHoraExtra: valorExtra });
            this.showToast('Empleado actualizado exitosamente');
            this.hideModals();
            this.loadAdminData();
        } catch(err) {
            this.showToast(err.message, 'error');
        }
    },

    async handleAddEmployee(e) {
        e.preventDefault();
        const nom = document.getElementById('add-emp-nombre').value;
        const ape = document.getElementById('add-emp-apellido').value;
        const dni = document.getElementById('add-emp-dni').value;
        const valor = document.getElementById('add-emp-valor').value;
        const valorExtra = document.getElementById('add-emp-valor-extra').value;

        try {
            await Store.addEmployee({ nombre: nom, apellido: ape, dni, valorHora: valor, valorHoraExtra: valorExtra });
            this.showToast('Empleado registrado exitosamente');
            document.getElementById('form-add-employee').reset();
            this.hideModals();
            this.loadAdminData();
        } catch(err) {
            this.showToast(err.message, 'error');
        }
    },

    async handleDeleteEmployee(id, nombre, apellido) {
        Swal.fire({
            title: '¿Eliminar a ' + nombre + ' ' + apellido + '?',
            text: "Esta acción eliminará su acceso y registro como empleado. (Sus pagos y horas quedarán en el historial financiero).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--danger)',
            cancelButtonColor: 'var(--text-muted)',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: 'var(--glass-bg)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await Store.deleteEmployee(id);
                    this.showToast('Empleado eliminado', 'success');
                    this.loadAdminData();
                } catch(err) {
                    this.showToast('Error al eliminar: ' + err.message, 'error');
                }
            }
        });
    },

    async handleAddHours(e) {
        e.preventDefault();
        const empId = document.getElementById('hour-emp-id').value;
        const fecha = document.getElementById('hour-date').value;
        const hourIn = document.getElementById('hour-in').value;
        const hourOut = document.getElementById('hour-out').value;
        
        if (!hourIn || !hourOut) {
            this.showToast('Debe ingresar hora de entrada y salida', 'error');
            return;
        }

        const [inH, inM] = hourIn.split(':').map(Number);
        const [outH, outM] = hourOut.split(':').map(Number);
        
        let inDate = new Date(0, 0, 0, inH, inM, 0);
        let outDate = new Date(0, 0, 0, outH, outM, 0);
        
        if (outDate < inDate) {
            outDate.setDate(outDate.getDate() + 1); // Pasó la medianoche
        }
        
        const diffMs = outDate - inDate;
        const qty = (diffMs / (1000 * 60 * 60)).toFixed(2);

        await Store.addHours(empId, fecha, qty, hourIn, hourOut);
        this.showToast(`Horas registradas exitosamente (${qty} hrs)`);
        document.getElementById('form-add-hours').reset();
        this.loadAdminData();
    },

    async handleAddPayment(e) {
        e.preventDefault();
        const empId = document.getElementById('pay-emp-id').value;
        const amount = document.getElementById('pay-amount').value;
        await Store.addPayment(empId, amount);
        this.showToast('Pago registrado exitosamente');
        document.getElementById('form-add-payment').reset();
        this.loadAdminData();
    },

    async handleAddExpense(e) {
        e.preventDefault();
        const desc = document.getElementById('exp-desc').value;
        const amount = document.getElementById('exp-amount').value;
        await Store.addExpense(desc, amount);
        this.showToast('Gasto registrado exitosamente');
        document.getElementById('form-add-expense').reset();
        this.loadAdminData();
    },

    async handleAddOvertime(e) {
        e.preventDefault();
        const empId = document.getElementById('ovt-emp-id').value;
        const fecha = document.getElementById('ovt-date').value;
        const qty = parseFloat(document.getElementById('ovt-qty').value) || 0;
        const rate = parseFloat(document.getElementById('ovt-rate').value) || 0;
        const amount = qty * rate;
        
        if (amount <= 0) {
            this.showToast('El valor total debe ser mayor a cero', 'error');
            return;
        }

        await Store.addOvertime(empId, fecha, qty, amount);
        this.showToast('Horas extras registradas');
        document.getElementById('form-add-overtime').reset();
        document.getElementById('ovt-total-display').value = '$0.00';
        this.loadAdminData();
    },

    async handleAddAdvance(e) {
        e.preventDefault();
        const empId = document.getElementById('adv-emp-id').value;
        const amount = document.getElementById('adv-amount').value;
        const desc = document.getElementById('adv-desc').value || 'Adelanto de sueldo';
        
        await Store.addAdvance(empId, amount, desc);
        this.showToast('Adelanto registrado');
        document.getElementById('form-add-advance').reset();
        this.loadAdminData();
    },

    // --- HORAS (EDIT/DELETE) ---
    openEditHour(encodedStr) {
        const data = JSON.parse(decodeURIComponent(encodedStr));
        document.getElementById('edit-hour-id').value = data.id;
        document.getElementById('edit-hour-empId').value = data.empId;
        document.getElementById('edit-hour-date').value = data.fecha;
        document.getElementById('edit-hour-in').value = data.ingreso !== '-' ? data.ingreso : '08:00';
        document.getElementById('edit-hour-out').value = data.egreso !== '-' ? data.egreso : '17:00';
        this.showModal('modal-edit-hour');
    },

    async handleEditHour(e) {
        e.preventDefault();
        const id = document.getElementById('edit-hour-id').value;
        const fecha = document.getElementById('edit-hour-date').value;
        const hourIn = document.getElementById('edit-hour-in').value;
        const hourOut = document.getElementById('edit-hour-out').value;
        
        const [inH, inM] = hourIn.split(':').map(Number);
        const [outH, outM] = hourOut.split(':').map(Number);
        
        let inDate = new Date(0, 0, 0, inH, inM, 0);
        let outDate = new Date(0, 0, 0, outH, outM, 0);
        
        if (outDate < inDate) {
            outDate.setDate(outDate.getDate() + 1);
        }
        
        const diffMs = outDate - inDate;
        const qty = (diffMs / (1000 * 60 * 60)).toFixed(2);

        try {
            await Store.updateHour(id, { fecha, cantidad: Number(qty), ingreso: hourIn, egreso: hourOut });
            this.showToast('Horas actualizadas');
            this.hideModals();
            this.loadAdminData();
        } catch(err) { this.showToast(err.message, 'error'); }
    },

    async handleDeleteHour(id) {
        if(confirm('¿Estás seguro de eliminar este registro de horas?')) {
            await Store.deleteHour(id);
            this.showToast('Registro eliminado');
            this.loadAdminData();
        }
    },

    // --- PAGOS (EDIT/DELETE) ---
    openEditPayment(encodedStr) {
        const data = JSON.parse(decodeURIComponent(encodedStr));
        document.getElementById('edit-payment-id').value = data.id;
        document.getElementById('edit-payment-amount').value = data.monto;
        this.showModal('modal-edit-payment');
    },

    async handleEditPayment(e) {
        e.preventDefault();
        const id = document.getElementById('edit-payment-id').value;
        const monto = parseFloat(document.getElementById('edit-payment-amount').value);
        
        try {
            await Store.updatePayment(id, { monto });
            this.showToast('Pago actualizado');
            this.hideModals();
            this.loadAdminData();
        } catch(err) { this.showToast(err.message, 'error'); }
    },

    async handleDeletePayment(id) {
        if(confirm('¿Estás seguro de eliminar este pago?')) {
            await Store.deletePayment(id);
            this.showToast('Pago eliminado');
            this.loadAdminData();
        }
    },

    // --- GASTOS (EDIT/DELETE) ---
    openEditExpense(encodedStr) {
        const data = JSON.parse(decodeURIComponent(encodedStr));
        document.getElementById('edit-expense-id').value = data.id;
        document.getElementById('edit-expense-desc').value = data.descripcion;
        document.getElementById('edit-expense-amount').value = data.monto;
        this.showModal('modal-edit-expense');
    },

    async handleEditExpense(e) {
        e.preventDefault();
        const id = document.getElementById('edit-expense-id').value;
        const desc = document.getElementById('edit-expense-desc').value;
        const monto = parseFloat(document.getElementById('edit-expense-amount').value);
        
        try {
            await Store.updateExpense(id, { descripcion: desc, monto });
            this.showToast('Gasto actualizado');
            this.hideModals();
            this.loadAdminData();
        } catch(err) { this.showToast(err.message, 'error'); }
    },

    async handleDeleteExpense(id) {
        if(confirm('¿Estás seguro de eliminar este gasto?')) {
            await Store.deleteExpense(id);
            this.showToast('Gasto eliminado');
            this.loadAdminData();
        }
    },

    async handleDeleteOvertime(id) {
        if(confirm('¿Estás seguro de eliminar este registro de horas extras?')) {
            await Store.deleteOvertime(id);
            this.showToast('Registro eliminado');
            this.loadAdminData();
        }
    },

    async handleDeleteAdvance(id) {
        if(confirm('¿Estás seguro de eliminar este adelanto?')) {
            await Store.deleteAdvance(id);
            this.showToast('Adelanto eliminado');
            this.loadAdminData();
        }
    },

    // --- OVERTIME (EDIT) ---
    openEditOvertime(encodedStr) {
        const data = JSON.parse(decodeURIComponent(encodedStr));
        document.getElementById('edit-ovt-id').value = data.id;
        document.getElementById('edit-ovt-empId').value = data.empId;
        document.getElementById('edit-ovt-date').value = data.fecha;
        document.getElementById('edit-ovt-qty').value = data.cantidad;
        const rate = data.cantidad > 0 ? (Number(data.valorTotal) / Number(data.cantidad)).toFixed(2) : 0;
        document.getElementById('edit-ovt-rate').value = rate;
        document.getElementById('edit-ovt-total-display').value = `$${Number(data.valorTotal).toFixed(2)}`;
        this.showModal('modal-edit-overtime');
    },

    async handleEditOvertime(e) {
        e.preventDefault();
        const id = document.getElementById('edit-ovt-id').value;
        const fecha = document.getElementById('edit-ovt-date').value;
        const cantidad = parseFloat(document.getElementById('edit-ovt-qty').value) || 0;
        const rate = parseFloat(document.getElementById('edit-ovt-rate').value) || 0;
        const valorTotal = cantidad * rate;

        try {
            await Store.updateOvertime(id, { fecha, cantidad, valorTotal });
            this.showToast('Horas extras actualizadas');
            this.hideModals();
            this.loadAdminData();
        } catch(err) { this.showToast(err.message, 'error'); }
    },

    // --- HELPERS OVERTIME AUTO-CÁLCULO ---
    calcOvertimeTotal(qtyId, rateId, displayId) {
        const qty = parseFloat(document.getElementById(qtyId).value) || 0;
        const rate = parseFloat(document.getElementById(rateId).value) || 0;
        const total = qty * rate;
        document.getElementById(displayId).value = `$${total.toFixed(2)}`;
    },

    async onOvertimeEmpChange() {
        const empId = document.getElementById('ovt-emp-id').value;
        if (!empId) return;
        const employees = await Store.getEmployees();
        const emp = employees.find(e => e.id === empId);
        if (emp && emp.valorHoraExtra) {
            document.getElementById('ovt-rate').value = emp.valorHoraExtra;
            this.calcOvertimeTotal('ovt-qty', 'ovt-rate', 'ovt-total-display');
        }
    },

    // --- HELPER: AUTO-SELECCIONAR QUINCENA ACTUAL ---
    getCurrentQuincenaKey() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = now.getDate();
        const q = d <= 15 ? 1 : 2;
        return `${y}-${m}-${q}`;
    }
};

window.UI = UI;

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
