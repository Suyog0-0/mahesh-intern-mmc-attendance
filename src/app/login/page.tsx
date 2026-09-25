import { Suspense } from "react";
import LoginForm from "./login-form";

// useSearchParams() in LoginForm requires a Suspense boundary during
// prerendering (Next.js App Router requirement).
export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-[100svh] flex-1 items-center justify-center overflow-hidden bg-[#f7f7f5] px-4 py-8 dark:bg-[#090d16] sm:px-6 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#9E1B32]/[0.045] blur-3xl sm:right-[8%] sm:top-[-10rem]" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#9E1B32]/[0.035] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9E1B32]/15 to-transparent" />
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
