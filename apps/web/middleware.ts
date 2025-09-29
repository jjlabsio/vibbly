import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const initMiddleware = createMiddleware(routing);

const publicRoutes = ["/sign-in", "/sign-up"];

const isSupportedLocale = (
  locale?: string
): locale is (typeof routing.locales)[number] =>
  !!locale && routing.locales.includes(locale as (typeof routing.locales)[number]);

const normalizePathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const [possibleLocale, ...rest] = segments;

  if (isSupportedLocale(possibleLocale)) {
    return `/${rest.join("/")}` || "/";
  }

  return pathname;
};

const isPublicPath = (pathname: string) =>
  publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip auth and i18n middleware for API/TRPC routes
  if (path.startsWith("/api") || path.startsWith("/trpc")) {
    return;
  }

  const normalizedPath = normalizePathname(path);

  // Protect non-public, non-API routes
  if (!isPublicPath(normalizedPath)) {
    await auth.protect();
  }

  // Apply locale routing for app pages
  return initMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
