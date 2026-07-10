import assert from "node:assert/strict";
import {
  isSpeechPermissionGranted,
  pickBestTranscript,
  VOICE_SEARCH_MESSAGES,
} from "./speechRecognition.js";
assert.equal(pickBestTranscript("  praia hoje  "), "praia hoje");
assert.equal(
  pickBestTranscript({ matches: ["restaurante perto", "restaurante perto de mim"] }),
  "restaurante perto"
);
assert.equal(
  pickBestTranscript({ accumulatedText: "trilha fácil" }),
  "trilha fácil"
);
assert.equal(pickBestTranscript({ text: "café aberto" }), "café aberto");

assert.equal(isSpeechPermissionGranted({ speechRecognition: "granted" }), true);
assert.equal(isSpeechPermissionGranted({ microphone: "granted" }), true);
assert.equal(isSpeechPermissionGranted({ speechRecognition: "denied" }), false);
assert.equal(isSpeechPermissionGranted(null), false);

assert.ok(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED.includes("microfone"));

console.log("speechRecognition.test.js: ok");
