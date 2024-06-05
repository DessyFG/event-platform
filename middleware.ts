import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
  publicRoutes: [
    '/',
    '/events/:id',
    '/api/webhook/clerk',
    '/api/webhook/stripe',
    '/api/webhook/uploadthing',
    '/api/uploadthing'
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/webhook/stripe',
    '/api/webhook/uploadthing',
    '/api/uploadthing'
  ]
};

// Assuming you want to export the modified config object somewhere,
// otherwise, you might just use it directly within your application logic.
export { config };
