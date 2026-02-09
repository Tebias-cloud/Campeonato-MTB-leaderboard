import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-chaski-sand">
      {/* El contenido de la página (Riders, Results, Dashboard) */}
      {children}

      {/* La Barra de Navegación Flotante */}
      <AdminNav />
    </div>
  );
}