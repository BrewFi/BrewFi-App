import type { ReactNode } from "react";
import { DappAccessGuard } from "@/components/blockchain/DappAccessGuard";

export default function TransactionHistoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DappAccessGuard>{children}</DappAccessGuard>;
}
