// project/src/pages/ProfilePage.tsx
import React, { useEffect, useRef, useState } from "react";
import { User as UserIcon, Save, Lock, Shield, AtSign, X, Upload, Cat, Check, LogOut, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import ThemedBackground from "../components/common/ThemedBackground";
import IconBase from "../components/ui/IconBase";
import AvatarCropper from "../components/ui/AvatarCropper";

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (СИНХРОНИЗИРОВАНА С ДРУГИМИ КОМПОНЕНТАМИ) ===
const DESIGN = {
  colors: {
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0",
      muted: "#b0b0b0",
      accent: "#d7aefb",
      error: "#ff6b6b",
    },
    background: {
      glass: "rgba(40, 40, 50, 0.65)",
      dark: "#0a0a12",
      item: "rgba(255,255,255,0.04)",
    },
    border: "rgba(255, 255, 255, 0.08)",
    accent: {
      primary: "#d7aefb",
      secondary: "#ff6bd6",
      glow: "rgba(215, 174, 251, 0.4)",
      errorGlow: "rgba(255, 107, 107, 0.2)",
    },
  },
  radius: {
    md: "16px",
    lg: "24px",
    full: "9999px",
  },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
    button: "0 6px 20px rgba(215, 174, 251, 0.3)",
    error: "0 4px 16px rgba(255, 107, 107, 0.2)",
  },
  fonts: {
    heading: `"Geist", "Inter", system-ui, sans-serif`,
    body: `"Geist", "Inter", system-ui, sans-serif`,
  },
  transitions: {
    spring: { type: "spring", stiffness: 400, damping: 25 } as const,
  },
};

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ ===
const ANIM = {
  fadeInUp: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  buttonTap: {
    whileTap: { scale: 0.97 },
  },
};

// === Компоненты в новом дизайне ===

const SectionCard: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ title, children, delay = 0.2 }) => (
  <motion.div
    {...ANIM.fadeInUp(delay)}
    className="rounded-2xl p-5"
    style={{ background: DESIGN.colors.background.glass, border: `1px solid ${DESIGN.colors.border}`, boxShadow: DESIGN.shadows.glass }}
  >
    <h3 className="text-lg font-bold mb-4" style={{ color: DESIGN.colors.text.primary }}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType, error?: string }> = ({ icon: Icon, error, ...props }) => (
  <div>
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: DESIGN.colors.background.item, border: `1px solid ${DESIGN.colors.border}` }}>
      <Icon className="w-5 h-5" style={{ color: DESIGN.colors.text.muted }} />
      <input
        {...props}
        className="bg-transparent outline-none w-full text-sm placeholder-text-muted"
        style={{ color: DESIGN.colors.text.primary, fontFamily: DESIGN.fonts.body }}
      />
    </div>
    {error && <p className="text-xs mt-1.5" style={{ color: DESIGN.colors.text.error }}>{error}</p>}
  </div>
);

const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ children, variant = 'primary', ...props }) => {
  const styles = {
    primary: { background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`, color: "#ffffff", boxShadow: DESIGN.shadows.button },
    secondary: { background: DESIGN.colors.background.glass, color: DESIGN.colors.text.primary, border: `1px solid ${DESIGN.colors.border}` },
    danger: { background: "rgba(255, 107, 107, 0.1)", color: "#ff6b6b", border: "1px solid rgba(255, 107, 107, 0.3)" },
  };
  return (
    <motion.button {...ANIM.buttonTap} {...props} className="w-full h-12 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2" style={styles[variant]}>
      {children}
    </motion.button>
  );
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
  
  const clearMessage = (ms = 3000) => setTimeout(() => setMessage(null), ms);

  const validate = () => {
    const nextErrors: { [key: string]: string } = {};
    if (!formData.nickname.trim()) nextErrors.nickname = "Никнейм не может быть пустым";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Некорректный email";
    if (formData.newPassword && formData.newPassword.length < 8) nextErrors.newPassword = "Пароль должен быть не менее 8 символов";
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) nextErrors.confirmPassword = "Пароли не совпадают";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setDeleteAvatar(false);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };
  
  const onCancel = () => {
    setIsEditing(false);
    setErrors({});
    setAvatarCropped(null);
    setDeleteAvatar(false);
    if (user) {
      setFormData({ ...formData, nickname: user.nickname, email: user.email, currentPassword: "", newPassword: "", confirmPassword: "" });
      setAvatarPreview(user.avatar || "");
    }
  };

  const onSave = async () => {
    if (!validate()) {
      setMessage({ type: "error", text: "Исправьте ошибки в форме" });
      clearMessage();
      return;
    }

    const updates: any = {};
    if (formData.nickname !== user?.nickname) updates.nickname = formData.nickname;
    if (formData.email !== user?.email) updates.email = formData.email;
    if (avatarCropped) updates.avatarFile = avatarCropped;
    if (deleteAvatar) updates.avatarFile = null;
    if (formData.newPassword && formData.currentPassword) {
      updates.oldPassword = formData.currentPassword;
      updates.password = formData.newPassword;
    }

    if (Object.keys(updates).length > 0) {
        const res = await updateProfile(updates);
        setMessage({ type: res.success ? "success" : "error", text: res.message });
        if (res.success) {
          setIsEditing(false);
          setFormData(prev => ({...prev, currentPassword: '', newPassword: '', confirmPassword: ''}));
        }
        clearMessage();
    } else {
        setIsEditing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen p-2 sm:p-4" style={{ fontFamily: DESIGN.fonts.body }}>
      <ThemedBackground intensity={0.9} animated />
      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
        <motion.div {...ANIM.fadeInUp(0.1)} className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ background: `linear-gradient(120deg, ${DESIGN.colors.text.primary} 0%, ${DESIGN.colors.accent.primary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Профиль
            </h1>
        </motion.div>

        {message && (
          <motion.div {...ANIM.fadeInUp(0.2)} className="p-4 rounded-2xl" style={{ background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 107, 0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 107, 107, 0.3)'}` }}>
            <p style={{ color: message.type === 'success' ? '#4ade80' : DESIGN.colors.text.error }}>{message.text}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <SectionCard title="Аватар" delay={0.2}>
              <div className="flex flex-col items-center gap-4">
                  {avatarPreview && !deleteAvatar ? (
                    <AvatarCropper src={avatarPreview} onCropped={setAvatarCropped} className="w-24 h-24" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border border-white/10 inline-flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})` }}>
                      <IconBase icon={Cat} size="avatar" style={{ color: "#ffffff" }} />
                    </div>
                  )}
                {isEditing && (
                  <div className="w-full space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    <ActionButton onClick={() => fileInputRef.current?.click()} variant="secondary"><Upload size={16}/> Выбрать</ActionButton>
                    <ActionButton onClick={() => { setAvatarPreview(""); setAvatarCropped(null); setDeleteAvatar(true); }} variant="danger"><X size={16}/> Удалить</ActionButton>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="md:col-span-2">
            <SectionCard title="Данные аккаунта" delay={0.3}>
              <InputField icon={Shield} label="Логин" value={user.username} readOnly disabled />
              <InputField icon={UserIcon} label="Никнейм" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} disabled={!isEditing} error={errors.nickname} />
              <InputField icon={AtSign} label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} error={errors.email} />
            </SectionCard>
          </div>
          
          {isEditing && (
            <div className="md:col-span-3">
              <SectionCard title="Смена пароля" delay={0.4}>
                <InputField icon={Lock} type="password" placeholder="Текущий пароль" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} error={errors.currentPassword} />
                <InputField icon={Lock} type="password" placeholder="Новый пароль" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} error={errors.newPassword} />
                <InputField icon={Lock} type="password" placeholder="Подтвердите новый пароль" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} error={errors.confirmPassword} />
              </SectionCard>
            </div>
          )}
        </div>
        
        <motion.div {...ANIM.fadeInUp(0.5)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing ? (
            <ActionButton onClick={() => setIsEditing(true)}><Edit size={16}/> Редактировать</ActionButton>
          ) : (
            <>
              <ActionButton onClick={onSave}><Save size={16}/> Сохранить</ActionButton>
              <ActionButton onClick={onCancel} variant="secondary"><X size={16}/> Отмена</ActionButton>
            </>
          )}
        </motion.div>

        <motion.div {...ANIM.fadeInUp(0.6)} className="pt-4">
            <ActionButton onClick={() => logout()} variant="danger"><LogOut size={16}/> Выйти из аккаунта</ActionButton>
        </motion.div>
      </div>
    </div>
  );
}