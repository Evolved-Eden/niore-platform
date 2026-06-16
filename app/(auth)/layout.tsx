export const metadata = {
  title: "Auth | Evolved Eden",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2rem",
          borderRadius: "16px",
          background: "#111",
          border: "1px solid #222",
        }}
      >
        {children}
      </div>
    </div>
  );
}