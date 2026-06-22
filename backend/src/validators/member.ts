import { z } from "zod";

// Strong password validation following OWASP guidelines
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  )
  .max(128, "Password is too long");

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: passwordSchema,
  number: z.number().int().positive().max(999999).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, "Invalid phone number format").optional(),
  role: z.enum(["admin", "manager", "member"]).optional().default("member"),
  status: z.boolean().optional().default(true),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email address").max(255).optional(),
  password: passwordSchema.optional(),
  number: z.number().int().positive().max(999999).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, "Invalid phone number format").optional(),
  role: z.enum(["admin", "manager", "member"]).optional(),
  status: z.boolean().optional(),
});

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;
export type UpdateMemberDTO = z.infer<typeof updateMemberSchema>;
