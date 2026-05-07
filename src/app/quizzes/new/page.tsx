import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/host/app-shell";
import { NewQuizForm } from "./new-quiz-form";

export const metadata = { title: "New quiz" };

export default async function NewQuizPage() {
  const user = await requireUser();
  return (
    <AppShell email={user.email!}>
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">New quiz</h1>
          <p className="text-muted-foreground">
            Give your quiz a title. You can add questions next.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <NewQuizForm />
        </div>
      </div>
    </AppShell>
  );
}
