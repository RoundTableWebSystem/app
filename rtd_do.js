
function do_nl2br(str)
{
  var breakTag = '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2')
}

function do_meeting_html(m)
{
	return '<li><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.name+', '+m.start_time+'</p></a></li>';
}

function do_get_favorites()
{
	var f = $.parseJSON(localStorage.getItem("favorites"));
	if (f == null) f = new Array();
	return f;
}

function do_add_to_contacts()
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

function do_sqldate_to_jsdate(sqldate)
{
	var t = sqldate.split(/[- :]/);
	return new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);	
}

function do_add_to_calendar()
{
	var title = last_shown_meeting.title;
	var loc = last_shown_meeting.location;
	var notes = ""/*last_shown_meeting.meeting_description*/;
	var s = do_sqldate_to_jsdate(last_shown_meeting.start_time);
	var e = do_sqldate_to_jsdate(last_shown_meeting.end_time);
	
	console.log(title);
	console.log(loc);
	console.log(notes);
	console.log(e);
	console.log(s);
	
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

function do_empty_favorites()
{
	localStorage.setItem("favorites", JSON.stringify(new Array()));
	show_frontpage();
}

function do_user_list_html(uid, firstname, lastname, addtxt)
{
	return "<li><a href=# onclick='show_user("+uid+")'><h2>"+firstname+" "+lastname+"</h2><p>"+addtxt+"</p></a><a href=# onclick='show_send_message("+uid+")' data-icon=comment>"+terms.generic_message+"</a></li>"
}

function do_add_favorite(who)
{
	console.log(who);
	
	var favorites = do_get_favorites();
	
	
	for (var i=0; i<favorites.length; ++i)
	{
		if (favorites[i].uid == who.uid)
		{
			return false;
		}
	}
	
	console.log(favorites);
	
	
	
	favorites.push(who);
	localStorage.setItem("favorites", JSON.stringify(favorites));
	return true;
}

function do_add_favorite_current_user()
{
	do_add_favorite(last_shown_user);
}

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

function do_open_weblink(link)
{
	if (link.indexOf('www.rtd.dk')>=0)
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

function do_linkify(text)
{
	var exp = /(\b((https?|ftp|file):\/\/|(www))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]*)/ig; 
	return text.replace(exp,"<a href='$1'>$1</a>");
}


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

function do_get_current_ts()
{
	return Date.now();
}

function do_logoff()
{
	//console.log("do_logoff");
	do_clear_userdata();
	show_login();
}

function do_send_message_to_club()
{
	show_group_message(current_club_members);
}


function do_get_country_meetings(d, success)
{
	var data = { did:d, token: do_get_userdata().token };
	do_soap_request('soap_get_country', data, success, do_network_error);
}

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

function do_send_reply(titleid, contentid, uidid)
{
	var c = $(contentid).val();
	var u =$(uidid).val();
	var t = $(titleid).text();
/*
	console.log(u);
	console.log(c);
	console.log(t);
	*/
	if (c == "" || t == "")
	{
		show_information(terms.do_send_reply_empty);
	}
	else
	{
		do_soap_request('soap_send_mail', { token: do_get_userdata().token, uid: u, title: t, content: c } , show_mail_sent, do_network_error)
	}
}


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
 
 function do_update_latests_users(cb)
 {
	do_soap_request('soap_get_geolocation_latest', { token: do_get_userdata().token }, cb, do_network_error);
 }
 
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
 
 function do_login_accepted(res)
 {
	//console.log("do_login_accepted");
	//console.log("data: "+res);
	if (res == null || res == "" || res=="null")
	{
		show_information(terms.do_login_accepted_fail);
	}
	else
	{
		do_set_userdata(res);
		gps_boot();
		show_frontpage();
		$("#login-password").val(''); 
	}
 }
 
 
 function do_set_userdata(data)
 {
	//console.log(data);
	session_current_user_data = data;
	localStorage.setItem("current_user", JSON.stringify(data));
 }
 
 function do_clear_userdata()
 {
	session_current_user_data = null;
	localStorage.removeItem("current_user");
 }
 
 function do_get_userdata()
 {
	//console.log(session_current_user_data);
	return session_current_user_data;
 }
 
 function do_soap_request(func, params, in_success, in_error, async)
 {
	//console.log("do_soap_request "+func);
	//console.log(JSON.stringify(params));
	
	if (async != true)
	{
		show_loading_on();
	}
	
	var export_data = 
	{
		cb: func,
		parameters: params
	};
	
	//console.log(JSON.stringify(export_data));

 	$.post(AJAX_END_POINT,  export_data)
	  .done(function(v) 
	  {
		//console.log('do_soap_request: done '+func);
		//console.log(v); 
		if (async != true)
		{
			show_loading_off();
		}
		in_success($.parseJSON(v));
	  })
	  .fail(function(v) 
	  {
		//console.log('do_soap_request: failed '+func);
		//console.log(v);
		in_error();
		if (async != true)
		{
			show_loading_off();
		}
	  });
 }

function do_get_club_members(clubid, in_success, in_error)
{
	do_soap_request('soap_get_active_club_members', { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
}
 
 function do_get_club_meetings(clubid, in_success, in_error)
 {
	do_soap_request('soap_fetch_future_meetings_for_club', { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
 }
 
 function do_get_club_data(clubid, in_success, in_error)
 {
	do_soap_request('soap_get_club',  { cid: parseInt(clubid), token: do_get_userdata().token }, in_success, in_error);
 }
 
 function do_get_meeting(meetingid, in_success)
 {
	do_soap_request('soap_get_meeting',  { token: do_get_userdata().token, mid: parseInt(meetingid) }, in_success, do_network_error);
 }
 
 function do_get_meeting_attendance(meetingid, in_success)
 {
	do_soap_request('soap_get_meeting_attendance',  { token: do_get_userdata().token, mid: parseInt(meetingid) }, in_success, do_network_error);
 }

function do_login()
{
	var p = $("#login-password").val();
	var u = $("#login-username").val();
 	do_soap_request('soap_login', { username: u, password: p }, do_login_accepted, do_network_error);
}

function do_get_user(user, success)
{
	do_soap_request('soap_get_user_by_id', { token: do_get_userdata().token, uid: user }, success, do_network_error);
}

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
			"<li><a href=# onclick=show_user("+u.uid+")><h2>"+u.profile_firstname+" "+u.profile_lastname+"</h2><p>"+u.club+", "+u.district+"</p></a>"
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

	
	if (count.members != 0)
	{
		show_page("#search-page-members");
	} else if (count.meetings != 0)
	{
		show_page("#search-page-meetings");
	} else if(count.clubs != 0)
	{
		show_page("#search-page-clubs");
	} else
	{
		show_information(terms.do_search_results_empty);
	}
}

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

function do_get_mail(cb)
{
	do_soap_request('soap_get_mail', { token: do_get_userdata().token }, cb, do_network_error);
}


function do_get_news()
{
	do_soap_request('soap_get_news', { token: do_get_userdata().token }, do_show_news, do_network_error);
}

function do_search()
{
	var query = $("#search-page-term").val();
	var t = do_get_userdata().token;
	do_soap_request('soap_search', { q: query, token: t}, do_search_results, do_network_error);
}


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


function do_notifications()
{
	if (ENABLE_NOTIFICATIONS)
	{
		do_check_network();
		do_check_mail()
	}
}

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