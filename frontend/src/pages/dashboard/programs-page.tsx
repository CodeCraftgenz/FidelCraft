import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

interface Program {
  id: string;
  name: string;
  type: 'POINTS' | 'STAMPS' | 'CASHBACK';
  active: boolean;
  pointsPerCurrency: number;
  description?: string;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  POINTS: { label: 'Pontos', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  STAMPS: { label: 'Carimbos', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  CASHBACK: { label: 'Cashback', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function ProgramsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'POINTS' as Program['type'], pointsPerCurrency: 1, description: '' });

  const { data: stores } = useQuery({ queryKey: ['my-stores'], queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; } });
  const storeId = (stores as any[])?.[0]?.id;

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ['programs', storeId],
    queryFn: async () => {
      const response = await api.get(`/programs/me/store/${storeId}`).catch(() => ({ data: { data: [] } }));
      return response.data.data;
    },
    enabled: !!storeId,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/programs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowForm(false);
      setForm({ name: '', type: 'POINTS', pointsPerCurrency: 1, description: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (program: Program) => api.patch(`/programs/${program.id}`, { active: !program.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Programas de Fidelidade</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie seus programas ativos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Programa'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-700/50 bg-slate-800/60">
          <CardHeader>
            <CardTitle className="text-white">Criar Programa</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
            >
              <Input
                label="Nome do Programa"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Programa de Pontos"
                required
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Program['type'] })}
                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="POINTS">Pontos</option>
                  <option value="STAMPS">Carimbos</option>
                  <option value="CASHBACK">Cashback</option>
                </select>
              </div>
              <Input
                label="Pontos por R$1"
                type="number"
                min={1}
                value={form.pointsPerCurrency}
                onChange={(e) => setForm({ ...form, pointsPerCurrency: Number(e.target.value) })}
              />
              <Input
                label="Descricao"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descricao curta (opcional)"
              />
              <div className="sm:col-span-2">
                <Button type="submit" loading={createMutation.isPending}>Criar Programa</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs?.length ? (
          programs.map((program) => {
            const badge = TYPE_BADGE[program.type];
            return (
              <Card key={program.id} className="border-slate-700/50 bg-slate-800/60">
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-white">{program.name}</CardTitle>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </CardHeader>
                <CardContent>
                  {program.description && (
                    <p className="mb-3 text-sm text-slate-400">{program.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {program.pointsPerCurrency} pts / R$1
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate(program)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        program.active ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          program.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="col-span-full text-center text-sm text-slate-500">
            Nenhum programa criado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
