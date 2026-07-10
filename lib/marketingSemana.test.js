import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildInstagramCaption,
  buildMarketingFilename,
  buildPhotoCatalog,
  buildPlacidLayers,
  buildReelCapaFilename,
  buildReelVideoClips,
  buildReelVideoLayers,
  isReelRow,
  matchPlacePhoto,
  parseMarketingCsv,
  parseReelScriptLines,
  resolveMarketingOutputDirName,
  resolvePlacidTemplateKey,
  resolvePlacidTemplateKeyForRow,
  resolvePlacidTemplateUuid,
  rowNeedsPlacePhoto,
  templateNeedsPlacePhoto,
} from "./marketingSemana.js";

const SAMPLE_CSV = `data;horário;formato;template_canva;texto_na_arte;legenda;hashtags;notas_producao
07/07 Seg;09:00;post;post-praia;Praia da Vila. Águas calmas.;Legenda da praia;#Imbituba;Nota
07/07 Seg;18:30;story;story-simples;Farol de Imbituba.;—;—;Sticker`;

describe("marketingSemana", () => {
  it("parseia CSV com separador ponto e vírgula", () => {
    const rows = parseMarketingCsv(SAMPLE_CSV);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].template_canva, "post-praia");
    assert.equal(rows[0].horario, "09:00");
    assert.equal(rows[0].texto_na_arte, "Praia da Vila. Águas calmas.");
    assert.equal(rows[1].formato, "story");
  });

  it("mapeia template_canva para chave Placid", () => {
    assert.equal(resolvePlacidTemplateKey("post-dica"), "post-feed");
    assert.equal(resolvePlacidTemplateKey("story-enquete"), "story-simples");
    assert.equal(resolvePlacidTemplateKey("desconhecido"), null);
  });

  it("resolve UUID do template via env", () => {
    const env = {
      PLACID_TEMPLATE_POST_FEED: "abc123",
      PLACID_TEMPLATE_STORY_SIMPLES: "def456",
      PLACID_TEMPLATE_REEL_CAPA: "ghi789",
    };
    assert.equal(resolvePlacidTemplateUuid(env, "post-feed"), "abc123");
    assert.equal(resolvePlacidTemplateUuid(env, "reel-capa"), "ghi789");
  });

  it("identifica posts que precisam de foto", () => {
    assert.equal(templateNeedsPlacePhoto("post-praia"), true);
    assert.equal(templateNeedsPlacePhoto("story-simples"), false);
  });

  it("monta layers do Placid com foto apenas em posts", () => {
    const withPhoto = buildPlacidLayers({
      templateCanva: "post-praia",
      textoNaArte: "Praia da Vila.",
      photoUrl: "https://cdn.test/praia.jpg",
    });
    assert.equal(withPhoto.text.text, "Praia da Vila.");
    assert.equal(withPhoto.foto.image, "https://cdn.test/praia.jpg");

    const story = buildPlacidLayers({
      templateCanva: "story-simples",
      textoNaArte: "Farol.",
      photoUrl: "https://cdn.test/farol.jpg",
    });
    assert.equal(story.text.text, "Farol.");
    assert.equal(story.foto, undefined);
  });

  it("faz match de lugar pelo texto", () => {
    const catalog = buildPhotoCatalog(
      [
        {
          nome: "Praia da Vila",
          imagem_url: "https://cdn.test/vila.jpg",
        },
        {
          nome: "Praia do Rosa",
          imagem_url: "https://cdn.test/rosa.jpg",
        },
      ],
      []
    );

    const match = matchPlacePhoto("Praia da Vila. Águas calmas.", catalog);
    assert.ok(match);
    assert.equal(match.source, "lugares:Praia da Vila");
    assert.equal(match.photoUrl, "https://cdn.test/vila.jpg");
  });

  it("gera nome de arquivo e pasta de saída", () => {
    assert.equal(
      buildMarketingFilename("Praia da Vila. Teste", "post", 3),
      "03-post-praia-da-vila.jpg"
    );
    assert.equal(
      buildMarketingFilename("Morro da Antena.", "reel", 11),
      "11-reel-morro-da-antena.mp4"
    );
    assert.equal(
      buildReelCapaFilename("Morro da Antena.", 11),
      "11-reel-capa-morro-da-antena.jpg"
    );
    assert.equal(
      resolveMarketingOutputDirName("/tmp/calendario_07_14_julho.csv"),
      "semana-07_14_julho"
    );
  });

  it("identifica reels e exige template de vídeo", () => {
    const reelRow = { formato: "reel", template_canva: "reel-capa" };
    assert.equal(isReelRow(reelRow), true);
    assert.equal(rowNeedsPlacePhoto(reelRow), true);
    assert.equal(resolvePlacidTemplateKeyForRow(reelRow, {}), null);
    assert.equal(
      resolvePlacidTemplateKeyForRow(reelRow, { PLACID_TEMPLATE_REEL_VIDEO: "vid123" }),
      "reel-video"
    );
    assert.equal(
      resolvePlacidTemplateKeyForRow(reelRow, { PLACID_TEMPLATE_REEL_CAPA: "capa123" }),
      "reel-capa"
    );
  });

  it("parseia roteiro do reel e monta clips por linha", () => {
    const notas =
      "Texto do reel: Existe uma piscina natural em Imbituba. / Água cristalina. / Na Rosa Norte.";
    const lines = parseReelScriptLines(notas, "Piscina Natural.");
    assert.deepEqual(lines, [
      "Existe uma piscina natural em Imbituba.",
      "Água cristalina.",
      "Na Rosa Norte.",
    ]);

    const layers = buildReelVideoLayers({
      textoNaArte: "Piscina Natural.",
      photoUrl: "https://cdn.test/rosa.jpg",
      notasProducao: notas,
    });
    assert.equal(layers.foto.image, "https://cdn.test/rosa.jpg");
    assert.ok(Array.isArray(layers.text.text));

    const clips = buildReelVideoClips("tpl-video", layers, {
      scriptLines: lines,
      photoUrl: "https://cdn.test/rosa.jpg",
    });
    assert.equal(clips.length, 3);
    assert.equal(clips[0].layers.text.text, lines[0]);
    assert.equal(clips[1].layers.foto.image, "https://cdn.test/rosa.jpg");
  });

  it("monta legenda com hashtags", () => {
    const caption = buildInstagramCaption({
      legenda: "Olá Imbituba",
      hashtags: "#Imbituba #SC",
    });
    assert.match(caption, /Olá Imbituba/);
    assert.match(caption, /#Imbituba/);
  });
});
