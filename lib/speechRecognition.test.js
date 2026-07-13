import assert from "node:assert/strict";
import {
  formatSpeechError,
  isSpeechPermissionGranted,
  pickBestTranscript,
  pickLongerTranscript,
  VOICE_IOS_LISTENING_HINT,
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
assert.equal(
  pickBestTranscript({ unstableText: "praia da" }),
  "praia da"
);
assert.equal(
  pickBestTranscript({ matches: [{ transcript: "lagoa bonita" }] }),
  "lagoa bonita"
);
assert.equal(pickLongerTranscript("praia", "praia da vila"), "praia da vila");

assert.equal(isSpeechPermissionGranted({ speechRecognition: "granted" }), true);
assert.equal(isSpeechPermissionGranted({ microphone: "granted" }), false);
assert.equal(isSpeechPermissionGranted({ speechRecognition: "denied" }), false);
assert.equal(
  formatSpeechError(new Error("SpeechRecognition plugin is not implemented on android")),
  VOICE_SEARCH_MESSAGES.PLUGIN_MISSING
);
assert.equal(formatSpeechError(new Error("0")), VOICE_SEARCH_MESSAGES.CANCELLED);
assert.equal(
  formatSpeechError(new Error("Speech recognition is already running.")),
  VOICE_SEARCH_MESSAGES.START_FAILED
);
assert.equal(
  formatSpeechError(new Error("ERROR_NO_MATCH")),
  VOICE_SEARCH_MESSAGES.NO_SPEECH
);
assert.equal(
  formatSpeechError(new Error("NETWORK_ERROR")),
  VOICE_SEARCH_MESSAGES.NETWORK_REQUIRED
);
assert.equal(isSpeechPermissionGranted(null), false);

assert.ok(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED.includes("microfone"));
assert.equal(formatSpeechError(new Error("-1")), VOICE_SEARCH_MESSAGES.CANCELLED);
assert.ok(VOICE_IOS_LISTENING_HINT.includes("toque"));

await assert.rejects(
  () => withVoiceCaptureTimeout(new Promise(() => {}), 20, "timeout-test"),
  /timeout-test/
);

console.log("speechRecognition.test.js: ok");
