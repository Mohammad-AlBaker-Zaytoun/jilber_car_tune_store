import { Suspense } from 'react';
import FailureContent from '@/components/checkout/FailureContent';

export default function FailurePage() {
  return (
    <Suspense>
      <FailureContent />
    </Suspense>
  );
}
