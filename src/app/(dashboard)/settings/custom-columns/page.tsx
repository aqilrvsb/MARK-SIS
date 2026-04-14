import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import CustomColumnsClient from "./client";

export default async function CustomColumnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "bod") redirect("/dashboard");
  return <CustomColumnsClient companyId={user.company_id} />;
}
