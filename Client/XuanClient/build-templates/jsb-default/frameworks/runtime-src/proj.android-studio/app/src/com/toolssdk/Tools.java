package com.toolssdk;

import android.content.Context;
import android.os.Build;
import android.widget.Toast;
import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

/**
 * Created by chenchun on 2017/11/12.
 */

public class Tools
{
    public static void copyClip(final String text)
    {
        AppActivity.App.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                //ClipboardManager cm = (ClipboardManager) AppActivity.App.getSystemService(Context.CLIPBOARD_SERVICE);
                //cm.setText(text);
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
					final android.content.ClipboardManager clipboardManager = (android.content.ClipboardManager) AppActivity.App.getSystemService(Context.CLIPBOARD_SERVICE);
					final android.content.ClipData clipData = android.content.ClipData.newPlainText("text label", text);
					clipboardManager.setPrimaryClip(clipData);
				} else {
					final android.text.ClipboardManager clipboardManager = (android.text.ClipboardManager) AppActivity.App.getSystemService(Context.CLIPBOARD_SERVICE);
					clipboardManager.setText(text);
				}
				
                Toast.makeText(AppActivity.App.getApplicationContext(), "复制成功", Toast.LENGTH_SHORT).show();
            }
        });
    }

    public static void device(){
        Build build = new Build();
        String model = build.MODEL;
        System.out.println(model);
        String evalString = String.format("window.sdktools.Callback_Build('%s')",model) ;
        Cocos2dxJavascriptJavaBridge.evalString( evalString );
    }
}

//
///**
// * 判断是否是刘海屏
// * @return
// */
//public static boolean hasNotchScreen(Activity activity){
//    if (getInt("ro.miui.notch",activity) == 1 || hasNotchAtHuawei() || hasNotchAtOPPO()
//            || hasNotchAtVivo() || isAndroidP(activity) != null){ //TODO 各种品牌
//        return true;
//    }
//
//    return false;
//}
//
//    /**
//     * Android P 刘海屏判断
//     * @param activity
//     * @return
//     */
//    public static DisplayCutout isAndroidP(Activity activity){
//        View decorView = activity.getWindow().getDecorView();
//        if (decorView != null && android.os.Build.VERSION.SDK_INT >= 28){
//            WindowInsets windowInsets = decorView.getRootWindowInsets();
//            if (windowInsets != null)
//                return windowInsets.getDisplayCutout();
//        }
//        return null;
//    }
//
//    /**
//     * 小米刘海屏判断.
//     * @return 0 if it is not notch ; return 1 means notch
//     * @throws IllegalArgumentException if the key exceeds 32 characters
//     */
//    public static int getInt(String key,Activity activity) {
//        int result = 0;
//        if (isXiaomi()){
//            try {
//                ClassLoader classLoader = activity.getClassLoader();
//                @SuppressWarnings("rawtypes")
//                Class SystemProperties = classLoader.loadClass("android.os.SystemProperties");
//                //参数类型
//                @SuppressWarnings("rawtypes")
//                Class[] paramTypes = new Class[2];
//                paramTypes[0] = String.class;
//                paramTypes[1] = int.class;
//                Method getInt = SystemProperties.getMethod("getInt", paramTypes);
//                //参数
//                Object[] params = new Object[2];
//                params[0] = new String(key);
//                params[1] = new Integer(0);
//                result = (Integer) getInt.invoke(SystemProperties, params);
//
//            } catch (ClassNotFoundException e) {
//                e.printStackTrace();
//            } catch (NoSuchMethodException e) {
//                e.printStackTrace();
//            } catch (IllegalAccessException e) {
//                e.printStackTrace();
//            } catch (IllegalArgumentException e) {
//                e.printStackTrace();
//            } catch (InvocationTargetException e) {
//                e.printStackTrace();
//            }
//        }
//        return result;
//    }
//
//    /**
//     * 华为刘海屏判断
//     * @return
//     */
//    public static boolean hasNotchAtHuawei() {
//        boolean ret = false;
//        try {
//            ClassLoader classLoader = StaticContext.CONTEXT.getClassLoader();
//            Class HwNotchSizeUtil = classLoader.loadClass("com.huawei.android.util.HwNotchSizeUtil");
//            Method get = HwNotchSizeUtil.getMethod("hasNotchInScreen");
//            ret = (boolean) get.invoke(HwNotchSizeUtil);
//        } catch (ClassNotFoundException e) {
//            AppLog.e("hasNotchAtHuawei ClassNotFoundException");
//        } catch (NoSuchMethodException e) {
//            AppLog.e("hasNotchAtHuawei NoSuchMethodException");
//        } catch (Exception e) {
//            AppLog.e( "hasNotchAtHuawei Exception");
//        } finally {
//            return ret;
//        }
//    }
//
//    public static final int VIVO_NOTCH = 0x00000020;//是否有刘海
//    public static final int VIVO_FILLET = 0x00000008;//是否有圆角
//
//    /**
//     * VIVO刘海屏判断
//     * @return
//     */
//    public static boolean hasNotchAtVivo() {
//        boolean ret = false;
//        try {
//            ClassLoader classLoader = StaticContext.CONTEXT.getClassLoader();
//            Class FtFeature = classLoader.loadClass("android.util.FtFeature");
//            Method method = FtFeature.getMethod("isFeatureSupport", int.class);
//            ret = (boolean) method.invoke(FtFeature, VIVO_NOTCH);
//        } catch (ClassNotFoundException e) {
//            AppLog.e( "hasNotchAtVivo ClassNotFoundException");
//        } catch (NoSuchMethodException e) {
//            AppLog.e(  "hasNotchAtVivo NoSuchMethodException");
//        } catch (Exception e) {
//            AppLog.e(  "hasNotchAtVivo Exception");
//        } finally {
//            return ret;
//        }
//    }
//    /**
//     * OPPO刘海屏判断
//     * @return
//     */
//    public static boolean hasNotchAtOPPO() {
//        return  StaticContext.CONTEXT.getPackageManager().hasSystemFeature("com.oppo.feature.screen.heteromorphism");
//    }