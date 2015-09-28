var AJAX_END_POINT = "https://rtd.dk/soap/jsonwrap.php";
var AJAX_GEOCODER_END_POINT = "https://rtd.dk/scripts/rtd/geocodeproxy.php";
var IMAGE_BASE_URL = "https://rtd.dk/uploads/user_image/";
var ATTACHMENT_BASE_URL = "https://rtd.dk/uploads/mail_attachment/";
var LOGOS_BASE_URL = "https://rtd.dk/uploads/club_logos/";
var RTD_DEBUG = false;
var ENABLE_NOTIFICATIONS=true;
var MAX_MAIL_CHECK_INTERVAL = (10*60*1000);
var MIN_MAIL_CHECK_INTERVAL = 1000;
var mail_check_interval = MIN_MAIL_CHECK_INTERVAL;
var session_current_user_data = $.parseJSON(localStorage.getItem("current_user"));
var current_last_mail_index = localStorage.getItem("current_last_mail_index");

$(document).ready(function () 
 {	
	console.log("on document ready");
	rtd_boot();
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
		show_frontpage();
		gps_boot();
	}
	else
	{
		console.log("you're not logged in");
		show_login();
	}
}

document.addEventListener("deviceready", gps_watch, false);