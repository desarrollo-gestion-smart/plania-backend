import admin from "firebase-admin";
export declare const createUser: (nombre: any, numero: any, verificationCode: any) => Promise<{
    id: any;
    nombre: any;
    numero: any;
    status: string;
}>;
export declare const updateUserAvatar: (userId: any, avatarUrl: any) => Promise<{
    id: any;
    avatar: any;
}>;
export declare const updateBusinessAvatar: (businessId: any, avatarUrl: any) => Promise<{
    id: any;
    avatar: any;
}>;
export declare const updateBusinessBanner: (businessId: any, bannerUrl: any) => Promise<{
    id: any;
    banner: any;
}>;
export declare const updateStaffAvatar: (staffId: any, avatarUrl: any) => Promise<{
    id: any;
    avatar: any;
}>;
export declare const verifyUserCode: (userId: any, code: any) => Promise<{
    id: any;
    status: string;
}>;
export declare const addStaff: (businessId: any, nombre: any, numero: any, password: any, avatar?: any, apellido?: string, staffId?: any, options?: {}) => Promise<{
    id: string;
    businessId: any;
    nombre: any;
    apellido: string;
    numero: any;
    avatar: any;
    permissions: {
        manualAppointments: boolean;
        manualBlocks: boolean;
        viewClientPhone: boolean;
    };
}>;
export declare const getStaffByBusiness: (businessId: any) => Promise<{
    apellido: string;
    avatar: any;
    businessId: any;
    createdAt: any;
    id: string;
    nombre: any;
    numero: any;
    password: any;
    updatedAt: any;
    staffServices: any[];
    staffdates: any[];
    staffAppoinments: any[];
    staffAppointmentsHour: any[];
    permissions: {
        manualAppointments: boolean;
        manualBlocks: boolean;
        viewClientPhone: boolean;
    };
}[]>;
export declare const loginStaff: (numero: any, password: any) => Promise<{
    id: any;
    businessId: any;
    nombre: any;
    apellido: any;
    numero: any;
    avatar: any;
}>;
export declare const findBusinessUser: (nombre: any, numero: any) => Promise<{
    id: any;
    nombre: any;
    correo: any;
    numero: any;
    avatar: any;
    banner: any;
}>;
/** Busca un usuario de la app (colección users) por número. Si hay varios, devuelve el más reciente. */
export declare const getAppUserByNumero: (numero: any) => Promise<{
    id: any;
    nombre: any;
    numero: any;
    status: any;
    type: string;
}>;
export declare const getBusinessUserByNumero: (numero: any) => Promise<{
    id: any;
    nombre: any;
    correo: any;
    numero: any;
    avatar: any;
    banner: any;
    isInitialSetupComplete: boolean;
    type: string;
}>;
export declare const loginBusinessUser: (numero: any, password: any) => Promise<{
    id: any;
    nombre: any;
    correo: any;
    numero: any;
    avatar: any;
    banner: any;
    isInitialSetupComplete: boolean;
}>;
export declare const createBusinessUser: (nombre: any, correo: any, numero: any, password: any, avatar?: any) => Promise<{
    id: any;
    nombre: any;
    correo: any;
    numero: any;
    verificationCode: string;
}>;
export declare const resendVerificationCode: (userId: any) => Promise<{
    id: any;
    numero: any;
    verificationCode: string;
    nextAvailableResendAt: number;
}>;
export declare const verifyBusinessCode: (id: any, code: any) => Promise<{
    id: any;
    status: string;
}>;
export declare const resendBusinessVerificationCode: (id: any) => Promise<{
    id: any;
    numero: any;
    verificationCode: string;
    nextAvailableResendAt: number;
}>;
export declare const updateStaffFields: (staffId: any, { nombre, apellido, numero, password, permissions }: {
    nombre: any;
    apellido: any;
    numero: any;
    password: any;
    permissions: any;
}) => Promise<{
    id: string;
    nombre: any;
    apellido: any;
    numero: any;
    permissions: any;
}>;
export declare const APPOINTMENT_STATES: string[];
export declare const createAppointment: ({ businessId, staffId, userId, serviceId, date, horario, calificacion, }: {
    businessId: any;
    staffId: any;
    userId: any;
    serviceId: any;
    date: any;
    horario: any;
    calificacion: any;
}) => Promise<{
    businessId: number;
    idappointment: any;
    staffdates: string;
    staffAppoinments: string;
    staffAppointmentsHour: string;
    serviceId: number;
    serviceType: string;
    serviceDuration: number;
    state: string;
    userId: number;
    userNombre: any;
    userNumero: any;
    userAvatar: any;
}>;
export declare const updateAppointmentState: (appointmentId: any, newState: any) => Promise<{
    idappointment: number;
    state: any;
}>;
export declare const updateAppointmentReschedule: (appointmentId: any, date: any, horario: any) => Promise<{
    idappointment: number;
    date: string;
    horario: string;
}>;
export declare const updateAppointmentCalificacion: (appointmentsId: any, calificacion: any, descripcion: any) => Promise<{
    idappointment: number;
    calificacion: number;
    descripcion: string;
    calificacionUpdatedAt: string;
}>;
export declare const deleteAppointment: (appointmentId: any) => Promise<{
    idappointment: number;
    deleted: boolean;
}>;
export declare const getAppointmentsByBusiness: (businessId: any) => Promise<{
    businessId: number;
    idappointment: number;
    staffdates: string;
    staffAppoinments: number;
    staffAppointmentsHour: string;
    serviceType: string;
    serviceDuration: any;
    direccion: any;
    state: any;
    calificacion: number;
    staffNombre: any;
    staffApellido: any;
    service: any;
    userId: number;
    userNombre: any;
    userNumero: any;
    userAvatar: any;
}[]>;
export declare const getAppointmentsByClientId: (clientId: any) => Promise<{
    businessId: number;
    idappointment: number;
    staffdates: string;
    staffAppoinments: number;
    staffAppointmentsHour: string;
    serviceType: string;
    serviceDuration: any;
    direccion: any;
    state: any;
    status: any;
    calificacion: number;
    calificacionUpdatedAt: string;
    userId: number;
    userNombre: any;
    userNumero: any;
    userAvatar: any;
}[]>;
/**
 * Agrupa clientes por cantidad de citas en el negocio.
 * - mejores: userId con más de 3 citas (count > 3)
 * - noTeVisitan: userId con exactamente 3 citas
 * - noHanVuelto: userId con 1 o 2 citas
 * - todos: todos los userId únicos con al menos 1 cita
 * Cada item es { userId, userName, userAvatar, staffdates }. userName viene de userNombre en las citas.
 */
export declare const getListClientsByBusiness: (businessId: any) => Promise<{
    todos: any[];
    mejores: any[];
    noTeVisitan: any[];
    noHanVuelto: any[];
}>;
export declare const getAppointmentsWithStaffByBusiness: (businessId: any) => Promise<{
    id: number;
    staffId: string;
    staffname: any;
    serviceType: any;
    horario: any;
    calificacion: any;
    date: any;
}[]>;
export declare const getStaffNameById: (staffId: any) => Promise<{
    id: string;
    nombre: any;
}>;
export declare const createBusinessSchedule: (businessId: any, payload: any) => Promise<{
    id: any;
    businessId: number;
    days: {};
    holidays: boolean;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}>;
export declare const updateBusinessSchedule: (businessId: any, scheduleId: any, payload: any) => Promise<admin.firestore.DocumentData>;
export declare const deleteBusinessSchedule: (businessId: any, scheduleId: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const getBusinessSchedules: (businessId: any) => Promise<admin.firestore.DocumentData[]>;
export declare const createStaffSchedule: (businessId: any, staffId: any, payload: any) => Promise<{
    id: any;
    businessId: number;
    staffId: string;
    days: {};
    holidays: boolean;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}>;
export declare const updateStaffSchedule: (businessId: any, staffId: any, scheduleId: any, payload: any) => Promise<admin.firestore.DocumentData>;
export declare const deleteStaffSchedule: (businessId: any, staffId: any, scheduleId: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const getStaffSchedules: (staffId: any) => Promise<admin.firestore.DocumentData[]>;
/** Elimina un usuario business y sus datos relacionados (staff, appointments). */
export declare const deleteBusinessUser: (businessId: any) => Promise<{
    id: number;
    message: string;
}>;
export declare const getBusinessById: (businessId: any) => Promise<{
    id: any;
    nombre: any;
    correo: any;
    numero: any;
    avatar: any;
    banner: any;
    name: any;
    description: any;
    direccion: any;
    isInitialSetupComplete: boolean;
    policies: {
        cancellationAdvanceMinutes: any;
        minAdvanceBookingMinutes: any;
        reminderMinutes: any;
    };
}>;
export declare const getAllUsers: () => Promise<{
    id: any;
    nombre: any;
    numero: any;
    status: any;
    createdAt: any;
    verifiedAt: any;
}[]>;
export declare const getAllClients: () => Promise<{
    id: any;
    nombre: any;
    apellido: any;
    avatar: any;
    numero: any;
}[]>;
export declare const getClientById: (clientId: any) => Promise<{
    id: any;
    nombre: any;
    apellido: any;
    avatar: any;
    numero: any;
}>;
export declare const updateClientById: (clientId: any, updateData?: {}) => Promise<{
    id: any;
    nombre: any;
    apellido: any;
    avatar: any;
    numero: any;
}>;
export declare const deleteClientById: (clientId: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const getAllBusinesses: () => Promise<{
    businessId: any;
    nombre: any;
    numero: any;
    avatar: any;
    banner: any;
    name: any;
}[]>;
export declare const createService: (businessId: any, name: any, type: any, duration: any, price: any, category: any, description: any, promotionTerms: any, promotionValidUntil: any, promotionValidIndefinite: any) => Promise<{
    id: any;
    businessId: number;
    name: string;
    type: string;
    duration: number;
    price: number;
    category: string;
    description: string;
    promotionTerms: string;
    promotionValidUntil: any;
    promotionValidIndefinite: boolean;
    archived: boolean;
    createdAt: admin.firestore.FieldValue;
}>;
export declare const updateService: (businessId: any, serviceId: any, updateData: any) => Promise<{
    staff: any[];
}>;
export declare const deleteService: (businessId: any, serviceId: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const getServicesByBusiness: (businessId: any, category: any, staffId: any) => Promise<{
    id: any;
    businessId: number;
    name: any;
    type: any;
    duration: any;
    staffDuration: any;
    staffcommission: any;
    staff: {
        id: string | number;
        staffDuration: any;
        staffcommission: any;
        staffprice: any;
        nombre: any;
        apellido: any;
    }[];
    price: any;
    category: any;
    description: any;
    archived: any;
    promotionTerms: any;
    promotionValidUntil: any;
    promotionValidIndefinite: any;
}[]>;
export declare const getGeneralServicesByBusiness: ({ page, limit }: {
    page?: number;
    limit?: number;
}) => Promise<{
    businesses: any[];
    pagination: {
        page: number;
        limit: number;
        totalBusinesses: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}>;
export declare const getServiceTypesByBusiness: (businessId: any) => Promise<{
    type: any;
    services: any;
}[]>;
export declare const setStaffServices: (businessId: any, staffId: any, serviceIds: any) => Promise<{
    staffId: string;
    businessId: number;
    services: any[];
}>;
export declare const updateBusinessPolicies: (businessId: any, { cancellationAdvanceMinutes, minAdvanceBookingMinutes, reminderMinutes }: {
    cancellationAdvanceMinutes: any;
    minAdvanceBookingMinutes: any;
    reminderMinutes: any;
}) => Promise<{
    cancellationAdvanceMinutes: any;
    minAdvanceBookingMinutes: any;
    reminderMinutes: any;
}>;
export declare const getBusinessPolicies: (businessId: any) => Promise<{
    cancellationAdvanceMinutes: any;
    minAdvanceBookingMinutes: any;
    reminderMinutes: any;
}>;
/** Categorías predefinidas de gastos (solo id y name para listado en Swagger/API) */
export declare const getExpenseCategories: () => {
    id: number;
    name: string;
}[];
export declare const getExpenseCategoryById: (categoryId: any) => any;
export declare const createExpenseCategory: (businessId: any, name: any) => Promise<{
    id: any;
    businessId: number;
    name: string;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}>;
export declare const getExpenseCategoriesByBusiness: (businessId: any) => Promise<{
    id: any;
    businessId: number;
    name: any;
}[]>;
export declare const createExpense: ({ businessId, name, category, categoryId, paidAt, amount, }: {
    businessId: any;
    name: any;
    category: any;
    categoryId: any;
    paidAt: any;
    amount: any;
}) => Promise<{
    id: any;
    businessId: number;
    name: string;
    categoryId: number;
    categoryName: any;
    amount: number;
    paidAt: string;
    paidAtISO: string;
    isoYear: number;
    isoWeek: number;
}>;
export declare const getExpensesByBusiness: (businessId: any, { year, week }?: {}) => Promise<{
    id: any;
    businessId: number;
    name: any;
    categoryId: any;
    categoryName: any;
    amount: any;
    paidAt: any;
    paidAtISO: any;
    isoYear: any;
    isoWeek: any;
    year: any;
    month: any;
}[]>;
export declare const getIncomeCategoryById: (categoryId: any) => any;
export declare const getIncomeCategories: () => {
    id: number;
    name: string;
}[];
export declare const createIncome: ({ businessId, name, categoryId, receivedAt, amount, }: {
    businessId: any;
    name: any;
    categoryId: any;
    receivedAt: any;
    amount: any;
}) => Promise<{
    id: any;
    businessId: number;
    name: string;
    categoryId: any;
    categoryName: any;
    amount: number;
    receivedAt: string;
    receivedAtISO: string;
    isoYear: number;
    isoWeek: number;
}>;
export declare const getIncomesByBusiness: (businessId: any, { year, week }?: {}) => Promise<{
    id: any;
    businessId: number;
    name: any;
    categoryId: any;
    categoryName: any;
    amount: any;
    receivedAt: any;
    receivedAtISO: any;
    isoYear: any;
    isoWeek: any;
    year: any;
    month: any;
}[]>;
export declare const updateIncome: (id: any, { name, category, categoryId, receivedAt, amount }: {
    name: any;
    category: any;
    categoryId: any;
    receivedAt: any;
    amount: any;
}) => Promise<{
    id: number;
    businessId: any;
    name: any;
    categoryId: any;
    categoryName: any;
    amount: any;
    receivedAt: any;
    receivedAtISO: any;
    isoYear: any;
    isoWeek: any;
}>;
export declare const deleteIncome: (id: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const deleteExpense: (id: any) => Promise<{
    id: number;
    deleted: boolean;
}>;
export declare const getBusinessResults: (businessId: any, { startDate, endDate, year, week }?: {}) => Promise<{
    businessId: number;
    filters: {
        startDate: any;
        endDate: any;
        year: any;
        week: any;
    };
    summary: {
        totalExpenses: number;
        totalIncomes: number;
        netResult: number;
        expensePercentage: number;
        incomePercentage: number;
    };
    expenses: {
        items: {
            id: any;
            businessId: number;
            name: any;
            categoryId: any;
            categoryName: any;
            amount: any;
            paidAt: any;
            paidAtISO: any;
            isoYear: any;
            isoWeek: any;
            year: any;
            month: any;
        }[];
        count: number;
        total: number;
        totalCat1: number;
        totalCat2: number;
        totalCat3: number;
        totalCat4: number;
        totalCat5: number;
        totalCat6: number;
        totalCat7: number;
    };
    incomes: {
        items: {
            id: any;
            businessId: number;
            name: any;
            categoryId: any;
            categoryName: any;
            amount: any;
            receivedAt: any;
            receivedAtISO: any;
            isoYear: any;
            isoWeek: any;
            year: any;
            month: any;
        }[];
        count: number;
        total: number;
        totalCatproduct: number;
        totalCatservice: number;
    };
}>;
export declare const getBusinessMostUsedTypes: (businessId: any) => Promise<{
    mostUsedServicioType: any[];
    mostUsedProductoType: any[];
}>;
//# sourceMappingURL=firestoreService.d.ts.map