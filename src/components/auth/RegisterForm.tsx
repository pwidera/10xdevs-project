import React from 'react';
import { registerSchema } from '@/lib/validation/auth.schemas';
import { post } from '@/lib/services/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RegisterForm() {
  const [values, setValues] = React.useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof values | 'form', string>>>({});
  const [loading, setLoading] = React.useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const result = registerSchema.safeParse(values);
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
      const res = await post<{ redirect?: string }>('/api/auth/register', { email: values.email, password: values.password });
      if (res.ok) {
        const to = (res.redirect as string) || '/app/generate';
        window.location.assign(to);
        return;
      }
      const code = res.code || 'UNKNOWN_ERROR';
      const message = code === 'ALREADY_EXISTS' ? 'Konto z tym adresem już istnieje' : (res.message || 'Wystąpił błąd. Spróbuj ponownie.');
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
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Utwórz konto, aby korzystać z aplikacji.</CardDescription>
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
            <Input id="password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
            {errors.password && <p id="password-error" className="text-xs text-red-600">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={values.confirmPassword} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
            {errors.confirmPassword && <p id="confirmPassword-error" className="text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Rejestrowanie…' : 'Zarejestruj się'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

