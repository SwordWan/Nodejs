package com.chuangsheng.thjxcx.wxapi;


import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;
import com.weixinsdk.Util;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler {
	private IWXAPI _api;
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		_api = WXAPIFactory.createWXAPI(this, Util.getAppid(), false);
		_api.handleIntent(getIntent(), this);
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);

		setIntent(intent);
		_api.handleIntent(intent, this);
	}

	@Override
	public void onReq(BaseReq req) {
		/*
		switch (req.getType()) {
		case ConstantsAPI.COMMAND_GETMESSAGE_FROM_WX:
			//goToGetMsg();		
			break;
		case ConstantsAPI.COMMAND_SHOWMESSAGE_FROM_WX:
			//goToShowMsg((ShowMessageFromWX.Req) req);
			break;
		default:
			break;
		}
		*/
		this.finish();
	}
	/*
	int ERR_OK = 0;
	int ERR_COMM = -1;
	int ERR_USER_CANCEL = -2;
	int ERR_SENT_FAILED = -3;
	int ERR_AUTH_DENIED = -4;
	int ERR_UNSUPPORT = -5;
	int ERR_BAN = -6;
	* */
	@Override
	public void onResp(BaseResp resp) {
		String  tmpEvalString = null;
		switch (resp.errCode) {
			case BaseResp.ErrCode.ERR_OK:
				if(resp.getType() == 1){
					SendAuth.Resp authResp = (SendAuth.Resp)resp;
					System.out.println("wxonResponResponResponResponResponResp1");
					tmpEvalString = String.format("window.sdkweixin.CallBack_Login(0 ,'%s')" ,authResp.code);
				} else if(resp.getType() == 2){
					System.out.println("wxonResponResponResponResponResponResp2");
					tmpEvalString  = String.format("window.sdkweixin.CallBack_Share(0)");
				}
				break;
			default:
				if(resp.getType() == 1){
					System.out.println("wxonResponResponResponResponResponResp11");
					tmpEvalString = String.format("window.sdkweixin.CallBack_Login(%d ,'')" ,resp.errCode);
				} else if(resp.getType() == 2){
					tmpEvalString  = String.format("window.sdkweixin.CallBack_Share(%d)"  ,resp.errCode);
					System.out.println("wxonResponResponResponResponResponResp22");
				}
		}
		final String evalString = tmpEvalString;
		AppActivity.App.runOnGLThread(new Runnable() {
			@Override
			public void run() {
				Cocos2dxJavascriptJavaBridge.evalString(evalString);
			}
		});
		this.finish();
	}
}
