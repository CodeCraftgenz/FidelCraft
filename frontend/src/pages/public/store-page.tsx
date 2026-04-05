import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

interface StoreInfo {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  programs: {
    id: string;
    name: string;
    type: 'POINTS' | 'STAMPS' | 'CASHBACK';
    pointsPerCurrency: number;
    rewards: { id: string; name: string; pointsCost: number; stock: number }[];
  }[];
}

const TYPE_LABEL: Record<string, string> = {
  POINTS: 'Pontos',
  STAMPS: 'Carimbos',
  CASHBACK: 'Cashback',
};

export function StorePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: '', phone: '' });
  const [joined, setJoined] = useState(false);

  const { data: store, isLoading } = useQuery<StoreInfo>({
    queryKey: ['public-store', storeSlug],
    queryFn: async () => {
      const response = await api.get(`/public/stores/${storeSlug}`);
      return response.data.data;
    },
    enabled: !!storeSlug,
  });

  const joinMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) =>
      api.post(`/public/stores/${storeSlug}/join`, data),
    onSuccess: () => {
      setJoined(true);
      setShowJoinForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loja nao encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10 text-center">
          {store.logoUrl && (
            <img src={store.logoUrl} alt={store.name} className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
          )}
          <h1 className="text-3xl font-bold text-white">{store.name}</h1>
          {store.description && <p className="mt-2 text-slate-400">{store.description}</p>}
        </div>

        {joined && (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-400">
            Cadastro realizado com sucesso! Voce ja faz parte do programa de fidelidade.
          </div>
        )}

        {!showJoinForm && !joined && (
          <div className="mb-8 text-center">
            <Button size="lg" onClick={() => setShowJoinForm(true)}>
              Participar do Programa
            </Button>
          </div>
        )}

        {showJoinForm && (
          <Card className="mb-8 border-emerald-500/20 bg-slate-800/80">
            <CardHeader>
              <CardTitle className="text-center text-white">Participar</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  joinMutation.mutate(joinForm);
                }}
              >
                <Input
                  label="Seu Nome"
                  value={joinForm.name}
                  onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
                <Input
                  label="Telefone"
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
                <div className="flex gap-3">
                  <Button type="submit" loading={joinMutation.isPending} className="flex-1">
                    Cadastrar
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                    Cancelar
                  </Button>
                </div>
                {joinMutation.isError && (
                  <p className="text-sm text-red-400">Erro ao cadastrar. Tente novamente.</p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {store.programs.map((program) => (
            <Card key={program.id} className="border-slate-700/50 bg-slate-800/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{program.name}</CardTitle>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    {TYPE_LABEL[program.type]}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {program.type === 'CASHBACK'
                    ? `${program.pointsPerCurrency}% de cashback`
                    : `${program.pointsPerCurrency} pontos por R$1 gasto`}
                </p>
              </CardHeader>
              <CardContent>
                {program.rewards.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {program.rewards.map((reward) => (
                      <div key={reward.id} className="rounded-lg bg-slate-700/40 p-3">
                        <p className="text-sm font-medium text-white">{reward.name}</p>
                        <p className="text-xs text-emerald-400">{reward.pointsCost.toLocaleString('pt-BR')} pontos</p>
                        {reward.stock === 0 && (
                          <span className="mt-1 inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                            Esgotado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Recompensas em breve.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-slate-600">
          Powered by <span className="font-semibold text-emerald-500">FidelCraft</span>
        </p>
      </div>
    </div>
  );
}
