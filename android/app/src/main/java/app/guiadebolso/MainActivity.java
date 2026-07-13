package app.guiadebolso;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    static final int VOICE_SEARCH_REQUEST = 73421;

    private PluginCall pendingVoicePluginCall;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GuiaVoiceSearchPlugin.class);
        super.onCreate(savedInstanceState);
    }

    public void startVoiceRecognition(PluginCall call, Intent intent) {
        if (pendingVoicePluginCall != null) {
            call.reject("BUSY", "Busca por voz já em andamento.");
            return;
        }

        pendingVoicePluginCall = call;
        call.setKeepAlive(true);
        bridge.saveCall(call);

        try {
            startActivityForResult(intent, VOICE_SEARCH_REQUEST);
        } catch (Exception ex) {
            pendingVoicePluginCall = null;
            call.reject("LAUNCH_FAILED", ex.getMessage());
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == VOICE_SEARCH_REQUEST && pendingVoicePluginCall != null) {
            PluginCall call = pendingVoicePluginCall;
            pendingVoicePluginCall = null;
            GuiaVoiceSearchPlugin.finishSpeechCall(call, resultCode, data);
        }

        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
