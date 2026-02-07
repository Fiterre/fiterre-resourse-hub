import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public paths that don't require authentication
        const publicPaths = ["/login", "/register", "/invite"];
        const isPublicPath = publicPaths.some((path) =>
          req.nextUrl.pathname.startsWith(path)
        );

        // API routes for auth are public
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }

        // Database init route is public (protected by token)
        if (req.nextUrl.pathname.startsWith("/api/db/init")) {
          return true;
        }

        // tRPC routes handle their own auth
        if (req.nextUrl.pathname.startsWith("/api/trpc")) {
          return true;
        }

        // Public paths don't need token
        if (isPublicPath) {
          return true;
        }

        // All other paths require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
