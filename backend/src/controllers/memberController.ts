import { Request, Response, NextFunction } from "express";
import { createMemberSchema, updateMemberSchema } from "../validators/member";
import * as memberService from "../services/memberService";
import { createAuditLog } from "../utils/auditLog";

export async function getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "10"));
    const search = String(req.query.search ?? "");
    const sortBy = String(req.query.sortBy ?? "createdAt");
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const result = await memberService.listMembers({ page, limit, search, sortBy, sortOrder });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await memberService.getMemberById(req.params.id);
    res.json({ member });
  } catch (err) {
    next(err);
  }
}

export async function createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ error: details[0].message, details });
      return;
    }

    const member = await memberService.createMember(parsed.data);
    await createAuditLog(req.user!.userId, "CREATE_MEMBER", `member:${(member as { _id: unknown })._id}`);

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ error: details[0].message, details });
      return;
    }

    const member = await memberService.updateMember(req.params.id, parsed.data);
    await createAuditLog(req.user!.userId, "UPDATE_MEMBER", `member:${req.params.id}`);

    res.json({ member });
  } catch (err) {
    next(err);
  }
}

export async function deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await memberService.deleteMember(req.params.id);
    await createAuditLog(req.user!.userId, "DELETE_MEMBER", `member:${req.params.id}`);

    res.json({ message: "Member deleted" });
  } catch (err) {
    next(err);
  }
}
