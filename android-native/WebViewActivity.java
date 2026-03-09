package com.nullbrowser.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

/**
 * Native WebView Activity untuk NullBrowser
 * 
 * Activity ini handle SEMUA web browsing dengan native Android WebView.
 * Tidak ada limitasi iframe, bisa buka YouTube, Facebook, etc.
 * 
 * CARA PAKAI:
 * 1. Copy file ini ke: android/app/src/main/java/com/nullbrowser/app/
 * 2. Daftar di AndroidManifest.xml
 * 3. Call dari Capacitor dengan Intent
 */
public class WebViewActivity extends Activity {
    
    private WebView webView;
    private ProgressBar progressBar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_webview);
        
        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progress_bar);
        
        // Setup WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        settings.setDefaultTextEncodingName("utf-8");
        
        // User Agent - Pretend to be Chrome mobile
        settings.setUserAgentString(
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Mobile Safari/537.36"
        );
        
        // AdBlock WebViewClient (intercept requests)
        webView.setWebViewClient(new AdBlockWebViewClient());
        
        // WebChromeClient untuk progress bar
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }
        });
        
        // Get URL from intent
        Intent intent = getIntent();
        String url = intent.getStringExtra("url");
        if (url != null && !url.isEmpty()) {
            webView.loadUrl(url);
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
