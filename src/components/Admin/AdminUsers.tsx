// project/src/components/Admin/AdminUsers.tsx
import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  User,
  Shield,
  Edit,
  Lock,
  Unlock,
  Save,
  X,
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { User as UserType } from "../../types";

const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({
  elevated = false,
}: { elevated?: boolean } = {}) {
  const baseAlpha = elevated ? 0.09 : 0.07;
  return {
    background: `
      radial-gradient(600px 260px at 0% 0%, rgba(247, 207, 225,0.10), transparent 60%),
      radial-gradient(600px 260px at 100% 100%, rgba(120,140,255,0.09), transparent 60%),
      rgba(255,255,255,${baseAlpha})
    `,
    border: `1px solid ${BORDER}`,
    boxShadow: "none", // Тень убрана
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}

const INPUT_CLS = "w-full rounded-xl px-4 py-2.5 bg-black/[.15] border border-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50";
const SELECT_CLS = INPUT_CLS + " pr-10 appearance-none";
const FILE_INPUT_CLS = "block w-full text-sm text-white/90 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/20";


export function AdminUsers() {
  const { users, loadUsers, updateUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<
    Partial<UserType> & { newPassword?: string; newPasswordConfirm?: string }
  >({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!users.length) loadUsers();
  }, [users.length, loadUsers]);

  const openModal = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      nickname: user.nickname,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setAvatarFile(null);
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setMessage("");

    if (formData.newPassword && formData.newPassword !== formData.newPasswordConfirm) {
      setMessage("Пароли не совпадают!");
      return;
    }
    if (formData.newPassword && (formData.newPassword?.length || 0) < 8) {
      setMessage("Новый пароль должен содержать не менее 8 символов.");
      return;
    }

    const dataToSend = new FormData();
    if (formData.nickname && formData.nickname !== editingUser.nickname)
      dataToSend.append("nickname", String(formData.nickname));
    if (formData.username && formData.username !== editingUser.username)
      dataToSend.append("username", String(formData.username));
    if (formData.email && formData.email !== editingUser.email)
      dataToSend.append("email", String(formData.email));
    if (formData.role && formData.role !== editingUser.role)
      dataToSend.append("role", String(formData.role));
    if (formData.newPassword) dataToSend.append("password", String(formData.newPassword));
    if (avatarFile) dataToSend.append("avatar", avatarFile);

    let hasData = false;
    for (const _ of (dataToSend as any).entries()) {
      hasData = true;
      break;
    }
    if (!hasData) {
      setMessage("Нет изменений для сохранения.");
      return;
    }

    const success = await updateUser(editingUser.id, dataToSend);
    if (success) {
      await loadUsers();
      closeModal();
    } else {
      setMessage("Не удалось сохранить изменения.");
    }
  };

  const toggleBlock = async (user: UserType) => {
    await updateUser(user.id, { is_blocked: !user.isBlocked });
    await loadUsers();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Управление пользователями</h2>
        <div className="hidden sm:flex items-center gap-2 text-slate-300">
          <Shield className="h-5 w-5" />
          <span>Всего: {users.length}</span>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl p-4 sm:p-5"
            style={surfaceStyle()}
          >
            <div className="flex items-center gap-4">
              <img
                src={u.avatar || "https://placehold.co/64x64?text=U"}
                alt={u.nickname || u.username}
                className="w-14 h-14 rounded-2xl object-cover border"
                style={{ borderColor: BORDER }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">
                  {u.nickname || "Без имени"}
                </div>
                <div className="text-sm opacity-80 truncate">@{u.username}</div>
                <div className="text-sm opacity-70 truncate">{u.email}</div>
                <div className="mt-1 text-xs inline-flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: BORDER }}
                  >
                    Роль: <b>{u.role}</b>
                  </span>
                  {u.isBlocked && (
                    <span
                      className="px-2 py-0.5 rounded-lg border"
                      style={{ borderColor: BORDER, color: "#fca5a5" }}
                    >
                      Заблокирован
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button
                onClick={() => openModal(u)}
                className="w-full rounded-xl px-4 py-2 border font-medium flex items-center justify-center gap-2"
                style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
              >
                <Edit size={16} />
                Редактировать
              </button>
              <button
                onClick={() => toggleBlock(u)}
                className="w-full rounded-xl px-4 py-2 border font-medium flex items-center justify-center gap-2"
                style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
              >
                {u.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                {u.isBlocked ? "Разблокировать" : "Заблокировать"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full sm:max-w-lg sm:rounded-2xl text-left align-middle transition-all" style={surfaceStyle({ elevated: true })}>
                  <div className="p-4 sm:p-6">
                    <Dialog.Title className="text-lg font-bold leading-6 mb-4">
                      Редактировать: {editingUser?.nickname}
                    </Dialog.Title>

                    <div className="space-y-4">
                      <div><label className="text-sm text-slate-300 mb-1 block">Никнейм</label><input type="text" value={formData.nickname || ""} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className={INPUT_CLS}/></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Логин</label><input type="text" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={INPUT_CLS}/></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Email</label><input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={INPUT_CLS}/></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Роль</label><select value={formData.role as any} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className={SELECT_CLS}><option value="user">Пользователь</option><option value="admin">Администратор</option></select></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Новый пароль</label><input type="password" placeholder="Новый пароль (оставьте пустым)" value={formData.newPassword || ""} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className={INPUT_CLS}/></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Подтвердите пароль</label><input type="password" placeholder="Подтвердите пароль" value={formData.newPasswordConfirm || ""} onChange={(e) => setFormData({...formData, newPasswordConfirm: e.target.value })} className={INPUT_CLS}/></div>
                      <div><label className="text-sm text-slate-300 mb-1 block">Новый аватар</label><input type="file" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className={FILE_INPUT_CLS}/></div>
                    </div>

                    {message && (
                      <p className="text-sm text-red-400 mt-3">{message}</p>
                    )}
                  </div>

                  <div className="sticky bottom-0 w-full flex gap-2 p-3 sm:p-4" style={{...surfaceStyle(), borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <button onClick={closeModal} className="w-1/2 rounded-xl px-4 py-2 border font-medium" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}>
                      Отмена
                    </button>
                    <button onClick={handleSave} className="w-1/2 rounded-xl px-4 py-2 font-semibold text-black" style={{ background: ACCENT }}>
                      Сохранить
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}