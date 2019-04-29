package com.batterysdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

/**
 * Created by 36937 on 2018/9/26.
 */

public class Battery {
    private static boolean mOpened = false;
    private static BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
        //获取当前电量，如未获取具体数值，则默认为0
        int batteryLevel = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, 0);
        //获取最大电量，如未获取到具体数值，则默认为100
        int batteryScale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        //textViewLevel.setText((batteryLevel * 100 / batteryScale) + " % ");
        System.out.println("batteryLevel");
        System.out.println(batteryLevel);
        System.out.println("batteryScale");
        System.out.println(batteryScale);
        final String evalString = String.format("window.sdkbattery.CallBack_Battery('%d,%d')",batteryLevel,batteryScale) ;
        AppActivity.App.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString( evalString );
            }
        });
        }
    };

    public static float getBattery(int batteryLevel ,int batteryScale){
        if(batteryLevel == -1 || batteryScale == -1){
            return 0f;
        }
        return  batteryLevel * 100 / batteryScale;
    }

    public static void start(){
        if(!mOpened){
            mOpened = true;
            AppActivity.App.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    IntentFilter intentFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
                    AppActivity.App.registerReceiver(broadcastReceiver, intentFilter);
                }
            });
        }
    }

    public static void stop(){
        if(mOpened){
            mOpened = false;
            AppActivity.App.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    AppActivity.App.unregisterReceiver(broadcastReceiver);
                }
            });
        }
    }

    public static void onDestroy(){
        if(mOpened){
            mOpened = false;
            AppActivity.App.unregisterReceiver(broadcastReceiver);
        }
    }
}
