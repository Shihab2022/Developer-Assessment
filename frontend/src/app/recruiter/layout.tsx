import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["RECRUITER", "COMPANY", "ADMIN"]}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
