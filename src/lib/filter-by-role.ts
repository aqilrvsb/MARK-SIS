import { UserProfile } from "./types";

interface AdRow {
  data: Record<string, unknown>;
  marketer_id: string;
  date_start: string;
  date_end: string;
}

interface TeamMember {
  id: string;
  leader_id: string | null;
}

export function filterByRole(
  adData: AdRow[],
  user: UserProfile,
  teamMembers: TeamMember[]
): AdRow[] {
  if (user.role === "bod") return adData; // BOD sees all
  if (user.role === "leader") {
    const myMarketers = teamMembers.filter(m => m.leader_id === user.id).map(m => m.id);
    return adData.filter(r => myMarketers.includes(r.marketer_id) || r.marketer_id === user.id);
  }
  // Marketer sees own only
  return adData.filter(r => r.marketer_id === user.id);
}
