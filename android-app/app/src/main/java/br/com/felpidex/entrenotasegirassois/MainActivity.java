package br.com.felpidex.entrenotasegirassois;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;

public class MainActivity extends Activity {
  private WebView game;
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    game = new WebView(this);
    game.setBackgroundColor(Color.rgb(25, 30, 43));
    game.setOverScrollMode(View.OVER_SCROLL_NEVER);
    WebSettings settings = game.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(false);
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);
    settings.setMediaPlaybackRequiresUserGesture(true);
    game.setWebViewClient(new WebViewClient());
    game.setWebChromeClient(new WebChromeClient());
    setContentView(game);
    game.loadUrl("file:///android_asset/index.html");
  }
  @Override public void onBackPressed() {
    if (game == null) { super.onBackPressed(); return; }
    game.evaluateJavascript("(function(){let d=document.getElementById('journalDialog');if(d&&d.open){d.close();return true;}let p=document.getElementById('puzzleLayer');if(p&&!p.classList.contains('hidden')){document.getElementById('puzzleClose').click();return true;}return false;})()", result -> {
      if (!"true".equals(result)) finish();
    });
  }
  @Override protected void onDestroy() {
    if (game != null) { game.destroy(); game = null; }
    super.onDestroy();
  }
}
