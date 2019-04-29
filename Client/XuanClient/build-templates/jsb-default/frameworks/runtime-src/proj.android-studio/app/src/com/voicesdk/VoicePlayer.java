package com.voicesdk;



import java.io.IOException;

import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnErrorListener;



public class VoicePlayer {
	private static MediaPlayer mPlayer = null;
	private static boolean isPause;
	private static String mPlayFile;
	public static  void play(final String filePathString) {
		_play(filePathString);
//		if(PermissionGranted.selfPermissionGranted(android.Manifest.permission.RECORD_AUDIO)){
//			_play(filePathString);
//		} else {
//			mPlayFile = filePathString;
//			ActivityCompat.requestPermissions(AppActivity.App ,new String[]{android.Manifest.permission.RECORD_AUDIO},PermissionGranted.RECORD_AUDIO_PLAYER_RET_CODE);
//		}
	}

	public static void preparePermissions(){
//		_play(mPlayFile);
	}

	private static void _play(String filePathString){
		if (mPlayer == null) {
			mPlayer = new MediaPlayer();
			//保险起见，设置报错监听
			mPlayer.setOnErrorListener(new OnErrorListener() {
				@Override
				public boolean onError(MediaPlayer mp, int what, int extra) {
					System.out.println("_play onError");
					mPlayer.reset();
					return false;
				}
			});
		}else {
			mPlayer.reset();//就回复
		}

		try {
			mPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
			mPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
				@Override
				public void onCompletion(MediaPlayer mp) {
					//Cocos2dxJavascriptJavaBridge.evalString("cc.vv.voiceMgr.onPlayEnd()");
				}
			});
			mPlayer.setDataSource(filePathString);
			mPlayer.prepare();
			mPlayer.start();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	//停止函数
	public static void pause(){
		if (mPlayer != null && mPlayer.isPlaying()) {
			mPlayer.pause();
			isPause = true;
		}
	}
	
	public static void stop(){
		if (mPlayer != null && mPlayer.isPlaying()) {
			mPlayer.stop();
			isPause = false;
		}
	}
	
	//继续
	public static void resume() {
		if (mPlayer != null && isPause) {
			mPlayer.start();
			isPause = false;
		}
	}

	public  static void release() {
		if (mPlayer != null) {
			mPlayer.release();
			mPlayer = null;
		}
	}
}
