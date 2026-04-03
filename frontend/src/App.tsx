import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/health" element={<p className="p-4">FidelCraft OK</p>} />
      </Routes>
    </div>
  );
}

function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand-bg-dark to-slate-900">
      <h1 className="font-heading text-5xl font-bold text-white">
        Fidel<span className="text-brand-primary">Craft</span>
      </h1>
      <p className="max-w-md text-center text-lg text-slate-400">
        Programa de fidelidade digital para comercios locais. Pontos, carimbos e cashback sem cartao de papel.
      </p>
      <div className="flex gap-4">
        <a href="/register" className="rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white transition hover:opacity-90">
          Comecar Gratis
        </a>
        <a href="/login" className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-white transition hover:bg-slate-800">
          Entrar
        </a>
      </div>
    </main>
  );
}

export default App;
