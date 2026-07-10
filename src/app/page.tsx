import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export default async function Home() {
  const c = await cookies();
  const sessionCookie = c.get("session")?.value;
  
  if (sessionCookie) {
    try {
      const session = await decrypt(sessionCookie);
      if (session) {
        if (session.role === "OWNER") {
          redirect("/dashboard");
        } else {
          redirect("/pos");
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  redirect("/login");
}
