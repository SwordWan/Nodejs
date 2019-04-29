package com.honest;

import android.content.Context;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Toast;

import org.cocos2dx.javascript.AppActivity;

import java.io.File;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * Created by 36937 on 2018/2/9.
 */

public class DownLoaderMgr {
    private BlockingQueue<DownLoadParameter> mQueue;
    private Thread mThread;
    private  DownLoader mDownLoader;
    private static DownLoaderMgr mInstace = null;
    public static DownLoaderMgr getInstance() {
        if (null == mInstace){
            mInstace = new DownLoaderMgr();
        }
        return mInstace;
    }

    public void init(AppActivity app)
    {
        mQueue = new ArrayBlockingQueue<DownLoadParameter>(100);
        mDownLoader = new DownLoader(mQueue);
        mThread = new Thread(mDownLoader);
        mThread.start();
        Window window = app.getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    public void stop()
    {
        try
        {
            mDownLoader.exit();
            mThread.join();
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    public void addTask(DownLoadParameter parameter)
    {
        if( !mQueue.offer(parameter) )
        {
            AppActivity.App.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                Toast.makeText(AppActivity.App.getApplicationContext(), "队列已满", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    public boolean exists(String dir ,String gameID)
    {
        return mDownLoader.exists(dir ,gameID);
    }

    public String getVersion(String dir ,String gameID)
    {
        return mDownLoader.readVersion(dir ,gameID);
    }

    public void removeGame(String dir ,String gameID)
    {
        mDownLoader.removeGame(dir ,gameID);
    }
}
