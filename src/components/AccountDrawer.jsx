import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function AccountDrawer({ open, onClose, profile }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleChangePassword = () => {
    // Se você já tem a rota /change-password, manda pra ela.
    // Se no seu projeto for outra rota, me fala qual é o arquivo existente e eu ajusto.
    navigate("/change-password");
    onClose?.();
  };

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 999,
        }}
      />

      {/* drawer */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 360,
          maxWidth: "calc(100vw - 32px)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1000,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.06)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
            title="Avatar"
          >
            {profile?.avatar_url && String(profile.avatar_url).startsWith("http") ? (
            <img
            src={profile.avatar_url}
             alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            ) : (
            (profile?.name?.[0] || "I").toUpperCase()
            )}

          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
              {profile?.name || "Minha Conta"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              {profile?.email || ""}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(0,0,0,0.06)",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
            aria-label="Fechar"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          <button
            onClick={handleChangePassword}
            style={btnStyle("primary")}
          >
            Trocar senha
          </button>

          <button onClick={handleLogout} style={btnStyle("danger")}>
            Logout
          </button>

          {/* dica: depois a gente pode colocar aqui "Editar informações" */}
        </div>
      </div>
    </>
  );
}

function btnStyle(kind) {
  const base = {
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  if (kind === "primary") {
    return {
      ...base,
      background: "rgba(0,0,0,0.92)",
      color: "#fff",
      border: "1px solid rgba(0,0,0,0.92)",
    };
  }

  if (kind === "danger") {
    return {
      ...base,
      background: "#fff",
      color: "#b42318",
      border: "1px solid rgba(180,35,24,0.35)",
    };
  }

  return base;
}
