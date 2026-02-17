import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import AccountDrawer from "./AccountDrawer";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [autoEvalEnabled, setAutoEvalEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    let channel;

    const resolveAutoEvalValue = (profile) => {
      if (!profile) return false;
      if (profile.auto_eval_enabled != null) return !!profile.auto_eval_enabled;
      if (profile.auto_eval_enable != null) return !!profile.auto_eval_enable;
      return false;
    };

    async function loadAutoEval() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Usa select("*") para evitar erro quando um dos nomes de coluna varia por ambiente.
      const { data: profileById } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      let profile = profileById;

      if (!profile) {
        // Fallback opcional para ambientes que espelham auth uid em profiles.user_id.
        const { data: profileByUserId } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        profile = profileByUserId;
      }

      if (mounted) setAutoEvalEnabled(resolveAutoEvalValue(profile));

      channel = supabase
        .channel(`profiles-auto-eval-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setAutoEvalEnabled(resolveAutoEvalValue(payload.new));
          }
        )
        .subscribe();
    }

    loadAutoEval();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

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

          {location.pathname === "/admin" && (
            <button
              onClick={() => navigate("/student-registration")}
              style={{
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Novo Cadastro
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {autoEvalEnabled && (
            <button
              onClick={() => navigate("/auto-evaluation")}
              style={{
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Realizar autoavaliação
            </button>
          )}

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
      <AccountDrawer open={drawerOpen} onClose={closeAccount} />
    </>
  );
}
