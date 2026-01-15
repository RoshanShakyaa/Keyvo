// app/api/ably/token/route.ts
import { NextRequest } from "next/server";
import Ably from "ably";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = new Ably.Rest(process.env.ABLY_API_KEY!);

  const tokenRequest = await client.auth.createTokenRequest({
    clientId: session.user.id,
  });

  return Response.json(tokenRequest);
}
