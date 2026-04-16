import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes REQUIRE a login (e.g., the stock market)
const isProtectedRoute = createRouteMatcher(['/market(.*)'])

// 1. Add 'async' right here before (auth, req)
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // 2. Add 'await' right here before auth()
    const session = await auth()
    
    // If there is no active user session, force them to the login screen
    if (!session.userId) {
      return session.redirectToSignIn()
    }
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}