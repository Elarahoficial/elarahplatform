# Notificações push — guia de configuração

A **base** de notificações push já está pronta no app (plugin instalado,
permissões e "ouvintes" configurados no `native/bridge.js`). O que falta é a
parte que **só você pode fazer**, porque depende das suas contas: conectar o app
ao Firebase (Android) e ao Apple Push (iPhone), e ter um jeito de **enviar** as
notificações.

Enquanto isso não for feito, o app funciona normalmente — só o push que fica
inativo.

---

## Como funciona (visão geral)

```
[seu backend / painel]  ──envia──►  Firebase (FCM) / Apple (APNs)  ──►  celular do usuário
```

1. O celular se registra e recebe um **token** (identidade daquele aparelho).
2. Esse token é enviado ao seu backend (Supabase) e salvo junto do usuário.
3. Para notificar alguém, seu backend manda a mensagem para o FCM/APNs usando o
   token, e o celular recebe.

No app, o token já é capturado — veja `ElarahPush` e o evento `elarah:push-token`
em `native/bridge.js`. O `TODO` marcado ali é onde você envia o token ao Supabase.

---

## Parte 1 — Android (Firebase Cloud Messaging)

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Em **Project settings → General → Your apps**, adicione um app **Android** com
   o pacote **`com.elarah.app`**.
3. Baixe o arquivo **`google-services.json`** e coloque em:
   ```
   app/android/app/google-services.json
   ```
   (use o `google-services.json.example` como referência do formato).
4. Aplique o plugin do Google Services no Gradle:

   Em `app/android/build.gradle`, dentro de `dependencies` do bloco `buildscript`:
   ```gradle
   classpath 'com.google.gms:google-services:4.4.2'
   ```
   No **final** de `app/android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
5. Rode `npx cap sync android` e compile. Pronto — o Android já registra o token.

> O `google-services.json` contém identificadores do seu projeto. Ele **não** é
> segredo crítico, mas por organização já deixamos ele no `.gitignore` do app.

---

## Parte 2 — iPhone (APNs)

Requer um **Mac** e conta **Apple Developer** (US$ 99/ano).

1. No [Apple Developer](https://developer.apple.com/), crie uma **APNs Auth Key**
   (Keys → +), e guarde o arquivo `.p8`, o **Key ID** e o **Team ID**.
2. No [Firebase Console](https://console.firebase.google.com/) → **Project
   settings → Cloud Messaging → Apple app configuration**, envie a APNs Auth Key.
   (Assim você usa o Firebase para enviar tanto para Android quanto iPhone.)
3. No **Xcode**, abra `app/ios/App/App.xcworkspace`, selecione o alvo **App** e em
   **Signing & Capabilities** adicione **Push Notifications** e
   **Background Modes → Remote notifications**.
4. Compile e rode num iPhone real (push não funciona no simulador).

---

## Parte 3 — Ativar no app e enviar o token

O registro **não** é automático (pra não pedir permissão antes da hora). Depois
de configurado, chame em algum momento — por exemplo após o login:

```js
if (window.ElarahPush && window.ElarahPush.available) {
  window.ElarahPush.register()
    .then(() => console.log('push ativado'))
    .catch((e) => console.log('push não ativado:', e.message));
}
```

E capture o token para salvar no Supabase:

```js
window.addEventListener('elarah:push-token', (ev) => {
  const token = ev.detail;
  // salvar `token` no Supabase, associado ao usuário logado
});
```

---

## Parte 4 — Enviar uma notificação (teste)

O jeito mais simples de testar: no **Firebase Console → Messaging → Nova
campanha → Notificação**, envie uma mensagem de teste usando o token do aparelho.

Para envio automático (ex.: "sua experiência é amanhã"), seu backend chama a API
do FCM. Posso te ajudar a montar isso no Supabase (Edge Function) quando você
quiser — é o próximo passo natural depois que Android e iPhone estiverem
registrando os tokens.
