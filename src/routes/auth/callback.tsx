import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/" });
      } else {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            authListener.subscription.unsubscribe();
            navigate({ to: "/" });
          }
        });

        const timeout = setTimeout(() => {
          authListener.subscription.unsubscribe();
          navigate({ to: "/" });
        }, 4000);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Completing sign in...</p>
      </div>
    </div>
  );
}
