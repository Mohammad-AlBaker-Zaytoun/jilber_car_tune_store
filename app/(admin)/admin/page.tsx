import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="DASHBOARD"
        subtitle="Overview of your store performance and recent activity."
      />
      <DashboardClient />
    </>
  );
}
