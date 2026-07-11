import assert from "node:assert/strict";
import {
  formatSpeechError,
  isSpeechPermissionGranted,
  pickBestTranscript,
  pickLongerTranscript,
  VOICE_SEARCH_MESSAGES,
  withVoiceCaptureTimeout,
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
assert.equal(pickLongerTranscript("praia", "praia da vila"), "praia da vila");

assert.equal(isSpeechPermissionGranted({ speechRecognition: "granted" }), true);
assert.equal(isSpeechPermissionGranted({ microphone: "granted" }), false);
assert.equal(isSpeechPermissionGranted({ speechRecognition: "denied" }), false);
assert.equal(
  formatSpeechError(new Error("SpeechRecognition plugin is not implemented on android")),
  VOICE_SEARCH_MESSAGES.PLUGIN_MISSING
);
assert.equal(formatSpeechError(new Error("0")), VOICE_SEARCH_MESSAGES.CANCELLED);
assert.equal(isSpeechPermissionGranted(null), false);

assert.ok(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED.includes("microfone"));
assert.ok(VOICE_SEARCH_MESSAGES.PLUGIN_MISSING.includes("App Store"));

await assert.rejects(
  () => withVoiceCaptureTimeout(new Promise(() => {}), 20, "timeout-test"),
  /timeout-test/
);

console.log("speechRecognition.test.js: ok");
