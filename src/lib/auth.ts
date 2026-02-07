import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword, getUserById } from "./db/queries";

// Get the base URL for NextAuth
function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name: string | null;
      email: string | null;
      image: string | null;
      role: "user" | "admin";
      tier: "1" | "2" | "3" | "4" | "5";
    };
  }

  interface User {
    id: number;
    role: "user" | "admin";
    tier: "1" | "2" | "3" | "4" | "5";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: "user" | "admin";
    tier: "1" | "2" | "3" | "4" | "5";
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        const user = await verifyPassword(
          credentials.email,
          credentials.password
        );

        if (!user) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as number;
        token.role = user.role;
        token.tier = user.tier;
      }

      // Refresh user data on session update
      if (trigger === "update") {
        const freshUser = await getUserById(token.id);
        if (freshUser) {
          token.role = freshUser.role;
          token.tier = freshUser.tier;
          token.name = freshUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tier = token.tier;
      }
      return session;
    },
  },
};
