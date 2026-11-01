import { ProtectedPage } from "@/modules/auth/components/protected-page";

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return <ProtectedPage>{children}</ProtectedPage>;
}
