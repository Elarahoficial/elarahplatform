# Auditoria de Aprovação — App Elarah (iOS)

Status honesto por prioridade. Legenda:
- ✅ **feito e verificável por código** (no repo)
- 🖥️ **só confirma no seu Mac/Xcode** (o projeto iOS nativo não está no repo)
- ⛔ **bloqueio atual**

---

## Prioridade 1 — Requisitos da Apple: implementado vs documentado

> **O projeto iOS nativo (Info.plist, .xcodeproj, entitlements, Podfile) NÃO
> está neste repositório.** Só existe `capacitor.config.json`, `config.xml` e
> o `www`. Por isso os itens abaixo são **preparados aqui** e **aplicados no
> Xcode** — não dá pra "confirmar na build" a partir do código.

| Item | Onde está | Ação |
|---|---|---|
| `PrivacyInfo.xcprivacy` | ✅ criado em `app/ios/App/App/` | 🖥️ adicionar ao **target App** no Xcode (Target Membership) |
| Info.plist (NSPhotoLibrary/NSCamera) | 🖥️ não está no repo | aplicar textos do `docs/app-store-privacidade.md` |
| Remover Push Notifications | 🖥️ plugin/capability no projeto nativo | `npm uninstall @capacitor/push-notifications` + tirar capability |
| App Privacy Labels | 🖥️ App Store Connect | preencher conforme a tabela do guia de privacidade |
| `allowNavigation` (pagamento in-app) | ✅ no `capacitor.config.json` | 🖥️ `npx cap sync` + rebuild |

**Para eu IMPLEMENTAR direto (opção B):** commite a pasta `app/ios` completa no
repo. Aí eu edito o Info.plist, adiciono o xcprivacy ao projeto e removo o push
por código — você só builda.

---

## Prioridade 2 — Revisão de iPad, TODAS as telas (código)

Base aplicada a tudo: `viewport-fit=cover` (56 páginas) + bloco de **Safe Area**
no CSS (cabeçalho sob a status bar, rodapé no home indicator, laterais no
notch em paisagem) + container central com `max-width: 1320px; margin: 0 auto`
(não estica infinito) + grid que cai de 3→2 colunas em ≤1024px (iPad retrato =
2 col, paisagem = 3 col) + larguras fixas decorativas têm override mobile
(sem scroll horizontal).

| Tela | Arquivo | Container/grid | Safe Area | Scroll-H | Obs |
|---|---|---|---|---|---|
| Home | index.html | ✅ 1320 / grid 3→2 | ✅ | ✅ | hero + seções + gift stack (responsivo) |
| Busca | index (?busca) | ✅ grid de cards | ✅ | ✅ | reusa o grid da home |
| Categorias | categoria.html | ✅ grid 3→2 + filtros | ✅ | ✅ | filtros empilham no estreito |
| Experiência | experiencia.html | ✅ 2 col → empilha | ✅ (header + CTA fixo) | ✅ | reserva em card lateral |
| Checkout/Carrinho | modal (script.js) | ✅ centrado, max-h, rola | ✅ | ✅ | modal com scroll interno |
| Perfil/Compras/Fidelidade | conta.html | ✅ sidebar + conteúdo | ✅ | ✅ | vira coluna no estreito |
| Favoritos | conta (aba) | ✅ grid de cards | ✅ | ✅ | — |
| Gift Cards | presentear.html | ✅ grid + card stack | ✅ | ✅ | stack tem override mobile |
| Login/Cadastro | modal auth | ✅ centrado | ✅ | ✅ | — |
| Recuperar senha | reset-password.html | ✅ card centrado | ✅ | ✅ | — |
| Grupos | grupos.html | ✅ form centrado | ✅ | ✅ | CTA WhatsApp (ver Prio 3) |
| Ser Parceiro | oferecer.html | ✅ form | ✅ | ✅ | file input = admin/parceiro |
| Cabeçalho/Menu | (todas) | sticky | ✅ padding-top inset | ✅ | menu mobile hambúrguer |
| Rodapé | (todas) | — | ✅ padding-bottom inset | ✅ | — |

**Honestidade:** isto é revisão de **código** (estrutura responsiva correta). A
confirmação **visual** (nada cortado/desalinhado) no **simulador de iPad Air**
é no seu Mac — a arquitetura está certa, mas olho no pixel é você.

---

## Prioridade 3 — Jornada de compra dentro do app

Rastreada no código, passo a passo:

| Passo | Onde acontece | Abre Safari? |
|---|---|---|
| Navegar / descobrir | index/categoria (WebView local) | ❌ não |
| Ver experiência | experiencia.html (local) | ❌ não |
| Escolher data | seletor de slot (local) | ❌ não |
| Participantes/quantidade | modal de reserva (local) | ❌ não |
| Checkout | modal de reserva (local) | ❌ não |
| Pagamento — **Pix** | QR inline no modal (local, sem navegação) | ❌ não |
| Pagamento — **Cartão** | vai pro Checkout Pro da Mercado Pago | ❌ **não** (com `allowNavigation`, carrega DENTRO da WebView) |
| Retorno | elarah.com.br/success (na allowNavigation) | ❌ não |
| Confirmação | success + e-mail | ❌ não |

**Único redirecionamento "externo" no código:** os CTAs de **WhatsApp**
("fechar em grupo" / formulário de grupo — `grupos.html`, `experiencia.html`).
Eles abrem o WhatsApp (`wa.me`), **não fazem parte da compra** — são contato
opcional. A Apple permite abrir o WhatsApp pra contato. *(Opcional: usar o
plugin Browser do Capacitor pra abrir in-app; não é bloqueio.)*

**Conclusão:** a compra completa (descoberta → pagamento → confirmação) acontece
**dentro do app**, sem Safari — **desde que a build inclua o `allowNavigation`**
(rebuild após `cap sync`).

---

## Prioridade 4 — Build limpa

⛔ **Não consigo confirmar** — não tenho Xcode/Mac e o projeto nativo não está no
repo. A última vez que você mostrou, o build **falhava**: `NodeJS < 22` e
`provisioning profile` (erro 65). **Isso é o gargalo real da submissão.**

Pra destravar (no seu Mac/CI):
1. **NodeJS 22+** no ambiente de build (o Capacitor CLI exige).
2. **Provisioning profile** válido + certificado de distribuição no Xcode
   (Signing & Capabilities → Team + perfil de distribuição da App Store).

Se você me mandar o **arquivo de CI** (o `.yml` que roda o build) ou o log
completo, eu te ajudo a corrigir os dois.

---

## Resumo do que falta pra submeter (na ordem)
1. 🖥️ **Destravar o build** (NodeJS 22 + provisioning) — sem isso, nada submete.
2. 🖥️ Aplicar no Xcode: Info.plist (fotos/câmera), remover Push, adicionar xcprivacy ao target.
3. 🖥️ `cap sync` + rebuild (pega allowNavigation + Safe Area + tudo do web).
4. 🖥️ Preencher App Privacy Labels no App Store Connect.
5. 🖥️ Rodar no **simulador de iPad Air** e confirmar visualmente as telas.
6. Submeter.
