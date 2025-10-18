import React from "react";
import { emailSchema } from "@/lib/validation/auth.schemas";
import { post } from "@/lib/services/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const validate = () => {
    const r = emailSchema.safeParse(email);
    if (!r.success) {
      setError(r.error.issues[0]?.message || "Podaj poprawny e‑mail");
      return false;
    }
    setError(null);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await post("/api/auth/password/forgot", { email });
      if (res.ok) setSent(true);
      else setError("Wystąpił błąd. Spróbuj ponownie.");
    } catch {
      setError("Wystąpił błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Odzyskiwanie hasła</CardTitle>
        <CardDescription>Podaj adres e‑mail. Jeśli konto istnieje, wyślemy instrukcję resetu.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-sm text-green-700">Jeśli konto istnieje, wysłaliśmy instrukcję na e‑mail.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {error && (
              <div role="alert" className="text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E‑mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validate}
                disabled={loading}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {error && (
                <p id="email-error" className="text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Wysyłanie…" : "Wyślij instrukcję"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
