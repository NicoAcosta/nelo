import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface p-4">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
