import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const redirectUri = searchParams.get('redirectUri');
  const locale = 'en';

  const consentUrl = new URL(`/${locale}/oauth/consent/google`, request.url);
  if (state) consentUrl.searchParams.set('state', state);
  if (redirectUri) consentUrl.searchParams.set('redirectUri', redirectUri);

  return NextResponse.redirect(consentUrl);
}
