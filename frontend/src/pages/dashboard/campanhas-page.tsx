import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

const TYPES: Record<string, { label: string; color: string }> = {
  DOUBLE_POINTS: { label: 'Pontos em Dobro', color: 'bg-emerald-500/20 text-emerald-400' },
  BIRTHDAY: { label: 'Aniversario', color: 'bg-pink-500/20 text-pink-400' },
  REFERRAL: { label: 'Indicacao', color: 'bg-blue-500/20 text-blue-400' },
  SEASONAL: { label: 'Sazonal', color: 'bg-orange-500/20 text-orange-400' },
  WELCOME: { label: 'Boas-vindas', color: 'bg-purple-500/20 text-purple-400' },
};

export function CampanhasPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'DOUBLE_POINTS', multiplier: '2', bonusPoints: '', startDate: '', endDate: '' });

  const { data: stores } = useQuery({ queryKey: ['my-stores'], queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; } });
  const storeId = (stores as any[])?.[0]?.id;

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', storeId],
    queryFn: async () => { if (!storeId) return []; const r = await api.get(`/campaigns/store/${storeId}`).catch(() => null); return r?.data?.data ?? []; },
    enabled: !!storeId,
  });

  const create = useMutation({
    mutationFn: () => api.post('/campaigns', { storeId, name: form.name, type: form.type, multiplier: form.multiplier ? parseFloat(form.multiplier) : undefined, bonusPoints: form.bonusPoints ? parseInt(form.bonusPoints) : undefined, startDate: form.startDate, endDate: form.endDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); setForm({ name: '', type: 'DOUBLE_POINTS', multiplier: '2', bonusPoints: '', startDate: '', endDate: '' }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  const now = new Date();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Campanhas</h1><p className="mt-1 text-sm text-slate-400">Promocoes e bonus para seus clientes</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Nova Campanha</Button>
      </div>

      {showForm && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome" value={form.name} onChange={set('name')} placeholder="Ex: Black Friday" />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select value={form.type} onChange={set('type')} className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <Input label="Multiplicador" type="number" value={form.multiplier} onChange={set('multiplier')} placeholder="2.0" />
              <Input label="Bonus (pontos fixos)" type="number" value={form.bonusPoints} onChange={set('bonusPoints')} />
              <Input label="Inicio" type="date" value={form.startDate} onChange={set('startDate')} />
              <Input label="Fim" type="date" value={form.endDate} onChange={set('endDate')} />
            </div>
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.name || !form.startDate || !form.endDate}>Criar Campanha</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(campaigns as any[])?.length ? (campaigns as any[]).map((c: any) => {
          const isActive = c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
          const type = TYPES[c.type] || { label: c.type, color: 'bg-slate-600/30 text-slate-400' };
          return (
            <Card key={c.id} className="border-slate-700/50 bg-slate-800/60">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium text-white">{c.name}</p><span className={`rounded px-2 py-0.5 text-xs ${type.color}`}>{type.label}</span></div>
                    <p className="text-xs text-slate-400">{new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')}{c.multiplier ? ` | ${c.multiplier}x` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/30 text-slate-500'}`}>{isActive ? 'Ativa' : 'Inativa'}</span>
                  <button type="button" onClick={() => remove.mutate(c.id)} className="text-slate-500 hover:text-red-400" title="Remover campanha"><Trash2 size={16} /></button>
                </div>
              </CardContent>
            </Card>
          );
        }) : <p className="text-center text-slate-500 py-8">Nenhuma campanha criada.</p>}
      </div>
    </div>
  );
}
