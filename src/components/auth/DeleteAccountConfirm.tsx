import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { post } from '@/lib/services/http';

export function DeleteAccountConfirm() {
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!['USUŃ', 'USUN'].includes(confirm.toUpperCase())) {
      setError('Wpisz USUŃ, aby potwierdzić');
      return;
    }
    setLoading(true);
    try {
      const res = await post('/api/auth/account/delete', { confirm });
      if (res.ok) {
        window.location.assign('/');
        return;
      }
      setError('Nie udało się usunąć konta. Spróbuj ponownie.');
    } catch {
      setError('Wystąpił błąd sieci. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Usuń konto</CardTitle>
        <CardDescription>Ta operacja jest nieodwracalna. Wszystkie dane zostaną trwale usunięte.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="confirm">Aby potwierdzić, wpisz: USUŃ</Label>
            <Input id="confirm" name="confirm" value={confirm} onChange={(e)=>setConfirm(e.target.value)} disabled={loading} />
          </div>
          <Button type="submit" variant="destructive" disabled={loading} className="w-full">{loading ? 'Usuwanie…' : 'Usuń konto'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

