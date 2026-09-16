import { redirect } from "next/navigation";

export default function HomePage() {
  // The root page is an unauthenticated landing — redirect to the dashboard
  // once the session resolves server-side.
  redirect("/login");
}
