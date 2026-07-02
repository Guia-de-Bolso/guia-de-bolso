# Materiais impressos — Guia de Bolso

## Adesivos e cartazes — baixar o app

**URL única para todo QR de download:**

```text
https://guiadebolso.app/baixar
```

- Use **um só QR** em adesivos redondos, cartazes de praia, pasta (verso), etc.
- **Não** codifique App Store e Google Play separadamente — a página `/baixar` detecta iPhone ou Android e redireciona quando `NEXT_PUBLIC_APP_STORE_URL` e `NEXT_PUBLIC_PLAY_STORE_URL` estiverem configurados na Vercel.
- Geração do QR: [QR Code Monkey](https://www.qrcode-monkey.com/) ou `node` + pacote `qrcode` (ver comando em “Arquivos auxiliares” abaixo).
- Correção de erro **H** se houver logo no centro do QR; testar scan em iPhone e Android antes do lote.
- A página **não** exibe instruções para designers — só copy para o usuário final (título, lojas, links).

### Copy sugerida no adesivo (exemplo)

| Posição | Texto |
|---------|--------|
| Arco superior | `Imbituba · SC` |
| Centro | Logo + `Guia de Bolso` + benefício (ex.: praias, gastronomia) |
| CTA | `Baixe o app grátis` |
| Laterais (opcional) | `Apoiado pela Prefeitura de Imbituba` · `Guia turístico oficial` |
| Rodapé | `guiadebolso.app` |

---

## Apresentação Parceiro (A4 frente e verso)

Arquivo: [`APRESENTACAO-PARCEIRO-A4.html`](./APRESENTACAO-PARCEIRO-A4.html)

Folha resumida para colocar **dentro da pasta personalizada** na visita presencial. Complementa a proposta/contrato:

- **6 meses grátis (lançamento):** [`../contratos/MODELO-CONTRATO-PARCEIRO-6-MESES-GRATIS.md`](../contratos/MODELO-CONTRATO-PARCEIRO-6-MESES-GRATIS.md) · Word: `npm run contrato:6meses:docx` → `.docx` na mesma pasta
- **Plano pago R$ 299/mês:** [`../contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.md`](../contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.md) · Word: `npm run contrato:docx`

### Como imprimir

1. Abra `APRESENTACAO-PARCEIRO-A4.html` no Chrome ou Safari (duplo clique no arquivo), **ou** use o PDF pronto: [`APRESENTACAO-PARCEIRO-A4.pdf`](./APRESENTACAO-PARCEIRO-A4.pdf).
2. Preencha à mão os campos sublinhados (proposta nº, data, nome do estabelecimento) **ou** edite o HTML antes de imprimir.
3. **Arquivo → Imprimir** (ou `Cmd+P` / `Ctrl+P`).
4. Configurações:
   - Papel: **A4**
   - Margens: **Nenhuma**
   - Escala: **100%**
   - **Gráficos de segundo plano**: ativado (marca d'água e fundo timbrado)
   - **Frente e verso**: sim · virar pela **borda longa**
5. Papel recomendado: couché fosco ou offset **150g**.

**Regenerar o PDF** (após editar o HTML):

```bash
node scripts/export-apresentacao-parceiro-pdf.mjs
```

O layout usa **papel timbrado**: fundo `#f0f4f3`, logo no canto (verso) e marca d'água central à direita.

### Organização da pasta na visita

```
[Pasta personalizada com logo]
├── Apresentação A4 (esta folha) — frente visível ao abrir
├── Proposta comercial completa
├── Contrato (2 vias para assinatura)
└── Anexos (bolso interno)
```

### Arquivos auxiliares

| Arquivo | Uso |
|---|---|
| `logo.png` | Logo embutido na folha |
| `qr-whatsapp.svg` | QR com mensagem pré-preenchida para WhatsApp |
| `qr-site.svg` | QR para guiadebolso.app/para-negocios |
| `qr-baixar.png` | QR para download do app (`/baixar`) — adesivos e cartazes |

> **Nota:** Este material não usa screenshots — o app é demonstrado ao vivo na visita.
> Os arquivos `screenshot-*.png` permanecem na pasta apenas como referência visual.

```bash
node -e "
const QRCode = require('qrcode');
const fs = require('fs');
const wa = 'https://wa.me/5548991223308?text=' + encodeURIComponent('Quero ser Parceiro do Guia de Bolso — Imbituba');
QRCode.toString(wa, { type: 'svg', margin: 1, width: 140, color: { dark: '#1a4a3a', light: '#ffffff' } }, (e, s) => fs.writeFileSync('docs/materiais/qr-whatsapp.svg', s));
QRCode.toString('https://guiadebolso.app/para-negocios', { type: 'svg', margin: 1, width: 100, color: { dark: '#1a4a3a', light: '#ffffff' } }, (e, s) => fs.writeFileSync('docs/materiais/qr-site.svg', s));
QRCode.toFile('docs/materiais/qr-baixar.png', 'https://guiadebolso.app/baixar', { width: 1200, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#1a4a3a', light: '#ffffff' } }, (e) => { if (e) throw e; console.log('qr-baixar.png'); });
"
```
