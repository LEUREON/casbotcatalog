import React, { useState } from "react";
import ThemedBackground from "../common/ThemedBackground";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type Props = {
  initialMode?: "login" | "register";
  onClose?: () => void;
};

/**
 * Центрированная модалка авторизации в стиле сайта.
 * Фон — ThemedBackground, затем полупрозрачный слой и карточка по центру.
 */
const AuthDialog: React.FC<Props> = ({ initialMode = "login", onClose }) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Site background */}
      <ThemedBackground intensity={0.9} animated />

      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Centered card */}
      <div className="relative z-10 w-full h-full grid place-items-center p-3">
        <div className="w-full max-w-sm">
          {mode === "login" ? (
            <LoginForm
              onClose={onClose}
              onSuccess={onClose}
              onSwitchRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onClose={onClose}
              onSuccess={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;
