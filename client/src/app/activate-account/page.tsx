import { Suspense } from "react";
import { ActivateAccountRoute } from "./activate-account-route";

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<main className="p-10 text-center">Loading...</main>}>
      <ActivateAccountRoute />
    </Suspense>
  );
}
