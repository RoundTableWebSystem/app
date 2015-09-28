var current_club_cid = false;
var current_mail_data = null;
var current_mail_read = $.parseJSON(localStorage.getItem("current_mail_read"));
var current_club_members = null;
var last_shown_user = null;
var last_show_meeting = null;

function show_page(what,p)
{
	$.mobile.changePage(what,p);
}

function show_favorites_page()
{
	show_page("#favorites-page");
	$("#favorites-list").empty();
	
	var favorites = do_get_favorites();
	if (favorites.length == 0)
	{
		$("#favorites-list").append("<li><p>"+terms.show_favorites_page+"</p></li>");
	}
	else
	{
		$.each(favorites, function(i, data)
		{
			$("#favorites-list").append(do_user_list_html(data.uid, data.profile_firstname, data.profile_lastname, ""));
		});
	}
	
	$("#favorites-list").listview("refresh");
}


function show_gps_page()
{
	
	if (gps_current_position == null)
	{
		show_information(terms.show_gps_page_fail);
	}
	else
	{
		show_page("#gps-page");

		swipe_manager_reset();
		swipe_manager_add("#gps-page");
		swipe_manager_add("#gps-page-work");
		swipe_manager_add("#gps-page-home");
		swipe_manager_add("#gps-page-meetings");
		swipe_manager_closure();
		
		do_get_country_meetings("",function(d)
		{
			console.log(d);
			$("#gps-page-meeting-list").empty();
			$.each(d.meetings, function(i,m)
			{
				var html = "";
				html = '<li><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.name+', '+m.start_time+'</p></a></li>';
				$("#gps-page-meeting-list").append(html);
			});
			$("#gps-page-meeting-list").listview("refresh");
		});
		

		do_get_geodata(function(d)
		{
			
			$("#gps-page-online-list").empty();
			$("#gps-page-home-list").empty();
			$("#gps-page-work-list").empty();
			
			
			for (var i=0; i<d.length; ++i)
			{
				var data = d[i];
				d[i].dist = Math.round(gps_distance(data.lat, data.lng, gps_current_position.coords.latitude, gps_current_position.coords.longitude, 'K'));
			}
			
			d.sort(function(a,b)
			{
				var ad = parseFloat(a.dist);
				var bd = parseFloat(b.dist);
				return ad-bd;
			});
			
			var current_uid = do_get_userdata().uid;
			var count = { online:0, work:0, home:0 };
	
			$.each(d, function(i, data)
			{
				if (data.refid != current_uid)
				{
					var dist = data.dist;
					var txt = "";
					var dlist = "";
					
					if (data.reftype == 'private') 
					{
						console.log("---------------------- ONLINE -------------------");
						console.log(data);
						count.online++;
						dlist = "#gps-page-online-list";
						txt = terms.online;
					}
					else if (data.reftype =='work') 
					{
						count.work++;
						dlist = "#gps-page-work-list";
						txt =terms.work;
					}
					else if (data.reftype =='home') 
					{
						count.home++;
						dlist = "#gps-page-home-list";
						txt =terms.home;
					}
					
					txt += " ("+dist+" km)";
					$(dlist).append(do_user_list_html(data.refid, data.profile_firstname, data.profile_lastname, txt));
				}
			
			});
			$("#gps-page-work").on("pageshow", function() {$("#gps-page-work-list").listview("refresh");});
			$("#gps-page-home").on("pageshow", function() {$("#gps-page-home-list").listview("refresh");});

			$("#gps-page-online-list").listview("refresh");		

			if (count.online == 0) 
			{
				if (count.home == 0)
				{
					if (count.work == 0)
					{
						show_information(terms.show_gps_page_empty);
					}
					else
					{
						show_page("#gps-page-work");
					}
				}
				else
				{
					show_page("#gps-page-work");
				}
			}
			
		});
	}
	
}

function show_single_mail(index)
{
	console.log("show_single_mail "+index);

	var m = current_mail_data[index];

	if (current_mail_read == null)
	{
		current_mail_read = [];
	}
	current_mail_read.push(m.id);
	localStorage.setItem("current_mail_read", JSON.stringify(current_mail_read));

	show_page("#single-mail-page");
	$("#single-mail-title").html(m.mail_subject);
	
	do_fix_html(do_nl2br(do_linkify(m.mail_content)), '#single-mail-body');
//	$("#single-mail-body").html(do_fix_html(m.mail_content));
	
	
	$("#single-mail-date").html(m.submit_time);
	$("#single-mail-index").attr("value", index);
	
	if (m.aid > 0)
	{	
		$("#single-mail-attachment").show();
		$("#single-mail-attachment").html(m.filename);
		$("#single-mail-attachment").click(function(){
				window.open(ATTACHMENT_BASE_URL+'?aid='+m.aid+'&token='+m.token, '_system');}
		);
	}
	else
	{
		$("#single-mail-attachment").hide();
	}
	
	
	$("#single-mail-sender").empty();
	if (m.SenderUID > 0)
	{
		$("#single-mail-sender").append(
			"<li><a href=# onclick=show_user("+m.SenderUID+")>"+m.SenderFirstname+" "+m.SenderLastname+"</a></li>"
		);
	}
	$("#single-mail-sender").listview("refresh");

}

function show_mail_sent(d)
{
	show_page("#mail-page");
	show_information(terms.show_mail_sent);
}

function show_group_message(recvs)
{
	show_page("#reply-mail-page");
	$("#reply-mail-receiver").empty();

	var uids = [];
	for (var i=0; i<recvs.length; ++i)
	{
		var user = recvs[i];
		uids.push(user.uid);
		$("#reply-mail-receiver").append(do_user_list_html(user.uid, user.profile_firstname, user.profile_lastname, ""));
	}
	
	$("#reply-mail-receiver-uid").attr("value", JSON.stringify(uids));
	$("#reply-mail-title").html(terms.show_group_message_subject);
	$("#reply-mail-content").val("");
	
	$("#reply-mail-receiver").listview("refresh");
}


function show_send_message(uid, subject)
{
	do_get_user(uid, function(user)
	{
		show_page("#reply-mail-page");

		$("#reply-mail-receiver-uid").attr("value", user.uid);
		
		if (subject == undefined || subject == "")
		{
			$("#reply-mail-title").html(terms.show_send_message_subject);		
		}
		else
		{
			$("#reply-mail-title").html(subject);
		}
		
		$("#reply-mail-content").val("");
		
		$("#reply-mail-receiver").empty();
		$("#reply-mail-receiver").append(do_user_list_html(user.uid, user.profile_firstname, user.profile_lastname, ""));
		$("#reply-mail-receiver").listview("refresh");
	});
}


function show_reply()
{
	var index = $("#single-mail-index").val();
	var m = current_mail_data[index];
	
	if (m.SenderUID > 0)
	{
		show_send_message(m.SenderUID, m.mail_subject);
	}
	else
	{
		show_information(terms.show_reply_fail);
	}	
}

function show_mail_list(data)
{
	swipe_manager_reset();
	swipe_manager_add("#mail-page");
	swipe_manager_add("#mail-page-read");
	swipe_manager_closure();
	
	current_mail_data = data;
	$.each(data, function(i, m)
	{
		var read = is_mail_read(m.id);
		
		if (m.SenderUID >0)
		{
			if (read)
			{
				$("#mail-list-read").append(
					"<li id=mail-list-item"+i+"><a href=# onclick=show_single_mail("+i+");><h2>"+m.mail_subject+"</h2><p>"+m.SenderFirstname+" "+m.SenderLastname+", "+m.submit_time+"</p></a></li>"
				);
			}
			else
			{
				$("#mail-list").append(
					"<li id=mail-list-item"+i+"><a href=# onclick=show_single_mail("+i+");><h2>"+m.mail_subject+"</h2><p>"+m.SenderFirstname+" "+m.SenderLastname+", "+m.submit_time+"</p></a></li>"
				);
			}
		}
		else
		{
			if (read)
			{
				$("#mail-list-read").append(
					"<li id=mail-list-item"+i+"><a href=# onclick=show_single_mail("+i+");><h2>"+m.mail_subject+"</h2><p>"+m.submit_time+"</p></a></li>"
				);
			}
			else
			{
				$("#mail-list").append(
					"<li id=mail-list-item"+i+"><a href=# onclick=show_single_mail("+i+");><h2>"+m.mail_subject+"</h2><p>"+m.submit_time+"</p></a></li>"
				);
			}
		}
	});
	$("#mail-page-read").on("pageshow", function() { $("#mail-list-read").listview("refresh");});
	
	$("#mail-list").listview("refresh");
}

function show_mail()
{
	show_page("#mail-page");
	$("#mail-list").empty();
	do_get_mail(show_mail_list);
}





function show_district(d)
{
	$("#news-page-meeting-list").empty();
	$("#news-page-minutes-list").empty();
	
	do_get_country_meetings(d,function(d)
	{
		var dest = "#news-page-meeting-list";
		$.each(d.meetings, function(i,m)
		{
			$(dest).append(do_meeting_html(m));
		});
		$(dest).listview().listview("refresh");

		
		dest = "#news-page-minutes-list";
		$.each(d.minutes, function(i,m)
		{
			$(dest).append(do_meeting_html(m));
		});
		$(dest).listview().listview("refresh");

	});
}

function show_news()
{
	show_page("#news-page");
	
	show_district(0);
	
	
	// do_get_news();
}

function show_duty(uid, label)
{
	if (uid>0)
	{
		do_get_user(uid, function(user) 
		{
			var name = user.profile_firstname + ' ' + user.profile_lastname;
			$("#meeting-page-duties").append(do_user_list_html(uid, user.profile_firstname, user.profile_lastname, label));
		});
	}
}

function show_meeting(mid)
{
	do_get_meeting(mid, function(data)
	{
		last_shown_meeting = data;
		swipe_manager_reset();
		swipe_manager_add("#meeting-page");
		swipe_manager_add("#meeting-description-page");
		swipe_manager_add("#meeting-minutes-page");
		swipe_manager_closure();
		
		console.log(data);
				$("#meeting-page-accept").hide();
				$("#meeting-page-decline").hide();
			
			show_page("#meeting-page");
			
			$("#meeting-minutes-content").html(data.minutes);
			$("#meeting-3min-content").html(data.minutes_3min);
			$("#meeting-letters-content").html(data.minutes_letters);
			
			$("#meeting-page-description").html(data.meeting_description);
			$("#meeting-page-mid").val(data.mid);
			$("#meeting-page-cid").val(data.cid);
			$("#meeting-page-title").html(data.title);
			$("#meeting-page-location").html("<a href=# onclick=\"do_open_map('"+data.location+"')\">"+data.location+"</a>");
			$("#meeting-page-start").html(data.start_time);
			$("#meeting-page-end").html(data.end_time);
			
			$("#meeting-page-distance").html(terms.show_meeting_gps_calc);
			
			$("#meeting-page-duties").empty();
			show_duty(data.duty_3min_uid, terms.duty_3min);
			show_duty(data.duty_letters1_uid, terms.duty_letters1);
			show_duty(data.duty_letters2_uid, terms.duty_letters2);
			show_duty(data.duty_ext1_uid, data.duty_ext1_text);
			show_duty(data.duty_ext2_uid, data.duty_ext2_text);
			show_duty(data.duty_ext3_uid, data.duty_ext3_text);
			show_duty(data.duty_ext4_uid, data.duty_ext4_text);
			show_duty(data.duty_ext5_uid, data.duty_ext5_text);
			$("#meeting-description-page").on("pageshow", function() {$("#meeting-page-duties").listview("refresh");});


			
			
			do_get_coords(data.location, 
				function(val)
				{ 
					var dist = Math.round(gps_distance(gps_current_position.coords.latitude, gps_current_position.coords.longitude, val.lat, val.lng, 'K'));
					$("#meeting-page-distance").html(""+dist+" km");
					console.log(val); 
				}, 
				function() 
				{ 
					$("#meeting-page-distance").html(terms.gps_calc_error)
				});
			
			do_get_meeting_attendance(mid, function(attendance)
			{
				$("#meeting-page-participants").empty();
				
				$("#meeting-page-participants").append("<li data-role=list-divider  data-theme=c>"+terms.participants+" (<span id=meeting-page-ok-nr></span>)</li>");
				var ok = 0;
				
				var current_uid = do_get_userdata().uid;
				
				var user_accepted = false;
				
				$.each(attendance, function(k,m)
				{
					if (m.accepted == 1)
					{
						ok++;
						
						if (m.uid == current_uid)
						{
							user_accepted=true;
						}

						$("#meeting-page-participants").append(do_user_list_html(m.uid, m.profile_firstname, m.profile_lastname, m.club_name));
					}
				});
				
				$("#meeting-page-ok-nr").html(ok);

				$("#meeting-page-participants").append("<li data-role=list-divider data-theme=c>"+terms.declined+" (<span id=meeting-page-decline-nr></span>)</li>");
				var declined = 0;
				$.each(attendance, function(k,m)
				{
					if (m.accepted == 0)
					{
						declined++;

						$("#meeting-page-participants").append(do_user_list_html(m.uid, m.profile_firstname, m.profile_lastname, m.club_name));
					}
				});
				
				
				
				$("#meeting-page-decline-nr").html(declined);
				
				$("#meeting-page-participants").listview("refresh");

				if (data.minutes_date == null)
				{
					if (user_accepted)
					{
						$("#meeting-page-decline-mid").attr("value", mid);
						$("#meeting-page-decline-cid").attr("value", data.cid);
						$("#meeting-page-decline").show();
					}
					else
					{
						$("#meeting-page-accept-mid").attr("value", mid);
						$("#meeting-page-accept-cid").attr("value", data.cid);
						$("#meeting-page-accept").show();
					}
				}
			});
			// meeting-page-participants
	});
	
}

function show_search()
{
	show_page('#search-page');
	swipe_manager_add("#search-page-members");
	swipe_manager_add("#search-page-meetings");
	swipe_manager_add("#search-page-clubs");
	swipe_manager_closure();
}




function show_user(uid)
{
	show_page("#user-page");
	
	
	do_get_user(uid, function(user)
	{
		last_shown_user = user;
		var name = user.profile_firstname + " " + user.profile_lastname;
		var adr = user.private_address + " " + user.private_houseno + ", " + user.private_zipno + " " + user.private_city;
		var cadr = user.company_address + ", " + user.company_zipno + " " + user.company_city;
		

		$("#user-page-name").html(name);
		$("#user-page-job").html(user.company_position+"<br>"+user.company_name);
		$("#user-page-adr").html("<a href=# onclick=\"do_open_map('"+adr+"')\">"+adr+"</a>");
		$("#user-page-adr-company").html("<a href=# onclick=\"do_open_map('"+cadr+"')\">"+cadr+"</a>");
		
		if (user.profile_image != "")
		{
			$("#user-page-pic").attr("src", IMAGE_BASE_URL+user.profile_image);
			$("#user-page-pic").show();
		}
		else
		{
			$("#user-page-pic").hide();
		}
		
		
		if (user.private_profile != "")
		{
			$("#user-page-profile").html("<h2>"+terms.private_profile+"</h2>"+user.private_profile);
		}
		else
		{
			$("#user-page-profile").html("");
		}

		if (user.company_profile != "")
		{
			$("#user-page-company-profile").html("<h2>"+terms.company_profile+"</h2>"+user.company_profile);
		}
		else
		{
			$("#user-page-company-profile").html("");
		}
		
		$("#user-page-charter").html(user.profile_started);
		$("#user-page-exit").html(user.profile_ended);
		$("#user-page-birth").html(user.profile_birthdate);
		
		var phone = [];
		phone.push( { t : terms.private_phone, v : user.private_phone } );
		phone.push( { t : terms.company_phone, v : user.company_phone } );
		phone.push( { t : terms.private_mobile, v : user.private_mobile } );
		$("#user-page-contact").empty();
		$.each(phone, function(k,v) {
			if (v.v != '')
			{
				$("#user-page-contact").append(
					"<li data-icon=phone><a href='tel://"+v.v+"' data-icon=phone>"+v.t+"</a></li>"
				);
			}
			
		});
		$("#user-page-contact").append(
			"<li data-icon=comment><a href=# onclick='show_send_message("+user.uid+")' data-icon=comment>"+terms.generic_message+"</a></li>"
		);
		$("#user-page-contact").listview("refresh");
		
	});
}



function close_club_page()
{
	show_frontpage();
}

function show_club(cid,p)
{
	console.log("show club: "+cid);

	show_page("#club-page",p);
	
	swipe_manager_reset();
	swipe_manager_add("#club-page");
	swipe_manager_add("#club-members-page");
	swipe_manager_closure();

	if (current_club_cid != cid)
	{
		do_get_club_data(cid, 
		function(clubdata)
		{
			current_club_cid = cid;
			$("#club-page-header").html(clubdata.name);
			$("#club-page-logo").attr("src", LOGOS_BASE_URL+clubdata.logo);
			
			$("#club-members-page-header").html(clubdata.name);
			$("#club-members-page-logo").attr("src", LOGOS_BASE_URL+clubdata.logo);
			
			
			if (cid != do_get_userdata().cid)
			{
				$("#club-page-message-to-club").hide();
			}
			else
			{
				$("#club-page-message-to-club").show();
			}
			
			
			$("#club-members-list").empty();
			
			do_get_club_members(cid, function(members)
			{
				current_club_members = members;
				$.each(members, function(i,member)
				{
					var name = member.profile_firstname + " " + member.profile_lastname;
					var phone = member.private_mobile;
					var txt = member.company_position+", "+member.company_name;
					$("#club-members-list").append(
					"<li><a href=# onclick=show_user("+member.uid+")><h2>"+name+"</h2><p>"+txt+"</p></a><a href='tel://"+phone+"' data-icon=phone>"+phone+"</a></li>"
					);
				});
			},
			do_network_error);
			$("#club-members-page").on("pageshow", function() {$("#club-members-list").listview("refresh");});
			
			
			
		},
		function()
		{
			show_information(terms.show_club_fail);
			return;
		});
		
		
		do_get_club_meetings(cid,
			function(meetings)
			{
				console.log(meetings);
				$("#club-page-meetings-list").empty();
				$.each(meetings, function(i,m)
				{
					var html = "";
					if (m.location != '')
					{
						html = '<li><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.location+', '+m.start_time+'</p></a></li>';
					}
					else
					{
						html = '<li><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.start_time+'</p></a></li>';
					}
					$("#club-page-meetings-list").append(html);
				});
				$("#club-page-meetings-list").listview("refresh");
			},
			function()
			{
				show_information(terms.show_club_fail);
			}
		);
	}
}

	
function show_my_club()
{
	var user = do_get_userdata();
	show_club(user.cid);
}


function show_login()
{
	swipe_manager_reset();
	show_page("#login-page");
}

function gps_distance(lat1, lon1, lat2, lon2, unit) 
{
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var radlon1 = Math.PI * lon1/180
	var radlon2 = Math.PI * lon2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}  

var latest_user_data = null;

function show_refresh_gps()
{
	data = latest_user_data;
}

function show_latest_users(data)
{
	latest_user_data = data;
	show_refresh_gps();
}

function show_frontpage()
{
	swipe_manager_reset();
	show_page("#front-page");
}

var information_index = 0;

var current_information_shown = [];

function show_swipe_markers(pid, next_pid, prev_pid)
{
}

function show_information(msg)
{
	var pageid = "#"+$.mobile.activePage.attr('id');
	
	for (var i=0; i<current_information_shown.length; ++i)
	{
		if (current_information_shown[i]!=null && current_information_shown[i].message == msg) 
		{
			current_information_shown[i].expire_ts = do_get_current_ts()+3000;
			
			var count = ++current_information_shown[i].count;
			var panel_id = "#"+current_information_shown[i].id;
			var msg = current_information_shown[i].message+" ("+count+")";
			console.log(panel_id+msg);
			
			$(panel_id).html(msg);
			return panel_id;
		}
	}
	
	information_index++;
	var panel_id = "information-panel-id"+information_index;
	
	current_information_shown.push({id:panel_id, message:msg, expire_ts:do_get_current_ts()+3000, count: 1});
	
	$(pageid).prepend(
		'<div id='+panel_id+' class="ui-bar ui-bar-b">'+msg+'</div>'
	);

	return panel_id;
}

function show_information_timer()
{
	var ts = do_get_current_ts();
	
	for (var i=0; i<current_information_shown.length; ++i)
	{
		var c = current_information_shown[i];
		if (c != null && c.expire_ts<ts)
		{
			$("#"+c.id).hide();
			current_information_shown[i] = null;
		}
	}

	setTimeout(show_information_timer, 3000);
}

function show_loading_on()
{
	$("body").addClass('ui-disabled');
	$.mobile.loading( "show" );
}

function show_loading_off()
{
	$("body").removeClass('ui-disabled');
	$.mobile.loading( "hide" );
}