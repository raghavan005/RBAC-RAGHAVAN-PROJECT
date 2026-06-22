import bcrypt from "bcryptjs";
import { User } from "../models/User";
import type { CreateMemberDTO, UpdateMemberDTO } from "../validators/member";

export interface MemberQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

import bcrypt from "bcryptjs";
import { User } from "../models/User";
import type { CreateMemberDTO, UpdateMemberDTO } from "../validators/member";

export interface MemberQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// Escape regex special characters to prevent NoSQL injection
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listMembers(query: MemberQuery) {
  const { page, limit, search, sortBy, sortOrder } = query;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(20, Math.max(1, limit)); // Reduced from 50 to 20
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  
  // Sanitize search input and limit length
  const sanitizedSearch = search ? escapeRegex(search.trim().substring(0, 100)) : '';

  const filter: Record<string, unknown> = sanitizedSearch
    ? {
        $or: [
          { name: { $regex: sanitizedSearch, $options: "i" } },
          { email: { $regex: sanitizedSearch, $options: "i" } },
          ...(!isNaN(Number(sanitizedSearch)) && Number.isInteger(Number(sanitizedSearch)) 
            ? [{ number: Number(sanitizedSearch) }] : []),
        ],
      }
    : {};

  const [total, members] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password")
      .sort({ [sortBy]: sortDirection })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);

  return {
    members,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getMemberById(id: string) {
  const member = await User.findById(id).select("-password");
  if (!member) {
    const err = new Error("Member not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return member;
}

export async function createMember(dto: CreateMemberDTO) {
  const existing = await User.findOne({ email: dto.email });
  if (existing) {
    // Generic error to prevent user enumeration
    const err = new Error("Unable to create member. Please check your input and try again.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  if (dto.number !== undefined) {
    const existingNumber = await User.findOne({ number: dto.number });
    if (existingNumber) {
      const err = new Error("Number already exists") as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }
  }

  const hashedPassword = await bcrypt.hash(dto.password, 12);
  const member = await User.create({
    name: dto.name,
    email: dto.email,
    password: hashedPassword,
    number: dto.number,
    phone: dto.phone,
    role: dto.role ?? "member",
    status: dto.status ?? true,
  });

  const memberData = member.toObject() as unknown as Record<string, unknown>;
  delete memberData.password;
  return memberData;
}

export async function updateMember(id: string, dto: UpdateMemberDTO, requestorRole?: string) {
  const updateData: Record<string, unknown> = { ...dto };

  // Prevent non-admin users from changing roles
  if (dto.role && requestorRole !== "admin") {
    const err = new Error("Insufficient permissions to change roles") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  if (dto.password) {
    updateData.password = await bcrypt.hash(dto.password, 12);
  }

  const member = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!member) {
    const err = new Error("Member not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return member;
}

export async function deleteMember(id: string) {
  const member = await User.findByIdAndDelete(id);
  if (!member) {
    const err = new Error("Member not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return member;
}
