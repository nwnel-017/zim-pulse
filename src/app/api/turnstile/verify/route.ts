import { NextResponse } from "next/server";

type TurnstileSiteverifyResponse = {
  "error-codes"?: string[];
  success?: boolean;
};

export async function POST(request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return NextResponse.json(
      { message: "Turnstile is not configured.", success: false },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    token?: unknown;
  } | null;
  const token = payload?.token;

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json(
      { message: "Turnstile token is required.", success: false },
      { status: 400 },
    );
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { message: "Unable to verify Turnstile token.", success: false },
      { status: 502 },
    );
  }

  const result = (await response
    .json()
    .catch(() => null)) as TurnstileSiteverifyResponse | null;

  return NextResponse.json({
    errorCodes: result?.["error-codes"] ?? [],
    success: result?.success === true,
  });
}
