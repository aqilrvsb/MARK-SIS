import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import BrandsClient from "./client";

export default async function BrandsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <BrandsClient companyId={user.company_id} />;
}
