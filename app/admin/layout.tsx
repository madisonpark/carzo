import { cookies } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication cookie
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('carzo_admin_auth');

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    // Allow access to login page
    return <>{children}</>;
  }

  return <>{children}</>;
}
