import { getProviders } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import SignInButton from "@/components/auth/sign-in";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const providers = await getProviders();

  return (
    <div>
      {providers &&
        Object.values(providers).map((provider) => (
          <div key={provider.name}>
            <SignInButton provider={provider} />
          </div>
        ))}
    </div>
  );
}
