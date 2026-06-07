import { useState, useEffect } from 'react';
import { listarDisciplinas, criarDisciplina, deletarDisciplina } from '../services/disciplinasService';

export default function DisciplinasCRUD() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [nome, setNome] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const dados = await listarDisciplinas();
    setDisciplinas(dados);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    await criarDisciplina({
      nome,
      carga_horaria: Number(cargaHoraria),
      codigo: codigo || null, 
    });
    
    setNome('');
    setCargaHoraria('');
    setCodigo('');
    carregarDados();
  };

  const handleDeletar = async (id) => {
    await deletarDisciplina(id);
    carregarDados(); 
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h2>Gestão de Disciplinas</h2>

      <form onSubmit={handleSalvar} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Nome da Disciplina" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          required 
        />
        <input 
          type="number" 
          placeholder="Carga Horária" 
          value={cargaHoraria} 
          onChange={(e) => setCargaHoraria(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Código (Ex: MAT101)" 
          value={codigo} 
          onChange={(e) => setCodigo(e.target.value)} 
        />
        <button type="submit">Salvar</button>
      </form>

      <table border="1" width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Carga Horária</th>
            <th>Código</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {disciplinas.map((disc) => (
            <tr key={disc.id}>
              <td>{disc.id}</td>
              <td>{disc.nome}</td>
              <td>{disc.carga_horaria}h</td>
              <td>{disc.codigo || '-'}</td>
              <td>
                <button onClick={() => handleDeletar(disc.id)} style={{ color: 'red' }}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}