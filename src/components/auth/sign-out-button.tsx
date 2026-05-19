"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

type SignOutButtonProps = {
  redirectTo: string;
};

export function SignOutButton({ redirectTo }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await authClient.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <button className="auth-link-button" disabled={pending} onClick={handleClick} type="button">
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
