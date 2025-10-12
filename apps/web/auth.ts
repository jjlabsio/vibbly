import NextAuth, { NextAuthResult } from "next-auth";
import Google from "next-auth/providers/google";
import { serverApi } from "./lib/api";
import { Prisma, User } from "./generated/prisma";
import { DefaultSession, DefaultUser } from "@auth/core/types";

export const nextAuth = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent", // 사용자에게 항상 동의 화면을 표시하도록 강제!
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt", // JSON Web Token 사용
    maxAge: 60 * 60 * 24, // 세션 만료 시간(sec), 24h
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    signIn: async ({ account, profile, user }) => {
      return true;
    },
    jwt: async ({ token, account, user }) => {
      if (account) {
        let dbUser = await _isExist(user.email as string);

        if (!dbUser) {
          dbUser = await _signUp({
            email: user.email as string,
            name: user.name as string,
            image: user.image as string,
          });
        }

        Object.assign(token, {
          userId: dbUser!.id,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        });
      } else if (Date.now() < token.expires_at * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        return token;
      } else {
        // Subsequent logins, but the `access_token` has expired, try to refresh it
        if (!token.refresh_token) throw new TypeError("Missing refresh_token");

        try {
          // The `token_endpoint` can be found in the provider's documentation. Or if they support OIDC,
          // at their `/.well-known/openid-configuration` endpoint.
          // i.e. https://accounts.google.com/.well-known/openid-configuration
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            body: new URLSearchParams({
              client_id: process.env.AUTH_GOOGLE_ID!,
              client_secret: process.env.AUTH_GOOGLE_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refresh_token,
            }),
          });

          const tokensOrError = await response.json();

          if (!response.ok) throw tokensOrError;

          const newTokens = tokensOrError as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
          };

          Object.assign(token, {
            access_token: newTokens.access_token,
            expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
            // Some providers only issue refresh tokens once, so preserve if we did not get a new one
            refresh_token: newTokens.refresh_token
              ? newTokens.refresh_token
              : token.refresh_token,
          });
        } catch (error) {
          console.error("Error refreshing access_token", error);
          // If we fail to refresh the token, return an error so we can handle it on the page
          token.error = "RefreshTokenError";
          return token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
  },
});

// https://github.com/nextauthjs/next-auth/issues/10568
// next-auth의 버그가 고쳐지기 전까지 구조분해할당 대신 아래 방식으로 export함
export const handlers: NextAuthResult["handlers"] = nextAuth.handlers;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut;
export const auth: NextAuthResult["auth"] = nextAuth.auth;

const _isExist = async (email: string) => {
  try {
    const { data } = await serverApi.get<User | null>(
      `/api/users?email=${email}`,
      {
        headers: {
          "x-admin-key": process.env.INTERNAL_SECRET!,
        },
      }
    );

    return data;
  } catch (error: any) {
    if (error.response.status === 404) {
      return null;
    }

    throw error;
  }
};

const _signUp = async ({ email, name, image }: Prisma.UserCreateInput) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("name", name);
  formData.append("image", image);

  const { data } = await serverApi.post<User>("/api/users", formData, {
    headers: {
      "x-admin-key": process.env.INTERNAL_SECRET!,
    },
  });

  return data;
};

declare module "next-auth" {
  interface Session {
    error?: "RefreshTokenError";
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    access_token: string;
    expires_at: number;
    refresh_token?: string;
    error?: "RefreshTokenError";
  }
}
