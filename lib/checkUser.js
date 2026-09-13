import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  if (!primaryEmail) {
    console.error("User does not have a primary email address on their Clerk account:", user.id);
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    const newUser = await db.user.upsert({
      where: {
        clerkUserId: user.id,
      },
      create: {
        clerkUserId: user.id,
        name: name || null,
        imageUrl: user.imageUrl,
        email: primaryEmail,
      },
      update: {
        name: name || null,
        imageUrl: user.imageUrl,
        email: primaryEmail,
      },
    });

    return newUser;
  } catch (error) {
    if (error.code === "P2002") {
      try {
        return await db.user.findUnique({
          where: {
            clerkUserId: user.id,
          },
        });
      } catch (fetchError) {
        console.error("Error fetching user after race condition:", fetchError.message);
      }
    }
    console.error("Error in checkUser:", error.message);
    return null;
  }
};
