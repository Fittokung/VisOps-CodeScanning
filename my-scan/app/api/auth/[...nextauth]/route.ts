// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = await NextAuth(authOptions);

export { handler as GET, handler as POST };
