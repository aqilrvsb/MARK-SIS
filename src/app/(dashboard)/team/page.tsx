import { getCurrentUser, getTeamMembers, getLeaders } from "@/lib/actions";
import { redirect } from "next/navigation";
import TeamClient from "./team-client";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "marketer") redirect("/dashboard");

  const members = await getTeamMembers();
  const leaders = await getLeaders();

  return <TeamClient currentUser={user} members={members} leaders={leaders} />;
}
