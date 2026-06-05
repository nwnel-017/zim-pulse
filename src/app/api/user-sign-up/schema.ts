import { z } from "zod";
import { normalizedText } from "@/utils/validation/zod-helpers";

export const userSignUpSchema = z.object({
  appPassword: z.string({ error: "App password is required." }).min(1, {
    error: "App password is required.",
  }),
  email: normalizedText({
    max: 320,
  }).pipe(z.email({ error: "Invalid email address." })),
});
