import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  number: z.number().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "member"]).optional().default("member"),
  status: z.boolean().optional().default(true),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  number: z.number().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "member"]).optional(),
  status: z.boolean().optional(),
});

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;
export type UpdateMemberDTO = z.infer<typeof updateMemberSchema>;
