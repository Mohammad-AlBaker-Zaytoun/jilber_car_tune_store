import { Suspense } from 'react';
import type { Metadata } from 'next';
import SignUpForm from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
