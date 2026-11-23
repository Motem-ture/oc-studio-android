package com.ocstudio.app;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * 全屏外壳：**状态栏默认隐藏**（沉浸式），底部导航栏保留但透明。
 *
 * 为什么不能只靠「透明状态栏」：那只是把内容铺到栏下面，栏本身还在，
 * 各家 ROM 还会给它刷上自己的底色 / 模糊 / 对比度遮罩，看着就是没隐藏。
 * 这里改成真正把状态栏 hide 掉，并用下面几条把主流系统的差异兜住：
 *
 * - **刘海 / 挖孔**：`LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` 让内容铺满，
 *   真正的避让交给 WebView 的 safe-area（原生把顶部内边距回传给前端，见 {@link NativeUi#getSafeTopPx()}）。
 * - **Android 10+ 对比度遮罩**：`setNavigationBarContrastEnforced(false)`，
 *   否则导航栏会被系统刷成半透明灰条。
 * - **MIUI / HyperOS**：只有带上 `FLAG_TRANSLUCENT_NAVIGATION` 才会把导航栏做成沉浸，
 *   但其余系统带这个标志会让现代 insets API 行为异常 —— 所以只在小米设备上加。
 * - **Android 11 以下**：insets controller 已经可用，但个别 ROM 仍认老 flag，
 *   这里同时下发 `SYSTEM_UI_FLAG_FULLSCREEN | IMMERSIVE_STICKY`。
 * - **会自己把状态栏放回来的系统**（MIUI / ColorOS / OriginOS 在弹窗、切输入法、切前后台之后）：
 *   焦点变化、onResume、旋转屏都会重放一次，并在 120/400/1000/2000ms 再补几次；
 *   另外挂了一个 window insets 监听 —— 只要状态栏又冒出来就再收一次。
 * - **提示条行为**：`BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`，用户从顶边下滑仍能临时拉出状态栏。
 *
 * 前端可以（也应当）通过 `window.OcNative` 控制：
 * `setHideStatusBar(bool)` / `isStatusBarHidden()` / `getSafeTopPx()`。
 * 设置项在「设置 › 个性化 › 隐藏状态栏」，默认开启。
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "OcStudio";

    private WindowInsetsControllerCompat insetsController;
    private boolean hideStatusBar = true;
    /** 深色主题 → 系统栏图标用浅色（true 表示「图标要浅」） */
    private boolean lightIcons = true;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // 刘海 / 挖孔：允许铺到挖孔区
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }

        // 内容延伸到系统栏下方（edge-to-edge）
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // 关掉系统给导航栏 / 状态栏自动加的对比度遮罩，否则「透明」会变成一条灰边
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // MIUI / HyperOS 依赖这个旧标志把导航栏做成沉浸；其它系统带上反而会让 insets 行为异常
        if ("Xiaomi".equalsIgnoreCase(Build.MANUFACTURER)) {
            window.addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        }

        insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            // 状态栏被藏起来后，用户从顶部下滑仍可以临时拉出来
            insetsController.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }

        // 有的系统会在弹窗 / 切输入法之后把状态栏放回来：只要它又出现，就再收一次
        final View decor = window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (v, insets) -> {
            if (hideStatusBar && insets.isVisible(WindowInsetsCompat.Type.statusBars())) {
                v.post(this::applySystemBars);
            }
            return insets;
        });

        applySystemBars();
        scheduleRetries();

        // 把控制权交给前端（设置项 / 安全区回读）
        try {
            getBridge().getWebView().addJavascriptInterface(new NativeUi(), "OcNative");
        } catch (Throwable ignored) {
            // 桥没起来也不影响沉浸式本身
        }
    }

    /** 按当前偏好重放一次系统栏状态。 */
    private void applySystemBars() {
        if (insetsController != null) {
            if (hideStatusBar) {
                insetsController.hide(WindowInsetsCompat.Type.statusBars());
            } else {
                insetsController.show(WindowInsetsCompat.Type.statusBars());
            }
            // 底部导航栏始终保留（手势条 / 三键导航是回家的路），只做透明
            insetsController.show(WindowInsetsCompat.Type.navigationBars());
            applyIconContrast(insetsController);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            if (hideStatusBar) {
                flags |= View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            }
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
    }

    /**
     * 系统栏图标的明暗：深色主题要浅色图标，浅色主题要深色图标。
     * 导航栏是透明的，图标跟背景同色时三键导航（部分 ROM 默认）会像「消失」一样。
     */
    private void applyIconContrast(WindowInsetsControllerCompat controller) {
        // `setAppearanceLight*` 的语义是「图标用深色」：深色主题要浅色图标，所以取反。
        // 不用 APPEARANCE_* 常量：core 1.13 的兼容类只暴露了这组旧方法，跨版本更保险。
        boolean darkIcons = !lightIcons;
        controller.setAppearanceLightStatusBars(darkIcons);
        controller.setAppearanceLightNavigationBars(darkIcons);
    }

    /** 启动 / 回前台 / 旋转之后，多数 ROM 会晚一点再把状态栏放回来，多补几次。 */
    private void scheduleRetries() {
        handler.removeCallbacksAndMessages(null);
        long[] delays = { 120L, 400L, 1000L, 2000L };
        for (long delay : delays) {
            handler.postDelayed(this::applySystemBars, delay);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applySystemBars();
            scheduleRetries();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBars();
        scheduleRetries();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applySystemBars();
        scheduleRetries();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    /**
     * 暴露给前端的原生能力。
     *
     * 只做三件事：设定是否隐藏状态栏、回读当前状态、回读顶部安全区（挖孔 /
     * 状态栏高度，单位是物理像素除以 density 后的 CSS px）。
     * 前端把后者写进 `--safe-top`，这样「状态栏藏起来」时顶部不会留出 24px 空洞。
     */
    private class NativeUi {

        @JavascriptInterface
        public void setHideStatusBar(boolean hide) {
            runOnUiThread(() -> {
                hideStatusBar = hide;
                applySystemBars();
                scheduleRetries();
            });
        }

        @JavascriptInterface
        public boolean isStatusBarHidden() {
            return hideStatusBar;
        }

        /** 深色主题传 true（图标用浅色），浅色主题传 false。 */
        @JavascriptInterface
        public void setLightSystemBarIcons(boolean light) {
            runOnUiThread(() -> {
                lightIcons = light;
                if (insetsController != null) {
                    applyIconContrast(insetsController);
                }
            });
        }

        /**
         * 用系统分享面板把应用私有目录里的文件交给用户。
         *
         * Android 10+ 起，直接写 `/storage/emulated/0/Documents` 会 EACCES（目标 SDK 30+ 的分区存储），
         * 所以导出改成「先写到 Cache，再让用户从分享面板存到文件 / 网盘 / 发给别人」。
         * 这里用既有的 `${applicationId}.fileprovider`（file_paths.xml 已包含 cache-path）。
         */
        @JavascriptInterface
        public void shareFile(String path, String title, String mimeType) {
            runOnUiThread(() -> {
                try {
                    String clean = path != null && path.startsWith("file://") ? path.substring(7) : path;
                    java.io.File file = new java.io.File(clean);
                    if (!file.exists()) {
                        android.widget.Toast.makeText(MainActivity.this, "File not found", android.widget.Toast.LENGTH_SHORT).show();
                        return;
                    }
                    Uri uri = FileProvider.getUriForFile(
                        MainActivity.this,
                        getPackageName() + ".fileprovider",
                        file
                    );
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType(mimeType == null || mimeType.isEmpty() ? "*/*" : mimeType);
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    Intent chooser = Intent.createChooser(intent, title);
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } catch (Throwable error) {
                    android.util.Log.w("OcStudio", "shareFile failed", error);
                }
            });
        }

        /** 顶部需要避让的高度（CSS px）：状态栏可见时是状态栏高度，隐藏时是挖孔高度。 */
        @JavascriptInterface
        public int getSafeTopPx() {
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(getWindow().getDecorView());
            if (insets == null) return 0;
            Insets top = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            if (density <= 0f) return top.top;
            return Math.round(top.top / density);
        }
    }
}