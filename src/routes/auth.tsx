import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Farmer Sign In — AgriCure AI" },
      {
        name: "description",
        content:
          "Sign in or create a free AgriCure AI farmer account to save crop scans, health scores and diagnostic reports.",
      },
      { property: "og:title", content: "Farmer Sign In — AgriCure AI" },
      {
        property: "og:description",
        content: "Create a free farmer account to save your crop diagnosis history.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.info("Check your email to confirm your account.");
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <div className="glass rise-in rounded-3xl p-6">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl hero-gradient text-forest-foreground">
            <Leaf className="size-7" />
          </span>
          <h1 className="mt-4 text-center text-2xl font-black">Farmer Account</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Save every scan, score and report to your farm profile.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4 space-y-3">
              <Field id="si-email" label="Email" value={email} onChange={setEmail} type="email" />
              <Field id="si-pass" label="Password" value={password} onChange={setPassword} type="password" />
              <Button onClick={signIn} disabled={busy} className="glow-cta h-12 w-full rounded-xl font-bold">
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Sign In
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-3">
              <Field id="su-name" label="Full name" value={name} onChange={setName} />
              <Field id="su-email" label="Email" value={email} onChange={setEmail} type="email" />
              <Field id="su-pass" label="Password" value={password} onChange={setPassword} type="password" />
              <Button onClick={signUp} disabled={busy} className="glow-cta h-12 w-full rounded-xl font-bold">
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Create Account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="h-12 w-full rounded-xl font-semibold" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11" />
    </div>
  );
}
