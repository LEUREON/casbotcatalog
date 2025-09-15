// project/src/components/Auth/RegisterForm.tsx
import React, { useMemo, useState } from "react";
import { X, User as UserIcon, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemedBackground from "../common/ThemedBackground";
import { useAuth } from "../../contexts/AuthContext";

const ACCENT = "#f7cfe1"; 

export const RegisterForm: React.FC<{onClose?: () => void; onSuccess?: () => void;}> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth(); 

  const next = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("next") || "/";
  }, [location.search]);

  const [username, setUsername] = useState(""); 
  const [nickname, setNickname] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !nickname || !email || !password) {
      setError("Заполните все поля");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      return;
    }
    try {
      setLoading(true);
      // ▼▼▼ ИЗМЕНЕНИЕ: Отправляем username и email в нижнем регистре ▼▼▼
      const res = await register(username.toLowerCase(), nickname, email.toLowerCase(), password); 
      // ▲▲▲ КОНЕЦ ▲▲▲
      if (res.success) {
        if (onClose) onClose();
        else navigate(next);
      } else {
        setError(res.message); 
      }
    } catch (err: any) {
      setError("Не удалось зарегистрироваться. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };
  
  const goLogin = () => {
    try {
      navigate("/login");
    } catch {
      window.location.hash = "#/login";
    }
  };

  const CloseBtn = () => (
    <button
      type="button"
      onClick={() => (onClose ? onClose() : navigate(-1))}
      aria-label="Закрыть"
      className="absolute right-2 top-2 p-2 rounded-lg hover:bg-white/10 active:scale-95 transition text-[var(--accent)]"
    >
      <X className="w-5 h-5" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[999]">
      <ThemedBackground intensity={0.9} animated />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full h-full grid place-items-center p-3">
        <div className="relative w-full max-w-sm mx-auto rounded-3xl border border-[var(--border)] bg-[var(--panel)] backdrop-blur-xl p-6 shadow-xl">
          <CloseBtn />
          <h1 className="text-xl font-semibold text-white mb-2">Регистрация</h1>
          <p className="text-sm text-[var(--textSecondary)] mb-4">Логин, никнейм, почта и пароль (мин. 8 симв.)</p>

          {error && (
            <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-400/30 rounded-xl p-3 mb-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Поле Логин (Username) */}
            <div className="flex items-center gap-3 rounded-xl border border-white/15 px-3 py-2 bg-white/[.03] focus-within:bg-white/[.05] transition">
              <div className="w-9 h-9 rounded-lg border grid place-items-center border-white/15">
                <UserIcon className="w-4 h-4 text-white/80" />
              </div>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Логин (для входа)"
                className="bg-transparent outline-none text-white flex-1 placeholder:text-white/40"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())} // Убираем .toLowerCase() отсюда
              />
            </div>
            
            {/* Поле Никнейм (Nickname) */}
            <div className="flex items-center gap-3 rounded-xl border border-white/15 px-3 py-2 bg-white/[.03] focus-within:bg-white/[.05] transition">
              <div className="w-9 h-9 rounded-lg border grid place-items-center border-white/15">
                <MessageSquare className="w-4 h-4 text-white/80" />
              </div>
              <input
                id="nickname"
                type="text"
                autoComplete="nickname"
                placeholder="Никнейм (для чата)"
                className="bg-transparent outline-none text-white flex-1 placeholder:text-white/40"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Поле Email */}
            <div className="flex items-center gap-3 rounded-xl border border-white/15 px-3 py-2 bg-white/[.03] focus-within:bg-white/[.05] transition">
              <div className="w-9 h-9 rounded-lg border grid place-items-center border-white/15">
                <Mail className="w-4 h-4 text-white/80" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-transparent outline-none text-white flex-1 placeholder:text-white/40"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())} // Убираем .toLowerCase() отсюда
              />
            </div>

            {/* Поле Пароль */}
            <div className="flex items-center gap-3 rounded-xl border border-white/15 px-3 py-2 bg-white/[.03] focus-within:bg-white/[.05] transition">
              <div className="w-9 h-9 rounded-lg border grid place-items-center border-white/15">
                <Lock className="w-4 h-4 text-white/80" />
              </div>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="bg-transparent outline-none text-white flex-1 placeholder:text-white/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPwd ? <EyeOff className="w-4 h-4 text-white/80" /> : <Eye className="w-4 h-4 text-white/80" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl px-4 py-2 font-medium text-black disabled:opacity-70"
              style={{ background: ACCENT }}
            >
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Создаем…</span> : "Создать аккаунт"}
            </button>
          </form>
          
           <div className="mt-4 flex items-center justify-center text-sm">
            <button
              type="button"
              onClick={goLogin}
              className="text-white/80 hover:text-white transition underline-offset-4 hover:underline"
              aria-label="Перейти ко входу"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 