import request from "supertest";
import { app } from "../app";
import "./setup";

describe("Auth — Register", () => {
  it("registers a new user and returns accessToken + user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "member",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      role: "member",
    });
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "incomplete@example.com", password: "pass123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "User",
      email: "not-an-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for password shorter than 6 chars", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "User",
      email: "user@example.com",
      password: "abc",
    });

    expect(res.status).toBe(400);
  });

  it("returns 409 when email is already registered", async () => {
    await request(app).post("/api/auth/register").send({
      name: "First",
      email: "dup@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Second",
      email: "dup@example.com",
      password: "password456",
    });

    expect(res.status).toBe(409);
  });
});

describe("Auth — Login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email: "login@example.com",
      password: "loginpass123",
      role: "admin",
    });
  });

  it("logs in with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "loginpass123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.email).toBe("login@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("returns 401 for non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});

describe("Auth — Refresh Token", () => {
  it("issues a new access token using the refresh cookie", async () => {
    // Use a persistent agent so cookies are carried across requests
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      name: "Refresh User",
      email: "refresh@example.com",
      password: "refreshpass123",
    });

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty("accessToken");
  });

  it("returns 401 when no refresh cookie is present", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });
});

describe("Auth — Profile", () => {
  it("returns profile for authenticated user", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Profile User",
      email: "profile@example.com",
      password: "profilepass123",
    });

    const { accessToken } = regRes.body;

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("profile@example.com");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/profile");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
