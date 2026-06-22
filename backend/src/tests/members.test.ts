import request from "supertest";
import { app } from "../app";
import "./setup";

// Helper: register a user and return their access token
async function getToken(
  email: string,
  role: "admin" | "manager" | "member"
): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({
    name: `${role} user`,
    email,
    password: "testpass123",
    role,
  });
  return res.body.accessToken as string;
}

describe("Members — RBAC permissions", () => {
  let adminToken: string;
  let managerToken: string;
  let memberToken: string;
  let createdMemberId: string;

  // Each test suite run gets fresh tokens (afterEach wipes DB)
  beforeEach(async () => {
    adminToken = await getToken("admin@example.com", "admin");
    managerToken = await getToken("manager@example.com", "manager");
    memberToken = await getToken("member@example.com", "member");

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Target Member",
        email: "target@example.com",
        password: "targetpass123",
        role: "member",
      });

    expect(res.status).toBe(201);
    createdMemberId = res.body.member._id as string;
  });

  // ── View members ───────────────────────────────────────────────────────────
  it("admin can view members", async () => {
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("members");
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  it("manager can view members", async () => {
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
  });

  it("member can view members", async () => {
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  it("unauthenticated request is rejected", async () => {
    const res = await request(app).get("/api/members");
    expect(res.status).toBe(401);
  });

  // ── Create member ──────────────────────────────────────────────────────────
  it("admin can create a member", async () => {
    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Member",
        email: "newmember@example.com",
        password: "pass123456",
        role: "member",
      });
    expect(res.status).toBe(201);
    expect(res.body.member.email).toBe("newmember@example.com");
    expect(res.body.member).not.toHaveProperty("password");
  });

  it("manager can create a member", async () => {
    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "Manager Created",
        email: "mgrcreated@example.com",
        password: "pass123456",
      });
    expect(res.status).toBe(201);
  });

  it("member CANNOT create a member (403)", async () => {
    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        name: "Forbidden",
        email: "forbidden@example.com",
        password: "pass123456",
      });
    expect(res.status).toBe(403);
  });

  // ── Update member ──────────────────────────────────────────────────────────
  it("admin can update a member", async () => {
    const res = await request(app)
      .put(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.member.name).toBe("Updated Name");
  });

  it("manager can update a member", async () => {
    const res = await request(app)
      .put(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ phone: "555-1234" });
    expect(res.status).toBe(200);
  });

  it("member CANNOT update a member (403)", async () => {
    const res = await request(app)
      .put(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Sneaky Update" });
    expect(res.status).toBe(403);
  });

  // ── Delete member ──────────────────────────────────────────────────────────
  it("manager CANNOT delete a member (403)", async () => {
    const res = await request(app)
      .delete(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it("member CANNOT delete a member (403)", async () => {
    const res = await request(app)
      .delete(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it("admin can delete a member", async () => {
    const res = await request(app)
      .delete(`/api/members/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────
  it("returns 404 for non-existent member ID", async () => {
    const res = await request(app)
      .get("/api/members/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 400 when required fields are missing on create", async () => {
    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "No Email or Password" });
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email on create", async () => {
    await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dup1", email: "dupcheck@example.com", password: "pass123456" });

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dup2", email: "dupcheck@example.com", password: "pass123456" });

    expect(res.status).toBe(409);
  });

  it("search returns filtered results", async () => {
    const res = await request(app)
      .get("/api/members?search=Target")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.members.length).toBeGreaterThanOrEqual(1);
    expect(res.body.members[0].name).toContain("Target");
  });

  it("pagination metadata is correct", async () => {
    const res = await request(app)
      .get("/api/members?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toHaveProperty("page", 1);
    expect(res.body.pagination).toHaveProperty("limit", 2);
    expect(res.body.pagination).toHaveProperty("total");
    expect(res.body.pagination).toHaveProperty("totalPages");
  });
});
