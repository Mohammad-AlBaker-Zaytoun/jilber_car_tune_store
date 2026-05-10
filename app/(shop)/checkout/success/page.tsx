import { Suspense } from 'react';
import SuccessContent from '@/components/checkout/SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
