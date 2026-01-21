import z from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    email: z.email(),
    password: z.string().min(6, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6, {
    message: "Password must be at least 8 characters.",
  }),
});

export const createRaceSchema = z.object({
  duration: z
    .number()
    .int()
    .refine((v) => [30, 60, 120].includes(v), "Invalid duration"),
  punctuation: z.boolean(),
  numbers: z.boolean(),
});

export type raceSchemaType = z.infer<typeof createRaceSchema>;

export type loginSchemaType = z.infer<typeof loginSchema>;
export type registerSchemaType = z.infer<typeof registerSchema>;
