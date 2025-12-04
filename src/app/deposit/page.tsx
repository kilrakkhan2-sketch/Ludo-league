
import { Suspense } from 'react';
import DepositPageContent from './DepositPageContent';

export default function DepositPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepositPageContent />
    </Suspense>
  );
}
