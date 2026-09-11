import type { Metadata } from 'next';

import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = { title: 'Resident registration' };

export default function RegisterPage() {
  return <RegisterForm />;
}
