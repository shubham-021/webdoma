"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"email" | "apikey">("email");

  // Email + Password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // API Key field
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const credentials =
      authMode === "email"
        ? { username: email, password }
        : { username: "torbox", password: apiKey };

    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      toast.success("Logged in successfully");
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-primary-foreground">D</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome to DoMa
        </CardTitle>
        <CardDescription>
          Connect to your TorBox cloud storage
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={authMode}
          onValueChange={(v) => {
            setAuthMode(v as "email" | "apikey");
            setError(null);
          }}
        >
          <TabsList>
            <TabsTrigger value="email">Email + Password</TabsTrigger>
            <TabsTrigger value="apikey">API Key</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="email">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="apikey">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="apikey" className="text-sm font-medium">
                    API Key
                  </label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="Paste your TorBox API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find your API key at{" "}
                    <a
                      href="https://torbox.app/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      torbox.app/settings
                    </a>
                  </p>
                </div>
              </div>
            </TabsContent>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
