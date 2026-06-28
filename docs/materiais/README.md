# Materiais impressos — Guia de Bolso

## Apresentação Parceiro (A4 frente e verso)

Arquivo: [`APRESENTACAO-PARCEIRO-A4.html`](./APRESENTACAO-PARCEIRO-A4.html)

Folha resumida para colocar **dentro da pasta personalizada** na visita presencial. Complementa a proposta/contrato em [`../contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.md`](../contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.md).

### Como imprimir

1. Abra `APRESENTACAO-PARCEIRO-A4.html` no Chrome ou Safari (duplo clique no arquivo).
2. Preencha à mão os campos sublinhados (proposta nº, data, nome do estabelecimento) **ou** edite o HTML antes de imprimir.
3. **Arquivo → Imprimir** (ou `Cmd+P` / `Ctrl+P`).
4. Configurações:
   - Papel: **A4**
   - Margens: **Nenhuma**
   - Escala: **100%**
   - **Gráficos de segundo plano**: ativado (para cores e mockups)
   - **Frente e verso**: sim · virar pela **borda longa**
5. Papel recomendado: couché fosco ou offset **150g**.

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

> **Nota:** Este material não usa screenshots — o app é demonstrado ao vivo na visita.
> Os arquivos `screenshot-*.png` permanecem na pasta apenas como referência visual.

```bash
node -e "
const QRCode = require('qrcode');
const fs = require('fs');
const wa = 'https://wa.me/5548991223308?text=' + encodeURIComponent('Quero ser Parceiro do Guia de Bolso — Imbituba');
QRCode.toString(wa, { type: 'svg', margin: 1, width: 140, color: { dark: '#1a4a3a', light: '#ffffff' } }, (e, s) => fs.writeFileSync('docs/materiais/qr-whatsapp.svg', s));
QRCode.toString('https://guiadebolso.app/para-negocios', { type: 'svg', margin: 1, width: 100, color: { dark: '#1a4a3a', light: '#ffffff' } }, (e, s) => fs.writeFileSync('docs/materiais/qr-site.svg', s));
"
```
