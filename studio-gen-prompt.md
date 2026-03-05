# Studio Gen — Prompt para Claude Code

Crie um app web em Next.js 14 (App Router) com TypeScript, Tailwind CSS e shadcn/ui chamado **"Studio Gen"** com duas abas principais: **Stills** e **Vídeos**.

---

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- `@google/genai` SDK (`npm install @google/genai`)
- Variáveis de ambiente: `GEMINI_API_KEY` no `.env.local`

---

## Aba 1 — Stills (Nano Banana Pro)

Geração de imagens usando o modelo `gemini-3-pro-image-preview`.

### UI

- Campo de texto para prompt (textarea)
- Select de aspect ratio: `1:1` | `16:9` | `9:16` | `4:3` | `3:4` | `21:9`
- Select de resolução: `1K` | `2K` | `4K`
- Botão "Gerar"
- Área de preview da imagem gerada
- Botão de download da imagem

### API Route

Criar `app/api/generate-image/route.ts`

```ts
// Usar @google/genai SDK
// model: "gemini-3-pro-image-preview"
// Retornar a imagem em base64 com mimeType
// Fazer o parse correto: response.candidates[0].content.parts
// Filtrar parts onde part.inlineData exists
// Retornar { imageData: base64string, mimeType: "image/png" }
```

---

## Aba 2 — Vídeos (Veo 3.1)

Geração de vídeos usando `veo-3.1-generate-preview` com suporte a first frame + last frame (end frame opcional).

### UI

- Campo de texto para prompt detalhado (textarea grande)
- Campo de negative prompt (opcional)
- Upload de imagem para **First Frame** (obrigatório quando usar frame)
- Upload de imagem para **Last Frame** (OPCIONAL — com toggle/switch para ativar)
- Select de aspect ratio: `16:9` | `9:16`
- Select de duração: `4s` | `6s` | `8s`
- Select de resolução: `720p` | `1080p`
- Botão "Gerar Vídeo"
- Status de polling em tempo real (`"Gerando… aguarde ~60s"`)
- Preview do vídeo com player nativo HTML5 quando pronto
- Botão de download do `.mp4`

### API Route

Criar `app/api/generate-video/route.ts`

```ts
// Usar @google/genai SDK
// model: "veo-3.1-generate-preview"
//
// Fluxo:
// 1. Receber: prompt, firstFrameBase64, firstFrameMimeType,
//    lastFrameBase64 (opcional), lastFrameMimeType (opcional),
//    aspectRatio, durationSeconds, resolution, negativePrompt
//
// 2. Montar a chamada:
//    client.models.generateVideos(
//      "veo-3.1-generate-preview",
//      prompt,
//      firstFrameImage,  // genai.Image com bytesBase64Encoded
//      {
//        lastFrame: lastFrameImage,  // só se lastFrame foi enviado
//        aspectRatio,
//        durationSeconds,
//        resolution,
//        negativePrompt,
//        numberOfVideos: 1,
//      }
//    )
//
// 3. Polling da operation até operation.done === true
//    Interval de 10s, max 20 tentativas (timeout de ~3min)
//
// 4. Retornar o video em base64 para download direto
//    (operation.response.generatedVideos[0].video.videoBytes)
//
// Tratar erros: quota, PERMISSION_DENIED, timeout
```

---

## Boas Práticas de Prompt para Veo 3.1

Exibir como tooltip ou helper text inline no app:

- Comece com o tipo de shot: `"Close-up"`, `"Wide shot"`, `"Medium shot"`, `"POV shot"`
- Descreva o movimento de câmera: `"slow dolly in"`, `"tracking shot"`, `"crane up"`, `"handheld"`
- Inclua iluminação: `"dramatic spotlight"`, `"golden hour"`, `"neon-lit"`, `"natural soft light"`
- Descreva o áudio desejado: sons ambiente, música, diálogos
- Para first+last frame: descreva a **transição** no prompt — o que acontece entre os dois frames
- Use negative prompt para: `"no text"`, `"no watermark"`, `"no blur"`, `"no artifacts"`

---

## Estrutura de Arquivos

```
app/
  page.tsx                   ← tabs de navegação (Stills | Vídeos)
  api/
    generate-image/
      route.ts
    generate-video/
      route.ts
components/
  StillsTab.tsx
  VideosTab.tsx
  PromptTips.tsx             ← tooltip/helper com as dicas de prompt
```

---

## UX / Behavior

- Loading states com skeleton ou spinner em ambas as abas
- Erros exibidos em toast (shadcn toast)
- Imagens e vídeos gerados ficam visíveis até nova geração
- Last Frame deve aparecer/desaparecer com um Switch **"Usar End Frame"**
- Ao fazer upload das imagens (first/last frame), mostrar preview imediato
- O vídeo não deve usar autoplay com som — apenas controls nativo
- Responsivo, funciona no mobile

---

## Variáveis de Ambiente

```env
GEMINI_API_KEY=sua_chave_aqui
```

> Usar `process.env.GEMINI_API_KEY` nas API routes — **nunca expor no client**.
