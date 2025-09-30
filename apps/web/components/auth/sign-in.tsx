"use client";

import { Button } from "@vibbly/ui/components/button";
import { signIn } from "next-auth/react";

export default function SignInButton({ provider }: { provider: any }) {
  return (
    <Button onClick={() => signIn(provider.id)}>
      Sign in with {provider.name}
    </Button>
  );
}
