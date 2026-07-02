/**
 * BASE DE DATOS (FIREBASE REALTIME DATABASE)
 * Conexión final establecida con Firebase.
 */

const firebaseConfig = {
    apiKey: "AIzaSyBbxhanL3ZHgWQ_rvo4xTrHNSE_gu_U47U",
    authDomain: "avf-metalurgica.firebaseapp.com",
    projectId: "avf-metalurgica",
    storageBucket: "avf-metalurgica.firebasestorage.app",
    messagingSenderId: "266395547823",
    appId: "1:266395547823:web:c9947d14e5e155f1613c5a",
    measurementId: "G-MYFYDQMXVY",
    databaseURL: "https://avf-metalurgica-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const Store = {

    // --- EMPLEADOS ---
    async getEmployees() {
        const snapshot = await db.ref('employees').once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    },

    async addEmployee(empData) {
        const employees = await this.getEmployees();
        const exists = employees.find(e => e.dni === empData.dni);
        if (exists) throw new Error("Ya existe un empleado con ese DNI.");
        
        const empId = 'emp_' + Date.now();
        const newEmp = {
            id: empId,
            fechaIngreso: new Date().toISOString(),
            ...empData
        };
        
        await db.ref('employees/' + empId).set(newEmp);
        return newEmp;
    },

    async updateEmployee(empId, updateData) {
        const ref = db.ref('employees/' + empId);
        const sn = await ref.once('value');
        if(!sn.exists()) throw new Error("Empleado no encontrado");
        
        const updated = { ...sn.val(), ...updateData };
        await ref.update(updateData);
        return updated;
    },

    async deleteEmployee(empId) {
        // Alerta: También se podrían borrar sus horas y pagos
        // pero por historial financiero general de la empresa,
        // a veces es mejor dejarlos, o se pueden borrar opcionalmente.
        // Aquí borraremos el empleado.
        await db.ref('employees/' + empId).remove();
    },
    
    // Autenticación de empleado
    async loginEmployee(nombre, apellido, dni) {
        const employees = await this.getEmployees();
        const emp = employees.find(e => 
            e.dni === dni && 
            e.nombre.toLowerCase() === nombre.toLowerCase() && 
            e.apellido.toLowerCase() === apellido.toLowerCase()
        );
        return emp || null;
    },

    // --- HORAS TRABAJADAS ---
    async getAllHours() {
        const snapshot = await db.ref('hours').once('value');
        const data = snapshot.val();
        const arr = data ? Object.values(data) : [];
        return arr.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async getHoursByEmployee(empId) {
        const hours = await this.getAllHours();
        return hours.filter(h => h.empId === empId);
    },

    async addHours(empId, fecha, cantidad, ingreso = '-', egreso = '-') {
        const id = 'hr_' + Date.now();
        const record = {
            id,
            empId,
            fecha, // YYYY-MM-DD
            cantidad: Number(cantidad),
            ingreso,
            egreso
        };
        await db.ref('hours/' + id).set(record);
        return record;
    },

    async updateHour(id, updateData) {
        await db.ref('hours/' + id).update(updateData);
    },

    async deleteHour(id) {
        await db.ref('hours/' + id).remove();
    },

    // --- PAGOS ---
    async getAllPayments() {
        const snapshot = await db.ref('payments').once('value');
        const data = snapshot.val();
        const arr = data ? Object.values(data) : [];
        return arr.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async getPaymentsByEmployee(empId) {
        const payments = await this.getAllPayments();
        return payments.filter(p => p.empId === empId);
    },

    async addPayment(empId, monto) {
        const id = 'pay_' + Date.now();
        const record = {
            id,
            empId,
            monto: Number(monto),
            fecha: new Date().toISOString()
        };
        await db.ref('payments/' + id).set(record);
        return record;
    },

    async updatePayment(id, updateData) {
        await db.ref('payments/' + id).update(updateData);
    },

    async deletePayment(id) {
        await db.ref('payments/' + id).remove();
    },

    // --- GASTOS EMPRESA ---
    async getExpenses() {
        const snapshot = await db.ref('expenses').once('value');
        const data = snapshot.val();
        const arr = data ? Object.values(data) : [];
        return arr.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async addExpense(descripcion, monto) {
        const id = 'exp_' + Date.now();
        const record = {
            id,
            descripcion,
            monto: Number(monto),
            fecha: new Date().toISOString()
        };
        await db.ref('expenses/' + id).set(record);
        return record;
    },

    async updateExpense(id, updateData) {
        await db.ref('expenses/' + id).update(updateData);
    },

    async deleteExpense(id) {
        await db.ref('expenses/' + id).remove();
    },

    // --- ADELANTOS ---
    async getAllAdvances() {
        const snapshot = await db.ref('advances').once('value');
        const data = snapshot.val();
        const arr = data ? Object.values(data) : [];
        return arr.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async getAdvancesByEmployee(empId) {
        const advances = await this.getAllAdvances();
        return advances.filter(a => a.empId === empId);
    },

    async addAdvance(empId, monto, descripcion = 'Adelanto de sueldo') {
        const id = 'adv_' + Date.now();
        const record = {
            id,
            empId,
            monto: Number(monto),
            descripcion,
            fecha: new Date().toISOString()
        };
        await db.ref('advances/' + id).set(record);
        return record;
    },

    async deleteAdvance(id) {
        await db.ref('advances/' + id).remove();
    },

    // --- HORAS EXTRAS ---
    async getAllOvertime() {
        const snapshot = await db.ref('overtime').once('value');
        const data = snapshot.val();
        const arr = data ? Object.values(data) : [];
        return arr.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async getOvertimeByEmployee(empId) {
        const overtime = await this.getAllOvertime();
        return overtime.filter(o => o.empId === empId);
    },

    async addOvertime(empId, fecha, cantidad, valorTotal, descripcion = 'Horas Extras') {
        const id = 'ovt_' + Date.now();
        const record = {
            id,
            empId,
            fecha, // YYYY-MM-DD
            cantidad: Number(cantidad),
            valorTotal: Number(valorTotal),
            descripcion
        };
        await db.ref('overtime/' + id).set(record);
        return record;
    },

    async deleteOvertime(id) {
        await db.ref('overtime/' + id).remove();
    },

    async updateOvertime(id, updateData) {
        await db.ref('overtime/' + id).update(updateData);
    },

    // --- BACKUP ---
    async exportBackup() {
        const snapshot = await db.ref('/').once('value');
        return snapshot.val();
    }
};

window.Store = Store;
