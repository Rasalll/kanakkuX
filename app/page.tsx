import { redirect } from 'next/navigation';

// Root page handles potential OAuth fallback redirects with code,
// or redirects unauthenticated users to /login (middleware redirects authenticated users to /dashboard)
export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  const code = params?.code;

  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  redirect('/login');
}
