package com.sphaxe.milo;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 这是 App，不是网页：WebView 自己的滚动条也关掉（页面里的滚动条由 global.css 隐藏，2026-10-08 走查 1）
        if (getBridge() == null || getBridge().getWebView() == null) return;  // 没有 WebView 的设备走 no_webview 布局
        WebView webView = getBridge().getWebView();
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
    }
}
