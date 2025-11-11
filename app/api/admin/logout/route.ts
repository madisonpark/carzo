import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));

  // Clear authentication cookie
  response.cookies.delete('carzo_admin_auth');

  return response;
}
