// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
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
        (session.user as any).id = token.id;
        (session.user as any).isSetupComplete = token.isSetupComplete;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
