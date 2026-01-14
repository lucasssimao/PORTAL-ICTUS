import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AccountCard } from "../pages/Account";
import "./AccountDrawer.css";

export default function AccountDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <>
      <div className="account-drawer-backdrop" onClick={onClose} />
      <div className="account-drawer-panel" role="dialog" aria-modal="true">
        <AccountCard onClose={onClose} />
      </div>
    </>
  );

  return createPortal(content, document.body);
}
