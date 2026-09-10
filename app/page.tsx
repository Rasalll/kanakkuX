import { redirect } from 'next/navigation';

// Root page redirects to login by default
// Middleware will redirect authenticated users to dashboard
export default function RootPage() {
  redirect('/login');
}
