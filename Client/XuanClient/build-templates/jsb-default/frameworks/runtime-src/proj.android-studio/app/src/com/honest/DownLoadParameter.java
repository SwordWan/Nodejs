package com.honest;

/**
 * Created by 36937 on 2018/2/9.
 */

public class DownLoadParameter {

    private String mUri = null;
    private String mPath = null;
    private String mGameID = null;
    private String mVersion = null;
    public DownLoadParameter(String uri ,String path ,String gameID ,String version)
    {
        this.mGameID = gameID;
        this.mPath = path;
        this.mUri = uri;
        this.mVersion = version;
    }

    public String getUri()
    {
        return this.mUri;
    }

    public String getPath()
    {
        return this.mPath;
    }

    public String getGameID()
    {
        return this.mGameID;
    }

    public String getVersion(){return  this.mVersion;}

}
