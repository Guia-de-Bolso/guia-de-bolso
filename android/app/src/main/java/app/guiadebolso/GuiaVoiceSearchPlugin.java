package app.guiadebolso;

import android.app.Activity;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/**
 * Abre o diálogo nativo do Android (RecognizerIntent) — mesma UX do Google.
 */
@CapacitorPlugin(name = "GuiaVoiceSearch")
public class GuiaVoiceSearchPlugin extends Plugin {

    @PluginMethod
    public void speak(PluginCall call) {
        String language = call.getString("language");
        if (language == null || language.isEmpty()) {
            language = "pt-BR";
        }

        String prompt = call.getString("prompt", "O que você quer descobrir em Imbituba?");

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());

        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            call.reject("NO_SPEECH_HANDLER", "Instale ou atualize o app Google para usar voz.");
            return;
        }

        startActivityForResult(call, intent, "handleSpeechResult");
    }

    @ActivityCallback
    private void handleSpeechResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        int resultCode = result.getResultCode();
        if (resultCode == Activity.RESULT_OK && result.getData() != null) {
            ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
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
