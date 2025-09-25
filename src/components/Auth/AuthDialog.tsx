// src/components/Auth/AuthDialog.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../../contexts/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";

export function AuthDialog() {
  const { authState, closeAuthDialog } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const { lockScroll, unlockScroll } = useScrollLock();

  useEffect(() => {
    if (authState.isOpen) {
      lockScroll();
      setIsLoginView(authState.view === 'login');
    } else {
      unlockScroll();
    }
    return unlockScroll;
  }, [authState.isOpen, authState.view, lockScroll, unlockScroll]);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
  };

  const handleClose = () => {
    closeAuthDialog();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  };

  if (!authState.isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isLoginView ? (
        <LoginForm onClose={handleClose} onSwitchToRegister={handleToggleView} />
      ) : (
        <RegisterForm onClose={handleClose} onSwitchToLogin={handleToggleView} />
      )}
    </AnimatePresence>
  );
}