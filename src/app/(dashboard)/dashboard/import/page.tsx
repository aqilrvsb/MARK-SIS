import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import ImportClient from "./client";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ImportClient companyId={user.company_id} userId={user.id} />;
}
