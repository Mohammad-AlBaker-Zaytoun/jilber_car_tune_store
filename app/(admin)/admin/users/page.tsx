import AdminPageHeader from '@/components/admin/AdminPageHeader';
import UsersClient from '@/components/admin/users/UsersClient';

export default function AdminUsersPage() {
  return (
    <>
      <AdminPageHeader
        title="USERS"
        subtitle="Manage user accounts and roles."
        breadcrumbs={[{ label: 'Users' }]}
      />
      <UsersClient />
    </>
  );
}
