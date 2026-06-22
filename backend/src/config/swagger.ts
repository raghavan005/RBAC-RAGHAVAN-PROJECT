import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import type { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RBAC API",
      version: "1.0.0",
      description:
        "Role-Based Access Control REST API with JWT authentication, member management and audit logs.",
    },
    servers: [{ url: "/api", description: "API server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            number: { type: "number" },
            phone: { type: "string" },
            role: { type: "string", enum: ["admin", "manager", "member"] },
            status: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            action: { type: "string" },
            resource: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.ts"), path.join(__dirname, "../routes/*.js")],
};

export const swaggerSpec = swaggerJsdoc(options);
