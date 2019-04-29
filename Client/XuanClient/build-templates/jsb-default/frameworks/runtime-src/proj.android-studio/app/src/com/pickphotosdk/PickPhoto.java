package com.pickphotosdk;

import android.content.ContentResolver;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.channels.FileChannel;

/**
 * -1是不支持
 * 1是相册取消
 * 2是获取相册数据失败
 * 3是裁剪取消
 * 4是保存裁剪失败
 * 5是裁剪失败
 * 6是裁剪取消
 * */

public class PickPhoto {
	private static String mSavePath;
	private static String mFile;
	private static Uri mImageUri = null;
	private static int REQ_CODE_CROP = 100;
	private static int REQ_CODE_ALBUM = 101;
	private static int REQ_CODE_CAMERA = 102;

	public static void setStorageDir(String dir){
		mSavePath = dir;
		System.out.println(mSavePath);
	}

	public static void openAlbums(){
		AppActivity.App.runOnUiThread(new Runnable() {
			@Override
			public void run() {
				Intent intent = new Intent(Intent.ACTION_PICK, null);
				intent.setDataAndType(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image/*");
				AppActivity.App.startActivityForResult(intent, REQ_CODE_ALBUM);
			}
		});
	}

	public static void openCamera(){
		AppActivity.App.runOnUiThread(new Runnable() {
			@Override
			public void run() {
                String name = String.format("%s.jpg",System.currentTimeMillis());
                String path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM).getAbsolutePath();
                System.out.println(name);
                System.out.println(path);
                mFile = String.format("%s/%s",path,name);
                System.out.println(mFile);
                File tempFile = new File(path, name);
                if (tempFile != null) {
                    mImageUri = Uri.fromFile(tempFile);
                    Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);//action is capture
                    intent.putExtra(MediaStore.EXTRA_OUTPUT, mImageUri);
					AppActivity.App.startActivityForResult(intent, REQ_CODE_CAMERA);
                }else {
					final String evalString = String.format("window.sdkpickphoto.CallBack_PickPhoto(-1 ,'')");
					AppActivity.App.runOnGLThread(new Runnable() {
						@Override
						public void run() {
							Cocos2dxJavascriptJavaBridge.evalString(evalString);
						}
					});
                    Toast.makeText(AppActivity.App, "打开照相机失败", Toast.LENGTH_SHORT).show();
                }
			}
		});
	}

	public static String bitmapToBase64(Bitmap bitmap) {
		String result = null;
		ByteArrayOutputStream baos = null;
		try {
			if (bitmap != null) {
				baos = new ByteArrayOutputStream();
				bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
				baos.flush();
				baos.close();
				byte[] bitmapBytes = baos.toByteArray();
				result = Base64.encodeToString(bitmapBytes, Base64.DEFAULT);
			}
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (baos != null) {
					baos.flush();
					baos.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return result;
	}

	public static void onActivityResult(int requestCode, int resultCode, Intent data) throws IOException {
		int errCode = -1;

		if(requestCode == REQ_CODE_ALBUM){
			if (data != null) {
				// 得到图片的全路径
				if (resultCode == AppActivity.App.RESULT_OK){
					Uri uri = data.getData();
					crop(uri);
				}else{
					errCode = 1;
				}
			} else{
				errCode = 2;
			}
		} else if(requestCode == REQ_CODE_CAMERA){
			if (resultCode == AppActivity.App.RESULT_OK){
				crop(mImageUri);
			} else{
				errCode = 3;
			}
		}else if(requestCode == REQ_CODE_CROP){
			System.out.println("ccccc=================================================================");
			String base64File = null;
			String file = null;
			if (resultCode == AppActivity.App.RESULT_OK){
				if (data != null) {
					Bitmap bitmap = data.getParcelableExtra("data");
					base64File = bitmapToBase64(bitmap);
					if(null == base64File){
						errCode = 4;
					} else {
						errCode = 0;
					}

					try{
						file = saveBitmap(bitmap);
						errCode = 0;
					}catch (Exception e){
						errCode = 4;
					}
				} else{
					errCode = 5;
				}
			} else{
				errCode = 6;
			}

			File f = new File(file);
			String fileName = f.getName();
			FileInputStream inputFile = new FileInputStream(f);
			FileChannel fc = inputFile.getChannel();
			int size = (int)fc.size();
			System.out.println("+++++++++++++++++++++++++++文件"+fileName+"的大小是："+ size+"\n");
			System.out.println("+++++++++++++++++++++++++++"+size);
			byte[] buffer = new byte[inputFile.available()];
			inputFile.read(buffer);
			fc.close();
			inputFile.close();
			//String str =  Base64.encodeToString(buffer, Base64.DEFAULT);


//			InputStream inputStream = null;
//			byte[] arr = null;
//			try {
//				inputStream = new FileInputStream(file);
//				arr = new byte[inputStream.available()];
//				inputStream.read(arr);
//				inputStream.close();
//			} catch (IOException e) {
//				e.printStackTrace();
//			}
			// 加密
			String str =  Base64.encodeToString(buffer, Base64.DEFAULT);

			String txtPath = file.replace(".jpg",".t");
			System.out.println(txtPath);
			try {
				File myfile = new File(txtPath);
				FileOutputStream fos = new FileOutputStream(myfile);
				OutputStreamWriter wt = new OutputStreamWriter(fos, "utf-8");
				wt.write(str);
				wt.flush();
				wt.close();
				fos.close();
			}catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			final String evalString = String.format("window.sdkpickphoto.CallBack_PickPhoto(%d ,'%s','%s')",errCode,file,txtPath);
			AppActivity.App.runOnGLThread(new Runnable() {
				@Override
				public void run() {
					Cocos2dxJavascriptJavaBridge.evalString(evalString);
				}
			});

		}
	}

	private static void crop(Uri uri) {
		// 裁剪图片意图
		Intent intent = new Intent("com.android.camera.action.CROP");
		intent.setDataAndType(uri, "image/*");
		intent.putExtra("crop", "true");
		// 裁剪框的比例，1：1
		intent.putExtra("aspectX", 1);
		intent.putExtra("aspectY", 1);
		// 裁剪后输出图片的尺寸大小
		intent.putExtra("outputX", 250);
		intent.putExtra("outputY", 250);
		intent.putExtra("outputFormat", "JPEG");// 图片格式
		intent.putExtra("noFaceDetection", true);// 取消人脸识别
		intent.putExtra("return-data", true);
		// 开启一个带有返回值的Activity，请求码为PHOTO_REQUEST_CUT
		AppActivity.App.startActivityForResult(intent, REQ_CODE_CROP);
	}

	private static String saveBitmap(Bitmap mBitmap) throws Exception{
		String file = String.format("%s%s.jpg",mSavePath ,System.currentTimeMillis());
		System.out.println("=================================");
		System.out.println(file);
		File f = new File(file);
		f.createNewFile();
		FileOutputStream fOut = new FileOutputStream(f);
		mBitmap.compress(Bitmap.CompressFormat.JPEG, 60, fOut);
		fOut.flush();
		fOut.close();
		return file;
	}

	public static void getFileBase64Block (String path ) throws Exception {
		File file = new File(path);
		String fileName = file.getName();
		FileInputStream inputFile = new FileInputStream(file);
		FileChannel fc = inputFile.getChannel();
		System.out.println("+++++++++++++++++++++++++++文件"+fileName+"的大小是："+ fc.size()+"\n");
		byte[] buffer = new byte[(int)fc.size()];
		while ((inputFile.read(buffer)) != -1) {

		}
		inputFile.close();
		String str =  Base64.encodeToString(buffer, Base64.DEFAULT);
		final String evalString = String.format("window.sdkpickphoto.CallBack_GetBase64('%s')",str);
		AppActivity.App.runOnGLThread(new Runnable() {
			@Override
			public void run() {
				Cocos2dxJavascriptJavaBridge.evalString(evalString);
			}
		});
	}
}