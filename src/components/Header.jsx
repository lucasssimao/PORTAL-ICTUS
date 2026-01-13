import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import AccountDrawer from "./AccountDrawer";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  // Carrega perfil do usuário logado (name, email, avatar_url)
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("name, email, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile(prof || { email: user.email });
    };

    load();
  }, [location.pathname]);

  const openAccount = () => setDrawerOpen(true);
  const closeAccount = () => setDrawerOpen(false);

  return (
    <>
      <header
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "#fff",
        }}
      >
        {/* ESQUERDA: Logo / Home */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 16,
            }}
            title="Voltar ao Dashboard"
          >
            ICTUS
          </button>
        </div>

        {/* DIREITA: Minha Conta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={openAccount}
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(0,0,0,0.04)",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Minha Conta
          </button>
        </div>
      </header>

      <AccountDrawer open={drawerOpen} onClose={closeAccount} profile={profile} />
    </>
  );
}
