function do_init_map()
{
	console.log(gps_current_position);
	
	var opt = {
		zoom: 10,
		center: new google.maps.LatLng(gps_current_position.coords.latitude, gps_current_position.coords.longitude),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	 
	var map = new google.maps.Map(document.getElementById("google_map"), opt);
	
	show_geodata_on_map(map);
	
}


// fix unix line breaks into html <br> tags
function do_nl2br(str)
{
  var breakTag = '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2')
}

// build meeting html from template
function do_meeting_html(m)
{
	return '<li><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.name+', '+m.start_time+'</p></a></li>';
}

// fetch speed dial favorite profiles
function do_get_favorites()
{
	var f = $.parseJSON(localStorage.getItem("favorites"));
	if (f == null) f = new Array();
	return f;
}

function do_add_photo()
{
	try
	{
		if (last_shown_meeting.current_user_attending)
		{
			navigator.camera.getPicture(function(image)
			{
				var data = { mid:last_shown_meeting.mid, imagedata:image, token: do_get_userdata().token };
				do_soap_request('soap_put_image', data, function()
				{
					show_meeting(last_shown_meeting.mid);
					show_information(terms.do_add_photo_ok);
				}, do_network_error);
			},
			function(data)
			{
				show_information(terms.do_add_photo_cancel);
			},
			
			{ 
				quality: 50, 
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY, 
				encodingType: Camera.EncodingType.JPEG, 
				targetWidth:1000, 
				targetHeight:1000, 
				destinationType: 
				Camera.DestinationType.DATA_URL });
		}
		else
		{
			show_information(terms.do_add_photo_closed);
		}
	}
	catch(e)
	{
		console.log(e);
		show_information(terms.do_add_photo_not_supported);
		alert(e);
	}
}


function do_open_social(media)
{

	var link = "";
	
	switch (media)
	{
		case 'linkedin':
			link = 'http://www.linkedin.com/groups?gid=48578';
			break;
		case 'facebook_open':
			link = 'https://www.facebook.com/roundtabledk';
			break;
		case 'facebook_closed':
			link = 'https://www.facebook.com/groups/9033340070';
			break;
		default:
			show_information(terms.do_open_social_error);
	};
	

	window.open(link, '_system', '');


}


// download contact to phones calendar
function do_add_to_contacts()
{
	try
	{
		var myContact = navigator.contacts.create({"displayName": last_shown_user.profile_firstname});
		var name = new ContactName();
		name.givenName = last_shown_user.profile_firstname;
		name.familyName = last_shown_user.profile_lastname;
		myContact.name = name;

		var phone = [];
		phone.push( { t : 'home', v : last_shown_user.private_phone } );
		phone.push( { t : 'work', v : last_shown_user.company_phone } );
		phone.push( { t : 'mobile', v : last_shown_user.private_mobile } );
		
		
		var phoneNumbers = [];
		
		$.each(phone, function(k,v) {
			if (v.v != '')
			{
				phoneNumbers.push(new ContactField(v.t, v.v, false));
			}
		});
		
		myContact.phoneNumbers = phoneNumbers;

		myContact.note = "RTDapp";

		myContact.save(onSuccessCallBack, onErrorCallBack);

		function onSuccessCallBack(contact) {
			show_information(terms.do_add_to_contacts_ok);
		};

		function onErrorCallBack(contactError) {
			show_information(terms.do_add_to_contacts_fail);
		};
	} 
	catch(err)
	{
		show_information(err);
	}
}

function do_time_to_text(a,b)
{
	var diff = Math.round((a.getTime() - b.getTime())/60000.0);


	if (diff < 0)
	{
		return " nu";
	}
	else
	if (diff>60*24*365)
	{
		diff = Math.round(diff / (60.0*24.0*365.0));
		return diff+" &aring;r siden";
	}
	else if (diff>60*24*30)
	{
		diff = Math.round(diff / (60.0*24.0*30.0));
		if (diff==1) return diff+" m&aring;ned siden";
		else return diff+" m&aring;neder siden";
	}
	else
	if (diff>60*24)
	{
		diff = Math.round(diff / (60.0*24.0));
		if (diff==1) return diff+" dag siden";
		else return diff+" dage siden";
	}
	else
	if (diff>60)
	{
		diff = Math.round(diff / 60.0);
		if (diff==1) return diff+" time siden";
		else return diff+" timer siden";
	}
	else
	{
		if (diff==1) 	return diff+" minut siden";
		else	return diff+" minutter siden";
	}
}


// transform date from sql format into javascript object
function do_sqldate_to_jsdate(sqldate)
{
	var t = sqldate.split(/[- :]/);

	for (var i=0; i<t.length; ++i)
	{
		t[i] = t[i].replace(/^[0]+/g,"");
	}
	var l = t.length;
	
	for (var i=l; i<6; ++i)
	{
		t.push(0);
	}
	
	return new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);	
}

function do_navigate_meeting()
{
	do_open_map(last_shown_meeting.location);
}


// download meeting entry to phones calendar
function do_add_to_calendar()
{
	try
	{
		var title = last_shown_meeting.title;
		var loc = last_shown_meeting.location;
		var notes = ""/*last_shown_meeting.meeting_description*/;
		var s = do_sqldate_to_jsdate(last_shown_meeting.start_time);
		var e = do_sqldate_to_jsdate(last_shown_meeting.end_time);
		
		
		window.plugins.calendar.createEvent(title,loc,notes,s,e,
		function(m)
		{
			show_information(terms.do_add_to_calendar_ok);
		},
		function(m)
		{
			show_information(terms.do_add_calendar_fail);
		});
	}
	catch(err)
	{
		show_information(err);
	}
}


// clear out the favorite - speed dial - list
function do_empty_favorites()
{
	localStorage.setItem("favorites", JSON.stringify(new Array()));
	show_frontpage();
}

// build user html from template
function do_user_list_html(uid, firstname, lastname, addtxt)
{
	return "<li><a href=# onclick='show_user("+uid+")'><h2>"+firstname+" "+lastname+"</h2><p>"+addtxt+"</p></a><a href=# onclick='show_send_message("+uid+")' data-icon=comment>"+terms.generic_message+"</a></li>"
}


// add profile to favorites - speed dial - list
function do_add_favorite(who)
{
	var favorites = do_get_favorites();
	
	
	for (var i=0; i<favorites.length; ++i)
	{
		if (favorites[i].uid == who.uid)
		{
			return false;
		}
	}
	


	
	favorites.push(who);
	localStorage.setItem("favorites", JSON.stringify(favorites));
	show_information(terms.do_add_favorite);
	return true;
}


// add current shown user to speed dial
function do_add_favorite_current_user()
{
	do_add_favorite(last_shown_user);
}

// retrieve gps coordinates using geocoder api
function do_get_coords(loc,success,err)
{
	var geourl = AJAX_GEOCODER_END_POINT+"?address="+encodeURIComponent(loc);
	//console.log(geourl);
	$.ajax({url: geourl}).done(
	function (v) 
		{
		var data = $.parseJSON(v);
//		console.log(data);
		if (data.status == "OK")
		{
			success(data.results[0].geometry.location);
		}
		else
		{
			err();
		}	
	});
}

// parse an url. used to see if the url can result in in-app display
function do_parse_url(link)
{
	var searchObject = [];
	var queries = link.replace(/^\?/, '').split('&');
	for( i = 0; i < queries.length; i++ ) {
		split = queries[i].split('=');
		searchObject.push({k:split[0], v:split[1]});
	}
	return searchObject;
}


// open weblink from html content
function do_open_weblink(link)
{
	if (link.indexOf(WEBURL)>=0)
	{
		var searchObject = do_parse_url(link);
		
		if (link.indexOf('?news=')>=0)
		{
			if (searchObject.length>0)
			{
				show_news(searchObject[0].v);
			}
			else
			{
				show_news();
			}
			return true;
		}
		else if (link.indexOf('?mid='))
		{
			if (searchObject.length>0)
			{
				show_meeting(searchObject[0].v);
				return true;
			}
			else
			{
				show_information(terms.do_open_weblink_error);
				return true;
			}
		}
	}
	window.open(link, '_system', '');
	return false;	
}

// add <a> links to text
function do_linkify(text)
{
	var exp = /(\b((https?|ftp|file):\/\/|(www))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]*)/ig; 
	return text.replace(exp,"<a href='$1'>$1</a>");
}

// fix html content and ammend with <a> tags etc
function do_fix_html(content, id)
{
	$(id).html(content);
	
	$(id).find('*').each(function(k,v){
		if (v.nodeName == 'A')
		{
			if (v.search.indexOf('?mid=')>=0)
			{
				var mid = v.search.substring(5);
				v.href = '#';
				v.onclick = function() { show_meeting(mid); };
				v.title = mid;
			}
			else if (v.search.indexOf('?uid=')>=0)
			{
				var uid = v.search.substring(5);
				v.href = '#';
				v.onclick = function() { show_user(uid); };
				v.title = uid;
			}
			else
			{
				var href = v.href;
				v.href = '#';
				v.onclick = function() { window.open(href, '_system'); };
				v.title = 'Ekstern';
			}
		}
	});	
}

// what time is it?
function do_get_current_ts()
{
	return Date.now();
}


// clear user information and logoff. will not clear local user database and favorites list (as they are global to the unit)
function do_logoff()
{
	//console.log("do_logoff");
	do_clear_userdata();
	show_login();
}

// send message to current club
function do_send_message_to_club()
{
	show_group_message(current_club_members);
}

// get meetings for whole country or a single district
function do_get_country_meetings(d, success)
{
	var data = { did:d, token: do_get_userdata().token };
	do_soap_request('soap_get_country', data, success, do_network_error);
}



function do_get_minutes(c, success)
{
	SOAP_DEBUG=true;
	var data = { cid:c, token: do_get_userdata().token };
	do_soap_request('soap_get_minutes', data, success, do_network_error);
}

function do_get_updates(success)
{
	do_soap_request('soap_new_updates', {token:do_get_userdata().token}, success, do_network_error, true);
}

// decline a meeting and send the response
function do_decline_meeting()
{
	var m = $("#meeting-page-decline-mid").val();
	var cm = $("#meeting-page-decline-comment").val();
	var c = $("#meeting-page-decline-cid").val();
	var u = do_get_userdata().uid;
	var t = do_get_userdata().token;
	var a = "0";
	
	do_soap_request('soap_save_meeting_attendance', { token: t, cid: c, mid: m, uid: u, accept: a, comment: cm}, function() { show_meeting(m); }, do_network_error);	
}

// accept a meeting and send the response
function do_accept_meeting()
{
	var m = $("#meeting-page-accept-mid").val();
	var cm = $("#meeting-page-accept-comment").val();
	var c = $("#meeting-page-accept-cid").val();
	var u = do_get_userdata().uid;
	var t = do_get_userdata().token;
	var a = "1";
	
	do_soap_request('soap_save_meeting_attendance', { token: t, cid: c, mid: m, uid: u, accept: a, comment: cm}, function() { show_meeting(m); }, do_network_error);	
}


// reply to an open message
function do_send_reply(titleid, contentid, uidid)
{
	var c = $(contentid).val();
	var u =$(uidid).val();
	var t = $(titleid).text();

	if (c == "" || t == "")
	{
		show_information(terms.do_send_reply_empty);
	}
	else
	{
		do_soap_request('soap_send_mail', { token: do_get_userdata().token, uid: u, title: t, content: c } , show_mail_sent, do_network_error)
	}
}

// display network error (and debug info)
function do_network_error(res)
{
	console.log("do_network_error");
	console.log(arguments.callee);
	console.log("Called from: "+arguments.callee.caller.toString());
	$("#login-password").val('');
	show_loading_off();
	show_information(terms.do_network_error);
	console.log(res);
 }
 
 // get information about latest online user (deprecated)
 function do_update_latests_users(cb)
 {
	do_soap_request('soap_get_geolocation_latest', { token: do_get_userdata().token }, cb, do_network_error);
 }

 function do_get_jubilees(cb)
 {
	do_soap_request('soap_get_jubilees', { token: do_get_userdata().token }, cb, do_network_error);
 }
 
 function do_get_club_stats(club, cb)
 {
	do_soap_request('soap_get_club_stats', { token: do_get_userdata().token,  cid:club }, cb, do_network_error);
 }
 
 
 // transmit gps coordinates to server
 function do_update_gps(pos)
 {
	if (is_logged_in())
	{
		//console.log(pos);
		var export_data = 
		{
			cb: 'soap_update_geolocation',
			parameters: 
						{
						lat : pos.coords.latitude,
						lng: pos.coords.longitude,
						token: do_get_userdata().token
						}
		};
		
		$.post(AJAX_END_POINT,  export_data)
		  .done(function(v) 
		  {
				show_refresh_gps();
			//console.log('do_update_gps: done '+v);
		  })
		  .fail(function(v) 
		  {
			//console.log('do_update_gps: failed '+v);
		  });
	}
 }
 
 // login accepted. token received.
 function do_login_accepted(res)
 {
	if (res == null || res == "" || res=="null")
	{
		show_information(terms.do_login_accepted_fail);
	}
	else
	{
		do_set_userdata(res);
		do_login_event();
		$("#login-password").val(''); 
	}
 }
 
 function do_get_clubs_for_district(did, cb)
 {
	var sql = "SELECT * FROM club WHERE district_did='"+did+"' ORDER BY name ASC";
	console.log(sql);
	db_get_data(sql, [], function(data)
	{
		var data_array = [];
		for (var i=0; i<data.length; ++i)
		{
			data_array.push(data.item(i));
		}
		cb(data_array);
	});
}
 
 function do_check_for_offline_updates()
 {
	if (is_offline_data_updated())
	{
		var last_db_update = localStorage.getItem(DATABASE_LAST_UPDATE_FIELD);
		if (last_db_update == null || !last_db_update)
		{
			show_page("#settings-page");
			show_information(terms.do_check_for_offline_updates_now);
		}
		else
		{
			var now_ts = do_get_current_ts();
			if (now_ts - last_db_update > DATABASE_REFRESH_RATE)
			{
				show_page("#settings-page");
				show_information(terms.do_check_for_offline_updates_now);
			}
		}
	}
 }
 
 function do_schedule_notification_event(in_title,in_text,in_data,in_at)
 {
	var event_data = 
	{
		id: in_data.mid,
		title: in_title,
		text: in_text,
		data: in_data,
		at: in_at
	};
	return event_data;
 }
 
 function do_schedule_notifications(data)
 {
	try
	{		
		cordova.plugins.notification.local.schedule(data);
	}
	catch (err)
	{
		show_information(err);
	}
 }
 
 function do_cancel_all_notifications(cb)
 {
	try
	{
		cordova.plugins.notification.local.cancelAll(cb);
	} catch(err)
	{
		show_information(err);
	}
 }
 
 
 function do_update_notifications()
 {
	var u = do_get_userdata().uid;
	var t = do_get_userdata().token;
	
	do_soap_request('soap_get_user_year_details_stats', { token: t, uid: u}, function(data) 
	{ 
		console.log(data); 
		
		var now = new Date();
		
		do_cancel_all_notifications(function()
		{
			var notifications = [];
			$.each(data, function(k,meeting)
			{
				var t = do_sqldate_to_jsdate(meeting.start_time);
				if (t > now)
				{
					var notify_time = new Date();
					notify_time.setTime(t.getTime() - EVENT_NOTIFICATION_1);
					notifications.push(do_schedule_notification_event(meeting.title, terms.do_update_notifications_text_1+meeting.club, meeting, notify_time));

					notify_time.setTime(t.getTime() - EVENT_NOTIFICATION_2);
					notifications.push(do_schedule_notification_event(meeting.title, terms.do_update_notifications_text_2+meeting.club, meeting, notify_time));
				}
			});
			if (notifications.length>0)
			{
				do_schedule_notifications(notifications);
			}
		});
	}, do_network_error, true);	
}
 
 
function do_refresh_front_page()
{
	do_soap_request('soap_get_user_year_details_stats', { token: do_get_userdata().token, uid: do_get_userdata().uid}, show_front_page_refresh, do_network_error, true);
} 
 
 function do_login_event()
 {
	$("#front-page").on("pageshow", do_refresh_front_page);
	gps_boot();
	do_update_notifications();
	show_frontpage();
	do_check_for_offline_updates();
 }
 
 // set session data locally
 function do_set_userdata(data)
 {
	session_current_user_data = data;
	localStorage.setItem("current_user", JSON.stringify(data));
 }
 
 // clear user data locally (including session token)
 function do_clear_userdata()
 {
	session_current_user_data = null;
	localStorage.removeItem("current_user");
 }
 
 // retrieve current user data and token
 function do_get_userdata()
 {
	//console.log(session_current_user_data);
	return session_current_user_data;
 }
 
 // do soap call to server. async is set to true if the call is not modal.
 function do_soap_request(func, params, in_success, in_error, async)
 {
	if (SOAP_DEBUG)
	{
		console.log("do_soap_request "+func);
		console.log(JSON.stringify(params));
	}
	
	if (async != true)
	{
		show_loading_on();
	}
	
	var export_data = 
	{
		cb: func,
		parameters: params
	};
	
	if (SOAP_DEBUG)
	{
		console.log(JSON.stringify(export_data));
	}
	
	
	$.ajax(
	{
		url: AJAX_END_POINT,
		method: 'post',
		data: export_data
	})
	.done(function(v) 
	{
		if (SOAP_DEBUG)
		{
			console.log('do_soap_request: done '+func);
			console.log(v); 
		}
		if (async != true)
		{
			show_loading_off();
		}
		in_success($.parseJSON(v));
	})
	.fail(function(xhr, text, error) 
	{
		if (SOAP_DEBUG)
		{
			console.log('do_soap_request: failed '+func);
			console.log(xhr);
			console.log(text);
			console.log(error);
			alert(xhr+'|'+text+'|'+error);
		}
		in_error();
		if (async != true)
		{
			show_loading_off();
		}
	});
	
/*
 	$.post(AJAX_END_POINT,  JSON.stringify(export_data))
	  .done(function(v) 
	  {
		if (SOAP_DEBUG)
		{
			console.log('do_soap_request: done '+func);
			console.log(v); 
		}
		if (async != true)
		{
			show_loading_off();
		}
		in_success($.parseJSON(v));
	  })
	  .fail(function(xhr, text, error) 
	  {
		if (SOAP_DEBUG)
		{
			console.log('do_soap_request: failed '+func);
			console.log(xhr);
			console.log(text);
			console.log(error);
			alert(xhr+'|'+text+'|'+error);
		}
		in_error();
		if (async != true)
		{
			show_loading_off();
		}
	  });*/
 }

 // download club members list
function do_get_club_members(clubid, in_success, in_error)
{
	if (is_offline_data_updated())
	{	
		db_get_data("SELECT * FROM user WHERE cid='"+clubid+"'", [], function(data)
		{
			if (data.length > 0)
			{
				var users = [];
				for (var i=0; i<data.length; ++i)
				{
					users.push(data.item(i));
				}
				in_success(users);
			}
			else
			{
				in_error();
			}
		});
	}
	else
	{
		do_soap_request('soap_get_active_club_members', { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
	}
}
 
 // download club meeitngs list
 function do_get_club_meetings(clubid, in_success, in_error)
 {
	do_soap_request('soap_fetch_future_meetings_for_club', { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
 }
 
 // download club information and data
 function do_get_club_data(clubid, in_success, in_error)
 {
	do_soap_request('soap_get_club',  { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
 }
 
 
 // download information for specfici meeting
 function do_get_meeting(meetingid, in_success)
 {
	do_soap_request('soap_get_meeting',  { token: do_get_userdata().token, mid: parseInt(meetingid) }, in_success, do_network_error);
 }
 
 
 // download list of attendance
 function do_get_meeting_attendance(meetingid, in_success)
 {
	do_soap_request('soap_get_meeting_attendance',  { token: do_get_userdata().token, mid: parseInt(meetingid) }, in_success, do_network_error);
 }
 
// fetch login information from ui and try to login
function do_login()
{
	var p = $("#login-password").val();
	var u = $("#login-username").val();
 	do_soap_request('soap_login', { username: u, password: p }, do_login_accepted, do_network_error);
}

// delete offline data
function do_delete_offline_data()
{
	if (db_get())
	{
		db_drop_table("user");
		db_drop_table("club");
		localStorage.setItem(DATABASE_LAST_UPDATE_FIELD,0);
	}
}


// download offline data
function do_update_offline_data()
{
	do_download_club_db();
	do_download_user_db();
	localStorage.setItem(DATABASE_LAST_UPDATE_FIELD,do_get_current_ts());
}

// extract field names for the database from object properties
function do_build_db_fields(data)
{
	var fields=[];
	$.each(data, function(k,v)
	{
		fields.push(k);
	});
	console.log(fields);
	return fields;
}

// download offline club database
function do_download_club_db()
{
	show_information(terms.do_download_club_db_start);
	do_soap_request('soap_get_clubs', {token:do_get_userdata().token, did:''},
	function(data)
	{
		if (data && data.length>0)
		{
			var fields = do_build_db_fields(data[0]);
			db_create_table("club", fields);
			db_put_data("club", data);
		}
		show_information(terms.do_download_club_db_done);
	},do_network_error,false);
}

// download offline user database
function do_download_user_db()
{
	console.log("do_download_user_db");	
	
	function do_download_user_db_inner(off)
	{
		do_soap_request('soap_get_users', { token: do_get_userdata().token, offset:off }, 
			function(data)
			{
				if (data && data.length>0)
				{				
					show_information(terms.do_download_user_db_still_updating);
					db_put_data("user", data);
					do_download_user_db_inner(off + data.length);
				}
				else
				{
					show_information(terms.do_download_user_db_done);
				}
			}, 
			do_network_error, false);
	}

	if (db_get() != null)
	{
		show_information(terms.do_download_user_db_start);
		do_get_user_from_server(do_get_userdata().uid, function(user)
		{
			var fields=do_build_db_fields(user);
			db_create_table("user", fields);
			do_download_user_db_inner(0);
		});	
	}
	else
	{
		show_information(terms.do_download_user_db_not_supported);
	}
}

// fetch user data from server
function do_get_user_from_server(user, success)
{
	do_soap_request('soap_get_user_by_id', { token: do_get_userdata().token, uid: user }, success, do_network_error);
}


// fetch user. see if user is found in local database. if not then donwload.
function do_get_user(user, success)
{
	if (is_offline_data_updated())
	{	
		db_get_data("SELECT * FROM user WHERE uid='"+user+"'", [], function(data)
		{
			if (data.length != 1)
			{
				do_get_user_from_server(user, success);
			}
			else
			{
				var user_data = data.item(0);
				success(user_data);
			}
		});
	}
	else
	{
		do_get_user_from_server(user, success);
	}
}

// serarch online for users, meetings and clubs (deprecated)
function do_search_results(val)
{
	//console.log(val);
	$("#search-page-list-members").listview();
	$("#search-page-list-meetings").listview();
	$("#search-page-list-clubs").listview();

	show_page("#search-page-members");


	
	$("#search-page-list-members").empty();
	$("#search-page-list-meetings").empty();
	$("#search-page-list-clubs").empty();
	
	var count = { members: 0, meetings: 0, clubs: 0 };
	
	$.each(val.users, function(i,u)
	{
		count.members ++;
		
		$("#search-page-list-members").append(
			do_user_list_html(u.uid, u.profile_firstname, u.profile_lastname, u.company_position+", "+u.company_name)
		);
	});
	
	$.each(val.meetings, function(i,m)
	{
		count.meetings ++;
		$("#search-page-list-meetings").append(
			"<li><a href=# onclick=show_meeting("+m.mid+")><h2>"+m.title+"</h2><p>"+m.club+"</p></a>"
		);
	});

	$.each(val.clubs, function(i,c)
	{
		count.clubs ++;
		$("#search-page-list-clubs").append(
			"<li><a href=# onclick=show_club("+c.cid+")><h2>"+c.name+"</h2></a>"
		);
	});

	$("#search-page-list-members-count").html(count.members);
	$("#search-page-list-meetings-count").html(count.meetings);
	$("#search-page-list-clubs-count").html(count.clubs);
	
	$("#search-page-list-clubs").listview("refresh");
	$("#search-page-list-members").listview("refresh");
	$("#search-page-list-meetings").listview("refresh");

	
	var page_to_show ="#search-page";
	var show_error = false;
	
	if (count.members == 1)
	{
		page_to_show ="#search-page-members";
	}
	else if (count.clubs == 1)
	{
		page_to_show ="#search-page-clubs";
	} else if (count.meetings == 1)
	{
		page_to_show ="#search-page-meetings";
	} else  if (count.members != 0)
	{
		page_to_show ="#search-page-members";
	} else if (count.meetings != 0)
	{
		page_to_show ="#search-page-meetings";
	} else if(count.clubs != 0)
	{
		page_to_show ="#search-page-clubs";
	} else
	{
		show_error = true;
	}
	show_page(page_to_show);
	if (show_error) 
	{
		show_information(terms.do_search_results_empty);
	}
}

// show downloaded news from server (deprecated)
function do_show_news(news)
{
	var item_count = 0;
	//console.log(news);
	$("#news-page-list").empty();
	$.each(news, function(i,n) 
	{
		var id = "news-page-list-item-"+item_count;
		$("#news-page-list").append('<div data-role="collapsible"><h2>'+n.title+'</h2><div id='+id+'></div></div>');
		do_fix_html(n.content, '#'+id);
//		$(id).append( do_fix_html(n.content) );
		
		item_count ++;
	});
	$("#news-page-list").collapsibleset("refresh");
}

// fetch mails for current user
function do_get_mail(cb)
{
	do_soap_request('soap_get_mail', { token: do_get_userdata().token }, cb, do_network_error);
}

// download news items from server (deprecated)
function do_get_news()
{
	do_soap_request('soap_get_news', { token: do_get_userdata().token }, do_show_news, do_network_error);
}

function do_count_occurences(str, value){
   var regExp = new RegExp(value, "gi");
   return (str.match(regExp) || []).length;
}

function do_calc_rank_score(data, words)
{
	var serialized = JSON.stringify(data);
	var rank_score = 0;
	for (var i=0; i<words.length; ++i)
	{
		rank_score += do_count_occurences(serialized, words[i])*(words.length+1-i);
	}
	return rank_score;
}

// search and display club data
function do_search_club(q)
{
	if (!is_offline_data_updated())
	{
		var t = do_get_userdata().token;
		var query = q;
		do_soap_request('soap_search', { q: query, token: t}, function(val)
		{
			show_club_search_result(val.clubs);
		}, do_network_error);
	}
	else
	{
		q = q.trim();
		var sql = "SELECT * FROM club WHERE name LIKE '%"+q+"%'";
		db_get_data(sql, [], function(data)
		{
			var data_array = [];
			for (var i=0; i<data.length; ++i)
			{
				data_array.push(data.item(i));
			}
			show_club_search_result(data_array);
		});
	}
}

// search and display user data
function do_search_user(q)
{
	if (!is_offline_data_updated())
	{
		var t = do_get_userdata().token;
		var query = q;
		do_soap_request('soap_search', { q: query, token: t}, function(val)
		{
			show_user_search_result(val.users);
		}, do_network_error);
	}
	else
	{
		q = q.toLowerCase().trim();
		var query_array = q.split(" ");                            	
		for (var i=0; i<query_array.length; ++i)
		{
			query_array[i] = query_array[i].trim();
		}
		var query_list = "'"+query_array.join("','")+"','"+q+"'";

		var sql =
		"SELECT * FROM user WHERE \
		lower(profile_firstname) in ("+query_list+") or \
		lower(profile_lastname) in ("+query_list+") or \
		lower(private_address) in ("+query_list+") or \
		lower(private_city) in ("+query_list+") or \
		lower(company_position) in ("+query_list+") or \
		lower(company_profile) in ("+query_list+") or \
		lower(company_name) in ("+query_list+") or \
		lower(private_email) in ("+query_list+") or \
		lower(company_email) in ("+query_list+") or \
		lower(company_business) in ("+query_list+") or \
		lower(company_city) in ("+query_list+") or \
		lower(private_phone) in ("+query_list+") or \
		lower(company_phone) in ("+query_list+") or \
		lower(private_profile) in ("+query_list+")";

		db_get_data(sql, [], function(data)
		{
			var rank_data = [];
			for (var i=0; i<data.length; i++)
			{
				var u = data.item(i);
				var rank_score = do_calc_rank_score(u, query_array);
				
				rank_data.push({
					score:rank_score,
					data:u
				});
				
			}
			
			rank_data.sort(function(a,b){return b.score-a.score;});
			show_user_search_result(rank_data);
		});
	}
}

// search meetings and show results
function do_search_meeting(query)
{
	query = query.trim();
	var t = do_get_userdata().token;
	do_soap_request('soap_search', { q: query, token: t}, 
	function(data)
	{
		show_meeting_search_result(data);
	}
	, do_network_error);
}

// execute search online
function do_search()
{
	var query = $("#search-page-term").val();
	var category = $("#search-page-category").val();
	switch(category)
	{
		case 'user': do_search_user(query); break;
		case 'club': do_search_club(query); break;
		case 'meeting': do_search_meeting(query); break;
	};
	return category;
}

// open map location in navigator
function do_open_map(adr)
{
	if (is_ios())
	{
		window.location.href = 'maps://maps.apple.com/?q='+adr;
	}
	else
	{
		window.location.href = 'http://maps.google.com/?q='+adr;
	}
}

// gps callback. upload gps coordinates to server.
function do_get_geodata(success)
{
	var d = 
	{
		token: do_get_userdata().token,
		lat: gps_current_position.coords.latitude,
		lng: gps_current_position.coords.longitude
	};
	do_soap_request('soap_get_geodata', d, success, do_network_error);
}

// verify network access
function do_check_network()
{
		do_soap_request("net_test_dummy", {foo:"bar"}, function()
		{
			//network ok - delay 30s
			setTimeout(do_notifications, 30000);
		}, 
		function() 
		{ 
			//network bad - delay 2s
			show_information(terms.do_check_network_fail); 
			setTimeout(do_notifications, 2000);
		}, true);
}


// check for mail periodically
function do_check_mail()
{
	if (is_logged_in())
	{
		do_soap_request('soap_get_last_mail_index', {token: do_get_userdata().token}, 
		function(v)
		{
			// mail received; let's check again shortly
			if (v != current_last_mail_index)
			{
				do_mail_notification(v);
				mail_check_interval = MIN_MAIL_CHECK_INTERVAL;
				setTimeout(do_check_mail, mail_check_interval);
			}
			else
			{
				// no new mail; let's wait longer before next check
				mail_check_interval += mail_check_interval;
				if (mail_check_interval > MAX_MAIL_CHECK_INTERVAL)
				{
					mail_check_interval = MAX_MAIL_CHECK_INTERVAL;
				}
				setTimeout(do_check_mail, mail_check_interval);
			}
			
			//console.log(mail_check_interval);

		}, 
		function()
		{
			// error checking mail - let's wait a loooong time
			setTimeout(do_check_mail, MAX_MAIL_CHECK_INTERVAL);
		}, true);
	}
	else
	{
		// not logged on, let's see if user is logged on in 15s
		setTimeout(do_check_mail, 15000);
	}
}

// do async notification
function do_notifications()
{
	if (ENABLE_NOTIFICATIONS)
	{
		do_check_network();
		do_check_mail()
	}
}

// nop
function do_nothing() {}

function do_get_active_page_id()
{
	var pid = $.mobile.activePage.attr('id');
}

function do_mail_notification(v)
{
	if (v != current_last_mail_index)
	{
		current_last_mail_index = v;
		localStorage.setItem("current_last_mail_index", current_last_mail_index);
		show_information(terms.do_mail_notification_new_message);
		show_beep();
		var pid = do_get_active_page_id();
		if (pid=="mail-page" || pid=="mail-page-read")
		{
			show_mail();
		}
	}
}


/*
(function(){
    var oldLog = console.log;
    console.log = function (message) 
	{
			$("#console-output").prepend("<p>"+JSON.stringify(message)+"</p>");
			oldLog.apply(console, arguments);
    };
})();*/