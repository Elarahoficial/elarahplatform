# Guia — Gerar e enviar o app iOS da Elarah (para quem tem Mac) 🍏

Olá! Você vai ajudar a Elarah a publicar o app na **App Store**. O app já está
todo pronto no projeto — aqui só falta "montar" a versão iOS no seu Mac e enviar.
São ~30–40 min. Qualquer dúvida, a Maria consegue tirar com o assistente que
escreveu este guia.

> **Sobre o app:** é o site elarah.com.br empacotado com **Capacitor** (webview
> nativa). `appId`: `com.elarah.app` · Nome: **Elarah**.

---

## Pré-requisitos no Mac

1. **Xcode** (grátis, na App Store do Mac). Abra uma vez e aceite as licenças.
2. **Node.js LTS** — https://nodejs.org (instalador `.pkg`).
3. Um **convite** para o time Apple Developer da Elarah (a Maria te envia pelo
   App Store Connect → Users and Access). Assim você assina com o **seu** Apple ID,
   sem precisar da senha dela.

> Não precisa de CocoaPods — este projeto usa Swift Package Manager.

---

## Passo 1 — Pegar o projeto

O código está no GitHub, no repositório **elarahoficial/elarahplatform**, branch
**`claude/quirky-shannon-h17nuy`** (a Maria te dá acesso, ou te manda o `.zip`).

- Pela web: abra o repositório, troque para essa branch, botão verde **Code →
  Download ZIP**, e descompacte.
- Ou por git:
  ```bash
  git clone -b claude/quirky-shannon-h17nuy https://github.com/elarahoficial/elarahplatform.git
  ```

---

## Passo 2 — Montar a versão iOS

No Terminal, entre na pasta **`app`** do projeto e rode, na ordem:

```bash
cd caminho/para/elarahplatform/app
npm install
npm run build         # gera o conteúdo do app a partir do site
npm run assets        # gera ícones e splash da Elarah (usa resources/)
npx cap sync ios      # leva tudo para o projeto iOS
```

---

## Passo 3 — Abrir no Xcode e assinar

```bash
npx cap open ios      # abre o projeto no Xcode
```

No Xcode:
1. No topo da barra lateral, clique no projeto **App** → alvo **App**.
2. Aba **Signing & Capabilities**:
   - Marque **Automatically manage signing**.
   - Em **Team**, selecione o time **Elarah** (do convite Apple Developer).
   - **Bundle Identifier** deve ser `com.elarah.app` (já vem preenchido).
3. Aba **General**: confira **Version** `1.0` e **Build** `1`.

> As notificações push do projeto são **opcionais** para o primeiro envio. Não
> adicione a capability "Push Notifications" agora — dá pra configurar depois.

---

## Passo 4 — Gerar e enviar

1. Na barra do topo do Xcode, escolha o destino **Any iOS Device (arm64)**.
2. Menu **Product → Archive**. Espere terminar (alguns minutos).
3. Abre o **Organizer** → botão **Distribute App** → **App Store Connect** →
   **Upload** → siga o assistente (deixe as opções padrão) → **Upload**.

---

## Passo 5 — Ficha na App Store Connect

Em https://appstoreconnect.apple.com (logado no time da Elarah):
1. **My Apps → +** → **New App**:
   - Plataforma: iOS · Nome: **Elarah** · Idioma: Português (Brasil)
   - Bundle ID: `com.elarah.app` · SKU: `elarah-app` (qualquer texto único)
2. Preencha a ficha:
   - Descrição, categoria (sugestão: **Estilo de vida** / Lifestyle)
   - **Capturas de tela** (peça à Maria, ou tire no simulador do Xcode)
   - **Política de privacidade**: `https://elarah.com.br/privacidade.html`
   - Preencha o questionário **App Privacy** (o app coleta dados de conta/uso
     via Supabase — informe conforme o uso real)
3. Em **Build**, selecione a versão que você subiu (pode levar ~15 min pra
   aparecer depois do upload).
4. **Add for Review** → **Submit**.

---

## Observações

- **Ícone:** o `npm run assets` aplica o ícone laranja da Elarah automaticamente.
- **Revisão da Apple:** apps que "são só um site" às vezes recebem a regra 4.2.
  O app da Elarah tem funções reais (compra de experiências, conta, favoritos),
  o que normalmente basta. Se pedirem mais, dá pra reforçar recursos nativos.
- **Dúvidas técnicas:** a Maria tem um assistente que consegue detalhar qualquer
  passo — é só chamar.

Obrigado pela força! 🧡
