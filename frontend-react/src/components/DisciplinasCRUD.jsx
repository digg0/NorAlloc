import { useState, useEffect } from 'react';
import { listarDisciplinas, criarDisciplina, atualizarDisciplina, deletarDisciplina } from '../services/disciplinasService';

export default function DisciplinasCRUD() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [nome, setNome] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [cursoId, setCursoId] = useState('');
  
  // Estado para controlar se estamos editando (guarda o ID da disciplina)
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const dados = await listarDisciplinas();
    setDisciplinas(dados);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    
    const dadosDisciplina = {
      nome,
      carga_horaria: Number(cargaHoraria),
      curso_id: Number(cursoId),
    };

    if (editandoId) {
      // Se tiver um ID em edição, chama o PUT
      await atualizarDisciplina(editandoId, dadosDisciplina);
    } else {
      // Se não, chama o POST para criar uma nova
      await criarDisciplina(dadosDisciplina);
    }
    
    // Limpa o formulário e reseta os estados
    setNome('');
    setCargaHoraria('');
    setCursoId('');
    setEditandoId(null);
    carregarDados();
  };

  // Função que joga os dados da tabela de volta para o formulário
  const iniciarEdicao = (disciplina) => {
    setEditandoId(disciplina.id);
    setNome(disciplina.nome);
    setCargaHoraria(disciplina.carga_horaria);
    setCursoId(disciplina.curso_id);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNome('');
    setCargaHoraria('');
    setCursoId('');
  };

  const handleDeletar = async (id) => {
    if (confirm("Deseja realmente excluir esta disciplina?")) {
      await deletarDisciplina(id);
      carregarDados();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <h2>Gestão de Disciplinas</h2>

      {/* Formulário único para Cadastro e Edição */}
      <form onSubmit={handleSalvar} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="number" 
          placeholder="ID do Curso" 
          value={cursoId} 
          onChange={(e) => setCursoId(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Nome da Disciplina" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          required 
        />
        <input 
          type="number" 
          placeholder="Carga Horária (h)" 
          value={cargaHoraria} 
          onChange={(e) => setCargaHoraria(e.target.value)} 
          required 
        />
        
        <button type="submit" style={{ backgroundColor: editandoId ? '#e0a800' : '#007bff', color: 'white', border: 'none', padding: '10px 15px', cursor: 'pointer' }}>
          {editandoId ? 'Atualizar' : 'Salvar'}
        </button>

        {editandoId && (
          <button type="button" onClick={cancelarEdicao} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 15px', cursor: 'pointer' }}>
            Cancelar
          </button>
        )}
      </form>

      {/* Tabela de Listagem */}
      <table border="1" width="100%" cellPadding="10" style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th>ID</th>
            <th>ID do Curso</th>
            <th>Nome</th>
            <th>Carga Horária</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {disciplinas.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>Nenhuma disciplina cadastrada.</td>
            </tr>
          ) : (
            disciplinas.map((disc) => (
              <tr key={disc.id}>
                <td>{disc.id}</td>
                <td>{disc.curso_id}</td>
                <td>{disc.nome}</td>
                <td>{disc.carga_horaria}h</td>
                <td>
                  <button onClick={() => iniciarEdicao(disc)} style={{ marginRight: '10px', backgroundColor: '#ffc107', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDeletar(disc.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}