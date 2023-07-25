import React from "react";
import type { Metadata } from "next";
import StyleSheet from "@/components/style-sheet";
import { AppReset } from "@/components/app-styles";

export const metadata: Metadata = {
  title: "Risk Leaderboard",
  description: "View and search the Risk leaderboard (updates hourly).",
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <StyleSheet>
          <AppReset />
          {children}
        </StyleSheet>
      </body>
    </html>
  );
}
