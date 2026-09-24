import { Suspense } from "react";
import LoginForm from "./login-form";

// useSearchParams() in LoginForm requires a Suspense boundary during
// prerendering (Next.js App Router requirement).
export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
