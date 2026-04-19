export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="p-4 bg-black text-white border-b">
        Hoodacity Dashboard
      </nav>

      <main>{children}</main>
    </div>
  );
}