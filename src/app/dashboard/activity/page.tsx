import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

import ActivityClient from "./ActivityClient";

export default async function ActivityLogPage() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
    take: 100 // show last 100 for now
  });

  return (
    <div className="page-wrapper animate-fade-in" style={{ flexDirection: "column" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Activity Log</h1>
      <ActivityClient logs={logs} />
    </div>
  );
}
