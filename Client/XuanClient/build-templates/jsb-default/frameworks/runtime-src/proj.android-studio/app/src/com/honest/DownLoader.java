package com.honest;


import android.util.Log;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;


/**
 * Created by 36937 on 2018/1/31.
 */

public class DownLoader implements Runnable {
    private BlockingQueue<DownLoadParameter> mQueue;
    private boolean mRunning = true;
    public DownLoader(BlockingQueue<DownLoadParameter> queue)
    {
        this.mQueue = queue;
    }
    public void run()
    {
        while (mRunning)
        {
            DownLoadParameter parameter = null;
            try
            {
                parameter = mQueue.take();
            }
            catch (Exception e)
            {

            }
            if(null == parameter)
            {
                break;
            }
            String dstDir = parameter.getPath() + parameter.getGameID() + "/";
            String gameID = parameter.getGameID();
            String completeFile = String.format("%s%s.complete",dstDir,gameID);
            String manifestFile = String.format("%sproject.manifest",dstDir);
            String version = parameter.getVersion();
            String remoteManifest = parameter.getUri();
            String localManifast  = readFile( manifestFile );
            System.out.println(completeFile);
            System.out.println(manifestFile);
            List<String> listUpdate = null;
            int result = 0;

            try
            {
                //直接读取文件
                result = 1;
                String manifest = getBody(remoteManifest);
                result = 2;
                JSONObject remote = new JSONObject(manifest);
                verifyManifast(remote);
                String packageUrl = remote.getString("packageUrl");
                packageUrl = packageUrl.substring(0, packageUrl.lastIndexOf('/'));
                System.out.println(packageUrl);
                //创建所需的文件夹
                JSONArray dirs = remote.getJSONArray("dirs");
                for(int i = 0; i < dirs.length(); i++)
                {
                    String dir = String.format ("%s%s" ,dstDir ,(String)dirs.get(i));
                    dir = dir.replaceAll("\\*", "/");
                    //System.out.println(dir);
                    //判断路径是否存在,不存在则创建文件路径
                    File file = new File(dir);
                    if(!file.exists())
                    {
                        if(!file.mkdirs())
                        {
                            result = 3;
                            throw new Exception("mkdirs error");
                        }
                    }
                }
                //下载文件
                List<String> list = new ArrayList();
                JSONObject assetsRemote = remote.getJSONObject("assets");
                Iterator it = assetsRemote.keys();
                while (it.hasNext())
                {
                    String key = (String) it.next();
                    list.add(key);
                }
                result = 4;
                try
                {
                    System.out.println("==========================");
                    System.out.println(localManifast);
                    JSONObject local = new JSONObject(localManifast);

                    verifyManifast(local);
                    listUpdate = new ArrayList();
                    JSONObject assetsLocal = local.getJSONObject("assets");
                    for(int i = 0 ; i < list.size();i++)
                    {
                        String key = list.get(i);
                        JSONObject lObj = assetsLocal.getJSONObject(key);
                        JSONObject rObj = assetsRemote.getJSONObject(key);
                        if(null != lObj)
                        {
                            String lMd5 = lObj.getString("md5");
                            String rMd5 = rObj.getString("md5");
                            if(lMd5.equals(rMd5))
                            {
                                continue;
                            }
                        }
                        listUpdate.add(key);
                    }
                }
                catch (Exception e)
                {
                    listUpdate = list;
                }
                result = 5;
                int total = listUpdate.size();
                for(int i = 0 ; i < total ;i++)
                {
                    String key = listUpdate.get(i);
                    JSONObject obj = assetsRemote.getJSONObject(key);
                    String uri = String.format("%s/%s",packageUrl ,key);
                    String dstFile = String.format("%s%s",dstDir,key);
                    writeRes(uri ,dstFile );
                    String rMd5 = obj.getString("md5");
                    String lMd5 = getMD5(dstFile);
                    //获取写入文件得md5值比较一次
                    if(!rMd5.equals(lMd5)){
                        System.out.println("=============================");
                        System.out.println(rMd5);
                        System.out.println(lMd5);
                        throw new Exception("md5 not equals");
                    }
                    final String evalString = String.format("window.launchGame.downLoadProcess('%s',%d,%d)",gameID ,i + 1 ,total);
                    System.out.println(evalString);
                    AppActivity.App.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            Cocos2dxJavascriptJavaBridge.evalString(evalString);
                        }
                    });
                }
                result = 6;
                //写入配置文件
                FileWriter fw = new FileWriter(manifestFile);
                fw.write(manifest);
                fw.flush();
                fw.close();
                //读取验证一次
                manifest  = readFile(manifestFile);
                System.out.println(manifest);
                JSONObject local = new JSONObject(manifest);
                verifyManifast(local);

                //下载完成写标致
                if(0 != writeVersion(completeFile ,version))
                {
                    result = 7;
                    throw new Exception("write version error");
                }
                //检查是否OK
                String _version = readFile(completeFile);
                if( null == _version)
                {
                    result = 8;
                    throw new Exception("write version error");
                }

                if(!version.equals(_version))
                {
                    result = 9;
                    throw new Exception("write version error");
                }

                final String evalString = String.format("window.launchGame.downLoadSuccess('%s')" ,gameID);
                System.out.println("下载子游戏成功");
                AppActivity.App.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString(evalString);
                    }
                });
            }
            catch (Exception e)
            {
                e.printStackTrace();
                System.out.println("下载子游戏失败");
                delFile(new File(dstDir));
                final String evalString = String.format("window.launchGame.downLoadError('%s','Exception Code[%d]')" ,gameID ,result);
                System.out.println(evalString);
                AppActivity.App.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString(evalString);
                    }
                });
            }
        }
    }

    public void verifyManifast(JSONObject jsonObject) throws Exception{
        if(null == jsonObject){
            throw new Exception("json error");
        }
        String packageUrl = jsonObject.getString("packageUrl");
        if(null == packageUrl || packageUrl.trim().equals("")){
            throw new Exception("packageUrl error");
        }
        JSONArray dirs = jsonObject.getJSONArray("dirs");
        if(null == dirs || dirs.length() == 0){
            throw new Exception("dirs error");
        }
        JSONObject assets = jsonObject.getJSONObject("assets");
        if(null == assets){
            throw new Exception("assets error");
        }
        Iterator it = assets.keys();
        while (it.hasNext()) {
            String key = (String) it.next();
            if(!assets.has(key)){
                throw new Exception("key error");
            }
            JSONObject obj = assets.getJSONObject(key);
            if(!obj.has("size")){
                throw new Exception("size error");
            }
            if(!obj.has("md5")){
                throw new Exception("md5 error");
            }
        }
    }

    public void writeRes(String uri ,String dstFile) throws Exception {
        System.out.println("writeRes");
        System.out.println(dstFile);
        int byteRead;
        URL url = new URL(uri);
        URLConnection conn = url.openConnection();
        InputStream inStream = conn.getInputStream();
        FileOutputStream fs = new FileOutputStream(dstFile);
        //根据响应获取文件大小
        int fileSize = conn.getContentLength();
        byte[] buffer = new byte[1204 * 10];
        final String _total = String.valueOf(fileSize);
        while ((byteRead = inStream.read(buffer)) != -1)
        {
            if(!mRunning)
            {
                break;
            }
            fs.write(buffer, 0, byteRead);
        }
        fs.flush();
        fs.close();
    }

    public String getMD5(String file) throws Exception
    {
        InputStream in = new FileInputStream(new File(file));
        StringBuffer md5 = new StringBuffer();
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] dataBytes = new byte[1024];
        int nread = 0;
        while ((nread = in.read(dataBytes)) != -1) {
            md.update(dataBytes, 0, nread);
        }
        byte[] mdbytes = md.digest();
        // convert the byte to hex format
        for (int i = 0; i < mdbytes.length; i++) {
            md5.append(Integer.toString((mdbytes[i] & 0xff) + 0x100, 16).substring(1));
        }
        return md5.toString().toLowerCase();
    }

    public String getBody(String url) throws Exception
    {
        StringBuilder result = new StringBuilder();
        HttpURLConnection connection = null;
        URL _url = new URL(url);
        connection = (HttpURLConnection) _url.openConnection();
        if(connection.getResponseCode() == 200)
        {
            InputStream is = connection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;
            while((line = reader.readLine()) != null)
            {
                result.append(line);
            }
        }
        connection.disconnect();
        return result.toString();
    }

    public void downLoad(DownLoadParameter parameter)
    {
        final String zipFile = parameter.getPath() + System.currentTimeMillis() + ".zip";
        final String dstDir = parameter.getPath() + parameter.getGameID() + "/";
        final String gameID = parameter.getGameID();
        final String version = parameter.getVersion();
        final String completeFile = String.format("%s%s.complete",dstDir,gameID);
        System.out.println("==================================Start ");

        File gameDir = new File(dstDir);
        if(gameDir.isDirectory())
        {
            System.out.println("dstDir exists");
        }
        int result = 0;
        do {
            result = downLoadZip(parameter.getUri() ,zipFile ,gameID);
            if(0 != result)
            {
                break;
            }

            result = unZipFiles(zipFile ,dstDir ,gameID);
            if(0 != result)
            {
                break;
            }

            result = writeVersion(completeFile ,version);
            if(0 != result)
            {
                break;
            }

            String _version = readFile(completeFile);
            if( null == _version)
            {
                result = 5;
                break;
            }

            if(!version.equals(_version))
            {
                result = 6;
                break;
            }

        }while (false);

        delZipFile(zipFile);

        final String evalString;
        if(result > 0)
        {
            evalString = String.format("window.launchGame.downLoadError('%s','Exception Code[%d]')" ,gameID ,result);
            System.out.println("下载子游戏失败");
            delFile(gameDir);
        }
        else
        {
            evalString = String.format("window.launchGame.downLoadSuccess('%s')" ,gameID);
            System.out.println("下载子游戏成功");
        }

        AppActivity.App.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(evalString);
            }
        });
    }

    public String getDstDir(String dir ,String gameID)
    {
        return dir + gameID + "/";
    }

    public boolean exists(String dir ,String gameID)
    {
        String dstDir = this.getDstDir(dir ,gameID);
        String completeFile = String.format("%s%s.complete",dstDir,gameID);
        File file = new File(completeFile);
        System.out.println("exists");
        System.out.println(completeFile);
        return  file.exists();
    }

    public void close(Closeable closeable)
    {
        try
        {
            if(null != closeable)
            {
                closeable.close();
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    public int writeVersion(String file ,String version)
    {
        System.out.println("writeVersion");
        System.out.println(file);
        FileOutputStream fos = null;
        OutputStreamWriter osw = null;
        BufferedWriter bw = null;
        int result = 0;
        try
        {
            fos = new FileOutputStream(new File(file));
            osw = new OutputStreamWriter(fos, "UTF-8");
            bw = new BufferedWriter(osw);
            bw.write(version.replace("\r\n","") + "\r\n");
        }
        catch (Exception e)
        {
            result = 4;
        }
        finally
        {
            close(bw);
            close(osw);
            close(fos);
        }
        return result;
    }

    public String readFile(String file)
    {
        System.out.println("readFile");
        System.out.println(file);
        FileInputStream fis = null;
        InputStreamReader isr = null;
        BufferedReader br = null;
        String result = null;
        File f = new File(file);
        if(f.exists() && f.isFile())
        {
            try
            {
                fis = new FileInputStream(file);
                isr = new InputStreamReader(fis, "UTF-8");
                br = new BufferedReader(isr);
                String line = null;
                while ((line=br.readLine())!=null)
                {
                    break;
                }
                if(null != line)
                {
                    System.out.println(line);
                    result = line.replace("\r\n","");
                }
            }
            catch (Exception e)
            {
                e.printStackTrace();
            }
            finally
            {
                close(br);
                close(isr);
                close(fis);
            }
        }

        return result;
    }

    public String readVersion(String dir ,String gameID)
    {
        String dstDir = this.getDstDir(dir ,gameID);
        String completeFile = String.format("%s%s.complete",dstDir,gameID);
        String result = readFile(completeFile);
        return result ;
    }

    public int downLoadZip(String uri ,String zipFile , final String gameID)
    {
        int byteRead;
        int byteSum = 0;
        int result = 0;
        long startTime = System.currentTimeMillis();
        try
        {
            URL url = new URL(uri);
            URLConnection conn = url.openConnection();
            InputStream inStream = conn.getInputStream();
            FileOutputStream fs = new FileOutputStream(zipFile);
            //根据响应获取文件大小
            int fileSize = conn.getContentLength();
            byte[] buffer = new byte[1204 * 10];
            final String _total = String.valueOf(fileSize);
            while ((byteRead = inStream.read(buffer)) != -1)
            {
                if(!mRunning)
                {
                    break;
                }
                byteSum += byteRead;

                fs.write(buffer, 0, byteRead);

                final String _byteSum = String.valueOf(byteSum);

                long compareTime = System.currentTimeMillis();
                if( compareTime - startTime > 10 )
                {
                    final String evalString = String.format("window.launchGame.downLoadProcess('%s','%d','%d')",gameID ,_byteSum ,_total);
                    AppActivity.App.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            Cocos2dxJavascriptJavaBridge.evalString(evalString);
                        }
                    });
                    startTime = System.currentTimeMillis();
                }
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
            result = 1;
        }
        return result;
    }

    public void removeGame(String dir ,String gameID)
    {
        String gameDir = this.getDstDir(dir ,gameID);
        File file = new File(gameDir);
        this.delFile(file);
        if( file.isDirectory() )
        {
            System.out.println("删除游戏失败");
            String evalString = String.format("window.launchGame.removeCallback('%s',%d)" ,gameID ,0);
            Cocos2dxJavascriptJavaBridge.evalString(evalString);
        }
        else
        {
            System.out.println("删除游戏成功");
            String evalString = String.format("window.launchGame.removeCallback('%s',%d)" ,gameID ,1);
            Cocos2dxJavascriptJavaBridge.evalString(evalString);
        }
    }

    public void exit()
    {
        mRunning = false;
    }

    public void delFile(File file) {
        if (file.exists()) { // 判断文件是否存在
            if (file.isFile()) { // 判断是否是文件
                file.delete(); // delete()方法
            } else if (file.isDirectory()) { // 否则如果它是一个目录
                File files[] = file.listFiles(); // 声明目录下所有的文件 files[];
                for (int i = 0; i < files.length; i++) { // 遍历目录下所有的文件
                    delFile(files[i]); // 把每个文件 用这个方法进行迭代
                }
            }
            file.delete();
        }
    }

    public void delZipFile(String zipFile)
    {
        File file = new File( zipFile );
        if (file.exists()){
            if (file.isFile()){
                file.delete();
            }
        }
    }

    public int writeFile(ZipFile zip ,ZipEntry entry ,String outPath)
    {
        int result = 0;
        InputStream in = null;
        OutputStream out = null;
        System.out.println(outPath);
        try
        {
            in = zip.getInputStream(entry);
            out = new FileOutputStream(outPath);
            int len;
            byte[] buf1 = new byte[1024];

            while((len=in.read(buf1))>0)
            {
                out.write(buf1,0,len);
            }
        }
        catch (Exception e)
        {
            result = 1;
        }
        finally
        {
            close(in);
            close(out);
        }
        return result;
    }

    public ZipFile openZip(String zipFile)
    {
        ZipFile zip = null;
        try
        {
            zip = new ZipFile(new File( zipFile ));
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return zip;
    }

    public void closeZip(ZipFile zip)
    {
        try
        {
            if(null != zip)
            {
                zip.close();
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    public int unZipFiles(String zipFile,String dstDir ,final String gameID) {
        File pathFile = new File(dstDir);
        int result = 0;
        ZipFile zip = null;

        if(!pathFile.exists())
        {
            pathFile.mkdirs();
        }
        System.out.println("******************解压开始********************");
        do {
            zip = openZip(zipFile);
            if(null == zip)
            {
                result = 2;
                break;
            }

            long startTime = System.currentTimeMillis();
            int total = zip.size();
            int current = 0;
            System.out.println("zipFile total = " + total );
            for(Enumeration entries = zip.entries(); entries.hasMoreElements();)
            {
                if(!mRunning)
                {
                    break;
                }
                current++;
                ZipEntry entry = (ZipEntry)entries.nextElement();
                String zipEntryName = entry.getName();
                String outPath = (dstDir + zipEntryName).replaceAll("\\*", "/");
                //判断路径是否存在,不存在则创建文件路径
                File file = new File(outPath.substring(0, outPath.lastIndexOf('/')));
                if(!file.exists())
                {
                    file.mkdirs();
                }
                //判断文件全路径是否为文件夹,如果是上面已经上传,不需要解压
                boolean isDirectory = new File(outPath).isDirectory();
                if(!isDirectory)
                {
                    if( writeFile(zip ,entry ,outPath) > 0 )
                    {
                        result = 3;
                        break;
                    }
                }

                long compareTime = System.currentTimeMillis();
                if( compareTime - startTime > 10 || total == current)
                {
                    double _num = ((float)current / total) * 0.5 + 0.5;
                    int prg_num = (int) ( _num * 100 );
                    //final String evalString_o = String.format("window.launchGame.zipProcess('%s','%d','%d')",gameID ,total ,current);
                    final String evalString_n = String.format("window.launchGame.process('%s','%d')",gameID ,prg_num);
                    AppActivity.App.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            //Cocos2dxJavascriptJavaBridge.evalString(evalString_o);
                            Cocos2dxJavascriptJavaBridge.evalString(evalString_n);
                        }
                    });
                    startTime = System.currentTimeMillis();
                }
            }
        }while (false);

        closeZip(zip);

        System.out.println("******************解压完毕********************");

        return result;
    }

    public void listDirectory(File dir ,boolean includeChild)
    {
        do
        {
            if(!dir.exists())
            {
                Log.v("====" ,"目录不存在");
                break;
            }

            if(!dir.isDirectory())
            {
                Log.v("====" ,"不是目录");
                break;
            }

            //如果要遍历子目录下的内容就需要构造File对象做递归操作，File提供了直接返回File对象的API
            File[] files = dir.listFiles();
            if( null == files || files.length < 1 )
            {
                Log.v("====" ,"目录为空");
                break;
            }

            for(File file:files)
            {
                if(file.isDirectory())
                {
                    //递归
                    Log.v("====dir===" ,file.getAbsolutePath());
                    if( includeChild )
                    {
                        listDirectory(file ,includeChild);
                    }
                }
                else
                {
                    Log.v("====file===" ,file.getAbsolutePath());
                }
            }
        }while (false);
    }
}


