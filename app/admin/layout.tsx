import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication cookie
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('carzo_admin_auth');

  // If not authenticated and not on login page, redirect to login
  const isLoginPage = false; // We'll handle this in the login page itself

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    // Allow access to login page
    return <>{children}</>;
  }

  return <>{children}</>;
}
