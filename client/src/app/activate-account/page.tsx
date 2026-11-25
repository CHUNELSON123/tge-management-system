import { Suspense } from "react";
import { ActivateAccountRoute } from "./activate-account-route";

export const metadata = { referrer: "no-referrer" as const };

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<main className="p-10 text-center">Loading...</main>}>
      <ActivateAccountRoute />
    </Suspense>
  );
}
