import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/share/(.*)",
  "/api/webhooks/(.*)",
  "/",
  "/api/test-email",
  "/terms(.*)",
  "/privacy(.*)",
  "/about",
  "/faqs(.*)",
  "/features(.*)",
  "/pricing(.*)",
  "/examples(.*)",
  "/api/price-update-background(.*)",
  "/api/cron/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
