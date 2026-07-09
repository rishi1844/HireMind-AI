export const AUTHENTICATED_PREFETCH_ROUTES = [
  "/dashboard",
  "/resume/upload",
  "/resume/builder",
  "/interview",
  "/interview/history",
  "/history",
  "/profile",
] as const;

export function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
