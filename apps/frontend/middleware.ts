import { getRedirect } from "@/data/sanity/redirects";
// @TODO @codemod-com/utilities imports node runtime libs, cannot be used in midddleware
// @TODO modular import @codemod-com/utilities/constants
// import {
//   CODEMOD_STUDIO_URL,
//   OLD_STUDIO_HOSTNAME,
// } from "@codemod-com/utilities";

const CODEMOD_STUDIO_URL = "https://codemod.com/studio";
const OLD_STUDIO_HOSTNAME = "codemod.studio";

import { type NextRequest, NextResponse } from "next/server";

// @TODO: Handle redirects from Sanity
export async function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === OLD_STUDIO_HOSTNAME) {
    return NextResponse.redirect(new URL(CODEMOD_STUDIO_URL));
  }

  const pathname = request.nextUrl.pathname;
  // @TODO fix sanity in middleware error
  const redirect = await getRedirect(pathname);

  if (redirect) {
    return NextResponse.redirect(new URL(redirect.destination, request.url), {
      status: redirect.permanent ? 301 : 302,
    });
  }

  // only backend should be able to call this endpoint
  if (request.nextUrl.pathname === "/api/revalidate") {
    const res = NextResponse.next();

    res.headers.append("Access-Control-Allow-Credentials", "true");
    res.headers.append(
      "Access-Control-Allow-Origin",
      "https://backend.codemod.com",
    );
    res.headers.append(
      "Access-Control-Allow-Methods",
      "GET,DELETE,PATCH,POST,PUT",
    );
    res.headers.append(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    );

    return res;
  }

  if (
    !request.nextUrl.pathname.startsWith("/api") &&
    process.env.NODE_ENV !== "development"
  ) {
    // based off the examples presented on:
    // https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://summary-walrus-25.clerk.accounts.dev https://clerk.codemod.com https://vercel.live https://cdn.jsdelivr.net https://www.googletagmanager.com;
		    frame-src https://challenges.cloudflare.com/ https://vercel.live;
        connect-src *.google-analytics.com https://clerk.codemod.com https://api.short.io https://backend.codemod.com https://codemod.com https://vitals.vercel-insights.com https://summary-walrus-25.clerk.accounts.dev https://*.vercel.app https://vercel.live wss://backend.codemod.com wss://*.api.sanity.io;
        style-src 'self' 'unsafe-inline' https://vercel.live;
        img-src 'self' blob: data: https://*.google-analytics.com https://*.googletagmanager.com https://img.clerk.com https://cdn.sanity.io https://image.mux.com https://vercel.com;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors https://codemod.com;
        block-all-mixed-content;
        upgrade-insecure-requests;
        media-src 'self' https://cdn.sanity.io https://image.mux.com https://stream.mux.com;
        worker-src 'self' blob: https://*.vercel.app;
    `;

    const contentSecurityPolicyHeaderValue = cspHeader
      .replace(/\s{2,}/g, " ")
      .trim();

    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

    const response = NextResponse.next({
      request: {
        headers,
      },
    });

    response.headers.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue,
    );
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manage|blocks|favicons|fonts|images|studio-docs).*)",
  ],
};
