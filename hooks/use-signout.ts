"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function useSignout() {
  const router = useRouter();
  const handleSignout = async function Signout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
        onError: () => {
          console.error("Failed to log out: ");
        },
      },
    });
  };

  return handleSignout;
}
