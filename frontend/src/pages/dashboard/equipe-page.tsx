import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Building2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

export function EquipePage() {
  const qc = useQueryClient();
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => { const r = await api.get('/organizations/me').catch(() => null); return r?.data?.data ?? null; },
  });

  const createOrg = useMutation({ mutationFn: () => api.post('/organizations', { name: orgName }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization'] }); setOrgName(''); } });
  const invite = useMutation({ mutationFn: () => api.post(`/organizations/${org.id}/invite`, { email: inviteEmail, role: 'MEMBER' }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization'] }); setInviteEmail(''); } });
  const removeMember = useMutation({ mutationFn: (mid: string) => api.delete(`/organizations/${org.id}/members/${mid}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }) });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  if (!org) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Equipe</h1>
      <Card className="border-slate-700/50 bg-slate-800/60"><CardContent className="pt-6">
        <p className="mb-4 text-slate-400">Crie uma organizacao para gerenciar multiplas lojas.</p>
        <div className="flex gap-3"><Input placeholder="Nome da organizacao" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="max-w-sm" /><Button onClick={() => createOrg.mutate()} loading={createOrg.isPending} disabled={!orgName.trim()}><Building2 size={16} /> Criar</Button></div>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Equipe — {org.name}</h1>
      <Card className="border-slate-700/50 bg-slate-800/60"><CardHeader><CardTitle className="text-white">Convidar</CardTitle></CardHeader><CardContent>
        <div className="flex gap-3"><Input type="email" placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="max-w-xs" /><Button onClick={() => invite.mutate()} loading={invite.isPending} disabled={!inviteEmail.trim()}><UserPlus size={16} /> Convidar</Button></div>
      </CardContent></Card>
      <Card className="border-slate-700/50 bg-slate-800/60"><CardHeader><CardTitle className="text-white">Membros ({org.members?.length || 0})</CardTitle></CardHeader><CardContent>
        <div className="space-y-3">{org.members?.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3">
            <div><p className="font-medium text-white">{m.user?.name}</p><p className="text-xs text-slate-400">{m.user?.email}</p></div>
            <div className="flex items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-xs ${m.role === 'OWNER' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-600/30 text-slate-400'}`}>{m.role}</span>
              {m.role !== 'OWNER' && <button type="button" onClick={() => removeMember.mutate(m.userId)} className="text-slate-500 hover:text-red-400" title="Remover membro"><Trash2 size={16} /></button>}
            </div>
          </div>
        ))}</div>
      </CardContent></Card>
    </div>
  );
}
