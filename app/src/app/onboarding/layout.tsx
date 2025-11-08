import type { ReactNode } from "react";
import { DappAccessGuard } from "@/components/blockchain/DappAccessGuard";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DappAccessGuard>{children}</DappAccessGuard>;
}
