package com.alpaysdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Message;
import android.text.ClipboardManager;
import android.util.Log;
import android.widget.Toast;

import com.alipay.sdk.app.EnvUtils;
import com.alipay.sdk.app.PayTask;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import java.io.File;
import java.util.Map;

/**
 * Created by chenchun on 2017/11/12.
 */

public class alpaysdk
{
    public static void pay(final String orderInfo){
        Runnable payRunnable = new Runnable() {
            @Override
            public void run() {
                PayTask alipay = new PayTask(AppActivity.App);
                Map<String, String> result = alipay.payV2(orderInfo, true);
                Log.i("msp", result.toString());
            }
        };
        Thread payThread = new Thread(payRunnable);
        payThread.start();
    }
}