import AdminPageHeader from '@/components/admin/AdminPageHeader';
import SettingsClient from '@/components/admin/settings/SettingsClient';

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="SETTINGS"
        subtitle="Configure your shop settings."
        breadcrumbs={[{ label: 'Settings' }]}
      />
      <SettingsClient />
    </>
  );
}
