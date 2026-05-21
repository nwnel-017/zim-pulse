import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authPool } from "@/lib/prisma/db";
import { sanitizeTextInput } from "@/utils/validation/sanitize-input";

type AdminSignUpPayload = {
  email?: unknown;
  name?: unknown;
  password?: unknown;
  signupCode?: unknown;
};

// this is wrong

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

  const payload = (await request
    .json()
    .catch(() => null)) as AdminSignUpPayload | null;

  if (!payload) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const name = sanitizeTextInput(payload.name, {
      fieldName: "Name",
      maxLength: 120,
    });
    const email = sanitizeTextInput(payload.email, {
      fieldName: "Email",
      maxLength: 320,
    });
    const signupCode = sanitizeTextInput(payload.signupCode, {
      fieldName: "Admin signup code",
      maxLength: 200,
    });
    const password =
      typeof payload.password === "string" && payload.password.length > 0
        ? payload.password
        : "";

    if (!password) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 },
      );
    }

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
