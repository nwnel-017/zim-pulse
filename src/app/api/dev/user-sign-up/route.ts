import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { userSignUpSchema } from "@/app/api/user-sign-up/schema";
import { getFirstZodIssueMessage } from "@/utils/validation/zod-helpers";

const isProduction = process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

function toErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to create your account.";
}

export async function POST(request: Request) {
  if (isProduction) {
    return NextResponse.json(
      { message: "This sign-up method is unavailable in production." },
      { status: 403 },
    );
  }

  const expectedAppPassword = process.env.APP_SIGNUP_PASSWORD;

  if (!expectedAppPassword) {
    return NextResponse.json(
      { message: "APP_SIGNUP_PASSWORD is not configured." },
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
    const validationResult = userSignUpSchema.safeParse(payload);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: getFirstZodIssueMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { appPassword, email } = validationResult.data;

    if (appPassword !== expectedAppPassword) {
      return NextResponse.json(
        { message: "Invalid app password." },
        { status: 403 },
      );
    }

    const result = await auth.api.signUpEmail({
      body: {
        email,
        name: "test user",
        password: appPassword,
      },
      headers: request.headers,
      returnHeaders: true,
    });

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
