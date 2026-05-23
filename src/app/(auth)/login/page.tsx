import { redirect } from "next/navigation";

// Demo mode: auth is disabled. Send everyone straight to the feed.
export default function LoginPage() {
  redirect("/feed");
}
