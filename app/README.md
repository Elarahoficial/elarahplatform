# Elarah — App mobile (Android e iOS)

Este é o aplicativo da Elarah para celular. Ele **empacota o site elarah.com.br**
dentro de um app nativo usando o [Capacitor](https://capacitorjs.com/).

O resultado é um app **idêntico ao site**: as mesmas páginas, o mesmo visual e os
mesmos dados (Supabase). A vantagem é que ele pode ser instalado pela **Google
Play** e pela **App Store**, com ícone próprio na tela do celular.

> **Por que assim?** O site da Elarah já é um aplicativo web completo. Em vez de
> reescrever tudo do zero (o que levaria meses e criaria duas bases pra manter),
> o app reaproveita o site. Quando o site muda, é só rodar o build de novo e o
> app acompanha.

---

## Como funciona (visão simples)

```
site (raiz do repositório)  ──►  npm run build  ──►  app/www  ──►  app Android/iOS
```

1. `npm run build` copia os arquivos do site para a pasta `app/www`.
2. O Capacitor coloca essa pasta dentro dos projetos nativos (`android/` e `ios/`).
3. Você compila e envia para as lojas.

A pasta `www` é **gerada automaticamente** (não precisa editar nada dentro dela).

---

## O que já está pronto neste projeto

- ✅ Projeto Capacitor configurado (`capacitor.config.json`)
- ✅ Projeto **Android** gerado (`android/`)
- ✅ Projeto **iOS** gerado (`ios/`)
- ✅ Nome do app: **Elarah** · ID: `com.elarah.app`
- ✅ Ícone e splash da marca (fontes em `resources/`)
- ✅ Ponte nativa (`native/bridge.js`): botão voltar do Android, links externos
  abrindo no navegador do sistema e navegação interna offline.

---

## Pré-requisitos (na sua máquina)

- **Node.js 18+** (para rodar os comandos `npm`).
- **Para Android:** [Android Studio](https://developer.android.com/studio) e uma
  conta de desenvolvedor **Google Play** (US$ 25, pagamento único).
- **Para iOS:** um **Mac** com [Xcode](https://developer.apple.com/xcode/) e uma
  conta **Apple Developer** (US$ 99 por ano).

> iPhone **só pode ser gerado num Mac** — é uma exigência da Apple. Para Android,
> qualquer computador (Windows, Mac ou Linux) com Android Studio serve.

---

## Passo a passo

### 1. Instalar as dependências

```bash
cd app
npm install
```

### 2. (Opcional) Gerar os ícones em todos os tamanhos

As imagens-fonte já estão em `resources/`. Para recortá-las em todos os tamanhos
que Android e iOS pedem:

```bash
npm run assets
```

> Isso usa o `@capacitor/assets`. Se quiser trocar o ícone, substitua os arquivos
> em `resources/` (ou rode `npm run gen-icons` para regerá-los a partir da logo)
> e rode `npm run assets` de novo.

### 3. Atualizar o app com a versão mais recente do site

Sempre que o site mudar:

```bash
npm run build          # regenera app/www a partir do site
npx cap sync           # leva o www para Android e iOS
```

### 4. Abrir e rodar no Android

```bash
npm run prepare:android   # build + sync do Android
npm run open:android      # abre no Android Studio
```

No Android Studio: clique em **Run ▶** para testar num emulador ou celular
conectado. Para publicar, use **Build → Generate Signed Bundle / APK** e gere um
**Android App Bundle (.aab)** assinado, que é o arquivo enviado à Google Play.

### 5. Abrir e rodar no iOS (só no Mac)

```bash
npm run prepare:ios
npm run open:ios          # abre no Xcode
```

No Xcode: escolha um simulador ou iPhone e clique em **Run ▶**. Para publicar, use
**Product → Archive** e envie para a App Store Connect.

---

## Publicar nas lojas (resumo)

### Google Play
1. Crie a conta em <https://play.google.com/console> (US$ 25, uma vez).
2. Crie um novo app, preencha ficha (nome, descrição, categoria, política de
   privacidade — já existe `privacidade.html` no site).
3. Envie o arquivo `.aab` assinado.
4. Adicione capturas de tela e o ícone.
5. Envie para revisão.

### App Store
1. Crie a conta em <https://developer.apple.com> (US$ 99/ano).
2. Em <https://appstoreconnect.apple.com>, crie o app com o ID `com.elarah.app`.
3. Faça o **Archive** no Xcode e envie.
4. Preencha a ficha e envie para revisão.

> **Atenção à revisão da Apple:** apps que são "só um site empacotado" às vezes
> são questionados (regra 4.2). O app da Elarah tem funcionalidades reais (compra
> de experiências, conta, favoritos), o que costuma ser suficiente. Se pedirem
> mais, dá pra reforçar recursos nativos (notificações push, compartilhamento,
> etc.) — posso ajudar a adicionar depois.

---

## Estrutura de pastas

```
app/
├── android/              projeto nativo Android (gerado)
├── ios/                  projeto nativo iOS (gerado)
├── www/                  site empacotado (gerado no build — não editar)
├── resources/            ícone e splash de origem (icon.png, splash.png...)
├── native/
│   └── bridge.js         melhorias nativas injetadas no app
├── scripts/
│   ├── copy-web.mjs      copia o site para www
│   └── gen-icons.mjs     gera os ícones a partir da logo
├── capacitor.config.json configuração do app (nome, id, plugins)
└── package.json
```

---

## Perguntas rápidas

**Preciso mexer no site pra atualizar o app?**
Não. Trabalhe no site normalmente. Para atualizar o app, rode `npm run build &&
npx cap sync` e gere uma nova versão.

**O app funciona offline?**
As páginas empacotadas abrem sem internet, mas os dados (experiências, preços)
vêm do Supabase e precisam de conexão, igual ao site.

**Onde mudo o número da versão?**
Android: `android/app/build.gradle` (`versionCode` e `versionName`).
iOS: no Xcode, aba **General** do alvo **App**.
