// project/src/pages/ProfilePage.tsx
import React, { useEffect, useRef, useState } from "react";
import { User as UserIcon, Save, Lock, Shield, AtSign, X, Upload, Cat, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import SectionCard from "../components/ui/SectionCard";
import Input from "../components/ui/Input";
import IconBase from "../components/ui/IconBase";
import AvatarCropper from "../components/ui/AvatarCropper";

const TOKENS = {
  accent: "#f7cfe1",
};

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nickname: user?.nickname || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    nickname?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarCropped, setAvatarCropped] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData((p) => ({ ...p, nickname: user.nickname, email: user.email }));
      setAvatarPreview(user.avatar || "");
      setDeleteAvatar(false);
    }
  }, [user]);

  if (!user) return null;

  const clearLater = (ms = 3000) => setTimeout(() => setMessage(null), ms);

  function validateFields() {
    const next: typeof errors = {};
    if (!formData.nickname.trim()) next.nickname = "Никнейм не может быть пустым";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(formData.email)) next.email = "Некорректный email";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDeleteAvatar(false);
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };
  
  const onCancel = () => {
    setIsEditing(false);
    setErrors({});
    setAvatarFile(null);
    setAvatarCropped(null);
    setDeleteAvatar(false);
    if (user) {
      setFormData({
        nickname: user.nickname,
        email: user.email,
        currentPassword: "", newPassword: "", confirmPassword: "",
      });
      setAvatarPreview(user.avatar || "");
    }
  };

  const onSave = async () => {
    if (!validateFields()) {
      setMessage({ type: "error", text: "Исправьте ошибки в форме" });
      clearLater();
      return;
    }

    const updates: any = {};
    if (formData.nickname !== user.nickname) updates.nickname = formData.nickname;
    if (formData.email !== user.email) updates.email = formData.email;
    if (avatarCropped) updates.avatarFile = avatarCropped;
    else if (avatarFile) updates.avatarFile = avatarFile;
    else if (deleteAvatar) updates.avatarFile = null;

    if (Object.keys(updates).length > 0) {
        const res = await updateProfile(updates);
        setMessage({ type: res.success ? "success" : "error", text: res.message });
        if (res.success) setIsEditing(false);
        clearLater();
    } else {
        setIsEditing(false);
    }
  };

  const confirmPasswordChange = async () => {
    const next: typeof errors = {};
    if (!formData.currentPassword) next.currentPassword = "Введите текущий пароль";
    if (formData.newPassword.length < 8) next.newPassword = "Пароль от 8 символов";
    else if (formData.newPassword !== formData.confirmPassword) next.confirmPassword = "Пароли не совпадают";
    setErrors((e) => ({ ...e, ...next }));

    if (Object.keys(next).length > 0) {
      setMessage({ type: "error", text: "Исправьте ошибки в полях пароля" });
      clearLater();
      return;
    }

    const res = await updateProfile({ oldPassword: formData.currentPassword, password: formData.newPassword });
    setMessage({ type: res.success ? "success" : "error", text: res.message });
    if (res.success) {
      setFormData((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    }
    clearLater();
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-6">
      <div className="mb-5 flex gap-2">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition">
            Редактировать профиль
          </button>
        ) : (
          <>
            <button onClick={onSave} className="flex-1 h-11 rounded-xl text-black font-medium inline-flex items-center justify-center gap-2" style={{ background: TOKENS.accent }}>
              <Check size={16} /> Сохранить
            </button>
            <button onClick={onCancel} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-slate-200 inline-flex items-center justify-center gap-2">
              <X size={16} /> Отмена
            </button>
          </>
        )}
      </div>

      {message && (
        <div className={`mb-5 rounded-xl px-4 py-3 border text-sm ${message.type === "success" ? "border-pink-300/40 text-pink-200 bg-pink-500/10" : "border-rose-400/30 text-rose-200 bg-rose-500/15"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Аккаунт">
          <Input label={<span className="flex items-center gap-2"><UserIcon size={16} />Логин</span>} value={user.username} readOnly disabled />
          <Input label={<span className="flex items-center gap-2"><Shield size={16} />Никнейм</span>} value={formData.nickname} onChange={(e) => setFormData((p) => ({ ...p, nickname: e.target.value }))} disabled={!isEditing} error={errors.nickname} />
          <Input label={<span className="flex items-center gap-2"><AtSign size={16} />Email</span>} type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} disabled={!isEditing} error={errors.email} />
        </SectionCard>

        <SectionCard title="Аватар">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0">
              {avatarPreview && !deleteAvatar ? (
                <AvatarCropper src={avatarPreview} onCropped={setAvatarCropped} className="w-16 h-16" />
              ) : (
                <div className="w-16 h-16 rounded-full border border-white/10 inline-flex items-center justify-center" style={{ background: TOKENS.accent }}>
                  <IconBase icon={Cat} size="avatar" className="text-black" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={onFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-11 rounded-xl text-black inline-flex items-center justify-center gap-2" style={{ background: TOKENS.accent }}>
                  <Upload size={16} /> Выбрать файл
                </button>
                <button onClick={() => { setAvatarPreview(""); setAvatarFile(null); setAvatarCropped(null); setDeleteAvatar(true); }} className="w-full h-10 rounded-xl border border-white/10 text-slate-200 hover:bg-white/10 transition">
                  Удалить аватар
                </button>
              </div>
            )}
          </div>
          {!isEditing && <p className="text-slate-400 text-sm">Нажмите "Редактировать", чтобы сменить аватар.</p>}
        </SectionCard>
        
        <div className="lg:col-span-2">
          <SectionCard title="Безопасность">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" label="Текущий пароль" value={formData.currentPassword} onChange={(e) => setFormData((p) => ({ ...p, currentPassword: e.target.value }))} error={errors.currentPassword} />
              <div/>
              <Input type="password" label="Новый пароль" value={formData.newPassword} onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))} error={errors.newPassword} />
              <Input type="password" label="Подтвердите пароль" value={formData.confirmPassword} onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))} error={errors.confirmPassword} />
            </div>
            <div className="pt-2">
              <button onClick={confirmPasswordChange} className="h-11 px-6 rounded-xl text-black font-medium inline-flex items-center justify-center gap-2" style={{ background: TOKENS.accent }}>
                <Lock size={16} /> Сменить пароль
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-6 pb-10">
        <button onClick={() => logout()} className="w-full h-12 rounded-2xl border text-rose-200 hover:bg-rose-500/15 transition" style={{ borderColor: "rgba(244, 63, 94, 0.35)", background: "rgba(244, 63, 94, 0.08)" }} aria-label="Выйти из аккаунта">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}