import React from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { post } from '@/lib/services/http';

const schema = z
  .object({ newPassword: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'), confirmPassword: z.string() })
  .refine(v => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Hasła muszą być takie same' });

export function ChangePasswordForm() {
  const [values, setValues] = React.useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof values | 'form', string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const r = schema.safeParse(values);
    if (!r.success) {
      const fieldErrors: any = {};
      for (const issue of r.error.issues) {
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
      const res = await post('/api/auth/password/change', { newPassword: values.newPassword });
      if (res.ok) {
        setSuccess(true);
        setValues({ newPassword: '', confirmPassword: '' });
      } else {
        setErrors({ form: 'Nie udało się zmienić hasła. Spróbuj ponownie.' });
      }
    } catch {
      setErrors({ form: 'Wystąpił błąd sieci. Spróbuj ponownie.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>Ustaw nowe hasło dla swojego konta.</CardDescription>
      </CardHeader>
      <CardContent>
        {success && <div className="text-sm text-green-700">Hasło zostało zmienione.</div>}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {errors.form && <div role="alert" className="text-sm text-red-600">{errors.form}</div>}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input id="newPassword" name="newPassword" type="password" value={values.newPassword} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.newPassword} aria-describedby={errors.newPassword ? 'newPassword-error' : undefined} />
            {errors.newPassword && <p id="newPassword-error" className="text-xs text-red-600">{errors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" value={values.confirmPassword} onChange={onChange} onBlur={validate} disabled={loading} required aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
            {errors.confirmPassword && <p id="confirmPassword-error" className="text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Zapisywanie…' : 'Zmień hasło'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

