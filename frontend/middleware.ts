import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseUserAgent } from "@/lib/deviceDetector";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/pricing",
  "/resume/upload",
  "/resume/builder",
  "/interview",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from login/signup/otp/forgot-password pages
  const token = request.cookies.get("token")?.value;
  const AUTH_PATHS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-otp",
    "/auth/forgot-password",
  ];

  if (token && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 1. Detect device type from user-agent header
  const userAgent = request.headers.get("user-agent") || "";
  const deviceInfo = parseUserAgent(userAgent);

  // 2. Clone headers and set device info keys
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-device-type", deviceInfo.deviceType);
  requestHeaders.set("x-device-os", deviceInfo.os);
  requestHeaders.set("x-device-browser", deviceInfo.browser);
  requestHeaders.set("x-is-mobile", String(deviceInfo.isMobile));
  requestHeaders.set("x-is-tablet", String(deviceInfo.isTablet));
  requestHeaders.set("x-is-desktop", String(deviceInfo.isDesktop));

  // Proceed with request carrying injected headers
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
