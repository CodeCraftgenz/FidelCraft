import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

export function LojaPage() {
  const [form, setForm] = useState({ name: '', description: '', category: '', phone: '', whatsapp: '', instagram: '', address: '', city: '', state: '' });
  const [copied, setCopied] = useState(false);

  const { data: stores, isLoading } = useQuery({
    queryKey: ['my-stores'],
    queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; },
  });

  const store = (stores as any[])?.[0];

  useEffect(() => {
    if (store) setForm({ name: store.name || '', description: store.description || '', category: store.category || '', phone: store.phone || '', whatsapp: store.whatsapp || '', instagram: store.instagram || '', address: store.address || '', city: store.city || '', state: store.state || '' });
  }, [store]);

  const save = useMutation({
    mutationFn: async () => {
      if (store) await api.patch(`/stores/me/stores/${store.id}`, form);
      else await api.post('/stores/me/stores', form);
    },
  });

  const togglePublish = useMutation({
    mutationFn: () => api.patch(`/stores/me/stores/${store.id}`, { isPublished: !store.isPublished }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const copySlug = () => { navigator.clipboard.writeText(`${window.location.origin}/l/${store?.slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Minha Loja</h1><p className="mt-1 text-sm text-slate-400">Edite as informacoes da sua loja</p></div>
        {store && <Button variant={store.isPublished ? 'outline' : 'primary'} size="sm" onClick={() => togglePublish.mutate()}>{store.isPublished ? 'Despublicar' : 'Publicar'}</Button>}
      </div>

      {store?.slug && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-sm text-slate-400">Link publico:</span>
            <code className="text-sm text-emerald-400">/l/{store.slug}</code>
            <button onClick={copySlug} className="text-slate-400 hover:text-white" title="Copiar link">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader><CardTitle className="text-white">Informacoes</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome da Loja" value={form.name} onChange={set('name')} />
            <Input label="Categoria" value={form.category} onChange={set('category')} placeholder="Ex: Cafeteria" />
            <Input label="Telefone" value={form.phone} onChange={set('phone')} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
            <Input label="Instagram" value={form.instagram} onChange={set('instagram')} placeholder="@sualoja" />
            <Input label="Endereco" value={form.address} onChange={set('address')} />
            <Input label="Cidade" value={form.city} onChange={set('city')} />
            <Input label="Estado" value={form.state} onChange={set('state')} placeholder="SP" />
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Descricao</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <Button className="mt-4" onClick={() => save.mutate()} loading={save.isPending}><Save size={16} /> Salvar</Button>
          {save.isSuccess && <span className="ml-3 text-sm text-green-400">Salvo!</span>}
        </CardContent>
      </Card>
    </div>
  );
}
