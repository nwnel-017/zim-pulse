import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { userNeedsSurvey } from "@/lib/survey/survey";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireUserSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  if (await userNeedsSurvey(session.user.id)) {
    redirect("/survey");
  }

  return session;
}

export async function requireSurveySession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  if (!(await userNeedsSurvey(session.user.id))) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
