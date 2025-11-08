import type { ReactNode } from "react";
import { DappAccessGuard } from "@/components/blockchain/DappAccessGuard";

export default function SwapLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DappAccessGuard>{children}</DappAccessGuard>;
}
