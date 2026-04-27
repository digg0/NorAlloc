const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('✅ BFF Node.js rodando perfeitamente!');
});

app.listen(port, () => {
  console.log(`BFF escutando na porta ${port}`);
});