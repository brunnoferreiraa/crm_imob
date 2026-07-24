"use client";
import { ErrorState } from "@/components/async-state";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-lg">
        <ErrorState message="Ocorreu um erro inesperado nesta página." retry={reset} />
      </div>
    </main>
  );
}
