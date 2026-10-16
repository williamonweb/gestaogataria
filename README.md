# Gataria Gestão — instalação manual

Sistema interno de pedidos, orçamentos, caixa e formação de preços, preparado para **Next.js + Vercel + Neon PostgreSQL**. Este projeto é separado do site público da Gataria.

## Atualizar uma instalação existente para a versão 1.1

Se o projeto já está no GitHub/Vercel, não crie outro repositório ou banco.

1. Em **Configurações → Backup**, exporte os registros atuais.
2. Extraia o ZIP e copie o conteúdo da pasta `gataria-gestao` sobre a raiz do projeto existente. Preserve seu `.env` e a pasta `.git`.
3. No **SQL Editor do mesmo Neon**, execute `db/002_profit_sharing.sql` antes de publicar o código novo. A migração adiciona tabelas e preserva os registros existentes. Alternativa: com `DATABASE_URL` correta no `.env`, rode `npm run db:migrate`.
4. Dentro do projeto, no Git Bash:

```bash
npm ci
npm run check
npm test
npm run build
git add .
git commit -m "Adiciona divisao de lucros e relatorio de retiradas"
git push
```

A Vercel publica pelo repositório já conectado. Não repita a configuração inicial dos usuários.

## O que está pronto

- Tela de login; primeiro cadastro de **William** (`william`) e **Jeslie** (`jeslie`). Você define as duas senhas.
- Administradores e operadores; criação/edição/desativação de usuários; troca de senha; invalidação das sessões após redefinição.
- Pedidos, orçamentos, conversão em venda, recebimentos e caixa.
- Preço independente por tamanho (inclusive GG), máscaras de telefone/CPF/CNPJ.
- Custos, taxas, margem e simulações de preço salvas.
- Configurações da empresa e condições padrão dos novos orçamentos.
- Lucro por pedido, reserva percentual e divisão igual entre William e Jeslie.
- Relatório de saldos, retiradas parciais, histórico por pessoa/período e exportação CSV.
- Exportação/importação de registros e histórico de ações por usuário.

## 1. Salvar os registros do painel atual

**O ZIP contém o código. Os dados existentes continuam no painel atual e não estão dentro deste ZIP.**

1. Abra https://gataria-controle.williamgomes94.chatgpt.site com sua conta.
2. Clique em **Backup** no topo, ou abra https://gataria-controle.williamgomes94.chatgpt.site/api/backup.
3. Guarde o arquivo `Gataria-Backup-Registros.json` fora do repositório.
4. Na troca definitiva, pare de cadastrar no painel antigo, exporte um backup final e importe na versão nova. Não continue lançando nos dois sistemas em paralelo.

A importação preserva IDs, itens, preços por tamanho, imagens das propostas, vínculos entre orçamento/pedido e pagamentos. Ela acrescenta os registros ausentes. Se um registro com o mesmo ID tiver conteúdo diferente, **toda a importação é cancelada**, sem sobrescrever dados.

## 2. Criar o banco no Neon

1. Crie um projeto/banco para **Gataria Gestão**.
2. No **SQL Editor**, execute `db/001_initial.sql` e depois `db/002_profit_sharing.sql`, nessa ordem.
3. Copie a connection string PostgreSQL com `sslmode=require` (a conexão pooled é adequada para a Vercel).

Alternativa ao SQL Editor: configure `DATABASE_URL` no `.env` local e rode `npm run db:migrate`. O comando aplica apenas migrações pendentes e não apaga registros. Não execute `reset`, `drop` ou qualquer comando de limpeza para atualizar o sistema.

## 3. Preparar o computador

Instale Node.js 22 ou superior e Git. Extraia este ZIP em uma pasta nova, por exemplo `D:/gataria-gestao`.

No Git Bash dentro da pasta:

```bash
npm ci
cp .env.example .env
```

Preencha `.env`:

```dotenv
DATABASE_URL=postgresql://SUA_CONNECTION_STRING_NEON
AUTH_SECRET=SUA_CHAVE_ALEATORIA
SETUP_TOKEN=OUTRA_CHAVE_ALEATORIA
APP_URL=http://localhost:3000
```

Para gerar **cada chave**, execute separadamente:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Não use o texto de exemplo. `AUTH_SECRET` e `SETUP_TOKEN` devem ser chaves diferentes. Não há nenhuma senha fixa de usuário no código.

Teste local:

```bash
npm run db:migrate
npm run dev
```

Abra http://localhost:3000/configuracao-inicial, informe a chave `SETUP_TOKEN` e defina as senhas de William e Jeslie (mínimo de 10 caracteres). Ambos começam como administradores. Depois entre em `/login`.

Se criar os usuários localmente apontando para o mesmo banco Neon de produção, eles já existirão na Vercel. A configuração inicial não se repete.

## 4. Subir para um NOVO repositório GitHub

Crie no GitHub um repositório **privado** chamado `gestaogataria`, sem README inicial. Não sobreponha o repositório do site público `gataria`.

No Git Bash, dentro da pasta extraída:

```bash
git init
git branch -M main
git add .
git commit -m "Gataria Gestao: pedidos, orcamentos, caixa e usuarios"
git remote add origin https://github.com/williamonweb/gestaogataria.git
git push -u origin main
```

A autenticação do GitHub pode ser solicitada. `.env`, backups, dependências e arquivos de build estão ignorados pelo Git. **Nunca remova essas proteções para conseguir enviar.**

## 5. Publicar na Vercel

1. **Add New Project → Import Git Repository → gestaogataria**.
2. Framework: **Next.js**. Root Directory: a raiz do projeto.
3. Install Command: `npm ci`. Build Command: `npm run build`. Output Directory: deixe o padrão do Next.js. Node.js: 22.x ou 24.x.
4. Em **Environment Variables**, cadastre `DATABASE_URL`, `AUTH_SECRET` e `SETUP_TOKEN` com os mesmos valores do ambiente escolhido. Cadastre `APP_URL` com a URL HTTPS final da Vercel (ou domínio próprio), sem barra no final. Nenhuma variável usa `NEXT_PUBLIC_`.
5. Faça o deploy. Se a URL só for conhecida após o primeiro deploy, ajuste `APP_URL` e faça um **Redeploy**.
6. Abra `/configuracao-inicial` se ainda não criou os dois usuários, ou `/login` se já existem no Neon.
7. Após concluir o cadastro inicial, remova `SETUP_TOKEN` da Vercel e do `.env` e faça um Redeploy. O login continua funcionando.

O build não precisa acessar o banco. O SQL deve estar aplicado antes de usar o aplicativo.

## 6. Importar os dados

Após entrar como administrador:

**Configurações → Backup → Importar registros do painel anterior**.

Selecione o JSON exportado do painel atual e importe. Confira quantidade de pedidos, orçamentos, entradas e saídas, totais e imagens antes de adotar a nova URL. A tela importa arquivos de até 3,5 MB.

Para backups maiores, use o importador local com o `.env` apontando para o banco correto:

```bash
npm run db:import -- "D:/backups/Gataria-Backup-Registros.json"
```

O arquivo de backup não contém usuários ou senhas. Os acessos são criados na configuração inicial. Backups do novo sistema também incluem configurações da empresa, custos por pedido, divisões de lucro e retiradas. Backups antigos sem esses campos continuam aceitos. Importar não altera configurações já existentes.

## 7. Configurações e usuários

- **Dados da Gataria:** nome, CPF/CNPJ, WhatsApp, descrição, prazo padrão, validade, percentual de entrada e percentual de reserva sobre o lucro. Essas condições afetam somente novos orçamentos.
- **Usuários:** adicionar, editar, definir perfil, redefinir senha e desativar. A senha inicial/redefinida deve ser trocada pelo usuário após o login.
- **Minha senha:** exige a senha atual e encerra as outras sessões.
- **Backup:** exporta registros completos e importa de forma aditiva.
- **Histórico:** últimas 100 ações registradas por usuário.

Operadores podem trabalhar com pedidos, orçamentos, caixa e custos, consultar dados da empresa e alterar a própria senha. Só administradores confirmam custos reais, liberam divisões, registram retiradas, consultam o relatório completo, gerenciam usuários, alteram configurações, exportam/importam o banco e veem o histórico. Não há cadastro público aberto.

Para recuperar um administrador se todos esquecerem a senha, use o `.env` local e execute:

```bash
npm run user:recover -- william
```

A nova senha é solicitada em um prompt oculto. Não coloque senha na linha de comando. O usuário deverá trocá-la no próximo login.

## Lucro por pedido e retiradas

Abra um pedido e use **Lucro e divisão do pedido**. Informe os custos reais totais de camisetas/produtos, DTF, embalagens, fretes e outros (incluindo taxas e despesas rateadas). A simulação de preço em `/custos` continua separada dos custos reais do pedido.

A regra inicial é: venda menos custos = lucro; 30% do lucro fica para a Gataria e os 70% restantes são divididos igualmente. Com R$ 100 de lucro, ficam R$ 30 na empresa, R$ 35 para William e R$ 35 para Jeslie. Eventual centavo indivisível fica na reserva. Se houver prejuízo ou lucro zero, nenhuma retirada é gerada.

- Enquanto o pedido estiver em andamento, os valores são uma previsão. Marque os custos como confirmados e salve.
- **Liberar divisão para retirada** exige pedido entregue, totalmente recebido e custos confirmados. A liberação fixa os valores do fechamento, bloqueando a edição do pedido e dos custos reais.
- Em **Configurações → Dados da Gataria**, o percentual de reserva pode ser alterado. Divisões já liberadas mantêm seu percentual original.
- No menu **Lucros e retiradas**, veja o total previsto, disponível e já pago de cada pessoa. A reserva acumulada é informativa; o saldo do caixa aparece separado.
- Selecione pedidos liberados e clique em **Registrar retirada**. Escolha a pessoa, valor (integral ou parcial), data e forma. Confirme depois de realizar o pagamento. O sistema registra uma saída no caixa e reduz o saldo dessa pessoa nos pedidos escolhidos; não efetua transferência bancária.
- O sistema impede retirar mais que o saldo individual dos pedidos selecionados ou que o saldo registrado no caixa. A distribuição é alocada primeiro aos fechamentos mais antigos dentre os pedidos selecionados.
- A aba **Pagamentos realizados** permite filtrar por pessoa e data do pagamento, mostra totais por pessoa no período e exporta CSV. A aba **Saldos por pedido** filtra pela data de cadastro do pedido; os cartões superiores mostram totais gerais.

**Apuração de lucro e movimentação de caixa são separadas:** salvar custos ou liberar a divisão não lança despesas no caixa. Registre pagamentos aos fornecedores no Caixa. Retiradas registradas pelo relatório já geram a saída; não lance a mesma retirada novamente manualmente.

## Atualizações

```bash
npm ci
npm run check
npm test
npm run build
git add .
git commit -m "Atualiza Gataria Gestao"
git push
```

A Vercel ligada ao repositório publica após o push. Para alterações de banco, acrescente novas migrações SQL; não edite migrações já aplicadas. Rode `npm run db:migrate` antes de usar código que dependa delas.

## O que protege cada parte

- **GitHub:** histórico e cópia do código.
- **Neon:** registros do sistema (PostgreSQL).
- **Vercel:** aplicativo publicado.
- **Backup JSON:** cópia exportável dos dados operacionais. Mantenha uma cópia em outro local.

As senhas são protegidas com scrypt e salt; o cookie de sessão é HttpOnly e Secure em produção; cada API verifica sessão/perfil. Há limitação de tentativas de login. Transações e revisões protegem pagamentos e alterações concorrentes. As simulações de custo não movimentam o caixa.

Testes automatizados em PostgreSQL embarcado verificam autenticação, perfis, senhas, saldos, conversão de propostas, importação e cálculos. A publicação real na sua conta Vercel e a conexão ao seu Neon dependem da configuração manual acima; este ZIP não configura contas externas automaticamente.
