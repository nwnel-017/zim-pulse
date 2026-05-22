import { z } from "zod";
import { normalizedText } from "@/utils/validation/zod-helpers";

export const adminSignUpSchema = z.object({
  email: normalizedText({
    max: 320,
  }).pipe(z.email({ error: "Invalid email address." })),
  name: normalizedText({
    max: 120,
  }),
  password: z.string({ error: "Password is required." }).min(1, {
    error: "Password is required.",
  }),
  signupCode: normalizedText({
    max: 200,
  }),
});
