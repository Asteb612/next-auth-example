import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions as NextAuthConfig } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type UserParams = {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  
  export type UserAuthenticated = {
    id?: string;
    name?: string;
    email?: string;
  };
  
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
  }

  interface Session {
    user: UserParams;
    access_token?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    user: UserParams
    error?: string;
  }
}

export type AuthRefresh = {
  access_token?: string | null;
  expires?: number | null;
  refresh_token?: string | null;
};

export type UserSession = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
};

export const config = {
  debug: true,
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7d
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const user = {
          id: "XXX",
          first_name: "John",
          last_name: "Smith",
          email: "js@gmail.com",
          access_token: "abc",
          expires_in: 60_000, //1m
          refresh_token: "abc",
        };
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          access_token: user.access_token,
          expires_at: Date.now() + (user.expires_in ?? 0),
          refresh_token: user.refresh_token,
          user: {
              id: '0000',
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
          }
        };
      }

      if ((token.expires_at ?? 0) > Date.now()) {
        console.log("use current token", token.access_token);
        return token;
      }

      return {
        ...token,
        access_token: "bcd",
        expires_at: Date.now() + (60_000 ?? 0), //1m
        refresh_token: "bcd",
      };
    },
    async session({ session, token }) {
      session.error = token.error ?? "";
      const { id, email, first_name, last_name } = token.user as UserParams;
      session.access_token = token.access_token;
      session.user = {
        id,
        email,
        first_name,
        last_name
      };
      return session;
    },
  },
} satisfies NextAuthConfig;

// Helper function to get session without passing config every time
// https://next-auth.js.org/configuration/nextjs#getserversession
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}

// We recommend doing your own environment variable validation
declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      NEXTAUTH_SECRET: string;
    }
  }
}
