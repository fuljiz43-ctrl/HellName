package com.nullbrowser.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor Plugin untuk buka Native WebView
 * 
 * USAGE dari JavaScript:
 * 
 * import { Plugins } from '@capacitor/core';
 * const { NativeWebView } = Plugins;
 * 
 * NativeWebView.open({ url: 'https://youtube.com' });
 */
@CapacitorPlugin(name = "NativeWebView")
public class NativeWebViewPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        // Launch WebViewActivity
        Intent intent = new Intent(getContext(), WebViewActivity.class);
        intent.putExtra("url", url);
        getActivity().startActivity(intent);
        
        call.resolve();
    }
}
