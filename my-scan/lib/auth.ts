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
    // Google Provider Removed per user request
    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // *** เพิ่มบรรทัดนี้เพื่อแก้ Error: OAuthAccountNotLinked ***
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user",
          status: "PENDING",
          isSetupComplete: false,
        };
      },
    }),
    */
    {
      id: "cmu-entraid",
      name: "CMU EntraID",
      type: "oauth",
      clientId: process.env.CMU_ENTRAID_CLIENT_ID,
      clientSecret: process.env.CMU_ENTRAID_CLIENT_SECRET,
      authorization: {
        url: "https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/authorize",
        params: {
          scope: "api://cmu/Mis.Account.Read.Me.Basicinfo offline_access",
        },
      },
      token: "https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/token",
      userinfo: "https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo",
      profile(profile) {
        return {
          id: profile.cmuitaccount,
          name: `${profile.firstname_EN} ${profile.lastname_EN}`,
          email: profile.cmuitaccount_name,
          image: null,
          role: "user",
          status: "PENDING",
          isSetupComplete: false,
        };
      },
      allowDangerousEmailAccountLinking: true,
    },
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
        if (!user || !user.password || user.role !== "ADMIN") {
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
      // always fetch latest user data to ensure permissions are up to date
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
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
          
          // Prevent large payloads (base64 images) from bloating the token and causing HTTP 431
          if (dbUser.image && dbUser.image.length > 2048) {
            token.image = null; 
          } else {
            token.image = dbUser.image;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add user info to session from token
        session.user.id = token.id as string;
        session.user.isSetupComplete = token.isSetupComplete as boolean;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.image = token.image as string; // Pass image to session
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
