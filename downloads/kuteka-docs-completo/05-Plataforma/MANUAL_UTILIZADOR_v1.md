# Manual do Utilizador Kuteka

**Manual do Utilizador / Centro de Ajuda · Versão 1.0 Beta · 5 de Agosto de 2026 · https://kutekalink.com**

Contacto de suporte: contacto@kutekalink.com · Centro de Ajuda na app: `/app/ajuda`

---

## 0. Como usar este manual

Este manual ensina a utilizar a plataforma Kuteka na versão **1.0 Beta**. Está organizado por **papéis** (Cliente, Parceiro Patrimonial, Agente Certificado, Prestador, Administrador e Super Administrador) e por **módulos transversais** (conta, identidade KIS, segurança, contratos e pagamentos).

| Se pretender…                      | Vá à secção             |
| ---------------------------------- | ----------------------- |
| Criar conta e começar              | §2 e §3                 |
| Procurar casa / arrendar / comprar | §4                      |
| Publicar e gerir imóveis           | §5                      |
| Mediar como agente                 | §6                      |
| Responder a pedidos de serviço     | §7                      |
| Operar administração               | §8                      |
| Parametrizar a plataforma          | §9                      |
| Completar KYC / confiança          | §10                     |
| Proteger a conta                   | §11                     |
| Respostas rápidas                  | §15 FAQ e §16 Glossário |

Na Beta, alguns pagamentos correm em **sandbox** (simulação). Sempre que isso afecte o que vê no ecrã, o manual indica-o explicitamente.

---

## 1. O que é a Kuteka

A Kuteka é uma plataforma **B2B2C** de gestão patrimonial e imobiliária em Angola. Liga num só espaço:

- **Clientes** que exploram habitação e pedem serviços;
- **Parceiros Patrimoniais** que activam e gerem imóveis;
- **Agentes Certificados** que mediçam e operam;
- **Prestadores** que orçamentam e executam serviços;
- **Administração / Super Administração** que operam e parametrizam a plataforma.

O núcleo de exploração (pesquisa, favoritos, conta) é **gratuito**. Serviços de valor acrescentado são **pay-per-use**, planos de parceiro, Kuteka Plus opcional e comissões. Nesta fase **não há carteira nem escrow**: a Kuteka não segura dinheiro do cliente (`custody_mode = none`).

Produção pública: **https://kutekalink.com**

---

## 2. Primeiros passos

### 2.1 Criar conta

1. Abra https://kutekalink.com e escolha **Criar conta** (`/auth/registar`).
2. Indique um **email** válido e uma **palavra-passe** segura (mínimo 8 caracteres, com maiúscula e número).
3. Aceite os **Termos de Utilização** (obrigatório).
4. Confirme a criação.

### 2.2 Verificar o email (dois métodos)

Após o registo, a Kuteka pede confirmação em `/auth/verificar`:

| Método             | Como funciona                                                       |
| ------------------ | ------------------------------------------------------------------- |
| **A — Link**       | Abra o email da Kuteka e clique no link de confirmação.             |
| **B — Código OTP** | Introduza na aplicação o código de **6 dígitos** recebido no email. |

Se o link não abrir (cliente de correio, telemóvel, etc.), use o código. Pode **reenviar** email e código com intervalo de segurança.

### 2.3 Entrar e recuperar acesso

- Entrar: `/auth/entrar` com email e palavra-passe.
- Recuperar: `/auth/recuperar` — escolha **email**, **telefone (SMS)** ou **ambos**.
- Após verificação, defina uma **nova palavra-passe** em `/auth/recuperar/confirmar`.

### 2.4 Escolher papéis (onboarding)

Em `/auth/onboarding/papeis` seleccione um ou ambos:

- **Cliente** — procurar e contratar;
- **Parceiro Patrimonial** — publicar e gerir patrimónios.

Agente e Administrador **não** são self-serve: são atribuídos pela Kuteka. A mesma conta pode acumular vários papéis; mude de experiência no **menu da conta**.

### 2.5 Nome de apresentação

Em `/auth/onboarding/perfil` indique como prefere ser chamado. Pode alterar depois em **Perfil**.

---

## 3. Navegação da plataforma

### 3.1 Área autenticada (`/app`)

Após login, entra no **painel** com atalhos para o seu papel activo: explorar habitação, activar património, contratos, serviços, administração, etc.

### 3.2 Menu da conta

No canto da interface encontra:

- Perfil e papéis;
- **Centro de Confiança** (`/app/centro-confianca`) — estado KYC / UTS;
- **Centro de Segurança** (`/app/centro-seguranca`) — email/telefone, sessões, score;
- Definições, ajuda e terminar sessão.

### 3.3 Mudar de papel

Use **Mudar de papel** no menu. Os menus, o dashboard e os atalhos adaptam-se imediatamente à experiência escolhida (Cliente, Parceiro, Agente, Admin, Super Admin).

### 3.4 Idioma

Em Definições (`/app/definicoes`) pode alternar entre português, inglês, francês e espanhol (cobertura em evolução na Beta).

---

## 4. Guia do Cliente

### 4.1 Explorar habitação

1. Abra `/app/habitacao/explorar` (ou o atalho **Explorar Habitação**).
2. Filtre por tipologia, localização, preço, disponibilidade (incluindo **disponibilidade futura**).
3. Abra a ficha do imóvel para fotos, descrição, mapa e contacto operacional.

### 4.2 Residência, favoritos e visitas

- **Residência** — vista do seu percurso habitacional.
- **Favoritos / Interesses** — guarde imóveis para comparar.
- **Visitas** — acompanhe pedidos e agendamentos associados ao seu papel.

### 4.3 Propostas e contratos

Quando avançar numa intenção (arrendamento ou compra):

1. Acompanhe propostas em Contratos / Propostas.
2. Formalize em `/app/contratos` quando a intenção estiver aprovada.
3. Leia partes, valor e termos antes de aceitar.

### 4.4 Hub financeiro do utilizador

Em `/app/financeiro` consulte (conforme disponibilidade na sua conta):

- faturas e movimentos;
- créditos Kuteka;
- consentimentos;
- lembretes de renda;
- Kuteka Plus (opcional).

### 4.5 Serviços comerciais (Cliente)

| Serviço             | Rota                  | O que faz                                      |
| ------------------- | --------------------- | ---------------------------------------------- |
| Mudança Inteligente | `/app/mudanca`        | Pedido assistido de mudança com match          |
| Encontrar Casa      | `/app/encontrar-casa` | Procura prioritária assistida                  |
| Concierge           | `/app/concierge`      | Pedidos de apoio personalizado                 |
| Garantia Kuteka     | `/app/garantia`       | Activação de garantia mensal (sandbox na Beta) |
| Assistência 24h     | `/app/assistencia`    | Pedido urgente ao imóvel                       |
| Prestadores         | `/app/servicos`       | Marketplace de orçamentos                      |

Na Beta, a cobrança destes serviços passa pelo **Kuteka Pay em sandbox** até o gateway real estar activo. O fluxo de estados (pedido → pagamento → execução) já é o de produção.

---

## 5. Guia do Parceiro Patrimonial

### 5.1 Activar património

1. Mude para a experiência **Parceiro Patrimonial**.
2. Abra `/app/patrimonios/novo` (**Ativar Património**).
3. Preencha localização, tipologia, condições, preços e media.
4. Publique e acompanhe em `/app/patrimonios`.

### 5.2 Gerir anúncios

Na lista e na ficha (`/app/patrimonios/detalhe`):

- actualize disponibilidade e preço;
- acompanhe interesses e visitas;
- consulte indicadores de saúde / PDK quando disponíveis na ficha.

### 5.3 Planos Parceiro

Em `/app/parceiro/planos` escolha **Bronze**, **Silver** ou **Gold** conforme benefícios e preço publicados no Super Admin. A activação na Beta pode decorrer em sandbox.

### 5.4 Contratos e prestadores

- Formalize arrendamentos/compras em `/app/contratos`.
- Contrate serviços de manutenção ou mudanças via `/app/servicos`.

---

## 6. Guia do Agente Certificado

Papel atribuído pela Kuteka (não self-serve).

1. Entre com a conta certificada e seleccione a experiência **Agente**.
2. `/app/agente` — cockpit operacional.
3. `/app/agente/explorar` — inventário e oportunidades.
4. `/app/agente/detalhe` — acompanhamento de um processo concreto.

Responsabilidades típicas: validar informação, mediar visitas, apoiar propostas e manter a qualidade do inventário. Cumprir as regras de conduta e o nível de confiança exigido.

---

## 7. Guia do Prestador

1. Aceda ao Marketplace em `/app/servicos`.
2. Consulte pedidos abertos compatíveis com a sua categoria.
3. Envie **orçamento**.
4. Após aceitação e pagamento (Kuteka Pay), execute o serviço.
5. Actualize o estado até conclusão; a comissão Kuteka é registada no Ledger.

Mantenha dados de contacto e identidade (KIS) actualizados — pedidos de maior valor exigem níveis KYC mais elevados.

---

## 8. Guia do Administrador

Requer permissão `admin.panel`.

| Área          | Rota                      | Função                          |
| ------------- | ------------------------- | ------------------------------- |
| Administração | `/app/admin`              | Resumo operacional              |
| Utilizadores  | `/app/admin/utilizadores` | Contas e papéis                 |
| Confiança     | `/app/confianca`          | Checklist e submissões          |
| Revisão       | `/app/confianca/revisao`  | Aprovar / rejeitar verificações |

O Administrador **não** altera o motor económico global (preços, gateways) — isso é Super Admin.

---

## 9. Guia do Super Administrador

Requer privilégios de Super Administrador. Área: `/app/super` (Revenue / Command Center).

Use para:

- catálogo de produtos e **preços**;
- **feature flags** e disponibilidade de serviços;
- configuração do **Kuteka Pay** (sandbox → gateways);
- campanhas e créditos;
- fraude, disputas e reconciliação;
- visão de receita e saúde operacional.

Boas práticas Beta:

1. Não practique alterações de preço sem registo da decisão.
2. Mantenha demos e contas `demo.*` fora do caminho crítico antes da beta pública alargada.
3. Exija email e telefone verificados nas contas de administração (Centro de Segurança).

---

## 10. Identidade KIS (Kuteka Identity System)

### 10.1 Porque existe

O KIS aumenta a confiança entre partes. Níveis KYC mais altos desbloqueiam operações sensíveis (contratos, pagamentos, certos serviços).

### 10.2 Completar o perfil

Em `/app/perfil` complete, por passos:

1. Contactos (telefone, email secundário);
2. Dados pessoais;
3. Documento de identificação (imagens);
4. Fotografia / selfie quando pedida;
5. Morada;
6. Dados bancários (quando necessários a pagamentos/recebimentos);
7. Preferências de privacidade.

### 10.3 Centro de Confiança

Em `/app/centro-confianca` veja:

- estado da conta;
- **UTS** (índice de confiança);
- completude do perfil;
- pilares (contacto, identidade, documento, morada, banking, foto);
- próximo passo recomendado.

---

## 11. Segurança da conta

### 11.1 Centro de Segurança (`/app/centro-seguranca`)

Consulta:

- email verificado;
- telefone verificado (OTP SMS — sandbox até fornecedor Angola activo);
- nível KYC;
- último login;
- dispositivos e sessões (infra preparada);
- histórico de eventos de autenticação;
- **nível de segurança** da conta (0–100).

### 11.2 Boas práticas

- Use palavra-passe única e forte.
- Confirme email e telefone.
- Não partilhe códigos OTP.
- Termine sessão em dispositivos partilhados (`/auth/sair`).
- Em alterações sensíveis (email, telefone, password, documento, IBAN) a plataforma pode exigir novo OTP.

---

## 12. Contratos

1. Abra `/app/contratos` ou **Novo** (`/app/contratos/novo`).
2. Indique partes, imóvel/serviço, valor e termos.
3. Percorra os estados até aceitação pelas partes.
4. Consulte o detalhe em `/app/contratos/detalhe`.

A ferramenta apoia a formalização; a validade jurídica depende da lei angolana e da capacidade das partes. Pagamentos associados seguem o Kuteka Pay.

---

## 13. Pagamentos — Kuteka Pay

| Conceito   | Significado na Beta                                                    |
| ---------- | ---------------------------------------------------------------------- |
| Kuteka Pay | Único motor de pagamento da plataforma                                 |
| Sandbox    | Pagamento simulado; estados reais no sistema                           |
| Produção   | Gateway real (ex.: Multicaixa/EMIS) — activação comunicada pela Kuteka |
| Ledger     | Registo auditável de cada movimento                                    |
| Créditos   | Unidades internas; não são depósito bancário                           |

O utilizador vê intenções de pagamento, estado (pendente, pago, falhado, reembolsado) e histórico no hub financeiro / no serviço que originou a cobrança.

---

## 14. Tutoriais rápidos

### 14.1 Publicar um imóvel (Parceiro)

1. Mudar para papel Parceiro.
2. `/app/patrimonios/novo`.
3. Preencher dados e fotos.
4. Guardar / publicar.
5. Confirmar em `/app/patrimonios`.

### 14.2 Procurar casa (Cliente)

1. `/app/habitacao/explorar`.
2. Aplicar filtros.
3. Abrir ficha; guardar favorito se desejar.
4. Pedir visita ou avançar para proposta conforme o fluxo disponível.

### 14.3 Pedir Assistência 24h

1. `/app/assistencia`.
2. Descrever o incidente e o imóvel.
3. Confirmar o pedido e o pagamento (sandbox na Beta).
4. Acompanhar o estado até resolução.

### 14.4 Activar Garantia Kuteka

1. `/app/garantia`.
2. Seleccionar o contexto elegível.
3. Activar o plano mensal.
4. Confirmar pagamento e estado activo.

---

## 15. FAQ

**1. A Kuteka é um banco?** Não. É plataforma de intermediação com motor de pagamentos (Kuteka Pay).

**2. A Kuteka segura o meu dinheiro?** Não nesta fase (`custody_mode = none`).

**3. Porque não recebo o email de confirmação?** Verifique Spam; use o código OTP de 6 dígitos; reenvie após o tempo de espera.

**4. Posso ser Cliente e Parceiro na mesma conta?** Sim. Active ambos no onboarding ou em papéis.

**5. Como me torno Agente?** A Kuteka atribui o papel após certificação; não é self-serve.

**6. O que é o KIS?** Sistema de identidade e verificação (KYC) da Kuteka.

**7. Preciso de KYC para explorar imóveis?** Em geral não para exploração básica; sim para operações sensíveis.

**8. O que é UTS?** Índice de confiança da conta no Centro de Confiança.

**9. Pagamentos na Beta são reais?** Enquanto o gateway estiver em sandbox, os valores são simulados; os estados do pedido são reais.

**10. Como cancelo um serviço?** Siga o estado do pedido no respectivo módulo; reembolsos seguem a política dos Termos.

**11. O que são Créditos Kuteka?** Unidades internas para funcionalidades; não são dinheiro depositado.

**12. Posso apagar a conta?** Contacte contacto@kutekalink.com; retenção legal pode aplicar-se (ver Política de Privacidade).

**13. Como denuncio um anúncio falso?** Contacte suporte ou, se for Admin, use as ferramentas de confiança/revisão.

**14. A Garantia renova-se automaticamente?** Na Beta a activação é mensal/sandbox; renovação automática depende do gateway real.

**15. O mapa mostra a morada exacta?** Pode mostrar zona aproximada por privacidade do proprietário.

**16. Que idiomas existem?** PT, EN, FR, ES (cobertura parcial na Beta).

**17. Onde leio os Termos?** https://kutekalink.com/termos — também PDF/Word para descarregar.

**18. Onde leio a Privacidade?** https://kutekalink.com/privacidade

**19. Esqueci a palavra-passe e não tenho email.** Use recuperação por telefone quando SMS estiver activo, ou contacte suporte com prova de identidade.

**20. Contas demo ainda existem?** Contas `demo.*@kuteka.local` são apenas para demonstração interna e serão removidas/banidas antes da beta pública alargada.

**21. O Super Admin pode ver os meus documentos KYC?** Acessos sensíveis são auditados; use apenas contas administrativas autorizadas.

**22. Como contacto a Kuteka?** `/contacto` ou contacto@kutekalink.com

---

## 16. Glossário

| Termo                    | Significado                                                    |
| ------------------------ | -------------------------------------------------------------- |
| **KIS**                  | Kuteka Identity System — identidade e KYC                      |
| **KYC**                  | Know Your Customer — verificação do utilizador                 |
| **UTS**                  | Índice de confiança / trust score da conta                     |
| **ICK**                  | Indicador de qualidade/confiança do imóvel (quando disponível) |
| **PDK**                  | Passaporte Digital Kuteka do imóvel (painel na ficha)          |
| **Ledger**               | Livro-razão digital de movimentos financeiros                  |
| **Kuteka Pay**           | Motor único de pagamentos                                      |
| **Sandbox**              | Ambiente de pagamento simulado                                 |
| **Plus**                 | Subscrição opcional Kuteka Plus                                |
| **SLA**                  | Acordo de nível de serviço (prazos operacionais)               |
| **B2B2C**                | Modelo empresa → parceiros → consumidor                        |
| **Parceiro Patrimonial** | Quem publica e gere patrimónios                                |
| **Agente Certificado**   | Mediador verificado pela Kuteka                                |
| **OTP**                  | Código de uso único (email/SMS)                                |
| **RLS**                  | Row Level Security — isolamento de dados na base               |

---

## 17. Contactos e suporte

| Canal           | Utilização                 |
| --------------- | -------------------------- |
| Centro de Ajuda | `/app/ajuda`               |
| Contacto        | `/contacto`                |
| Email geral     | contacto@kutekalink.com    |
| Privacidade     | privacidade@kutekalink.com |
| Jurídico        | juridico@kutekalink.com    |
| Site            | https://kutekalink.com     |

Horário de atendimento de referência na Beta: dias úteis, 09:00–18:00 (WAT), salvo comunicação em contrário.

---

_Documento oficial de suporte ao utilizador — Kuteka v1.0 Beta._  
_Luanda, 5 de Agosto de 2026 · Equipa Kuteka_
