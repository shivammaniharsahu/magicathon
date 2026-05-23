import { z } from "zod";

export const emailSchema = z.string().trim().email("That's not an email, comedian.");
export const passwordSchema = z
  .string()
  .min(8, "Min 8 characters. We believe in you.")
  .max(72, "Too long for bcrypt. Trim it.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(24, "Max 24")
    .regex(/^[a-z0-9_]+$/, "Letters, numbers, underscores only"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
