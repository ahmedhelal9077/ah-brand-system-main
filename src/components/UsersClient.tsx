"use client";

import React, { useState } from "react";
import { UserPlus, Shield, UserX, UserCheck, KeyRound, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { createUser, toggleUserStatus, resetUserPassword, editUser } from "../app/dashboard/users/actions";
import DeleteUserButton from "../app/dashboard/users/DeleteUserButton";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showPlainPasswordFor, setShowPlainPasswordFor] = useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    const res = await editUser(editingUser.id, formData);
    if (res?.error) {
      alert(res.error);
    } else {
      setEditingUser(null);
      window.location.reload(); // Refresh to get updated data
    }
  };

  return (
    <>
      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Add User Form */}
        <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={20} className="text-primary" /> إضافة مستخدم جديد
          </h2>
          
          <form action={createUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="username">اسم المستخدم</label>
              <input className="input-field" type="text" id="username" name="username" required placeholder="Employee username" />
            </div>
            
            <div className="input-group" style={{ marginBottom: "0", position: "relative" }}>
              <label className="input-label" htmlFor="password">كلمة المرور</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  className="input-field" 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  required 
                  placeholder="Initial password" 
                  style={{ paddingRight: "2.5rem" }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.5rem", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="role">الصلاحية</label>
              <select className="input-field" id="role" name="role" required>
                <option value="EMPLOYEE">موظف (كاشير)</option>
                <option value="WAREHOUSE">موظف مخزن (تجهيز)</option>
                <option value="OWNER">مدير (صلاحيات كاملة)</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
              إنشاء حساب
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={20} className="text-primary" /> المستخدمين
          </h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>الاسم</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>الباسورد</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>الصلاحية</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>الحالة</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "500", textAlign: "right" }}>{user.username}</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "var(--accent)", fontFamily: "monospace" }}>
                      {showPlainPasswordFor === user.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                          {user.plainPassword || "مخفي"}
                          <button type="button" onClick={() => setShowPlainPasswordFor(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}><EyeOff size={16}/></button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                          ••••••••
                          <button type="button" onClick={() => setShowPlainPasswordFor(user.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}><Eye size={16}/></button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      <span style={{ 
                        background: user.role === "OWNER" ? "rgba(79, 70, 229, 0.1)" : user.role === "WAREHOUSE" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)", 
                        color: user.role === "OWNER" ? "var(--primary)" : user.role === "WAREHOUSE" ? "var(--warning)" : "var(--accent)", 
                        padding: "0.3rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: "bold" 
                      }}>
                        {user.role === "OWNER" ? "مدير" : user.role === "WAREHOUSE" ? "مخزن" : "كاشير"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      {user.isActive ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--accent)", fontSize: "0.9rem" }}>
                          <UserCheck size={16} /> نشط
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--danger)", fontSize: "0.9rem" }}>
                          <UserX size={16} /> موقوف
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "left", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button onClick={() => setEditingUser(user)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                        <Edit size={14} /> تعديل
                      </button>
                      <form action={toggleUserStatus.bind(null, user.id, !user.isActive)}>
                        <button type="submit" className={`btn ${user.isActive ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                          {user.isActive ? "إيقاف" : "تفعيل"}
                        </button>
                      </form>
                      {user.role !== "OWNER" && (
                        <DeleteUserButton userId={user.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: "2rem", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>تعديل بيانات المستخدم: {editingUser.username}</h2>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-username">اسم المستخدم</label>
                <input className="input-field" type="text" id="edit-username" name="username" required defaultValue={editingUser.username} />
              </div>
              
              <div className="input-group" style={{ marginBottom: "0", position: "relative" }}>
                <label className="input-label" htmlFor="edit-password">كلمة المرور الجديدة (اختياري)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input 
                    className="input-field" 
                    type={showEditPassword ? "text" : "password"} 
                    id="edit-password" 
                    name="password" 
                    placeholder="اتركه فارغاً لعدم التغيير" 
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{ position: "absolute", right: "0.5rem", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-role">الصلاحية</label>
                <select className="input-field" id="edit-role" name="role" required defaultValue={editingUser.role}>
                  <option value="EMPLOYEE">موظف (كاشير)</option>
                  <option value="WAREHOUSE">موظف مخزن (تجهيز)</option>
                  <option value="OWNER">مدير (صلاحيات كاملة)</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>حفظ التعديلات</button>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary" style={{ flex: 1 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
