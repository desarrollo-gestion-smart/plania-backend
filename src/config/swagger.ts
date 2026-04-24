import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const serverUrl = process.env.SERVER_URL || "http://3.80.174.154";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Plania API",
      version: "1.0.0",
      description: "API para la plataforma Plania — gestión de negocios, personal y citas.",
    },
    servers: [
      {
        url: `${serverUrl}/api`,
        description: "Production server",
      },
      {
        url: "/api",
        description: "API base path (local development)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Ingresa el planiaToken obtenido en el login",
        },
      },
      schemas: {
        // ─── Errores ────────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Mensaje de error" },
          },
        },
        ErrorWithCode: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string", example: "TOKEN_EXPIRED" },
          },
        },

        // ─── Usuarios App ──────────────────────────────────────
        RegisterUserRequest: {
          type: "object",
          required: ["nombre", "numero"],
          properties: {
            nombre: { type: "string", example: "Juan Pérez" },
            numero: { type: "string", example: "3001234567" },
          },
        },
        RegisterUserResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            userId: { type: "number" },
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                nombre: { type: "string" },
                numero: { type: "string" },
                status: { type: "string", example: "pending_verification" },
              },
            },
          },
        },
        VerifyUserRequest: {
          type: "object",
          required: ["userId", "code"],
          properties: {
            userId: { type: "number", example: 1 },
            code: { type: "string", example: "123456" },
          },
        },
        ResendCodeRequest: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "number", example: 1 },
          },
        },

        // ─── Login ─────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["numero"],
          properties: {
            numero: { type: "string", example: "3001234567" },
          },
        },
        LoginUserResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login exitoso" },
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                nombre: { type: "string" },
                numero: { type: "string" },
                status: { type: "string" },
              },
            },
            type: { type: "string", example: "user" },
            planiaToken: { type: "string", description: "JWT token de autenticación" },
            refreshToken: { type: "string", description: "JWT de refresh (también en cookie HttpOnly)" },
          },
        },
        LoginBusinessResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login exitoso" },
            business: {
              type: "object",
              properties: {
                id: { type: "number" },
                nombre: { type: "string" },
                correo: { type: "string" },
                numero: { type: "string" },
                avatar: { type: "string", nullable: true },
                banner: { type: "string", nullable: true },
                isInitialSetupComplete: { type: "boolean" },
              },
            },
            type: { type: "string", example: "business" },
            planiaToken: { type: "string", description: "JWT token de autenticación" },
            refreshToken: { type: "string", description: "JWT de refresh (también en cookie HttpOnly)" },
          },
        },

        // ─── Business ──────────────────────────────────────────
        RegisterBusinessRequest: {
          type: "object",
          required: ["nombre", "correo", "numero", "password", "terms"],
          properties: {
            nombre: { type: "string", example: "Mi Barbería" },
            correo: { type: "string", format: "email", example: "negocio@email.com" },
            numero: { type: "string", example: "3009876543" },
            password: { type: "string", example: "Password1", description: "Min 6 chars, 1 mayúscula, 1 número" },
            terms: { type: "boolean", example: true },
            avatar: { type: "string", nullable: true, description: "URL de avatar (opcional)" },
          },
        },
        RegisterBusinessResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            business: {
              type: "object",
              properties: {
                id: { type: "number" },
                nombre: { type: "string" },
                correo: { type: "string" },
                numero: { type: "string" },
                status: { type: "string", example: "pending_verification" },
              },
            },
          },
        },
        LoginBusinessRequest: {
          type: "object",
          required: ["numero", "password"],
          properties: {
            numero: { type: "string", example: "3009876543" },
            password: { type: "string", example: "Password1" },
          },
        },
        LoginBusinessWithTokenResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login exitoso" },
            business: {
              type: "object",
              properties: {
                id: { type: "number" },
                nombre: { type: "string" },
                correo: { type: "string" },
                numero: { type: "string" },
                avatar: { type: "string", nullable: true },
                banner: { type: "string", nullable: true },
                isInitialSetupComplete: { type: "boolean" },
              },
            },
            planiaToken: { type: "string", description: "JWT token de autenticación" },
            refreshToken: { type: "string", description: "JWT de refresh (también en cookie HttpOnly)" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          properties: {
            refreshToken: { type: "string", description: "Opcional si se usa cookie HttpOnly" },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          properties: {
            planiaToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        LogoutResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Logout exitoso" },
          },
        },
        BusinessPolicies: {
          type: "object",
          properties: {
            cancellationAdvanceMinutes: { type: "number", nullable: true, example: 120, description: "Minutos de antelación para cancelar una cita" },
            minAdvanceBookingMinutes: { type: "number", nullable: true, example: 60, description: "Antelación mínima para agendar" },
            reminderMinutes: { type: "number", nullable: true, example: 30, description: "Minutos antes para enviar recordatorio" },
          },
        },
        UpdateBusinessPoliciesRequest: {
          type: "object",
          properties: {
            cancellationAdvanceMinutes: { type: "string", nullable: true, example: "120", description: "Enviar 'null' para limpiar" },
            minAdvanceBookingMinutes: { type: "string", nullable: true, example: "60", description: "Enviar 'null' para limpiar" },
            reminderMinutes: { type: "string", nullable: true, example: "30", description: "Enviar 'null' para limpiar" },
          },
        },
        Expense: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            name: { type: "string", example: "Compra de insumos" },
            categoryId: { type: "number", nullable: true },
            categoryName: { type: "string", example: "Insumos" },
            amount: { type: "number", example: 150.5 },
            paidAt: { type: "string", example: "15/02/2026", description: "dd/MM/YYYY" },
            paidAtISO: { type: "string", example: "2026-02-15" },
            isoYear: { type: "number", example: 2026 },
            isoWeek: { type: "number", example: 7 },
          },
        },
        CreateExpenseRequest: {
          type: "object",
          required: ["businessId", "name", "paidAt", "amount", "categoryId"],
          properties: {
            businessId: { type: "number", example: 1 },
            name: { type: "string", example: "Compra de toallas" },
            categoryId: { type: "number", example: 3, description: "ID de la categoría (obtener listado desde GET /expense-categories)" },
            paidAt: { type: "string", example: "15/02/2026", description: "dd/MM/YYYY o YYYY-MM-DD" },
            amount: { type: "number", example: 250.0 },
          },
        },
        ListExpensesResponse: {
          type: "object",
          properties: {
            expenses: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Expense" } },
                count: { type: "number", description: "Cantidad de gastos" },
                total: { type: "number", description: "Suma de todos los amount" },
                totalCat1: { type: "number", description: "Suma amount categoría 1 (Gastos)" },
                totalCat2: { type: "number", description: "Suma amount categoría 2 (Pago de comisiones)" },
                totalCat3: { type: "number", description: "Suma amount categoría 3 (Utilidades de servicios)" },
                totalCat4: { type: "number", description: "Suma amount categoría 4 (Utilidades de productos)" },
                totalCat5: { type: "number", description: "Suma amount categoría 5 (Tasa de ocupación)" },
                totalCat6: { type: "number", description: "Suma amount categoría 6 (Valor de facturas del mes)" },
                totalCat7: { type: "number", description: "Suma amount categoría 7 (Cantidad de facturas del mes)" },
              },
            },
          },
        },
        ExpenseCategory: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            name: { type: "string", example: "Insumos" },
          },
        },
        ExpenseCategoryItem: {
          type: "object",
          description: "Categoría predefinida de gastos (id y nombre)",
          properties: {
            id: { type: "number", example: 1 },
            name: { type: "string", example: "Gastos" },
          },
        },
        ListPredefinedExpenseCategoriesResponse: {
          type: "object",
          description: "Lista de categorías predefinidas: Gastos, Pago de comisiones, Utilidades de servicios, Utilidades de productos, Tasa de ocupación, Valor de facturas del mes, Cantidad de facturas del mes",
          properties: {
            categories: { type: "array", items: { $ref: "#/components/schemas/ExpenseCategoryItem" } },
            total: { type: "number", example: 7 },
          },
        },
        CreateExpenseCategoryRequest: {
          type: "object",
          required: ["businessId", "name"],
          properties: {
            businessId: { type: "number", example: 1 },
            name: { type: "string", example: "Renta" },
          },
        },
        ListExpenseCategoriesResponse: {
          type: "object",
          properties: {
            categories: { type: "array", items: { $ref: "#/components/schemas/ExpenseCategory" } },
            total: { type: "number" },
          },
        },
        Income: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            name: { type: "string", example: "Venta de servicios" },
            categoryId: { type: "number", nullable: true },
            categoryName: { type: "string", example: "Servicios" },
            amount: { type: "number", example: 500.0 },
            receivedAt: { type: "string", example: "15/02/2026", description: "dd/MM/YYYY" },
            receivedAtISO: { type: "string", example: "2026-02-15" },
            isoYear: { type: "number", example: 2026 },
            isoWeek: { type: "number", example: 7 },
          },
        },
        CreateIncomeRequest: {
          type: "object",
          required: ["businessId", "name", "categoryId", "receivedAt", "amount"],
          properties: {
            businessId: { type: "number", example: 1 },
            name: { type: "string", example: "Corte de cabello" },
            categoryId: { type: "number", example: 2, description: "ID de la categoría: 1=Venta de productos, 2=Venta de servicios" },
            receivedAt: { type: "string", example: "15/02/2026", description: "dd/MM/YYYY o YYYY-MM-DD" },
            amount: { type: "number", example: 50.0 },
          },
        },
        UpdateIncomeRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Corte y lavado" },
            categoryId: { type: "number", nullable: true, example: 2, description: "ID de la categoría: 1=Venta de productos, 2=Venta de servicios" },
            receivedAt: { type: "string", example: "16/02/2026", description: "dd/MM/YYYY o YYYY-MM-DD" },
            amount: { type: "number", example: 60.0 },
          },
        },
        ListIncomesResponse: {
          type: "object",
          properties: {
            incomes: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Income" } },
                count: { type: "number", description: "Cantidad de ingresos" },
                total: { type: "number", description: "Suma de todos los amount" },
                totalCatproduct: { type: "number", description: "Suma de amount de categoría 1 (Venta de productos)" },
                totalCatservice: { type: "number", description: "Suma de amount de categoría 2 (Venta de servicios)" },
              },
            },
          },
        },
        DeleteResponse: {
          type: "object",
          properties: {
            id: { type: "number" },
            deleted: { type: "boolean" },
          },
        },
        IncomeCategory: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            name: { type: "string", example: "Venta de productos" },
          },
        },
        ListIncomeCategoriesResponse: {
          type: "object",
          properties: {
            categories: { type: "array", items: { $ref: "#/components/schemas/IncomeCategory" } },
            total: { type: "number", example: 2 },
          },
        },
        BusinessResults: {
          type: "object",
          properties: {
            businessId: { type: "number" },
            filters: {
              type: "object",
              properties: {
                startDate: { type: "string", nullable: true, example: "2026-02-01" },
                endDate: { type: "string", nullable: true, example: "2026-02-28" },
                year: { type: "number", nullable: true, example: 2026 },
                week: { type: "number", nullable: true, example: 7 },
              },
            },
            summary: {
              type: "object",
              properties: {
                totalExpenses: { type: "number", example: 1500.5 },
                totalIncomes: { type: "number", example: 3000.0 },
                netResult: { type: "number", example: 1499.5 },
                expensePercentage: { type: "number", example: 33.34 },
                incomePercentage: { type: "number", example: 66.66 },
              },
            },
            expenses: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Expense" } },
                count: { type: "number", example: 5 },
                total: { type: "number", example: 1500.5 },
                totalCat1: { type: "number", description: "Suma amount categoría 1 (Gastos)" },
                totalCat2: { type: "number", description: "Suma amount categoría 2 (Pago de comisiones)" },
                totalCat3: { type: "number", description: "Suma amount categoría 3 (Utilidades de servicios)" },
                totalCat4: { type: "number", description: "Suma amount categoría 4 (Utilidades de productos)" },
                totalCat5: { type: "number", description: "Suma amount categoría 5 (Tasa de ocupación)" },
                totalCat6: { type: "number", description: "Suma amount categoría 6 (Valor de facturas del mes)" },
                totalCat7: { type: "number", description: "Suma amount categoría 7 (Cantidad de facturas del mes)" },
              },
            },
            incomes: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Income" } },
                count: { type: "number", example: 10 },
                total: { type: "number", example: 3000.0 },
                totalCatproduct: { type: "number", description: "Suma de amount de categoría 1 (Venta de productos)" },
                totalCatservice: { type: "number", description: "Suma de amount de categoría 2 (Venta de servicios)" },
              },
            },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            name: { type: "string" },
            type: { type: "string" },
            duration: { type: "number", description: "Duration in minutes" },
            staffcommission: { type: "number", nullable: true, description: "Comisión del staff" },
            price: { type: "number" },
            staff: {
              type: "array",
              description: "Listado de staff asignado al servicio",
              items: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  staffDuration: { type: "number", nullable: true },
                  staffcommission: { type: "number", nullable: true },
                  staffprice: { type: "number", nullable: true },
                },
              },
            },
            category: { type: "string", enum: ["service", "promotion"] },
            description: { type: "string" },
            archived: { type: "boolean", example: false },
            promotionTerms: { type: "string", description: "Solo para category=promotion" },
            promotionValidUntil: { type: "string", nullable: true, description: "dd/MM/YYYY (solo para category=promotion)" },
            promotionValidIndefinite: { type: "boolean", description: "Solo para category=promotion" },
          },
        },
        DaySchedule: {
          type: "object",
          properties: {
            active: { type: "boolean", example: true },
            start: { type: "string", nullable: true, example: "09:00" },
            until: { type: "string", nullable: true, example: "18:00" },
            breakStart: { type: "string", nullable: true, example: "13:00" },
            breakUntil: { type: "string", nullable: true, example: "14:00" },
          },
        },
        Schedule: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            holidays: { type: "boolean" },
            days: {
              type: "object",
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        CreateScheduleRequest: {
          type: "object",
          required: ["businessId", "days"],
          properties: {
            businessId: { type: "number", example: 1 },
            holidays: { type: "boolean", example: false },
            days: {
              type: "object",
              example: {
                monday: { active: false },
                tuesday: { active: true, start: "10:00", until: "20:00", breakStart: "12:00", breakUntil: "13:00" },
              },
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        UpdateScheduleRequest: {
          type: "object",
          required: ["businessId"],
          properties: {
            businessId: { type: "number", example: 1 },
            holidays: { type: "boolean" },
            days: {
              type: "object",
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        StaffSchedule: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
            staffId: { type: "string" },
            holidays: { type: "boolean" },
            days: {
              type: "object",
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        CreateStaffScheduleRequest: {
          type: "object",
          required: ["businessId", "days"],
          properties: {
            businessId: { type: "number", example: 1 },
            holidays: { type: "boolean", example: false },
            days: {
              type: "object",
              example: {
                monday: { active: false },
                wednesday: { active: true, start: "10:00", until: "18:00" },
              },
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        UpdateStaffScheduleRequest: {
          type: "object",
          required: ["businessId"],
          properties: {
            businessId: { type: "number", example: 1 },
            holidays: { type: "boolean" },
            days: {
              type: "object",
              properties: {
                monday: { $ref: "#/components/schemas/DaySchedule" },
                tuesday: { $ref: "#/components/schemas/DaySchedule" },
                wednesday: { $ref: "#/components/schemas/DaySchedule" },
                thursday: { $ref: "#/components/schemas/DaySchedule" },
                friday: { $ref: "#/components/schemas/DaySchedule" },
                saturday: { $ref: "#/components/schemas/DaySchedule" },
                sunday: { $ref: "#/components/schemas/DaySchedule" },
              },
            },
          },
        },
        CreateServiceRequest: {
          type: "object",
          required: ["businessId", "name", "type", "duration", "price", "category"],
          properties: {
            businessId: { type: "number", example: 1 },
            name: { type: "string", example: "Haircut" },
            type: { type: "string", example: "corte" },
            duration: { type: "number", example: 30 },
            price: { type: "number", example: 20.0 },
            category: { type: "string", enum: ["service", "promotion"], example: "service" },
            description: { type: "string", example: "Servicio completo de corte y lavado" },
            promotionTerms: { type: "string", example: "Aplica de lunes a jueves", description: "Requerido si category=promotion" },
            promotionValidUntil: { type: "string", example: "31/12/2026", description: "Opcional si category=promotion (dd/MM/YYYY)" },
            promotionValidIndefinite: { type: "boolean", example: true, description: "Opcional si category=promotion. Si es true, no enviar promotionValidUntil" },
          },
        },
        UpdateServiceRequest: {
          type: "object",
          required: ["businessId"],
          properties: {
            businessId: { type: "number", example: 1 },
            name: { type: "string", example: "Haircut" },
            type: { type: "string", example: "corte" },
            duration: { type: "number", example: 45 },
            price: { type: "number", example: 25.0 },
            category: { type: "string", enum: ["service", "promotion"], example: "promotion" },
            description: { type: "string", example: "Incluye coloración y peinado" },
            archived: { type: "boolean", example: true },
            promotionTerms: { type: "string", example: "Válida hasta fin de mes", description: "Solo si category=promotion" },
            promotionValidUntil: { type: "string", example: "30/03/2026", description: "Solo si category=promotion (dd/MM/YYYY)" },
            promotionValidIndefinite: { type: "boolean", example: false, description: "Solo si category=promotion" },
            staffDuration: { type: "string", nullable: true, example: "45", description: "Enviar 'null' para limpiar" },
            staffcommission: { type: "string", nullable: true, example: "10", description: "Enviar 'null' para limpiar" },
            staffprice: { type: "string", nullable: true, example: "35", description: "Enviar 'null' para limpiar" },
            staffId: { type: "string", nullable: true, example: "5", description: "Opcional: aplicar overrides para un staff específico y asignarlo al servicio" },
          },
        },
        ListServicesResponse: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: { $ref: "#/components/schemas/Service" },
            },
            total: { type: "number" },
          },
        },
        ServiceType: {
          type: "object",
          properties: {
            type: { type: "string", example: "corte" },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  name: { type: "string", example: "Haircut" },
                  duration: { type: "number", nullable: true, description: "Duration in minutes" },
                  staffDuration: { type: "string", nullable: true, description: "Duración por staff como string o null" },
                },
              },
            },
          },
        },
        ListServiceTypesResponse: {
          type: "object",
          properties: {
            types: {
              type: "array",
              items: { $ref: "#/components/schemas/ServiceType" },
            },
            total: { type: "number" },
          },
        },
        VerifyBusinessRequest: {
          type: "object",
          required: ["id", "code"],
          properties: {
            id: { type: "number", example: 1 },
            code: { type: "string", example: "123456" },
          },
        },
        ResendBusinessRequest: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", example: 1 },
          },
        },

        // ─── Staff ─────────────────────────────────────────────
        AddStaffRequest: {
          type: "object",
          required: ["businessId", "nombre", "numero", "password"],
          properties: {
            businessId: { type: "number", example: 1 },
            id: { type: "number", nullable: true, description: "ID personalizado (opcional)" },
            nombre: { type: "string", example: "Carlos" },
            apellido: { type: "string", example: "García" },
            numero: { type: "string", example: "3005551234" },
            password: { type: "string", example: "Staff123" },
          },
        },
        AddStaffResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            staff: {
              type: "object",
              properties: {
                id: { type: "number" },
                businessId: { type: "number" },
                nombre: { type: "string" },
                apellido: { type: "string" },
                numero: { type: "string" },
              },
            },
          },
        },
        LoginStaffRequest: {
          type: "object",
          required: ["numero", "password"],
          properties: {
            numero: { type: "string", example: "3005551234" },
            password: { type: "string", example: "Staff123" },
          },
        },
        LoginStaffResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login exitoso" },
            staff: { type: "object" },
            planiaToken: { type: "string", description: "JWT token de autenticación" },
          },
        },
        UpdateStaffRequest: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", example: 1 },
            nombre: { type: "string" },
            apellido: { type: "string" },
            numero: { type: "string" },
            password: { type: "string" },
          },
        },
        SetStaffServicesRequest: {
          type: "object",
          required: ["businessId", "serviceIds"],
          properties: {
            businessId: { type: "number", example: 1 },
            serviceIds: { type: "array", items: { type: "number" }, example: [1, 2, 3] },
          },
        },
        SetStaffServicesResponse: {
          type: "object",
          properties: {
            staffId: { type: "string" },
            businessId: { type: "number" },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                },
              },
            },
          },
        },

        // ─── Appointments ──────────────────────────────────────
        CreateAppointmentRequest: {
          type: "object",
          required: ["businessId", "staffId", "userId", "date", "horario"],
          properties: {
            businessId: { type: "number", example: 1 },
            staffId: { type: "string", example: "5" },
            userId: { type: "number", example: 42, description: "ID de usuario de la app" },
            service: { type: "number", example: 1, description: "Service ID seleccionado" },
            date: { type: "string", example: "15/03/2026", description: "Formato dd/MM/YYYY" },
            horario: { type: "string", example: "10:00" },
            calificacion: { type: "number", nullable: true, example: 5 },
          },
        },
        CreateAppointmentResponse: {
          type: "object",
          properties: {
            appointment: {
              type: "object",
              properties: {
                businessId: { type: "number" },
                staffId: { type: "string" },
                date: { type: "string" },
                horario: { type: "string" },
                calificacion: { type: "number", nullable: true },
                idappointment: { type: "number" },
                state: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"] },
                service: { $ref: "#/components/schemas/Service" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    nombre: { type: "string" },
                    numero: { type: "string" },
                  },
                },
              },
            },
          },
        },
        UpdateAppointmentStateRequest: {
          type: "object",
          required: ["state"],
          properties: {
            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"], example: "confirmado" },
          },
        },
        UpdateAppointmentStateResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Estado actualizado exitosamente" },
            idappointment: { type: "number" },
            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"] },
          },
        },

        // ─── Followers ─────────────────────────────────────────
      Follower: {
        type: "object",
        properties: {
          id: { type: "number", example: 1 },
          userId: { type: "string", example: "user123" },
          businessId: { type: "string", example: "business456" },
          business: {
            type: "object",
            properties: {
              id: { type: "string", example: "business456" },
              nombre: { type: "string", example: "Mi Barbería" },
              avatar: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
            },
          },
          createdAt: { type: "string", format: "date-time", example: "2024-04-24T10:30:00.000Z" },
        },
      },
      FollowBizResponse: {
        type: "object",
        properties: {
          follower: { $ref: "#/components/schemas/Follower" },
        },
      },
      FollowersListResponse: {
        type: "object",
        properties: {
          followers: {
            type: "array",
            items: { $ref: "#/components/schemas/Follower" },
          },
          total: { type: "number", example: 5 },
        },
      },
      FollowingsListResponse: {
        type: "object",
        properties: {
          followings: {
            type: "array",
            items: { $ref: "#/components/schemas/Follower" },
          },
          total: { type: "number", example: 3 },
        },
      },
    },
    },
    tags: [
      { name: "Health", description: "Estado del servidor" },
      { name: "Auth - Usuarios", description: "Registro, verificación y login de usuarios de la app" },
      { name: "Auth - Negocios", description: "Registro, verificación y login de cuentas de negocio" },
      { name: "Auth - Staff", description: "Login de personal" },
      {name: "Clientes", description: "Gestión de clientes (protegido)"},
      { name: "Negocios", description: "Gestión de negocios (protegido)" },
      { name: "Staff", description: "Gestión de personal (protegido)" },
      { name: "Citas", description: "Gestión de citas (protegido)" },
      { name: "Gastos", description: "Gestión de gastos (protegido)" },
      { name: "Ingresos", description: "Gestión de ingresos (protegido)" },
      { name: "Resultados", description: "Reportes financieros (protegido)" },
      { name: "Uploads", description: "Subida de imágenes" },
      { name: "Notificaciones", description: "Push tokens y notificaciones push (protegido)" },
      { name: "Followers", description: "Gestión de seguidores de negocios (protegido)" },
    ],
    paths: {
      // ═══════════════════════════════════════════════════════════
      // HEALTH
      // ═══════════════════════════════════════════════════════════
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description: "Verifica que el servidor esté funcionando.",
          responses: {
            200: {
              description: "Servidor activo",
              content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" }, message: { type: "string" } } } } },
            },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // AUTH - USUARIOS APP
      // ═══════════════════════════════════════════════════════════
      "/register": {
        post: {
          tags: ["Auth - Usuarios"],
          summary: "Registrar usuario de la app",
          description: "Registra un usuario y envía un SMS con código de verificación.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterUserRequest" } } } },
          responses: {
            200: { description: "Registro exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterUserResponse" } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Error del servidor", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/verify": {
        post: {
          tags: ["Auth - Usuarios"],
          summary: "Verificar código de usuario",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyUserRequest" } } } },
          responses: {
            200: { description: "Verificación exitosa" },
            400: { description: "Código inválido o expirado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/resend-code": {
        post: {
          tags: ["Auth - Usuarios"],
          summary: "Reenviar código de verificación",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResendCodeRequest" } } } },
          responses: {
            200: { description: "Código reenviado" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/login": {
        post: {
          tags: ["Auth - Usuarios"],
          summary: "Login por número de teléfono",
          description: "Busca primero en usuarios de la app, luego en negocios. Retorna planiaToken.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
          responses: {
            200: {
              description: "Login exitoso (respuesta varía según tipo de usuario)",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/LoginUserResponse" },
                      { $ref: "#/components/schemas/LoginBusinessResponse" },
                    ],
                  },
                },
              },
            },
            400: { description: "Credenciales incorrectas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // AUTH - NEGOCIOS
      // ═══════════════════════════════════════════════════════════
      "/register-business": {
        post: {
          tags: ["Auth - Negocios"],
          summary: "Registrar cuenta de negocio",
          description: "Crea una cuenta de negocio y envía SMS de verificación.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBusinessRequest" } } } },
          responses: {
            201: { description: "Registro exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBusinessResponse" } } } },
            400: { description: "Datos inválidos o cuenta duplicada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/login-business": {
        post: {
          tags: ["Auth - Negocios"],
          summary: "Login de negocio (número + password)",
          description: "Autenticación con credenciales de negocio. Retorna planiaToken.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBusinessRequest" } } } },
          responses: {
            200: { description: "Login exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBusinessWithTokenResponse" } } } },
            400: { description: "Credenciales incorrectas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/logout": {
        post: {
          tags: ["Auth - Usuarios", "Auth - Negocios"],
          summary: "Logout (revoca access y refresh)",
          description: "Cierra sesión: revoca el access token actual y el refresh token si se envía cookie o body.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenRequest" } } },
          },
          responses: {
            200: { description: "Logout exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/LogoutResponse" } } } },
            401: { description: "No autenticado o token revocado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorWithCode" } } } },
          },
        },
      },
      "/refresh-token": {
        post: {
          tags: ["Auth - Usuarios", "Auth - Negocios"],
          summary: "Renovar access token con refresh",
          description: "Emite nuevo planiaToken y rota el refresh token. Lee refresh desde cookie o body.",
          requestBody: {
            required: false,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenRequest" } } },
          },
          responses: {
            200: { description: "Tokens renovados", content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenResponse" } } } },
            401: { description: "Refresh expirado o revocado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorWithCode" } } } },
            403: { description: "Refresh inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorWithCode" } } } },
          },
        },
      },
      "/services": {
        post: {
          tags: ["Servicios"],
          summary: "Crear servicio",
          description: "Crea un servicio para un negocio. El campo archived se inicializa en false por defecto.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateServiceRequest" } } },
          },
          responses: {
            201: { description: "Servicio creado", content: { "application/json": { schema: { type: "object", properties: { service: { $ref: "#/components/schemas/Service" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/services/{serviceId}": {
        patch: {
          tags: ["Servicios"],
          summary: "Actualizar servicio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateServiceRequest" } } },
          },
          responses: {
            200: { description: "Servicio actualizado", content: { "application/json": { schema: { type: "object", properties: { service: { $ref: "#/components/schemas/Service" } } } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Servicios"],
          summary: "Eliminar servicio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { businessId: { type: "number", example: 1 } } } } },
          },
          responses: {
            200: { description: "Servicio eliminado", content: { "application/json": { schema: { type: "object", properties: { id: { type: "number" }, deleted: { type: "boolean" } } } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/services/{businessId}": {
        get: {
          tags: ["Servicios"],
          summary: "Listar servicios por negocio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" } },
            { name: "category", in: "query", required: false, schema: { type: "string", enum: ["service", "promotion"] }, description: "Filtrar por categoría" },
            { name: "staffId", in: "query", required: false, schema: { type: "string" }, description: "Filtrar servicios asignados a un staff" },
          ],
          responses: {
            200: { description: "Listado de servicios", content: { "application/json": { schema: { $ref: "#/components/schemas/ListServicesResponse" } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/services-general": {
        get: {
          tags: ["Servicios"],
          summary: "Listar servicios en general",
          description: "Listado de servicios en General",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", required: false, schema: { type: "number", default: 1 }, description: "Página de negocios" },
            { name: "limit", in: "query", required: false, schema: { type: "number", default: 10 }, description: "Cantidad de negocios por página" },
          ],
          responses: {
            200: {
              description: "Servicios agrupados por negocio",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      businesses: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            businessId: { type: "number" },
                            businessName: { type: "string" },
                            businessAvatar: { type: "string", nullable: true },
                            businessBanner: { type: "string", nullable: true },
                            total: { type: "number" },
                            services: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Service" },
                            },
                          },
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "number" },
                          limit: { type: "number" },
                          totalBusinesses: { type: "number" },
                          totalPages: { type: "number" },
                          hasNextPage: { type: "boolean" },
                          hasPrevPage: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
          },
        },
      },
      "/service-types/{businessId}": {
        get: {
          tags: ["Servicios"],
          summary: "Listar tipos de servicio por negocio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" } },
          ],
          responses: {
            200: { description: "Listado de tipos de servicio", content: { "application/json": { schema: { $ref: "#/components/schemas/ListServiceTypesResponse" } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/expenses": {
        post: {
          tags: ["Gastos"],
          summary: "Crear gasto",
          description: "Solo rol business.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateExpenseRequest" } } } },
          responses: {
            201: { description: "Gasto creado", content: { "application/json": { schema: { type: "object", properties: { expense: { $ref: "#/components/schemas/Expense" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/expenses/{businessId}": {
        get: {
          tags: ["Gastos"],
          summary: "Listar gastos por negocio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" } },
            { name: "year", in: "query", required: false, schema: { type: "number" }, description: "Año a filtrar" },
            { name: "week", in: "query", required: false, schema: { type: "number" }, description: "Semana ISO a filtrar (requiere year)" },
          ],
          responses: {
            200: { description: "Listado de gastos", content: { "application/json": { schema: { $ref: "#/components/schemas/ListExpensesResponse" } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/expense-categories": {
        get: {
          tags: ["Gastos"],
          summary: "Listar categorías de gastos",
          description: "Obtiene todas las categorías predefinidas para gastos (Gastos, Pago de comisiones, Utilidades de servicios, Utilidades de productos, Tasa de ocupación, Valor de facturas del mes, Cantidad de facturas del mes).",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de categorías de gastos", content: { "application/json": { schema: { $ref: "#/components/schemas/ListPredefinedExpenseCategoriesResponse" } } } },
            401: { description: "No autenticado" },
          },
        },
        post: {
          tags: ["Gastos"],
          summary: "Crear categoría de gasto",
          description: "Solo rol business.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateExpenseCategoryRequest" } } } },
          responses: {
            201: { description: "Categoría creada", content: { "application/json": { schema: { type: "object", properties: { category: { $ref: "#/components/schemas/ExpenseCategory" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/expense-categories/{businessId}": {
        get: {
          tags: ["Gastos"],
          summary: "Listar categorías de gasto por negocio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" } },
          ],
          responses: {
            200: { description: "Listado de categorías", content: { "application/json": { schema: { $ref: "#/components/schemas/ListExpenseCategoriesResponse" } } } },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/schedules": {
        post: {
          tags: ["Horarios"],
          summary: "Crear horario disponible del negocio",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateScheduleRequest" } } } },
          responses: {
            201: { description: "Horario creado", content: { "application/json": { schema: { type: "object", properties: { schedule: { $ref: "#/components/schemas/Schedule" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/schedules/{scheduleId}": {
        patch: {
          tags: ["Horarios"],
          summary: "Actualizar horario del negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "scheduleId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateScheduleRequest" } } } },
          responses: {
            200: { description: "Horario actualizado", content: { "application/json": { schema: { type: "object", properties: { schedule: { $ref: "#/components/schemas/Schedule" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Horarios"],
          summary: "Eliminar horario del negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "scheduleId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { businessId: { type: "number", example: 1 } } } } },
          },
          responses: {
            200: { description: "Horario eliminado", content: { "application/json": { schema: { type: "object", properties: { id: { type: "number" }, deleted: { type: "boolean" } } } } } },
            400: { description: "No pertenece o no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/schedules/{businessId}": {
        get: {
          tags: ["Horarios"],
          summary: "Listar horarios del negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Lista de horarios", content: { "application/json": { schema: { type: "object", properties: { schedules: { type: "array", items: { $ref: "#/components/schemas/Schedule" } }, total: { type: "number" } } } } } },
          },
        },
      },
      "/verify-business": {
        post: {
          tags: ["Auth - Negocios"],
          summary: "Verificar código de negocio",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyBusinessRequest" } } } },
          responses: {
            200: { description: "Verificación exitosa" },
            400: { description: "Código inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/resend-business": {
        post: {
          tags: ["Auth - Negocios"],
          summary: "Reenviar código de verificación de negocio",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResendBusinessRequest" } } } },
          responses: {
            200: { description: "Código reenviado" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // AUTH - STAFF
      // ═══════════════════════════════════════════════════════════
      "/login-staff": {
        post: {
          tags: ["Auth - Staff"],
          summary: "Login de personal",
          description: "Autenticación de miembros del staff. Retorna planiaToken.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginStaffRequest" } } } },
          responses: {
            200: { description: "Login exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginStaffResponse" } } } },
            400: { description: "Credenciales incorrectas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      // ═══════════════════════════════════════════════════════════
      //  CLIENTES (protegido)
      // ═══════════════════════════════════════════════════════════
      "/get-client/{clientId}": {
        get: {
          tags: ["Clientes"],
          summary: "Obtener clientes",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "clientId", in: "path", required: true, schema: { type: "string" }, description: "ID del cliente o 'all' para listar todos" },
          ],
          responses: {
            200: {
              description: "Listado de clientes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      users: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "number" },
                            nombre: { type: "string" },
                            apellido: { type: "string" },
                            avatar: { type: "string", nullable: true },
                            numero: { type: "string" },
                          },
                        },
                      },
                      total: { type: "number" },
                    },
                  },
                },
              },
            },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Cliente no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/clients/{clientId}": {
        patch: {
          tags: ["Clientes"],
          summary: "Modificar cliente",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    nombre: { type: "string" },
                    apellido: { type: "string" },
                    numero: { type: "string" },
                    avatar: { type: "string", format: "binary" },
                    image: { type: "string", format: "binary" },
                    avatarBase64: { type: "string" },
                    avatarUrl: { type: "string" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nombre: { type: "string" },
                    apellido: { type: "string" },
                    numero: { type: "string" },
                    avatarBase64: { type: "string" },
                    avatarUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Cliente modificado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {
                        type: "object",
                        properties: {
                          id: { type: "number" },
                          nombre: { type: "string" },
                          apellido: { type: "string" },
                          avatar: { type: "string", nullable: true },
                          numero: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Cliente no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Clientes"],
          summary: "Eliminar cliente",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Cliente eliminado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      deleted: { type: "boolean" },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Cliente no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // NEGOCIOS (protegido)
      // ═══════════════════════════════════════════════════════════
      "/configure-business": {
        post: {
          tags: ["Negocios"],
          summary: "Configurar negocio (setup inicial)",
          description: "Configura nombre, descripción, avatar, banner, imágenes adicionales y staff del negocio. Acepta multipart/form-data.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "number", description: "Business ID" },
                    name: { type: "string" },
                    description: { type: "string" },
                    avatar: { type: "string", format: "binary" },
                    banner: { type: "string", format: "binary" },
                    avatarBase64: { type: "string" },
                    bannerBase64: { type: "string" },
                    avatarUrl: { type: "string" },
                    bannerUrl: { type: "string" },
                    images: { type: "array", items: { type: "string", format: "binary" }, description: "Imágenes adicionales del negocio (archivos)" },
                    imagesBase64: { type: "string", description: "JSON array de imágenes adicionales en base64. Ej: [\"data:image/jpeg;base64,...\"]" },
                    imagesUrls: { type: "string", description: "JSON array de URLs de imágenes adicionales. Ej: [\"https://...\"]" },
                    direccion: {
                      type: "object",
                      required: ["address"],
                      properties: {
                        address: { type: "string", example: "Av. Siempre Viva 742" },
                        altura: { type: "string", nullable: true, example: "742" },
                        codigoPostal: { type: "string", nullable: true, example: "1000" },
                        ciudad: { type: "string", nullable: true, example: "Buenos Aires" },
                        provincia: { type: "string", nullable: true, example: "CABA" },
                        pais: { type: "string", nullable: true, example: "Argentina" },
                      },
                    },
                    staff: { type: "string", description: "JSON array de staff" },
                    staffAvatars: { type: "array", items: { type: "string", format: "binary" } },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Negocio configurado exitosamente",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      avatarUrl: { type: "string", nullable: true },
                      bannerUrl: { type: "string", nullable: true },
                      images: { type: "array", items: { type: "string" }, description: "URLs de las imágenes adicionales subidas" },
                      staff: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorWithCode" } } } },
            403: { description: "Sin permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        patch: {
          tags: ["Negocios"],
          summary: "Modificar configuración del negocio",
          description: "Actualiza nombre, descripción, avatar, banner, imágenes adicionales y staff del negocio. Acepta multipart/form-data.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "number", description: "Business ID" },
                    name: { type: "string" },
                    description: { type: "string" },
                    avatar: { type: "string", format: "binary" },
                    banner: { type: "string", format: "binary" },
                    avatarBase64: { type: "string" },
                    bannerBase64: { type: "string" },
                    avatarUrl: { type: "string" },
                    bannerUrl: { type: "string" },
                    images: { type: "array", items: { type: "string", format: "binary" }, description: "Imágenes adicionales del negocio (archivos)" },
                    imagesBase64: { type: "string", description: "JSON array de imágenes adicionales en base64. Ej: [\"data:image/jpeg;base64,...\"]" },
                    imagesUrls: { type: "string", description: "JSON array de URLs de imágenes adicionales. Ej: [\"https://...\"]" },
                    direccion: {
                      type: "object",
                      required: ["address"],
                      properties: {
                        address: { type: "string", example: "Av. Siempre Viva 742" },
                        altura: { type: "string", nullable: true, example: "742" },
                        codigoPostal: { type: "string", nullable: true, example: "1000" },
                        ciudad: { type: "string", nullable: true, example: "Buenos Aires" },
                        provincia: { type: "string", nullable: true, example: "CABA" },
                        pais: { type: "string", nullable: true, example: "Argentina" },
                      },
                    },
                    staff: { type: "string", description: "JSON array de staff" },
                    staffAvatars: { type: "array", items: { type: "string", format: "binary" } },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Negocio modificado exitosamente",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      avatarUrl: { type: "string", nullable: true },
                      bannerUrl: { type: "string", nullable: true },
                      images: { type: "array", items: { type: "string" }, description: "URLs de las imágenes adicionales subidas" },
                      staff: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorWithCode" } } } },
            403: { description: "Sin permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/get-business/{businessId}": {
        get: {
          tags: ["Negocios"],
          summary: "Obtener información de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Información del negocio",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      nombre: { type: "string" },
                      correo: { type: "string" },
                      numero: { type: "string" },
                      avatar: { type: "string", nullable: true },
                      banner: { type: "string", nullable: true },
                      images: { type: "array", items: { type: "string" }, description: "URLs de imágenes adicionales del negocio" },
                      name: { type: "string" },
                      description: { type: "string" },
                      direccion: {
                        type: "object",
                        nullable: true,
                        properties: {
                          address: { type: "string" },
                          altura: { type: "string", nullable: true },
                          codigoPostal: { type: "string", nullable: true },
                          ciudad: { type: "string", nullable: true },
                          provincia: { type: "string", nullable: true },
                          pais: { type: "string", nullable: true },
                        },
                      },
                      isInitialSetupComplete: { type: "boolean" },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/get-business-id": {
        get: {
          tags: ["Negocios"],
          summary: "Listar IDs de negocios",
          description: "Retorna todos los negocios con businessId, nombre, numero, avatar, banner y name.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Listado de negocios",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      businesses: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            businessId: { type: "number" },
                            nombre: { type: "string" },
                            numero: { type: "string" },
                            avatar: { type: "string", nullable: true },
                            banner: { type: "string", nullable: true },
                            name: { type: "string" },
                          },
                        },
                      },
                      total: { type: "number" },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
          },
        },
      },
      "/business/{businessId}/policies": {
        get: {
          tags: ["Negocios"],
          summary: "Obtener políticas de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Políticas del negocio", content: { "application/json": { schema: { type: "object", properties: { policies: { $ref: "#/components/schemas/BusinessPolicies" } } } } } },
            401: { description: "No autenticado" },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        patch: {
          tags: ["Negocios"],
          summary: "Actualizar políticas del negocio",
          description: "Solo rol business. Valores en minutos; enviar 'null' para limpiar.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateBusinessPoliciesRequest" } } } },
          responses: {
            200: { description: "Políticas actualizadas", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, policies: { $ref: "#/components/schemas/BusinessPolicies" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users": {
        get: {
          tags: ["Negocios"],
          summary: "Listar todos los usuarios registrados",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Lista de usuarios",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      users: { type: "array", items: { type: "object" } },
                      total: { type: "number" },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
          },
        },
      },
      // ═══════════════════════════════════════════════════════════
      // NOTIFICACIONES (protegido)
      // ═══════════════════════════════════════════════════════════
      "/users/{userId}/push-token": {
        post: {
          tags: ["Notificaciones"],
          summary: "Guardar Expo Push Token del usuario",
          description: "Guarda o actualiza el push token del usuario en Firestore (colección users).",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["pushToken"],
                  properties: {
                    pushToken: { type: "string", example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Token guardado", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
            400: { description: "pushToken requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            500: { description: "Error interno", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/businesses/{businessId}/push-token": {
        post: {
          tags: ["Notificaciones"],
          summary: "Guardar Expo Push Token del negocio",
          description: "Guarda o actualiza el push token del negocio en Firestore (colección businesses).",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["pushToken"],
                  properties: {
                    pushToken: { type: "string", example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Token guardado", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } },
            400: { description: "pushToken requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            500: { description: "Error interno", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/notifications/chat": {
        post: {
          tags: ["Notificaciones"],
          summary: "Enviar notificación push de chat",
          description: "Busca el push token del destinatario y envía una notificación via Expo Push API.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["recipientId", "recipientType", "senderName", "message", "chatId"],
                  properties: {
                    recipientId: { type: "string", description: "ID del destinatario" },
                    recipientType: { type: "string", enum: ["client", "business"], description: "Tipo de destinatario" },
                    senderName: { type: "string", description: "Nombre del remitente (título de la notificación)" },
                    message: { type: "string", description: "Texto del mensaje (cuerpo de la notificación)" },
                    chatId: { type: "string", description: "ID del chat" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Notificación enviada o sin token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      reason: { type: "string", example: "no token", nullable: true },
                    },
                  },
                },
              },
            },
            400: { description: "Faltan campos requeridos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            500: { description: "Error interno", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/delete-business/{businessId}": {
        delete: {
          tags: ["Negocios"],
          summary: "Eliminar negocio",
          description: "Elimina un negocio y sus datos relacionados. Solo rol business.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Negocio eliminado" },
            400: { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/upload-business-avatar": {
        post: {
          tags: ["Negocios"],
          summary: "Subir avatar de negocio",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image", "businessId"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    businessId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Avatar subido", content: { "application/json": { schema: { type: "object", properties: { url: { type: "string" }, message: { type: "string" } } } } } },
            400: { description: "Archivo o businessId faltante" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/upload-business-banner": {
        post: {
          tags: ["Negocios"],
          summary: "Subir banner de negocio",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image", "businessId"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    businessId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Banner subido" },
            400: { description: "Archivo o businessId faltante" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // STAFF (protegido)
      // ═══════════════════════════════════════════════════════════
      "/add-staff": {
        post: {
          tags: ["Staff"],
          summary: "Agregar miembro del personal",
          description: "Solo rol business puede agregar staff.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AddStaffRequest" } } } },
          responses: {
            201: { description: "Staff creado", content: { "application/json": { schema: { $ref: "#/components/schemas/AddStaffResponse" } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/get-staff/{businessId}": {
        get: {
          tags: ["Staff"],
          summary: "Obtener staff de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Lista de staff", content: { "application/json": { schema: { type: "object", properties: { staff: { type: "array", items: { type: "object" } } } } } } },
            401: { description: "No autenticado" },
          },
        },
      },
      "/get-staff-ids/{businessId}": {
        get: {
          tags: ["Staff"],
          summary: "Obtener IDs de staff de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Lista de IDs",
              content: { "application/json": { schema: { type: "object", properties: { staffIds: { type: "array", items: { type: "object", properties: { id: { type: "number" }, nombre: { type: "string" }, apellido: { type: "string" } } } } } } } },
            },
            401: { description: "No autenticado" },
          },
        },
      },
      "/upload-staff-avatar": {
        post: {
          tags: ["Staff"],
          summary: "Subir avatar de staff",
          description: "Roles permitidos: business, staff.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image", "staffId"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    staffId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Avatar subido" },
            400: { description: "Archivo o staffId faltante" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
        patch: {
          tags: ["Staff"],
          summary: "Actualizar avatar de staff",
          description: "Roles permitidos: business, staff.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image", "staffId"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    staffId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Avatar actualizado" },
            400: { description: "Archivo o staffId faltante" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/update-staff": {
        put: {
          tags: ["Staff"],
          summary: "Actualizar miembro del personal",
          description: "Roles permitidos: business, staff.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStaffRequest" } } } },
          responses: {
            200: { description: "Staff actualizado" },
            400: { description: "Datos inválidos" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Staff no encontrado" },
          },
        },
      },
      "/get-staff-name/{id}": {
        get: {
          tags: ["Staff"],
          summary: "Obtener nombre de un staff por ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Nombre del staff", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, nombre: { type: "string" } } } } } },
            401: { description: "No autenticado" },
            404: { description: "Staff no encontrado" },
          },
        },
      },
      "/staff/{staffId}/services": {
        put: {
          tags: ["Staff"],
          summary: "Asignar servicios a un staff",
          description: "Reemplaza la lista de servicios que un staff puede atender. Solo rol business.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "staffId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SetStaffServicesRequest" } } } },
          responses: {
            200: { description: "Servicios asignados", content: { "application/json": { schema: { $ref: "#/components/schemas/SetStaffServicesResponse" } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Staff o servicios no encontrados", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/staff/{staffId}/schedules": {
        post: {
          tags: ["Horarios"],
          summary: "Crear horario de un staff",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "staffId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateStaffScheduleRequest" } } } },
          responses: {
            201: { description: "Horario creado", content: { "application/json": { schema: { type: "object", properties: { schedule: { $ref: "#/components/schemas/StaffSchedule" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        get: {
          tags: ["Horarios"],
          summary: "Listar horarios de un staff",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "staffId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Lista de horarios de staff", content: { "application/json": { schema: { type: "object", properties: { schedules: { type: "array", items: { $ref: "#/components/schemas/StaffSchedule" } }, total: { type: "number" } } } } } },
          },
        },
      },
      "/staff/{staffId}/schedules/{scheduleId}": {
        patch: {
          tags: ["Horarios"],
          summary: "Actualizar horario de staff",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "staffId", in: "path", required: true, schema: { type: "string" } }, { name: "scheduleId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStaffScheduleRequest" } } } },
          responses: {
            200: { description: "Horario actualizado", content: { "application/json": { schema: { type: "object", properties: { schedule: { $ref: "#/components/schemas/StaffSchedule" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Horarios"],
          summary: "Eliminar horario de staff",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "staffId", in: "path", required: true, schema: { type: "string" } }, { name: "scheduleId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { businessId: { type: "number", example: 1 } } } } },
          },
          responses: {
            200: { description: "Horario eliminado", content: { "application/json": { schema: { type: "object", properties: { id: { type: "number" }, deleted: { type: "boolean" } } } } } },
            400: { description: "No pertenece o no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // CITAS (protegido)
      // ═══════════════════════════════════════════════════════════
      "/appointments": {
        post: {
          tags: ["Citas"],
          summary: "Crear una cita",
          description: "Crea una cita con businessId, staffId, date y horario. Opcionalmente incluye service (ID) para vincular un servicio.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAppointmentRequest" } } } },
          responses: {
            201: { description: "Cita creada", content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAppointmentResponse" } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },
      "/appointments/manual": {
        post: {
          tags: ["Citas"],
          summary: "Crear una cita manual (sin cliente)",
          description: "Crea una cita sin userId. Útil cuando el negocio agenda manualmente. Requiere businessId, staffId, date y horario. serviceId es opcional.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["businessId", "staffId", "date", "horario"],
                  properties: {
                    businessId: { type: "number", example: 60 },
                    staffId: { type: "string", example: "104" },
                    date: { type: "string", example: "30/03/2026" },
                    horario: { type: "string", example: "10:00" },
                    serviceId: { type: "number", example: 14, description: "Opcional" },
                    name: { type: "string", example: "Juan Pérez", description: "Nombre del cliente (opcional)" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Cita manual creada exitosamente" },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/appointments/{businessId}": {
        get: {
          tags: ["Citas"],
          summary: "Listar citas de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "string" } },
            {
              name: "filter[staffAppoinments]",
              in: "query",
              required: false,
              schema: { type: "number" },
              description: "Filtrar citas por ID del staff (staffAppoinments)",
            },
          ],
          responses: {
            200: {
              description: "Lista de citas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      appointments: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            businessId: { type: "number" },
                            idappointment: { type: "number" },
                            staffdates: { type: "string" },
                            staffAppoinments: { type: "number" },
                            staffAppointmentsHour: { type: "string" },
                            serviceType: { type: "string" },
                            serviceDuration: { type: "number", nullable: true },
                            direccion: {
                              type: "object",
                              nullable: true,
                              properties: {
                                address: { type: "string" },
                                altura: { type: "string", nullable: true },
                                codigoPostal: { type: "string", nullable: true },
                                ciudad: { type: "string", nullable: true },
                                provincia: { type: "string", nullable: true },
                                pais: { type: "string", nullable: true },
                              },
                            },
                            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"] },
                            staffNombre: { type: "string" },
                            staffApellido: { type: "string" },
                            userId: { type: "number", nullable: true },
                            userNombre: { type: "string" },
                            userNumero: { type: "string" },
                          },
                          mostSoldServiceType: { type: "string" },
                        },
                      },
                    },
                    mostSoldServiceType: { type: "string" },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
          },
        },
      },
      "/appoiments/{clientId}": {
        get: {
          tags: ["Citas"],
          summary: "Listado de citas por cliente",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" }, description: "userId del cliente" }],
          responses: {
            200: {
              description: "Lista de citas por cliente",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      appointments: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            businessId: { type: "number" },
                            idappointment: { type: "number" },
                            staffdates: { type: "string" },
                            staffAppoinments: { type: "number" },
                            staffAppointmentsHour: { type: "string" },
                            serviceType: { type: "string" },
                            serviceDuration: { type: "number", nullable: true },
                            direccion: {
                              type: "object",
                              nullable: true,
                              properties: {
                                address: { type: "string" },
                                altura: { type: "string", nullable: true },
                                codigoPostal: { type: "string", nullable: true },
                                ciudad: { type: "string", nullable: true },
                                provincia: { type: "string", nullable: true },
                                pais: { type: "string", nullable: true },
                              },
                            },
                            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"] },
                            status: { type: "string", enum: ["pendiente", "confirmado", "cancelado", "completado"] },
                            userId: { type: "number", nullable: true },
                            userNombre: { type: "string" },
                            userNumero: { type: "string", nullable: true },
                            userAvatar: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/appointments/{businessId}/list-client": {
        get: {
          tags: ["Citas"],
          summary: "Listar clientes por tipos de visita",
          description:
            "Agrupa clientes por cantidad de citas en el negocio: mejores (más de 3 citas), noTeVisitan (3 citas), noHanVuelto (1 o 2 citas). Todos incluye todos los clientes con al menos una cita. Cada item tiene userId, userName, userAvatar y staffdates (fecha más reciente del cliente).",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" }, description: "ID del negocio" }],
          responses: {
            200: {
              description: "Lista de clientes por tipos de visita",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      todos: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "number" },
                            userName: { type: "string" },
                            userAvatar: { type: "string", nullable: true },
                            staffdates: { type: "string", nullable: true, example: "15/03/2026", description: "Fecha más reciente de cita del cliente" },
                          },
                        },
                      },
                      mejores: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "number" },
                            userName: { type: "string" },
                            userAvatar: { type: "string", nullable: true },
                            staffdates: { type: "string", nullable: true, example: "15/03/2026", description: "Fecha más reciente de cita del cliente" },
                          },
                        },
                        description: "Clientes con más de 3 citas",
                      },
                      noTeVisitan: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "number" },
                            userName: { type: "string" },
                            userAvatar: { type: "string", nullable: true },
                            staffdates: { type: "string", nullable: true, example: "15/03/2026", description: "Fecha más reciente de cita del cliente" },
                          },
                        },
                        description: "Clientes con exactamente 3 citas",
                      },
                      noHanVuelto: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "number" },
                            userName: { type: "string" },
                            userAvatar: { type: "string", nullable: true },
                            staffdates: { type: "string", nullable: true, example: "15/03/2026", description: "Fecha más reciente de cita del cliente" },
                          },
                        },
                        description: "Clientes con 1 o 2 citas",
                      },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/appointments/{appointmentId}/state": {
        patch: {
          tags: ["Citas"],
          summary: "Actualizar estado de una cita",
          description: "Cambia el estado de una cita. Roles permitidos: business, staff. Estados válidos: pendiente, confirmado, cancelado, completado.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "appointmentId", in: "path", required: true, schema: { type: "string" }, description: "ID de la cita" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAppointmentStateRequest" } } } },
          responses: {
            200: { description: "Estado actualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAppointmentStateResponse" } } } },
            400: { description: "Estado inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Cita no encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/appointments/{appointmentId}": {
        delete: {
          tags: ["Citas"],
          summary: "Eliminar una cita",
          description: "Elimina una cita por ID. Roles permitidos: business, staff.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "appointmentId", in: "path", required: true, schema: { type: "string" }, description: "ID de la cita" }],
          responses: {
            200: {
              description: "Cita eliminada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string", example: "Cita eliminada exitosamente" },
                      idappointment: { type: "number" },
                      deleted: { type: "boolean" },
                    },
                  },
                },
              },
            },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Cita no encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/appoiments/{appintmentId}/reschedule": {
        patch: {
          tags: ["Citas"],
          summary: "Reprogramar cita",
          description: "Actualiza la fecha y el horario de una cita.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "appintmentId", in: "path", required: true, schema: { type: "string" }, description: "ID de la cita" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "horario"],
                  properties: {
                    date: { type: "string", example: "24/02/2026", description: "Formato dd/MM/YYYY" },
                    horario: { type: "string", example: "14:30", description: "Formato HH:mm" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Cita reprogramada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      idappointment: { type: "number" },
                      date: { type: "string" },
                      horario: { type: "string" },
                    },
                  },
                },
              },
            },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Cita no encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/appointments/{appointmentId}/timer": {
        get: {
          tags: ["Citas"],
          summary: "Cronómetro de una cita confirmada",
          description:
            "Sin query params: stream SSE (la petición queda abierta; ticks cada segundo). Con ?json=1: devuelve una sola respuesta JSON y cierra (recomendado para Swagger o polling).",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "appointmentId", in: "path", required: true, schema: { type: "string" }, description: "ID de la cita" },
            { name: "json", in: "query", required: false, schema: { type: "string", enum: ["1", "true"] }, description: "Si es 1 o true, respuesta JSON única (no stream); la petición termina y no queda cargando." },
          ],
          responses: {
            200: {
              description: "Con json=1: objeto con startAtEpoch, endAtEpoch, now, timeLeftMs. Sin json: stream SSE.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      appointmentId: { type: "number" },
                      startAtEpoch: { type: "number", nullable: true },
                      endAtEpoch: { type: "number" },
                      now: { type: "number" },
                      timeLeftMs: { type: "number" },
                    },
                  },
                },
                "text/event-stream": { schema: { type: "string" } },
              },
            },
            400: { description: "No se puede calcular final del servicio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Cita no encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
     
      // ═══════════════════════════════════════════════════════════
      // UPLOADS
      // ═══════════════════════════════════════════════════════════
      "/upload": {
        post: {
          tags: ["Uploads"],
          summary: "Subir imagen genérica",
          description: "Sube una imagen y la asocia a un usuario.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image", "userId"],
                  properties: {
                    image: { type: "string", format: "binary" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Imagen subida", content: { "application/json": { schema: { type: "object", properties: { url: { type: "string" }, message: { type: "string" } } } } } },
            400: { description: "Archivo o userId faltante" },
            404: { description: "Usuario no encontrado" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // INGRESOS
      // ═══════════════════════════════════════════════════════════
      "/incomes": {
        post: {
          tags: ["Ingresos"],
          summary: "Crear ingreso",
          description: "Crea un nuevo ingreso para el negocio.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateIncomeRequest" } } } },
          responses: {
            201: { description: "Ingreso creado", content: { "application/json": { schema: { type: "object", properties: { income: { $ref: "#/components/schemas/Income" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
      },
      "/incomes/{businessId}": {
        get: {
          tags: ["Ingresos"],
          summary: "Listar ingresos por negocio",
          description: "Obtiene todos los ingresos de un negocio con filtros opcionales.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" }, description: "ID del negocio" },
            { name: "year", in: "query", schema: { type: "number" }, description: "Filtrar por año" },
            { name: "week", in: "query", schema: { type: "number" }, description: "Filtrar por semana (junto con year)" },
            { name: "categoryId", in: "query", schema: { type: "number" }, description: "Filtrar por categoría: 1=Productos, 2=Servicios" },
          ],
          responses: {
            200: { description: "Lista de ingresos", content: { "application/json": { schema: { $ref: "#/components/schemas/ListIncomesResponse" } } } },
            401: { description: "No autenticado" },
          },
        },
      },
      "/income-categories": {
        get: {
          tags: ["Ingresos"],
          summary: "Listar categorías de ingresos",
          description: "Obtiene todas las categorías predefinidas para ingresos.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de categorías de ingresos", content: { "application/json": { schema: { $ref: "#/components/schemas/ListIncomeCategoriesResponse" } } } },
            401: { description: "No autenticado" },
          },
        },
      },
      "/incomes/{id}": {
        put: {
          tags: ["Ingresos"],
          summary: "Actualizar ingreso",
          description: "Actualiza los datos de un ingreso existente.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "number" }, description: "ID del ingreso" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateIncomeRequest" } } } },
          responses: {
            200: { description: "Ingreso actualizado", content: { "application/json": { schema: { type: "object", properties: { income: { $ref: "#/components/schemas/Income" } } } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Ingreso no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Ingresos"],
          summary: "Eliminar ingreso",
          description: "Elimina un ingreso permanentemente.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "number" }, description: "ID del ingreso" }],
          responses: {
            200: { description: "Ingreso eliminado", content: { "application/json": { schema: { $ref: "#/components/schemas/DeleteResponse" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Ingreso no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // GASTOS (ELIMINACIÓN)
      // ═══════════════════════════════════════════════════════════
      "/expenses/{id}": {
        delete: {
          tags: ["Gastos"],
          summary: "Eliminar gasto",
          description: "Elimina un gasto permanentemente.",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "number" }, description: "ID del gasto" }],
          responses: {
            200: { description: "Gasto eliminado", content: { "application/json": { schema: { $ref: "#/components/schemas/DeleteResponse" } } } },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
            404: { description: "Gasto no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // RESULTADOS
      // ═══════════════════════════════════════════════════════════
      "/results/{businessId}": {
        get: {
          tags: ["Resultados"],
          summary: "Obtener resultados financieros",
          description: "Retorna un resumen financiero con gastos, ingresos y porcentajes.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "number" }, description: "ID del negocio" },
            { name: "startDate", in: "query", schema: { type: "string", format: "date" }, description: "Fecha de inicio (YYYY-MM-DD)" },
            { name: "endDate", in: "query", schema: { type: "string", format: "date" }, description: "Fecha de fin (YYYY-MM-DD)" },
            { name: "year", in: "query", schema: { type: "number" }, description: "Filtrar por año" },
            { name: "week", in: "query", schema: { type: "number" }, description: "Filtrar por semana (junto con year)" },
          ],
          responses: {
            200: { description: "Resultados financieros", content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessResults" } } } },
            400: { description: "Parámetros inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════
      // FOLLOWERS
      // ═══════════════════════════════════════════════════════════
      "/followers": {
        post: {
          tags: ["Followers"],
          summary: "Seguir a un negocio",
          description: "Un usuario sigue a un negocio. No permite duplicados. Requiere token de autenticación.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["userId", "businessId"], properties: { userId: { type: "string", example: "user123" }, businessId: { type: "string", example: "business456" } } } } },
          },
          responses: {
            201: { description: "Follower creado exitosamente", content: { "application/json": { schema: { $ref: "#/components/schemas/FollowBizResponse" } } } },
            400: { description: "Datos inválidos o userId/businessId requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Negocio no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },

      "/followers-business": {
        get: {
          tags: ["Followers"],
          summary: "Ver negocios que un usuario sigue",
          description: "Retorna una lista de todos los negocios que un usuario específico está siguiendo.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "userId", in: "query", required: true, schema: { type: "string" }, description: "ID del usuario" },
          ],
          responses: {
            200: { description: "Lista de negocios seguidos", content: { "application/json": { schema: { $ref: "#/components/schemas/FollowingsListResponse" } } } },
            400: { description: "userId requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },

      "/followers/{businessId}": {
        get: {
          tags: ["Followers"],
          summary: "Ver seguidores de un negocio",
          description: "Retorna una lista de usuarios que siguen a un negocio específico.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "string" }, description: "ID del negocio" },
          ],
          responses: {
            200: { description: "Lista de seguidores", content: { "application/json": { schema: { $ref: "#/components/schemas/FollowersListResponse" } } } },
            400: { description: "businessId requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
        delete: {
          tags: ["Followers"],
          summary: "Dejar de seguir un negocio",
          description: "El usuario autenticado deja de seguir a un negocio.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "businessId", in: "path", required: true, schema: { type: "string" }, description: "ID del negocio" },
          ],
          responses: {
            200: { description: "Dejaste de seguir el negocio", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
            400: { description: "businessId requerido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "No estás siguiendo este negocio", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },
    },
  },
  apis: [], // No usamos anotaciones JSDoc en rutas, toda la spec está aquí
};

export const swaggerSpec = swaggerJsdoc(options);
