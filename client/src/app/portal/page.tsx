import PortalHome from "./portal-home";

// This route resolves its protected destination from a browser-held session.
export const instant = false;

export default function Page() {
  return <PortalHome />;
}
