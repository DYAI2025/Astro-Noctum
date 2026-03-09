// Next.js Middleware - connects proxy.ts to the request pipeline
export { proxy as middleware } from './src/proxy'

// Config must be defined here, not re-exported (Next.js requirement)
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
