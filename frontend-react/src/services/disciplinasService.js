const API_URL = 'http://localhost:8000/api/disciplinas';

export const listarDisciplinas = async () => {
  const resposta = await fetch(API_URL);
  return await resposta.json();
};

export const criarDisciplina = async (disciplina) => {
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disciplina),
  });
  return await resposta.json();
};

// Nova função para ATUALIZAR a disciplina no backend
export const atualizarDisciplina = async (id, disciplina) => {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disciplina),
  });
  return await resposta.json();
};

export const deletarDisciplina = async (id) => {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
};