const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlexiLeave App API",
      version: "1.0.0",
      description:
        "API documentation for the FlexiLeave Leave Management App. <br><strong>Note:</strong> Authentication is handled via HttpOnly cookies. Login first via the auth endpoints to get authenticated.",
      contact: {
        name: "API Support",
        email: "support@flexileave.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        // 🔒 Production URL intentionally unchanged
        url: "https://flexileave-api.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        LeaveBalances: {
          type: "object",
          properties: {
            AnnualLeave: { type: "number", example: 15 },
            SickLeave: { type: "number", example: 10 },
            FamilyResponsibility: { type: "number", example: 5 },
            UnpaidLeave: { type: "number", example: 2 },
            Other: { type: "number", example: 0 },
          },
        },
        Tenant: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "FlexiLeave" },
            slug: { type: "string", example: "flexileave" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Jackson Khuto" },
            email: { type: "string", format: "email", example: "jacksonk@digititan.co.za" },
            phone: { type: "string", example: "+27 661802747" },
            department: { type: "string", example: "IT" },
            position: { type: "string", example: "Administrator" },
            joinDate: { type: "string", format: "date" },
            leaveBalances: { $ref: "#/components/schemas/LeaveBalances" },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "OWNER", "ADMIN", "MANAGER", "EMPLOYEE"],
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE"],
            },
            avatar: { type: "string", nullable: true },
            tenantId: { type: "integer" },
            tenant: { $ref: "#/components/schemas/Tenant" },
            createdAt: { type: "string", format: "date-time" },
            refreshToken: { type: "string", nullable: true },
          },
        },
        UserInvitation: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            token: { type: "string" },
            tenantId: { type: "integer" },
            expiresAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Leave: {
          type: "object",
          properties: {
            id: { type: "integer", example: 101 },
            leaveType: {
              type: "string",
              example: "AnnualLeave",
            },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            days: { type: "integer" },
            reason: { type: "string" },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED"],
            },
            submittedAt: { type: "string", format: "date-time" },
            rejectionReason: { type: "string", nullable: true },
            emergencyContact: { type: "string", nullable: true },
            emergencyPhone: { type: "string", nullable: true },
            userId: { type: "integer" },
            actionedBy: { type: "integer", nullable: true },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  url: { type: "string" },
                  size: { type: "integer" },
                  type: { type: "string" },
                  uploadedAt: { type: "string", format: "date-time" },
                },
              },
            },
            user: { $ref: "#/components/schemas/User" },
            actionedByUser: { $ref: "#/components/schemas/User" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer" },
            type: {
              type: "string",
              enum: ["leave_submitted", "leave_approved", "leave_rejected", "system"],
            },
            title: { type: "string" },
            message: { type: "string" },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            recipientId: { type: "integer" },
            triggeredById: { type: "integer", nullable: true },
            leaveId: { type: "integer", nullable: true },
            metadata: { type: "object", additionalProperties: true },
          },
        },
        TenantStats: {
          type: "object",
          properties: {
            stats: {
              type: "object",
              properties: {
                users: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    active: { type: "integer" },
                    inactive: { type: "integer" },
                    departments: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
                leaves: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    pending: { type: "integer" },
                    approved: { type: "integer" },
                    rejected: { type: "integer" },
                    thisMonth: { type: "integer" },
                    lastMonth: { type: "integer" },
                    monthlyTrends: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          total: { type: "integer" },
                          breakdown: {
                            type: "object",
                            properties: {
                              pending: { type: "integer" },
                              approved: { type: "integer" },
                              rejected: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                    leaveTypeBreakdown: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          leaveType: { type: "string" },
                          count: { type: "integer" },
                        },
                      },
                    },
                    recentLeaves: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Leave" },
                    },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            error: { type: "string", example: "Detailed error description" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication token missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Input validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

// Swagger UI configuration for HttpOnly cookie auth
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    requestInterceptor: (req) => {
      req.credentials = "include";
      return req;
    },
  },
  customSiteTitle: "FlexiLeave App API Documentation",
  customCss: ".swagger-ui .topbar { display: none }",
};

module.exports = { swaggerUi, specs, swaggerUiOptions };
