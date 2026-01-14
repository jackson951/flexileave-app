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
        url: "https://digititan-leave-app.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            phone: {
              type: "string",
              example: "+1234567890",
            },
            profileImage: {
              type: "string",
              nullable: true,
              example: "https://example.com/profile.jpg",
            },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
              example: "USER",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            isVerified: {
              type: "boolean",
              example: true,
            },
            emailVerified: {
              type: "boolean",
              example: true,
            },
            lastLogin: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Leave: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            type: {
              type: "string",
              enum: [
                "ANNUAL",
                "SICK",
                "MATERNITY",
                "PATERNITY",
                "UNPAID",
                "OTHER",
              ],
              example: "ANNUAL",
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2024-01-15",
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2024-01-20",
            },
            days: {
              type: "number",
              example: 5,
            },
            reason: {
              type: "string",
              example: "Family vacation",
            },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
              example: "PENDING",
            },
            document: {
              type: "string",
              nullable: true,
              example: "medical_certificate.pdf",
            },
            approvedById: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            approvedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            rejectionReason: {
              type: "string",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
            },
            message: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
            },
            isRead: {
              type: "boolean",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "string",
              example: "Detailed error description",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success message",
            },
            data: {
              type: "object",
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication token is missing or invalid",
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
          description: "Validation error",
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
