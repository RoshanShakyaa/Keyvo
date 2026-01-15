"use client";

import React, { useMemo, ReactNode } from "react";
import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";

/**
 * This component ensures that Ably is only initialized on the client side.
 * Next.js often tries to run "use client" components on the server for SSR,
 * which causes the Ably Node.js bundle to be loaded and fail.
 */
export default function AblyClientProvider({
  children,
  userId,
  raceCode,
}: {
  children: ReactNode;
  userId: string;
  raceCode: string;
}) {
  // We use useMemo to ensure the client is only created once on the client side.
  // The check for typeof window !== "undefined" is a safety measure for SSR.
  const client = useMemo(() => {
    if (typeof window === "undefined") return null;

    return new Ably.Realtime({
      authUrl: "/api/ably/token",
      clientId: userId,
    });
  }, [userId]);

  if (!client) {
    return <>{children}</>;
  }

  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName={`race:${raceCode}`}>
        {children}
      </ChannelProvider>
    </AblyProvider>
  );
}
