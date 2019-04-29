package com.weixinsdk;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.modelmsg.SendMessageToWX;
import com.tencent.mm.opensdk.modelmsg.WXImageObject;
import com.tencent.mm.opensdk.modelmsg.WXMediaMessage;
import com.tencent.mm.opensdk.modelmsg.WXMusicObject;
import com.tencent.mm.opensdk.modelmsg.WXTextObject;
import com.tencent.mm.opensdk.modelmsg.WXVideoObject;
import com.tencent.mm.opensdk.modelmsg.WXWebpageObject;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import java.io.File;
import java.net.URL;

public class WXAPI {
	public static IWXAPI api;
	public static Activity instance;
	public static boolean isLogin = false;
	public static int THUMB_WIDTH = 150;
	public static int THUMB_HEIGHT = 150;

	public static void Init(Activity context){
		WXAPI.instance = context;
		api = WXAPIFactory.createWXAPI(context, Util.getAppid() , true);
		api.registerApp(Util.getAppid() );
	}
	
	private static String buildTransaction(final String type) {
	    return (type == null) ? String.valueOf(System.currentTimeMillis()) : type + System.currentTimeMillis();
	}
	
	public static void Login(){
		isLogin = true;
		final SendAuth.Req req = new SendAuth.Req();
		req.scope = "snsapi_userinfo";
		req.state = "carjob_wx_login";
		api.sendReq(req);
	}

	public static void SetThumbSize(int width ,int height){
		THUMB_WIDTH = width;
		THUMB_HEIGHT = height;
	}

	/*
	* 分享链接
	* url 分享的网页地址
	* title 分享的标题
	* desc 分享的描述信息
	* thumbFile 分享的缩略图
	* sceneType 分享类型 0朋友 1朋友圈
	* */
	public static void ShareLink(String url, String title, String desc, String thumbFile, String sceneType) {
		try {
			WXWebpageObject webpage = new WXWebpageObject();
			webpage.webpageUrl = url;
			WXMediaMessage msg = new WXMediaMessage(webpage);
			msg.title = title;
			msg.description = desc;
			msg.thumbData = thumbData(thumbFile);

			SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("webpage");
			req.message = msg;
			req.scene = Integer.valueOf(sceneType).intValue();// /*isTimelineCb.isChecked() ? SendMessageToWX.Req.WXSceneTimeline : */SendMessageToWX.Req.WXSceneSession;
			api.sendReq(req);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	/*
	* 分享文字
	* url 分享的网页地址
	* title 分享的标题
	* desc 分享的描述信息
	* thumbFile 分享的缩略图
	* sceneType 分享类型 0朋友 1朋友圈
	* */
	public static void ShareText(String text, String sceneType){
		WXTextObject textObj = new WXTextObject();
		textObj.text = text;
		WXMediaMessage msg = new WXMediaMessage();
		msg.mediaObject = textObj;
		// msg.title = "Will be ignored";
		msg.description = text;

		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("text");
		req.message = msg;
		req.scene = Integer.valueOf(sceneType).intValue();

		api.sendReq(req);
	}

	public static void ShareImage(String shareImage, String sceneType ){
		Bitmap bmp = getBitMap(shareImage);
		WXImageObject imgObj = new WXImageObject(bmp);
		WXMediaMessage msg = new WXMediaMessage();
		msg.mediaObject = imgObj;
		Bitmap thumbBmp = Bitmap.createScaledBitmap(bmp, THUMB_WIDTH, THUMB_HEIGHT, true);
		msg.thumbData = Util.bmpToByteArray(thumbBmp, true);
		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("img");
		req.message = msg;
		req.scene = Integer.valueOf(sceneType).intValue();
		api.sendReq(req);
		bmp.recycle();
	}

	public static void ShareVideo(String url ,String title ,String desc , String thumbFile, String sceneType){
		WXVideoObject video = new WXVideoObject();
		video.videoLowBandUrl = url;
		WXMediaMessage msg = new WXMediaMessage(video);
		msg.title = title;
		msg.description = desc;
		msg.thumbData = thumbData(thumbFile);

		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("video");
		req.message = msg;
		req.scene = Integer.valueOf(sceneType).intValue();
		api.sendReq(req);
	}

	public static void ShareMusic(String url ,String title ,String desc , String thumbFile, String sceneType){
		WXMusicObject music = new WXMusicObject();
		music.musicUrl = url;
		WXMediaMessage msg = new WXMediaMessage();
		msg.mediaObject = music;
		msg.title = title;
		msg.description = desc;
		msg.thumbData = thumbData(thumbFile);

		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("music");
		req.message = msg;
		req.scene = Integer.valueOf(sceneType).intValue();
		api.sendReq(req);
	}

	private static Bitmap getBitMap(String file){
		Bitmap bitMap = null;
		do{
			if(null == file){
				break;
			}
			if(file.startsWith("http://")){
				try{
					bitMap = BitmapFactory.decodeStream(new URL(file).openStream());
				}catch (Exception e){
					e.printStackTrace();
				}
				break;
			}
			File f = new File(file);
			if(f.exists()){
//				BitmapFactory.Options options = new BitmapFactory.Options();
//				options.inJustDecodeBounds = true;
				bitMap = BitmapFactory.decodeFile(file);
				break;
			}
		}while (false);
		return bitMap;
	}

	private static byte[] thumbData(String thumbFile){
		Bitmap bitmap = getBitMap(thumbFile);
		if(null == bitmap) {
			return null;
		}
		Bitmap thumbBmp = Bitmap.createScaledBitmap(bitmap, THUMB_WIDTH, THUMB_HEIGHT, true);
		bitmap.recycle();
		return Util.bmpToByteArray(thumbBmp, true);
	}
}
