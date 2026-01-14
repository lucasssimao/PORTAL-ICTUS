import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountDrawer from "./AccountDrawer";

export default function Header() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        </div>

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
      <AccountDrawer open={drawerOpen} onClose={closeAccount} />
    </>
  );
}
