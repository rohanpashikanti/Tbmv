import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let clerkAuthUser = null;
  let applicationUser = null;

  try {
    const { userId } = await auth();

    if (userId) {
      const clerkUser = await currentUser();
      clerkAuthUser = {
        id: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress,
        phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber,
        name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" "),
      };

      const appUser = await prisma.user.findUnique({
        where: { authUserId: userId },
      });

      if (appUser) {
        applicationUser = {
          id: appUser.id,
          name: appUser.name,
          email: appUser.email,
          role: appUser.role,
          status: appUser.status,
        };
      }
    }
  } catch (err: any) {
    // Gracefully handle unauthenticated/offline states
  }

  return NextResponse.json({
    status: "ok",
    authProvider: "Clerk",
    session: {
      authenticated: Boolean(clerkAuthUser),
      user: clerkAuthUser,
      applicationUser,
    },
    timestamp: new Date().toISOString(),
  });
}
