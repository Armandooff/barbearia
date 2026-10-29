# API da barbearia

## PostgreSQL (Neon/Vercel)

O backend usa PostgreSQL quando encontra `DATABASE_URL` (a variavel fornecida pela integracao Neon da Vercel). A API cria a tabela `barbearia_state` automaticamente no primeiro inicio. `schema.sql` contem a definicao para criacao manual, caso prefira. O banco guarda o estado de servicos, disponibilidade, agendamentos e pagamentos em uma coluna JSONB. As alteracoes de agendamento usam transacao e bloqueio no banco para evitar que duas requisicoes confirmem o mesmo horario ao mesmo tempo.

Para desenvolvimento local, copie `.env.example` para `.env` e informe a URL de conexao PostgreSQL. Sem `DATABASE_URL`, a API continua usando `data.json`. Dados locais nao sao enviados ao banco remoto automaticamente. Em um banco novo, a API comeca com servicos e horarios padrao.

Na Vercel, conecte a integracao Neon ao projeto da API e deixe a variavel `DATABASE_URL` disponivel em Production e Preview. O Express e exportado pelo `server.js` para a Vercel e continua iniciando com `npm start` localmente.

## Pagamento por PIX

Os pagamentos online usam QR Codes dinamicos do Mercado Pago. O sistema nao solicita nem armazena CPF ou email do cliente. O Access Token e o segredo de webhook ficam somente no servidor.

1. Configure `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_EXTERNAL_POS_ID`, `MERCADOPAGO_WEBHOOK_SECRET`, uma senha forte para o admin e um `JWT_SECRET` aleatorio como variaveis privadas da API na Vercel.
2. No Mercado Pago, crie uma loja e um caixa (POS) para a barbearia. Coloque o `external_id` do caixa em `MERCADOPAGO_EXTERNAL_POS_ID`. O QR dinamico deve ser associado a um caixa criado na conta.
3. No painel de desenvolvedor do Mercado Pago, configure o webhook de **Order (Mercado Pago)** para `https://URL-DA-API/api/payments/webhook`.
4. Defina `VITE_API_URL` nos dois projetos frontend para a URL publica da API antes do build.

Sem Access Token ou POS configurado, pagamentos online por PIX ficam indisponiveis; o pagamento presencial continua disponivel. A API reserva o horario por 30 minutos e libera a reserva quando a order expira.
