# Auditoria de Privacidade — App Elarah (iOS)

Guia para aplicar no **Xcode** e no **App Store Connect** antes da próxima
submissão. O app é Capacitor (WebView do site), então parte da privacidade é
config nativa (aqui) e parte é o código web (já no repo).

> ⚠️ O projeto iOS nativo (Info.plist, entitlements, .xcodeproj) **não está
> versionado neste repositório** — ele é gerado no seu Mac/CI (`npx cap add ios`
> / `npx cap sync`). Por isso estes ajustes são aplicados **no seu Xcode**.

---

## 1. Info.plist — descrições de permissão (obrigatório)

O app tem `<input type="file">` (nas telas de **admin**), que no iOS abre a
biblioteca de fotos / câmera. **Sem a descrição de uso, o app CRASHA** quando o
campo é tocado → reprovação. Adicione ao `Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>A Elarah usa suas fotos apenas quando você escolhe uma imagem para enviar (ex.: foto de uma experiência). Nenhuma foto é acessada sem sua ação.</string>

<key>NSCameraUsageDescription</key>
<string>A câmera é usada apenas se você optar por tirar uma foto para enviar dentro do app. Nada é capturado sem sua ação.</string>
```

> Se você decidir **não** expor as telas de admin dentro do app (o admin é feito
> pelo site), pode remover os `<input type="file">` do bundle do app — aí essas
> permissões deixam de ser necessárias. É a opção mais limpa.

## 2. Push Notifications — REMOVER (não é usado)

O plugin `PushNotifications` está incluído no Capacitor, mas **o código web nunca
registra nem envia push**. App com capacidade declarada e não usada é motivo de
rejeição (Guideline 2.1 / 5.1.1). **Remova:**

```bash
npm uninstall @capacitor/push-notifications
npx cap sync ios
```

E no Xcode, em **Signing & Capabilities**, remova a capability **Push
Notifications** (e o entitlement `aps-environment`, se existir). Quando (e se) for
usar push de verdade, a gente reativa com o fluxo de permissão correto.

## 3. PrivacyInfo.xcprivacy — já criado

Adicionei `app/ios/App/App/PrivacyInfo.xcprivacy`. No Xcode:
1. Arraste o arquivo pra dentro do target **App** (App > App).
2. Marque **Target Membership: App**.

Ele declara: **sem rastreamento** (ATT não é necessário), dados coletados
(e-mail, nome, telefone, histórico de compra, ID do usuário — ligados à
identidade, para funcionalidade), interação com produto (analytics 1ª parte), e
os *required-reason APIs* padrão do WebView/Capacitor.

## 4. App Privacy Labels (App Store Connect → Privacidade do app)

Declare **exatamente** isto (bate com o `PrivacyInfo.xcprivacy` e com o código):

| Tipo de dado | Coletado? | Ligado ao usuário? | Rastreamento? | Finalidade |
|---|---|---|---|---|
| E-mail | Sim | Sim | Não | Funcionalidade do app (conta/login) |
| Nome | Sim | Sim | Não | Funcionalidade do app |
| Telefone | Sim | Sim | Não | Funcionalidade do app (contato da reserva) |
| Histórico de compra | Sim | Sim | Não | Funcionalidade do app |
| ID do usuário | Sim | Sim | Não | Funcionalidade do app |
| Interação com produto (analytics) | Sim | Sim | Não | Análise |

**Não** declare: localização, saúde, contatos, fotos como *coletadas* (a foto do
`<input file>` fica no dispositivo/enviada só sob ação do usuário — não é coleta
passiva). **Rastreamento (ATT): NÃO** — não há SDK de anúncios de terceiros.

## 5. Dados de terceiros (o que passa por onde)

- **Supabase** (auth + banco): guarda e-mail, nome, telefone, reservas. É o
  backend próprio da Elarah — dado de funcionalidade, não rastreamento.
- **Mercado Pago** (pagamento): processa o cartão/Pix. O cartão é digitado na
  página segura da MP (Checkout Pro) — a Elarah **não** armazena dado de cartão.
  Declarar "Informações de pagamento" NÃO é necessário nas labels porque a Elarah
  não coleta/armazena o cartão (a MP processa).
- **Analytics (`analytics_events`)**: 1ª parte, no Supabase. Sem cookies de
  terceiros, sem pixel de anúncio.

## 6. Exclusão de conta (LGPD + 5.1.1) — ✅ já implementado

Fluxo completo em "Minha conta → Excluir minha conta" (função `delete-account`):
apaga login + dados pessoais, anonimiza registros fiscais. Cobre a exigência da
Apple e o direito de eliminação da LGPD.

---

## Checklist antes de submeter

- [ ] `NSPhotoLibraryUsageDescription` e `NSCameraUsageDescription` no Info.plist
      (ou remover os file inputs do bundle do app)
- [ ] Remover plugin/capability de Push Notifications
- [ ] `PrivacyInfo.xcprivacy` adicionado ao target App
- [ ] App Privacy Labels preenchidas conforme a tabela acima
- [ ] Rastreamento (ATT) = Não
- [ ] Testar no simulador que nenhuma tela pede permissão sem contexto
