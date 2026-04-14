import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import KpiTargetsClient from "./client";

export default async function KpiTargetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <KpiTargetsClient companyId={user.company_id} />;
}
