package com.nullbrowser.app;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.Context;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * NullBrowser - Native AdBlock WebViewClient
 * Intercepts requests at the Android WebView level for maximum blocking
 * This runs BEFORE any JavaScript, blocking ads at the network layer
 */
public class AdBlockWebViewClient extends WebViewClient {

    // ── BLOCKED DOMAINS (subset - full list in adblock.js) ──
    private static final Set<String> BLOCKED_DOMAINS = new HashSet<>(Arrays.asList(
        // Ad Networks
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adnxs.com", "rubiconproject.com", "pubmatic.com", "openx.net",
        "casalemedia.com", "appnexus.com", "advertising.com",
        "criteo.com", "criteo.net", "taboola.com", "outbrain.com",
        "revcontent.com", "mgid.com", "propellerads.com", "popads.net",
        "exoclick.com", "trafficjunky.net", "adroll.com",
        // Trackers
        "google-analytics.com", "googletagmanager.com", "googletagservices.com",
        "segment.com", "segment.io", "amplitude.com", "heap.io",
        "fullstory.com", "logrocket.com", "hotjar.com",
        "facebook.com", "connect.facebook.net",
        "analytics.twitter.com", "bat.bing.com",
        "clarity.ms", "matomo.org",
        // Coinminers
        "coinhive.com", "coin-hive.com", "minero.cc", "crypto-loot.com",
        // Social widgets
        "platform.twitter.com", "addthis.com", "sharethis.com"
    ));

    // ── URL PATTERNS ──
    private static final Pattern[] BLOCKED_PATTERNS = {
        Pattern.compile(".*/ads?/.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*/adserver/.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*ad[_-]?banner.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*/tracking/.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*/tracker/.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*/pixel(\\.php)?.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*[?&]utm_.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*[?&]fbclid=.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*[?&]gclid=.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*coinhive.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*cryptominer.*", Pattern.CASE_INSENSITIVE),
    };

    // Empty response for blocked requests
    private static final WebResourceResponse EMPTY_RESPONSE = new WebResourceResponse(
        "text/plain", "utf-8", 200, "OK", null,
        new ByteArrayInputStream("".getBytes())
    );

    private boolean enabled = true;
    private int blockedCount = 0;

    public AdBlockWebViewClient(Context context) {
        super();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        if (!enabled) return null;

        String url = request.getUrl().toString();
        String host = request.getUrl().getHost();

        if (host != null && shouldBlockHost(host)) {
            blockedCount++;
            notifyBlocked(view, url);
            return EMPTY_RESPONSE;
        }

        if (shouldBlockUrl(url)) {
            blockedCount++;
            notifyBlocked(view, url);
            return EMPTY_RESPONSE;
        }

        return null; // allow
    }

    private boolean shouldBlockHost(String host) {
        String clean = host.startsWith("www.") ? host.substring(4) : host;
        if (BLOCKED_DOMAINS.contains(clean)) return true;

        // Check parent domains
        String[] parts = clean.split("\\.");
        for (int i = 0; i < parts.length - 1; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = i; j < parts.length; j++) {
                if (j > i) sb.append(".");
                sb.append(parts[j]);
            }
            if (BLOCKED_DOMAINS.contains(sb.toString())) return true;
        }
        return false;
    }

    private boolean shouldBlockUrl(String url) {
        String lower = url.toLowerCase();
        for (Pattern p : BLOCKED_PATTERNS) {
            if (p.matcher(lower).matches()) return true;
        }
        return false;
    }

    private void notifyBlocked(WebView view, String url) {
        // Notify JS layer about the block
        view.post(() -> view.evaluateJavascript(
            "if(window.AdBlock) AdBlock.recordBlock('" +
            url.replace("'", "\\'").substring(0, Math.min(url.length(), 100)) + "')",
            null
        ));
    }

    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getBlockedCount() { return blockedCount; }
}
