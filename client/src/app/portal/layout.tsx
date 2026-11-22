import { ProtectedPage } from "@/modules/auth/components/protected-page";
import { MemberPortalGate } from "@/modules/member-portal/components/member-portal-gate";

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return <ProtectedPage><MemberPortalGate>{children}</MemberPortalGate></ProtectedPage>;
}
