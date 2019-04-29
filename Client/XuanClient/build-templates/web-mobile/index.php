<!--<?php
require_once "../../tks/jssdk.php";
$jssdk = new JSSDK("wx334dd19596dd7dae", "919dce436aa96957c33622441b494dbb");
$signPackage = $jssdk->GetSignPackage();
?>-->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">

  <title>创胜|斗地主</title>

  <!--http://www.html5rocks.com/en/mobile/mobifying/-->
  <meta name="viewport"
        content="width=device-width,user-scalable=no,initial-scale=1, minimum-scale=1,maximum-scale=1"/>

  <!--https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html-->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="format-detection" content="telephone=no">
  
  <!-- force webkit on 360 -->
  <meta name="renderer" content="webkit"/>
  <meta name="force-rendering" content="webkit"/>
  <!-- force edge on IE -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
  <meta name="msapplication-tap-highlight" content="no">

  <!-- force full screen on some browser -->
  <meta name="full-screen" content="yes"/>
  <meta name="x5-fullscreen" content="true"/>
  <meta name="360-fullscreen" content="true"/>
  
  <!-- force screen orientation on some browser -->
  <meta name="screen-orientation" content="portrait"/>
  <meta name="x5-orientation" content="true">

  <!--fix fireball/issues/3568 -->
  <!--<meta name="browsermode" content="application">-->
  <meta name="x5-page-mode" content="app">

  <!--<link rel="apple-touch-icon" href=".png" />-->
  <!--<link rel="apple-touch-icon-precomposed" href=".png" />-->

  <link rel="stylesheet" type="text/css" href="style-mobile.css"/>
</head>
<body>
  <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="0"></canvas>
  <div id="splash">
    <div class="progress-bar stripes">
      <span style="width: 0%"></span>
    </div>
  </div>

  <?php
	if(strpos($_SERVER['HTTP_USER_AGENT'], 'iPhone')||strpos($_SERVER['HTTP_USER_AGENT'], 'iPad')){
  ?>
<script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js" charset="utf-8"></script>
<script>
	setTimeout("runSettings()",500);
	function runSettings()
	{	
		var oHead = document.getElementsByTagName('head').item(0); 
		var oScript= document.createElement("script"); 
    		oScript.type = "text/javascript"; 
    		oScript.src="src/settings.js?ver=<?php echo time();?>";
    		oHead.appendChild( oScript);
		setTimeout("runMain()",500);
	}

	function runMain()
	{
		var oHead = document.getElementsByTagName('head').item(0); 
		var oScript= document.createElement("script"); 
    		oScript.type = "text/javascript"; 
    		oScript.src="main.js?ver=<?php echo time();?>"; 
    		oHead.appendChild( oScript);

	}
   <?php
	}else{
   ?>
	<script src="src/settings.js?ver=<?php echo time();?>" charset="utf-8"></script>
	<script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js" charset="utf-8"></script>
	<script src="main.js?ver=<?php echo time();?>" charset="utf-8"></script>
	<script>
   <?php } ?>
	window.g_PhpUserName = '<?php echo $_POST['PhpUserName'] ?>';
	window.g_PhpPassword = '<?php echo $_POST['PhpPassword'] ?>';
	window.g_IsHttps = <?php if($_SERVER['HTTPS']=='on'){echo 'true';}else{echo 'false';} ?>;
	window.g_GameFullpath = '<?php if($_SERVER['HTTPS']=='on'){echo 'https://';}else{echo 'http://';} ?>'+ '<?php echo $_SERVER['SERVER_NAME'].substr($_SERVER['REQUEST_URI'],0,strpos($_SERVER['REQUEST_URI'],'?')-1) ?>';
        wx.config({
          debug: false,
          appId: '<?php echo $signPackage["appId"];?>',
          timestamp: <?php echo $signPackage["timestamp"];?>,
          nonceStr: '<?php echo $signPackage["nonceStr"];?>',
          signature: '<?php echo $signPackage["signature"];?>',
          jsApiList: [
            'onMenuShareAppMessage',
            'showMenuItems',
            'uploadVoice',
            'onVoicePlayEnd',
            'stopVoice',
            'playVoice',
            'onVoiceRecordEnd',
            'stopRecord',
            'downloadVoice',
            'startRecord',
          ]
        });
        wx.onMenuShareAppMessage({
                                  title: '创胜斗地主', // 分享标题
                                  desc: '创胜斗地主',  // 分享描述
                                  link: '#', // 分享链接
                                  imgUrl: '', // 分享图标
                                  type: '', // 分享类型,music、video或link，不填默认为link
                                  dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                                  success: function () { 
                                  },
                                  cancel: function () { 
                                  }
                              });
        wx.ready(function () {
		
        });
</script>
<form style='display:none;' id='form1' name='form1' method='post' action=''>
     <input name='PhpUserName' type='text' value='' />
     <input name='PhpPassword' type='text' value=''/>
</form>
</body>
</html>
