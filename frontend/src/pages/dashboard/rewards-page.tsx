import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  stock: number;
  imageUrl?: string;
  active: boolean;
}

interface Redemption {
  id: string;
  rewardName: string;
  memberName: string;
  pointsCost: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export function RewardsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', pointsCost: 100, stock: 10 });

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ['rewards'],
    queryFn: async () => {
      const response = await api.get('/rewards');
      return response.data.data;
    },
  });

  const { data: redemptions, isLoading: loadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ['redemptions-pending'],
    queryFn: async () => {
      const response = await api.get('/redemptions', { params: { status: 'PENDING' } });
      return response.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      editingId ? api.patch(`/rewards/${editingId}`, data) : api.post('/rewards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/redemptions/${id}`, { status: 'COMPLETED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['redemptions-pending'] }),
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', pointsCost: 100, stock: 10 });
  }

  function startEdit(reward: Reward) {
    setEditingId(reward.id);
    setForm({ name: reward.name, pointsCost: reward.pointsCost, stock: reward.stock });
    setShowForm(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recompensas</h1>
          <p className="mt-1 text-sm text-slate-400">Premios disponiveis para resgate</p>
        </div>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancelar' : '+ Nova Recompensa'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-700/50 bg-slate-800/60">
          <CardHeader>
            <CardTitle className="text-white">{editingId ? 'Editar' : 'Criar'} Recompensa</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
            >
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Cafe Gratis"
                required
              />
              <Input
                label="Custo em Pontos"
                type="number"
                min={1}
                value={form.pointsCost}
                onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })}
                required
              />
              <Input
                label="Estoque"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                required
              />
              <div className="sm:col-span-3">
                <Button type="submit" loading={saveMutation.isPending}>
                  {editingId ? 'Salvar Alteracoes' : 'Criar Recompensa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards?.length ? (
            rewards.map((reward) => (
              <Card key={reward.id} className="border-slate-700/50 bg-slate-800/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">{reward.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-400">{reward.pointsCost.toLocaleString('pt-BR')}</span>
                    <span className="text-sm text-slate-500">pontos</span>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`text-sm font-medium ${reward.stock > 0 ? 'text-slate-300' : 'text-red-400'}`}>
                      Estoque: {reward.stock}
                    </span>
                    {reward.stock === 0 && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">Esgotado</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(reward)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
                          deleteMutation.mutate(reward.id);
                        }
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-sm text-slate-500">
              Nenhuma recompensa criada ainda.
            </p>
          )}
        </div>
      )}

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">Resgates Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRedemptions ? (
            <Spinner />
          ) : redemptions?.length ? (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{r.rewardName}</p>
                    <p className="text-xs text-slate-400">
                      {r.memberName} &middot; {r.pointsCost.toLocaleString('pt-BR')} pts &middot;{' '}
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => completeMutation.mutate(r.id)}>
                    Confirmar Entrega
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum resgate pendente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
