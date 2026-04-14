import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import ColumnsClient from "./client";

export default async function ColumnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ColumnsClient companyId={user.company_id} />;
}
