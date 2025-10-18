/**
 * Client-side validation schemas for auth forms (React)
 */
import { z } from "zod";

export const emailSchema = z.string().trim().email("Podaj poprawny adres e‑mail");

export const passwordSchema = z.string().min(8, "Hasło musi mieć co najmniej 8 znaków");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Hasła muszą być takie same",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
