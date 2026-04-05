import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

export function FuncionariosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', pin: '' });
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');

  const { data: stores } = useQuery({ queryKey: ['my-stores'], queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; } });
  const storeId = (stores as any[])?.[0]?.id;

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', storeId],
    queryFn: async () => { if (!storeId) return []; const r = await api.get(`/staff/store/${storeId}`).catch(() => null); return r?.data?.data ?? []; },
    enabled: !!storeId,
  });

  const create = useMutation({
    mutationFn: () => api.post('/staff', { storeId, ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setShowForm(false); setForm({ name: '', email: '', pin: '' }); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/staff/${id}`, { isActive: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });

  const resetPinMut = useMutation({
    mutationFn: () => api.patch(`/staff/${resetId}/pin`, { pin: newPin }),
    onSuccess: () => { setResetId(null); setNewPin(''); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Funcionarios</h1><p className="mt-1 text-sm text-slate-400">Gerencie quem pode registrar transacoes</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Novo</Button>
      </div>

      {showForm && (
        <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Nome" value={form.name} onChange={set('name')} />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            <Input label="PIN (4 digitos)" value={form.pin} onChange={set('pin')} maxLength={4} placeholder="0000" />
          </div>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.name || !form.email || form.pin.length !== 4}>Criar</Button>
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {(staff as any[])?.length ? (staff as any[]).map((s: any) => (
          <Card key={s.id} className="border-slate-700/50 bg-slate-800/60">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-white">{s.name}</p>
                <p className="text-xs text-slate-400">{s.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-xs ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{s.isActive ? 'Ativo' : 'Inativo'}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => toggle.mutate({ id: s.id, active: !s.isActive })}>{s.isActive ? 'Desativar' : 'Ativar'}</Button>
                {resetId === s.id ? (
                  <div className="flex gap-2"><Input value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="Novo PIN" className="w-24" /><Button size="sm" onClick={() => resetPinMut.mutate()} disabled={newPin.length !== 4}>OK</Button></div>
                ) : (
                  <button type="button" onClick={() => setResetId(s.id)} className="text-slate-400 hover:text-white" title="Resetar PIN"><KeyRound size={16} /></button>
                )}
                <button type="button" onClick={() => remove.mutate(s.id)} className="text-slate-500 hover:text-red-400" title="Remover"><Trash2 size={16} /></button>
              </div>
            </CardContent>
          </Card>
        )) : <p className="text-center text-slate-500 py-8">Nenhum funcionario cadastrado.</p>}
      </div>
    </div>
  );
}
