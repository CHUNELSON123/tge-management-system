import { ProtectedPage } from "@/modules/auth/components/protected-page";
import { MentorPortal } from "@/modules/mentor-portal/components/mentor-portal";
export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage><MentorPortal>{children}</MentorPortal></ProtectedPage>;
}
