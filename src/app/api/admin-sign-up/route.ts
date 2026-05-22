import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authPool } from "@/lib/prisma/db";
import { adminSignUpSchema } from "@/app/api/admin-sign-up/schema";
import { getFirstZodIssueMessage } from "@/utils/validation/zod-helpers";

function toErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to create the admin account.";
}

export async function POST(request: Request) {
  const expectedSignupCode = process.env.ADMIN_SIGNUP_CODE;

  if (!expectedSignupCode) {
    return NextResponse.json(
      { message: "ADMIN_SIGNUP_CODE is not configured." },
      { status: 500 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const validationResult = adminSignUpSchema.safeParse(payload);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: getFirstZodIssueMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { email, name, password, signupCode } = validationResult.data;

    if (signupCode !== expectedSignupCode) {
      return NextResponse.json(
        { message: "Invalid admin signup code." },
        { status: 403 },
      );
    }

    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: request.headers,
      returnHeaders: true,
    });

    await authPool.query('UPDATE "user" SET role = $1 WHERE id = $2', [
      "admin",
      result.response.user.id,
    ]);

    const response = NextResponse.json({ ok: true });

    result.headers?.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append(key, value);
        return;
      }

      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: toErrorMessage(error) },
      { status: 400 },
    );
  }
}
