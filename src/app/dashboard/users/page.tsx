import { PrismaClient } from "@prisma/client";
import UsersClient from "@/components/UsersClient";

const prisma = new PrismaClient();

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>إدارة المستخدمين</h1>
          <p style={{ color: "#9ca3af" }}>إدارة الموظفين والمديرين والصلاحيات وكلمات المرور.</p>
        </div>
      </div>

      <UsersClient initialUsers={users} />
    </div>
  );
}
