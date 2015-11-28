var SOAP_DEBUG = false;
var WEBURL = 'www.rtd.dk';
var EVENT_NOTIFICATION_1 = 24*60*60*1000;
var EVENT_NOTIFICATION_2 = 2*60*60*1000;

var AJAX_END_POINT = "https://rtd.dk/soap/jsonwrap.php";
var AJAX_GEOCODER_END_POINT = "https://rtd.dk/scripts/rtd/geocodeproxy.php";
var IMAGE_BASE_URL = "https://rtd.dk/uploads/user_image/";
var ATTACHMENT_BASE_URL = "https://rtd.dk/uploads/mail_attachment/";
var LOGOS_BASE_URL = "https://rtd.dk/uploads/club_logos/";

var RTD_DEBUG = false;
var ENABLE_NOTIFICATIONS=true;
var MAX_MAIL_CHECK_INTERVAL = (10*60*1000);
var MIN_MAIL_CHECK_INTERVAL = 1000;
var DATABASE_NAME = "RTD_DATABASE";
var DATABASE_VERSION = "1.0";
var DATABASE_DISPLAY = "RTDapp Offline Database";
var DATABASE_SIZE = 5000000;
var DATABASE_REFRESH_RATE = 604800000;
var MEETING_IMAGE_BASE_URL = 'https://rtd.dk/uploads/meeting_image';
var DATABASE_LAST_UPDATE_FIELD = "last_update_offline_data";
var mail_check_interval = MIN_MAIL_CHECK_INTERVAL;
var session_current_user_data = $.parseJSON(localStorage.getItem("current_user"));
var current_last_mail_index = localStorage.getItem("current_last_mail_index");

var NOTIFICATIONS = { DISABLED:0, VIBRATION:1, SOUND_AND_VIBRATION:2 };




$(document).ready(function () 
 {	
	console.log("on document ready");
	rtd_boot();
	
	$("#settings-page").on("pageshow", function() { show_prepare_settings_page(); });
	$("#map-page").on("pageshow", do_init_map);
});

function rtd_boot()
{
	do_notifications();
	swipe_manager_init();
	show_information_timer();
	console.log("rtd_boot");
	if (is_logged_in())
	{
		console.log("you're logged in");
		do_login_event();
	}
	else
	{
		console.log("you're not logged in");
		show_login();
	}
}

function rtd_device_ready()
{
	setTimeout(gps_watch, 3000);
/*
	gps_watch();
	try
	{
		cordova.plugins.notification.local.on("click", function (notification, state) 
		{
			show_meeting(notification.data.mid);
		});
	} catch(err)
	{
		console.log(err);
	}
*/
}

document.addEventListener("deviceready", rtd_device_ready, false);