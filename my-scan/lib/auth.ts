// lib/auth.ts - forcing update
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
        url: process.env.CMU_ENTRAID_AUTHORIZATION_URL,
        params: {
          scope: process.env.SCOPE,
          redirect_uri: process.env.CMU_ENTRAID_REDIRECT_URL,
        },
      },
      token: {
        url: process.env.CMU_ENTRAID_GET_TOKEN_URL,
        async request(context) {
          const { provider, params, checks, client } = context;
          const { code } = params;
          const { code_verifier } = checks;

          // Force using the custom Redirect URI
          const redirectUri = process.env.CMU_ENTRAID_REDIRECT_URL;
          
          if (!redirectUri) throw new Error("Missing CMU_ENTRAID_REDIRECT_URL");

          // Fix TS Error: check if token is object or string
          const tokenUrl = typeof provider.token === "string" 
            ? provider.token 
            : provider.token?.url;

          if (!tokenUrl) throw new Error("Missing provider token URL");

          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: provider.clientId as string,
              client_secret: provider.clientSecret as string,
              code: code as string,
              grant_type: "authorization_code",
              redirect_uri: redirectUri,
              code_verifier: code_verifier as string, // PKCE
            }),
          });
          
          if (!response.ok) {
             const text = await response.text();
             console.error("[CMU Auth Error]", text); // Log for debugging
             throw new Error(text);
          }

          const tokens = await response.json();
          
          // Fix Error: Unknown argument `ext_expires_in`
          // We must return only fields that match the Account model or standard OAuth fields
          return {
            tokens: {
              access_token: tokens.access_token,
              token_type: tokens.token_type,
              id_token: tokens.id_token,
              refresh_token: tokens.refresh_token,
              scope: tokens.scope,
              expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000 + tokens.expires_in) : undefined,
            },
          };
        }
      },
      userinfo: process.env.CMU_ENTRAID_GET_BASIC_INFO,
      profile(profile) {
        return {
          id: profile.cmuitaccount,
          name: `${profile.firstname_EN} ${profile.lastname_EN}`,
          email: profile.cmuitaccount_name,
          image: null,
          role: "user",
          status: "PENDING",
          isSetupComplete: false,
          
          // Map CMU Fields
          firstnameTH: profile.firstname_TH,
          lastnameTH: profile.lastname_TH,
          firstnameEN: profile.firstname_EN,
          lastnameEN: profile.lastname_EN,
          organizationCode: profile.organization_code,
          organizationName: profile.organization_name_EN,
          itAccountType: profile.itaccounttype_EN,
          studentId: profile.student_id,
        };
      },
      checks: ["pkce", "state"], 
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
            status: true,
            email: true,
            name: true,
            image: true,
            role: true,
            
            // CMU Fields
            firstnameTH: true,
            lastnameTH: true,
            firstnameEN: true,
            lastnameEN: true,
            organizationCode: true,
            organizationName: true,
            itAccountType: true,
            studentId: true,
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
          
          // Pass CMU Fields to Token
          token.firstnameTH = dbUser.firstnameTH;
          token.lastnameTH = dbUser.lastnameTH;
          token.firstnameEN = dbUser.firstnameEN;
          token.lastnameEN = dbUser.lastnameEN;
          token.organizationCode = dbUser.organizationCode;
          token.organizationName = dbUser.organizationName;
          token.itAccountType = dbUser.itAccountType;
          token.studentId = dbUser.studentId;
          
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
        
        // Pass CMU Fields to Session
        session.user.firstnameTH = token.firstnameTH as string | null;
        session.user.lastnameTH = token.lastnameTH as string | null;
        session.user.firstnameEN = token.firstnameEN as string | null;
        session.user.lastnameEN = token.lastnameEN as string | null;
        session.user.organizationCode = token.organizationCode as string | null;
        session.user.organizationName = token.organizationName as string | null;
        session.user.itAccountType = token.itAccountType as string | null;
        session.user.studentId = token.studentId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        console.log("DEBUG: SignIn Event Triggered");
        console.log("DEBUG: Provider:", account?.provider);
        if (profile) {
            console.log("DEBUG: Profile Keys:", Object.keys(profile));
            console.log("DEBUG: Profile Data (Partial):", JSON.stringify({
                firstname_TH: (profile as any).firstname_TH,
                organization_name_EN: (profile as any).organization_name_EN,
                itaccounttype_EN: (profile as any).itaccounttype_EN
            }, null, 2));
        }

        // Sync CMU Profile Data on every login
        if (account?.provider === "cmu-entraid" && profile) {
           const cmuProfile = profile as any;
           await prisma.user.update({
             where: { id: user.id },
             data: {
               firstnameTH: cmuProfile.firstname_TH,
               lastnameTH: cmuProfile.lastname_TH,
               firstnameEN: cmuProfile.firstname_EN,
               lastnameEN: cmuProfile.lastname_EN,
               organizationCode: cmuProfile.organization_code,
               organizationName: cmuProfile.organization_name_EN,
               itAccountType: cmuProfile.itaccounttype_EN,
               studentId: cmuProfile.student_id,
             }
           });
        }

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "LOGIN",
            details: {
              provider: account?.provider,
              isNewUser,
            },
          },
        });
      } catch (error) {
        console.error("Failed to log sign in or sync profile:", error);
      }
    },
  },
};
