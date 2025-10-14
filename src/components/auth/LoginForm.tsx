import React from 'react';
import { loginSchema } from '@/lib/validation/auth.schemas';
import { post } from '@/lib/services/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LoginForm() {
  const [values, setValues] = React.useState({ email: '', password: '' });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof values | 'form', string>>>({});
  const [loading, setLoading] = React.useState(false);
  const nextRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || undefined;
      nextRef.current = next || undefined;
    } catch {}
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: any = {};
      for (const issue of result.error.issues) {
        const name = issue.path[0] as keyof typeof values;
        if (!fieldErrors[name]) fieldErrors[name] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await post<{ redirect?: string }>('/api/auth/login', { ...values, next: nextRef.current });
      if (res.ok) {
        const to = (res.redirect as string) || '/app/generate';
        window.location.assign(to);
        return;
      }
      // Map common backend codes to friendly messages
      const code = res.code || 'UNKNOWN_ERROR';
      const message = code === 'UNAUTHORIZED' ? 'Nieprawidłowy e‑mail lub hasło' : (res.message || 'Wystąpił błąd. Spróbuj ponownie.');
      setErrors({ form: message });
    } catch (err) {
      setErrors({ form: 'Wystąpił błąd sieci. Spróbuj ponownie.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Podaj adres e‑mail i hasło, aby się zalogować.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {errors.form && (
            <div role="alert" className="text-sm text-red-600">{errors.form}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E‑mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <p id="email-error" className="text-xs text-red-600">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
            {errors.password && <p id="password-error" className="text-xs text-red-600">{errors.password}</p>}
          </div>
          <div className="flex justify-end -mt-1">
            <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">Nie pamiętasz hasła?</a>
          </div>

          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Logowanie…' : 'Zaloguj się'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

