// project/src/components/Auth/LoginForm.tsx
import React, { useMemo, useState } from "react";
import { X, Mail, User as UserIcon, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemedBackground from "../common/ThemedBackground";
import { useAuth } from "../../contexts/AuthContext";
import { LoginStatus } from "../../types"; 
import { motion } from "framer-motion";

// === 🎨 DESIGN & ANIM CONSTANTS ===
const DESIGN = {
  colors: {
    text: { primary: "#ffffff", muted: "#b0b0b0", accent: "#d7aefb" },
    background: { glass: "rgba(40, 40, 50, 0.65)" },
    border: "rgba(255, 255, 255, 0.08)",
    accent: { primary: "#d7aefb", secondary: "#ff6bd6" },
  },
  shadows: { glass: "0 8px 32px rgba(0, 0, 0, 0.35)", button: "0 6px 20px rgba(255, 107, 214, 0.3)" },
  fonts: { heading: `"Geist", "Inter", system-ui, sans-serif`, body: `"Geist", "Inter", system-ui, sans-serif` },
};
const ANIM = {
  fadeInUp: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  buttonTap: { whileTap: { scale: 0.97 } },
};

export const LoginForm: React.FC<{onClose?: () => void; onSwitchToRegister?: () => void;}> = ({ onClose, onSwitchToRegister }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isUserBlocked } = useAuth(); 

  const next = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("next") || "/";
  }, [location.search]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const looksLikeEmail = (v: string) => /@/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) { setError("Введите логин/почту и пароль"); return; }
    setLoading(true);
    const identityToTry = identifier.toLowerCase();
    const blocked = await isUserBlocked(identityToTry); 
    if (blocked) { setError("Этот аккаунт заблокирован."); setLoading(false); return; }
    try {
      const res = await login(identityToTry, password); 
      if (res === LoginStatus.SUCCESS) {
        onClose ? onClose() : navigate(next);
      } else {
         setError("Неверный логин/почта или пароль.");
      }
    } catch (err: any) {
       setError("Неверный логин/почта или пароль.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      navigate(path);
    }
  };

  const CloseBtn = () => (
    <motion.button
      {...ANIM.buttonTap}
      type="button"
      onClick={() => (onClose ? onClose() : navigate(-1))}
      aria-label="Закрыть"
      className="absolute right-4 top-4 p-2 rounded-full transition-all duration-300"
      style={{
        background: DESIGN.colors.background.glass,
        color: DESIGN.colors.text.primary,
        border: `1px solid ${DESIGN.colors.border}`,
        boxShadow: DESIGN.shadows.glass,
      }}
    >
      <X className="w-5 h-5" />
    </motion.button>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3" style={{ fontFamily: DESIGN.fonts.body }}>
      <ThemedBackground intensity={0.9} animated />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <motion.div
        {...ANIM.fadeInUp(0.2)}
        className="relative z-10 w-full max-w-sm rounded-2xl"
        style={{
          background: DESIGN.colors.background.glass,
          border: `1px solid ${DESIGN.colors.border}`,
          boxShadow: DESIGN.shadows.glass,
          padding: "2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseBtn />
        <h1
          className="text-2xl font-black mb-2 text-center"
          style={{
            background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: DESIGN.fonts.heading,
          }}
        >
          Вход в аккаунт
        </h1>
        <p className="text-center mb-6" style={{ color: DESIGN.colors.text.muted }}>
          Логин <span className="opacity-60">или</span> почта + пароль
        </p>

        {error && (
          <motion.div {...ANIM.buttonTap} className="flex items-start gap-3 p-4 mb-6 rounded-2xl" style={{ background: "rgba(255, 107, 107, 0.1)", border: `1px solid rgba(255, 107, 107, 0.3)`, boxShadow: "0 4px 16px rgba(255, 107, 107, 0.2)" }}>
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ff6b6b" }} />
            <span className="text-sm" style={{ color: "#ff6b6b" }}>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex h-14 items-center gap-3 rounded-2xl px-4 transition-all duration-300"
            style={{ background: DESIGN.colors.background.glass, border: `1px solid ${DESIGN.colors.border}`, boxShadow: DESIGN.shadows.glass }}
          >
            <div className="flex shrink-0 items-center justify-center">
              {looksLikeEmail(identifier) ? <Mail className="w-5 h-5" style={{ color: DESIGN.colors.text.muted }} /> : <UserIcon className="w-5 h-5" style={{ color: DESIGN.colors.text.muted }} />}
            </div>
            <input id="identifier" type="text" autoComplete="username email" placeholder="Логин или email" className="h-full w-full flex-1 bg-transparent text-sm placeholder:text-white/70 outline-none" style={{ color: DESIGN.colors.text.primary }} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </div>

          <div className="flex h-14 items-center gap-3 rounded-2xl px-4 transition-all duration-300"
            style={{ background: DESIGN.colors.background.glass, border: `1px solid ${DESIGN.colors.border}`, boxShadow: DESIGN.shadows.glass }}
          >
            <div className="flex shrink-0 items-center justify-center">
              <Lock className="h-5 w-5" style={{ color: DESIGN.colors.text.muted }} />
            </div>
            <input id="password" type={showPwd ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="h-full w-full flex-1 bg-transparent text-sm placeholder:text-white/70 outline-none" style={{ color: DESIGN.colors.text.primary }} value={password} onChange={(e) => setPassword(e.target.value)} />
            <motion.button {...ANIM.buttonTap} type="button" onClick={() => setShowPwd(v => !v)} className="flex shrink-0 items-center justify-center p-2 rounded-full transition-colors hover:bg-white/10" style={{ color: DESIGN.colors.text.muted }}>
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </motion.button>
          </div>

          <motion.button
            {...ANIM.buttonTap}
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`, color: "#ffffff", boxShadow: DESIGN.shadows.button }}
          >
            {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Входим…</span> : "Войти в аккаунт"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm mb-2" style={{ color: DESIGN.colors.text.muted }}>Еще нет аккаунта?</p>
          <motion.button {...ANIM.buttonTap} type="button" onClick={() => handleNavigation('/register')} className="text-sm font-bold" style={{ color: DESIGN.colors.accent.primary }}>
            Зарегистрироваться
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};