import assert from "node:assert/strict";
import {
  otpDigitsFromInput,
  otpDigitsToCode,
} from "./smsOtpAutofill.js";

assert.equal(otpDigitsFromInput("123456"), "123456");
assert.equal(otpDigitsFromInput("12 34-56"), "123456");
assert.equal(otpDigitsFromInput("1234567890"), "123456");
assert.equal(otpDigitsFromInput(""), "");

assert.deepEqual(otpDigitsToCode("123456"), ["1", "2", "3", "4", "5", "6"]);
assert.equal(otpDigitsToCode("12345"), null);
assert.equal(otpDigitsToCode("1234567"), null);

console.log("smsOtpAutofill.test.js OK");
