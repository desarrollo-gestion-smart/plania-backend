import swaggerJsdoc from "swagger-jsdoc";

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
        url: "/api",
        description: "API base path",
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

        // ─── Appointments ──────────────────────────────────────
        CreateAppointmentRequest: {
          type: "object",
          required: ["businessId", "staffId", "serviceType", "date", "horario"],
          properties: {
            businessId: { type: "number", example: 1 },
            staffId: { type: "string", example: "5" },
            serviceType: { type: "string", example: "Corte de cabello" },
            serviceDuration: { type: "number", description: "Duración del servicio en minutos", example: 30 },
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
                idappointment: { type: "number" },
                staffdates: { type: "string" },
                staffAppoinments: { type: "string" },
                staffAppointmentsHour: { type: "string" },
                serviceType: { type: "string" },
                serviceDuration: { type: "number", nullable: true },
                state: { type: "string", enum: ["pendiente", "confirmado", "cancelado"] },
              },
            },
          },
        },
        UpdateAppointmentStateRequest: {
          type: "object",
          required: ["state"],
          properties: {
            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado"], example: "confirmado" },
          },
        },
        UpdateAppointmentStateResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Estado actualizado exitosamente" },
            idappointment: { type: "number" },
            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado"] },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Estado del servidor" },
      { name: "Auth - Usuarios", description: "Registro, verificación y login de usuarios de la app" },
      { name: "Auth - Negocios", description: "Registro, verificación y login de cuentas de negocio" },
      { name: "Auth - Staff", description: "Login de personal" },
      { name: "Negocios", description: "Gestión de negocios (protegido)" },
      { name: "Staff", description: "Gestión de personal (protegido)" },
      { name: "Citas", description: "Gestión de citas (protegido)" },
      { name: "Uploads", description: "Subida de imágenes" },
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
      // NEGOCIOS (protegido)
      // ═══════════════════════════════════════════════════════════
      "/configure-business": {
        post: {
          tags: ["Negocios"],
          summary: "Configurar negocio (setup inicial)",
          description: "Configura nombre, descripción, avatar, banner y staff del negocio. Acepta multipart/form-data.",
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
                    staff: { type: "string", description: "JSON array de staff" },
                    staffAvatars: { type: "array", items: { type: "string", format: "binary" } },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Negocio configurado exitosamente" },
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
            200: { description: "Información del negocio" },
            401: { description: "No autenticado" },
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

      // ═══════════════════════════════════════════════════════════
      // CITAS (protegido)
      // ═══════════════════════════════════════════════════════════
      "/appointments": {
        post: {
          tags: ["Citas"],
          summary: "Crear una cita",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAppointmentRequest" } } } },
          responses: {
            201: { description: "Cita creada", content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAppointmentResponse" } } } },
            400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "No autenticado" },
          },
        },
      },
      "/appointments/{businessId}": {
        get: {
          tags: ["Citas"],
          summary: "Listar citas de un negocio",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "businessId", in: "path", required: true, schema: { type: "string" } }],
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
                            state: { type: "string", enum: ["pendiente", "confirmado", "cancelado"] },
                            staffNombre: { type: "string" },
                            staffApellido: { type: "string" },
                          },
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
      "/appointments/{appointmentId}/state": {
        patch: {
          tags: ["Citas"],
          summary: "Actualizar estado de una cita",
          description: "Cambia el estado de una cita. Roles permitidos: business, staff. Estados válidos: pendiente, confirmado, cancelado.",
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
    },
  },
  apis: [], // No usamos anotaciones JSDoc en rutas, toda la spec está aquí
};

export const swaggerSpec = swaggerJsdoc(options);
