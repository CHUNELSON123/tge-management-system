import { AdminHomePage } from "@/modules/admin-portal/pages/admin-home-page";
import { connection } from "next/server";

export const instant = false;

export default async function AdminPage() {
  await connection();
  const year = new Date().getUTCFullYear();
  const initialRange = { from: `${year}-01-01`, to: `${year}-12-31` };
  return <AdminHomePage initialRange={initialRange} />;
}
