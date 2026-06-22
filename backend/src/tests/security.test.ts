import request from "supertest";
import { app } from "../app";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";

describe("Security Tests", () => {
  let adminToken: string;
  let regularUserToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "$2a$12$hash", // Pre-hashed for speed
      role: "admin"
    });

    // Create regular user
    const regularUser = await User.create({
      name: "Regular User",
      email: "user@test.com",
      password: "$2a$12$hash",
      role: "member"
    });

    // Login to get tokens (bypass CSRF for login)
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "password" });
    adminToken = adminLogin.body.accessToken;

    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "password" });
    regularUserToken = userLogin.body.accessToken;

    // Get CSRF token
    const csrfResponse = await request(app).get("/api/csrf-token");
    csrfToken = csrfResponse.body.csrfToken;
  });

  afterEach(async () => {
    // Clean up test data but keep users
    await User.deleteMany({ email: { $regex: /test-/ } });
  });

  describe("Password Security", () => {
    it("should reject weak passwords", async () => {
      const weakPasswords = [
        "123456",
        "password",
        "abc123",
        "Password", // Missing special char
        "password123", // Missing uppercase
        "PASSWORD123!", // Missing lowercase
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post("/api/auth/register")
          .set("X-CSRF-Token", csrfToken)
          .send({
            name: "Test User",
            email: `test-${Date.now()}@test.com`,
            password,
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Password must contain");
      }
    });

    it("should accept strong passwords", async () => {
      const strongPassword = "StrongP@ss123";
      
      const response = await request(app)
        .post("/api/auth/register")
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Test User",
          email: `test-strong-${Date.now()}@test.com`,
          password: strongPassword,
        });

      expect(response.status).toBe(201);
    });
  });

  describe("Input Validation & Injection Prevention", () => {
    it("should prevent NoSQL injection in search", async () => {
      const maliciousInputs = [
        '{"$ne": ""}',
        '{"$regex": ".*"}',
        '{"$where": "return true"}',
        '.*',
        '$ne',
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .get("/api/members")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ search: input });

        expect(response.status).toBe(200);
        // Should not return all users - injection should be escaped
        expect(response.body.members.length).toBeLessThanOrEqual(20);
      }
    });

    it("should validate email format strictly", async () => {
      const invalidEmails = [
        "notanemail",
        "@domain.com",
        "user@",
        "user..user@domain.com",
        "a".repeat(250) + "@test.com", // Too long
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post("/api/auth/register")
          .set("X-CSRF-Token", csrfToken)
          .send({
            name: "Test User",
            email,
            password: "StrongP@ss123",
          });

        expect(response.status).toBe(400);
      }
    });

    it("should validate number fields properly", async () => {
      const invalidNumbers = [-1, 1.5, 9999999, "abc", null];

      for (const number of invalidNumbers) {
        const response = await request(app)
          .post("/api/members")
          .set("Authorization", `Bearer ${adminToken}`)
          .set("X-CSRF-Token", csrfToken)
          .send({
            name: "Test User",
            email: `test-number-${Date.now()}@test.com`,
            password: "StrongP@ss123",
            number,
          });

        if (typeof number === 'number' && (number < 0 || number > 999999 || !Number.isInteger(number))) {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe("CSRF Protection", () => {
    it("should reject POST requests without CSRF token", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: `test-csrf-${Date.now()}@test.com`,
          password: "StrongP@ss123",
        });

      expect(response.status).toBe(403); // CSRF error
    });

    it("should accept POST requests with valid CSRF token", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Test User",
          email: `test-csrf-valid-${Date.now()}@test.com`,
          password: "StrongP@ss123",
        });

      expect(response.status).toBe(201);
    });
  });

  describe("Authorization & Privilege Escalation", () => {
    it("should prevent regular users from changing roles", async () => {
      // Create a member to edit
      const member = await User.create({
        name: "Target User",
        email: `test-target-${Date.now()}@test.com`,
        password: "$2a$12$hash",
        role: "member"
      });

      const response = await request(app)
        .put(`/api/members/${member._id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          role: "admin" // Try to escalate to admin
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Insufficient permissions");
    });

    it("should allow admins to change roles", async () => {
      const member = await User.create({
        name: "Target User 2",
        email: `test-target2-${Date.now()}@test.com`,
        password: "$2a$12$hash",
        role: "member"
      });

      const response = await request(app)
        .put(`/api/members/${member._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          role: "manager"
        });

      expect(response.status).toBe(200);
      expect(response.body.member.role).toBe("manager");
    });
  });

  describe("Rate Limiting", () => {
    it("should rate limit auth endpoints", async () => {
      const promises = [];
      
      // Send 25 requests rapidly (over the limit of 20)
      for (let i = 0; i < 25; i++) {
        promises.push(
          request(app)
            .post("/api/auth/login")
            .set("X-CSRF-Token", csrfToken)
            .send({ email: "nonexistent@test.com", password: "wrong" })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe("Error Messages & Information Disclosure", () => {
    it("should not reveal if email exists during registration", async () => {
      // Try to register with existing admin email
      const response = await request(app)
        .post("/api/auth/register")
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Hacker",
          email: "admin@test.com", // Existing email
          password: "StrongP@ss123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).not.toContain("already registered");
      expect(response.body.error).toContain("Unable to complete registration");
    });

    it("should use generic error messages for login failures", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({
          email: "nonexistent@test.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/api/csrf-token");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["strict-transport-security"]).toContain("max-age=31536000");
    });
  });
});