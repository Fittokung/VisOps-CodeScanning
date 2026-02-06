// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  cookies: {
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes in seconds
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // *** เพิ่มบรรทัดนี้เพื่อแก้ Error: OAuthAccountNotLinked ***
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Only allow admins to login via credentials
        if (!user || !user.password || user.role !== "admin") {
          throw new Error("Invalid credentials or not an admin");
        }

        if (user.status === "REJECTED") {
          throw new Error("Your account has been suspended.");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
          isSetupComplete: user.isSetupComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // On sign in or session update, fetch latest user data
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            isSetupComplete: true,
            role: true,
            status: true,
            email: true,
            name: true,
            image: true,
          },
        });

        if (dbUser) {
          // Block Rejected Users
          if (dbUser.status === "REJECTED") {
            throw new Error("Your account has been suspended.");
          }

          token.id = dbUser.id;
          token.isSetupComplete = dbUser.isSetupComplete;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add user info to session from token
        session.user.id = token.id;
        session.user.isSetupComplete = token.isSetupComplete;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
