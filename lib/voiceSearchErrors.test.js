import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mapNativeVoiceError,
  messageForVoiceError,
  VOICE_ERROR,
} from "./voiceSearchErrors.js";

test("messageForVoiceError cobre códigos conhecidos", () => {
  assert.match(messageForVoiceError(VOICE_ERROR.PERMISSION), /microfone/i);
  assert.match(messageForVoiceError(VOICE_ERROR.NO_SPEECH), /Não ouvi/i);
  assert.match(messageForVoiceError("xyz"), /Tente de novo/i);
});

test("mapNativeVoiceError normaliza códigos nativos", () => {
  assert.equal(mapNativeVoiceError("permission_denied"), VOICE_ERROR.PERMISSION);
  assert.equal(mapNativeVoiceError("ERROR_NETWORK"), VOICE_ERROR.NETWORK);
  assert.equal(mapNativeVoiceError("no_speech"), VOICE_ERROR.NO_SPEECH);
  assert.equal(mapNativeVoiceError("Recognizer_Busy"), VOICE_ERROR.BUSY);
  assert.equal(mapNativeVoiceError("something else"), VOICE_ERROR.UNKNOWN);
});
