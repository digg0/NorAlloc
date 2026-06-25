import { useEffect, useState } from 'react';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { validarSemestre, type AlertaUI } from '../services/alocacoes';

const TIPO_LABEL: Record<string, { label: string; classe: string }> = {
  CONFLITO_PROFESSOR: { label: 'Conflito de Professor', classe: 'bg-red-50 border-red-200 text-red-700' },
  CONFLITO_TURMA: { label: 'Conflito de Turma', classe: 'bg-red-50 border-red-200 text-red-700' },
  PROFESSOR_AFASTADO: { label: 'Professor Afastado', classe: 'bg-amber-50 border-amber-200 text-amber-700' },
  DISCIPLINA_SEM_HORARIO: { label: 'Disciplina Sem Horário', classe: 'bg-amber-50 border-amber-200 text-amber-700' },
  SOBRECARGA: { label: 'Sobrecarga', classe: 'bg-orange-50 border-orange-200 text-orange-700' },
  JANELA: { label: 'Janela entre Aulas', classe: 'bg-blue-50 border-blue-200 text-blue-700' },
};

export function AlertasView() {
  const [semestres, setSemestres] = useState<SemestreUI[]>([]);
  const [semestreId, setSemestreId] = useState<number>(0);
  const [alertas, setAlertas] = useState<AlertaUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarSemestres()
      .then((s) => {
        setSemestres(s);
        if (s.length > 0) setSemestreId(s[0].id);
      })
      .catch((err) => setErro(err?.message || 'Falha ao carregar semestres.'))
      .finally(() => setLoading(false));
  }, []);

  const carregarAlertas = (id: number) => {
    if (!id) return;
    setLoading(true);
    validarSemestre(id)
      .then(setAlertas)
      .catch((err) => setErro(err?.message || 'Falha ao validar grade.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarAlertas(semestreId); }, [semestreId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Semestre:</label>
        <select value={semestreId} onChange={(e) => setSemestreId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
          {semestres.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button onClick={() => carregarAlertas(semestreId)} className="text-sm text-[#1B4332] hover:underline">Atualizar</button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      {loading ? (
        <p className="text-sm text-gray-400">Validando grade…</p>
      ) : alertas.length === 0 ? (
        <div className="px-4 py-6 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 text-center">
          Nenhum alerta encontrado para este semestre.
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map((a, i) => {
            const info = TIPO_LABEL[a.tipo] ?? { label: a.tipo, classe: 'bg-gray-50 border-gray-200 text-gray-700' };
            return (
              <div key={i} className={`px-4 py-3 border rounded-xl text-sm flex items-start gap-3 ${info.classe}`}>
                <span className="font-semibold shrink-0">{info.label}</span>
                <span className="flex-1">{a.descricao}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
