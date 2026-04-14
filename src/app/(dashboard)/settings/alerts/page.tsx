import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import AlertsClient from "./client";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AlertsClient companyId={user.company_id} />;
}
