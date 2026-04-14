import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import ClientSharesClient from "./client";

export default async function ClientSharesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ClientSharesClient companyId={user.company_id} />;
}
