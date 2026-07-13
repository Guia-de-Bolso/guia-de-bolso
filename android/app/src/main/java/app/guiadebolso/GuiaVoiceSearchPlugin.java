package app.guiadebolso;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/**
 * Abre o diálogo nativo do Android (RecognizerIntent) — mesma UX do Google.
 */
@CapacitorPlugin(name = "GuiaVoiceSearch")
public class GuiaVoiceSearchPlugin extends Plugin {

    private static final String TAG = "GuiaVoiceSearch";

    @PluginMethod
    public void ping(PluginCall call) {
        call.resolve(new JSObject().put("ok", true));
    }

    @PluginMethod
    public void speak(PluginCall call) {
        Activity activity = getActivity();
        if (!(activity instanceof MainActivity)) {
            call.reject("NO_ACTIVITY", "Atividade indisponível.");
            return;
        }

        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            call.reject("MISSING_PERMISSION", "Permita o microfone nas configurações do app.");
            return;
        }

        String language = call.getString("language");
        if (language == null || language.isEmpty()) {
            language = "pt-BR";
        }
        language = language.replace('_', '-');

        String prompt = call.getString("prompt", "O que você quer descobrir em Imbituba?");
        Intent intent = buildSpeechIntent(language, prompt);

        if (intent == null) {
            call.reject("NO_SPEECH_HANDLER", "Instale ou atualize o app Google para usar voz.");
            return;
        }

        Log.i(TAG, "Abrindo RecognizerIntent via MainActivity");
        ((MainActivity) activity).startVoiceRecognition(call, intent);
    }

    private Intent buildSpeechIntent(String language, String prompt) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());

        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            return null;
        }

        return intent;
    }

    static void finishSpeechCall(PluginCall call, int resultCode, Intent data) {
        if (call == null) {
            return;
        }

        Log.i(TAG, "Resultado do reconhecimento: " + resultCode);

        if (resultCode == Activity.RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            JSObject payload = new JSObject();
            JSArray matchesJson = new JSArray();

            if (matches != null) {
                for (String match : matches) {
                    matchesJson.put(match);
                }
            }

            String text = matches != null && !matches.isEmpty() ? matches.get(0) : "";
            payload.put("text", text);
            payload.put("matches", matchesJson);
            call.resolve(payload);
            return;
        }

        call.reject(Integer.toString(resultCode));
    }
}
