import { Suspense } from 'react';
import type { Metadata } from 'next';
import VerifyEmailForm from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
