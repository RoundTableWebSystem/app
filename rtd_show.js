
var current_club_cid = false;
var current_mail_data = null;
var current_mail_read = $.parseJSON(localStorage.getItem("current_mail_read"));
var current_club_members = null;
var last_shown_user = null;
var last_show_meeting = null;
var last_geodata_database = null;

function show_prepare_settings_page()
{
}


function show_beep()
{
	if (navigator.notification)
	{
		navigator.notification.vibrate(500);
	}
}


function show_club_archive()
{
	show_page("#club-archive-page");
	console.log(current_club_cid);
	$("#club-archive-page-list").empty();
	do_get_minutes(current_club_cid, function(data)
	{
		var last_section = '';
		var html = '';
		$.each(data, function(i, m)
		{
			var y = do_sqldate_to_jsdate(m.start_time).getFullYear();
			if (last_section != y)
			{
				html += "<li data-role=list-divider data-theme=c>"+y+"</li>";
				last_section = y;
			}
			
			html += '<li data-icon=calendar><a href=# onclick=show_meeting('+m.mid+')>'+m.title+'<p>'+m.start_time+'</p></a></li>';
			
		});
		
		$("#club-archive-page-list").html(html);
		
		$("#club-archive-page-list").listview("refresh");	
	});
}

function show_alert(msg)
{
	navigator.notification.alert(
		msg,  
		terms.show_alert_title,
		terms.show_alert_button
	);
}
function show_page(what,p)
{
	console.log("show_page "+what);
	
	$.mobile.changePage(what,p);
}

function show_reports_for_district(input)
{
	$("#reports-page-toggle").show();
	
	var input_split = input.split(",");
	var did = input_split[0];
	var d_name = input_split[1];
	console.log(input_split);
	
	$("#reports-page-club-content").html('');
	$("#reports-page-member-content").html('');
	
	do_get_jubilees(function(data)
	{
		console.log(data);
		$.each(data.club, function(year, clubs)
		{
			for (var i=0; i<clubs.length; i++)
			{
				if (clubs[i].district == d_name)
				{
					$("#reports-page-club-content").append(
						'<tr onclick=show_club('+clubs[i].cid+')>'+
						'<td>'+year+'</td>'+
						'<td>'+clubs[i].club+'</td>'+
						'<td>'+clubs[i].charter_club+'</td>'+
						'<td>'+clubs[i].district+'</td>'+
						'<td>'+clubs[i].charter_date+'</td>'+
						'</tr></tr>'
					);
				}
			}
		
		});
		
		$.each(data.member, function(year, members)
		{
			for (var i=0; i<members.length; ++i)
			{
				if (members[i].district == d_name)
				{
					var n = members[i].profile_firstname + ' ' + members[i].profile_lastname;
					$("#reports-page-member-content").append(
						'<tr onclick=show_user('+members[i].uid+')><td>'+year+'</td><td>'+n+'</td><td>'+members[i].club+'</td><td>'+members[i].profile_started+'</td></tr>'
					);
				}
			}
		});
	
	});

	do_get_clubs_for_district(did, function(data)
	{
		// clear the table header
		var header_generated = false;
		$("#reports-page-table-header").html("");
		
		
		var html = "";
		$.each(data, function(k,v)
		{
			var id = "reports-page-cid-"+v.cid;
			html += "<tr onclick=show_club("+v.cid+") id='"+id+"'><td>"+v.name+"</td></tr>";
		});
		$("#reports-page-content").html(html);

		$.each(data, function(k,v)
		{
			var id = "reports-page-cid-"+v.cid;
			do_get_club_stats(v.cid, function(data)
			{
				// generate table header
				if (header_generated == false)
				{
					var count = 0;
					$("#reports-page-table-header").append("<th>"+terms.show_reports_for_district_club+"</th>");
					$.each(data, function(year, stats)
					{
						if (count<4)
						{
							$("#reports-page-table-header").append("<th>"+year+"</th>");
						}
						count++;
					});
					header_generated = true;
				}

				var html = '';
				var count = 0;
				$.each(data, function(year, stats)
				{
					if (count<4)
					{
						var exits = stats.new - stats.exit;
						html += "<td style='text-align:right'>"+exits+"</td>";
					}
					count++;
				});
				$("#"+id).append(html);
				
				try
				{
					$("#reports-page-table").table("refresh");
				}
				catch(err)
				{}
			});
		});
	});
}

function show_reports_page()
{
	if (!is_offline_data_updated())
	{
		show_information(terms.show_reports_page_no_offline_data);
		return;
	}

	show_page("#reports-page");
	
	$("#reports-page-content").html('');
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


function show_marker(map, u, t)
{
	var pos = {lat: parseFloat(u.lat), lng: parseFloat(u.lng)};
	console.log(pos);
	
	var marker = new google.maps.Marker({
		position: pos,
		map: map,
		title: u.profile_firstname+' '+u.profile_lastname
	  });

	var infowindow = new google.maps.InfoWindow({
		content: '<div><h1>'+u.profile_firstname+' '+u.profile_lastname+'</h1><p>'+t+'</p><p><a href=# onclick=show_user('+u.refid+')>Kontakt</a></div>'
	});

	marker.addListener('click', function() {
	infowindow.open(map, marker);
	});

}


function show_geodata_on_map(map)
{
	if (last_geodata_database == null)
	{
		show_information(terms.show_geodata_on_map_no_data);
	}
	else
	{
		var current_uid = do_get_userdata().uid;

		var n = new Date();
		
		$.each(last_geodata_database, function(i, data)
		{
//			if (data.refid != current_uid)
			{
				var dist = data.dist;
				
				if (data.reftype == 'private') 
				{
					var d = do_sqldate_to_jsdate(data.expiry_date);
					d.setDate(d.getDate()-1);			
					
					txt = terms.online +' '+ do_time_to_text(n,d);
					txt += " ("+dist+" km)";
					
					show_marker(map, data, txt);
				}
				else if (data.reftype =='work') 
				{
					txt =terms.work;
					txt += " ("+dist+" km)";

					show_marker(map, data, txt);
				}
				else if (data.reftype =='home') 
				{
					txt =terms.home;
					txt += " ("+dist+" km)";

					show_marker(map, data, txt);
				}
				
			}
		});
	}
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

		do_get_geodata(function(d)
		{
			
			$("#gps-page-online-list").empty();
			$("#gps-page-home-list").empty();
			$("#gps-page-work-list").empty();
			
			console.log(d);
			
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
			
			
			last_geodata_database = d;
			
			var current_uid = do_get_userdata().uid;
			var count = { online:0, work:0, home:0 };

			var n = new Date();
			
			$.each(d, function(i, data)
			{
				if (data.refid != current_uid)
				{
					var dist = data.dist;
					var txt = "";
					var dlist = "";
					
					if (data.reftype == 'private') 
					{
						count.online++;
						dlist = "#gps-page-online-list";
						
						var d = do_sqldate_to_jsdate(data.expiry_date);
						d.setDate(d.getDate()-1);			
						
						txt = do_time_to_text(n,d);
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
			do_user_list_html(m.SenderUID, m.SenderFirstname, m.SenderLastname, "")
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
		if (is_active_member(user))
		{
			uids.push(user.uid);
			$("#reply-mail-receiver").append(do_user_list_html(user.uid, user.profile_firstname, user.profile_lastname, ""));
		}
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
			$("#meeting-page-duties").prepend(do_user_list_html(uid, user.profile_firstname, user.profile_lastname, label));
			$("#meeting-page-duties").listview("refresh");
		});
	}
	else if (label != "")
	{
		$("#meeting-page-duties").prepend("<li data-icon=alert><a href=#>"+terms.show_duty_unassigned+"<p>"+label+"</p></a></li>");
		$("#meeting-page-duties").listview("refresh");
	}
}

function show_meeting_duties(data)
{
	$("#meeting-page-duties").empty();
	show_duty(data.duty_3min_uid, terms.duty_3min);
	show_duty(data.duty_letters1_uid, terms.duty_letters1);
	show_duty(data.duty_letters2_uid, terms.duty_letters2);
	show_duty(data.duty_ext1_uid, data.duty_ext1_text);
	show_duty(data.duty_ext2_uid, data.duty_ext2_text);
	show_duty(data.duty_ext3_uid, data.duty_ext3_text);
	show_duty(data.duty_ext4_uid, data.duty_ext4_text);
	show_duty(data.duty_ext5_uid, data.duty_ext5_text);
	
	
}

function show_meeting_minutes(data)
{
	$("#meeting-minutes-content").html(data.minutes);
	$("#meeting-3min-content").html(data.minutes_3min);
	$("#meeting-letters-content").html(data.minutes_letters);
}

function show_meeting_details(data)
{
	console.log("show_meeting_details: "); console.log(data);
	$("#meeting-page-description").html(data.meeting_description);
	$("#meeting-page-mid").val(data.mid);
	$("#meeting-page-cid").val(data.cid);
	$("#meeting-page-title").html(data.title);
	
	
	$("#meeting-page-club-link").html(data.name.substr(0,data.name.indexOf(' ')));
	$("#meeting-page-club-link").attr("onclick", "show_club("+data.cid+")");


	$("#meeting-page-location").html(data.location);

	$("#meeting-page-start").html(data.start_time);
	$("#meeting-page-end").html(data.end_time);

	// calc distance
	$("#meeting-page-distance").html(terms.show_meeting_gps_calc);
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
}

function show_meeting_attendance(data)
{
	do_get_meeting_attendance(data.mid, function(attendance)
	{
		$("#meeting-page-participants").empty();
		
		var ok = 0;
		
		var current_uid = do_get_userdata().uid;
		
		var user_accepted = false;
		
		last_shown_meeting.current_user_attending = false;
		
		$.each(attendance, function(k,m)
		{
			if (m.uid == current_uid)
			{
				last_shown_meeting.current_user_attending = true;
			}
			
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
				$("#meeting-page-decline-mid").attr("value", data.mid);
				$("#meeting-page-decline-cid").attr("value", data.cid);
				$("#meeting-page-decline").show();
			}
			else
			{
				$("#meeting-page-accept-mid").attr("value", data.mid);
				$("#meeting-page-accept-cid").attr("value", data.cid);
				$("#meeting-page-accept").show();
			}
		}
	});
}


function show_meeting_images(data)
{
	$("#meeting-page-images").empty();
	var cnt = 0;
	$.each(data.images, function(k, img)
	{
		cnt++;
		var url = MEETING_IMAGE_BASE_URL+'/'+data.mid+'/'+img.filename;
		$("#meeting-page-images").append("<img src='"+url+"' width=100% />");
	});
	$("#meeting-page-images-count").html(cnt);
}


function show_meeting(mid)
{
	do_get_meeting(mid, function(data)
	{
		last_shown_meeting = data;
			$("#meeting-page-accept").hide();
			$("#meeting-page-decline").hide();
			show_page("#meeting-page");
			show_meeting_details(data);
			show_meeting_minutes(data);
			show_meeting_duties(data);
			show_meeting_attendance(data);
			show_meeting_images(data);
	});
	
}

function show_user_search_result(data)
{
	var count = 0;
	$("#search-page-list-members").listview();
	$("#search-page-list-members").empty();

	$.each(data, function(i,u)
	{
		count ++;
		var add_txt = "";
		if (u.data) 
		{
			u = u.data;
			add_txt = u.company_position+", "+u.company_name;
		}
		else
		{
			add_txt = u.club+", "+u.district;
		}
		$("#search-page-list-members").append(
			do_user_list_html(u.uid, u.profile_firstname, u.profile_lastname, add_txt)
		);
	});
	
	$("#search-page-list-members-count").html(count);
	$("#search-page-list-members").listview("refresh");
	if (count>0)
	{
		show_page("#search-page-members");
	}
	else
	{
		show_information(terms.do_search_results_empty);
	}
}


function show_club_search_result(data)
{
	var count = 0;
	console.log(data);
	$("#search-page-list-clubs").listview();
	$.each(data, function(i,c)
	{
		count++;
		$("#search-page-list-clubs").append(
			"<li><a href=# onclick=show_club("+c.cid+")><h2>"+c.name+"</h2></a>"
		);
	});
	$("#search-page-list-clubs-count").html(count);
	$("#search-page-list-clubs").listview("refresh");
	
	if (count>0)
	{
		show_page("#search-page-clubs");
	}
	else
	{
		show_information(terms.do_search_results_empty);
	}

}

function show_meeting_search_result(data)
{
	var count = 0;
	$("#search-page-list-meetings").listview();
	$("#search-page-list-meetings").empty();
	$.each(data.meetings, function(i,m)
	{
		count++;
		$("#search-page-list-meetings").append(
			"<li><a href=# onclick=show_meeting("+m.mid+")><h2>"+m.title+"</h2><p>"+m.club+"</p></a>"
		);
	});
	$("#search-page-list-meetings-count").html(count);
	$("#search-page-list-meetings").listview("refresh");
	if (count>0)
	{
		show_page("#search-page-meetings");
	}
	else
	{
		show_information(terms.do_search_results_empty);
	}
}

function show_search()
{
	show_page('#search-page');
}

function show_search_from_front_query()
{
	var q = $("#front_search_input").val();
	$("#search-page-term").val(q);
	show_search();
	$("#search-page-term").val(q);
	return false;
}


function show_user(uid)
{
	do_get_user(uid, function(user)
	{
		console.log(user);
		
		show_page("#user-page");
		$("#user-page-pic").hide();
		last_shown_user = user;
		var name = user.profile_firstname + " " + user.profile_lastname;
		var adr = user.private_address + " " + user.private_houseno + ", " + user.private_zipno + " " + user.private_city;
		var cadr = user.company_address + ", " + user.company_zipno + " " + user.company_city;
		

		$("#user-page-name").html(name);
		$("#user-page-job").html(user.company_position+"<br>"+user.company_name+"<br>"+user.company_business);

		$("#user-page-adr").html("<a href=# onclick=\"do_open_map('"+adr+"')\">"+adr+"</a>");
		$("#user-page-adr-company").html("<a href=# onclick=\"do_open_map('"+cadr+"')\">"+cadr+"</a>");

		
		if (user.profile_image != "")
		{
			var url = user.profile_image.replace('/var/www/vhosts/rtd.dk/test2012/uploads/user_image/','');
		
		
			$("#user-page-pic").attr("src", IMAGE_BASE_URL+url);
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
		
		if (phone[0].v != user.company_phone)
		{
			phone.push( { t : terms.company_phone, v : user.company_phone } );
		}
		
		if (phone[0].v != user.private_mobile && phone[1].v != user.private_mobile)
		{
			phone.push( { t : terms.private_mobile, v : user.private_mobile } );
		}

		$("#user-page-contact").empty();
		$.each(phone, function(k,v) {
			if (v.v != '')
			{
				$("#user-page-contact").append(
					"<li data-icon=phone><a href='tel://"+v.v+"' data-icon=phone>"+v.v+" ("+v.t+")</a></li>"
				);
			}
			
		});
		$("#user-page-contact").append(
			"<li data-icon=comment><a href=# onclick='show_send_message("+user.uid+")' data-icon=comment>"+/*terms.generic_message*/user.private_email+"</a></li>"
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
	
	$("#club-page-logo").attr("src",'');
	
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
			$("#club-members-old-list").empty();
		
			var now = do_get_current_ts();
		
			do_get_club_members(cid, function(members)
			{
				current_club_members = members;
				$.each(members, function(i,member)
				{
					var name = member.profile_firstname + " " + member.profile_lastname;
					var phone = member.private_mobile;
					var txt = member.company_position+", "+member.company_name;
					
					var dest_list = "#club-members-list";

					if (!is_active_member(member))
					{
						dest_list = "#club-members-old-list";
					}
					
					$(dest_list).append(
						do_user_list_html(member.uid, member.profile_firstname, member.profile_lastname, "")
					);
				});
				$("#club-members-list").listview("refresh");
				$("#club-members-old-list").listview("refresh");
			},
			do_network_error);
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
						html = '<li data-icon=calendar><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.location+', '+m.start_time+'</p></a></li>';
					}
					else
					{
						html = '<li data-icon=calendar><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.start_time+'</p></a></li>';
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
	do_get_updates(show_updates);
}


function show_updates_birthday(v)
{
	return do_user_list_html(v.uid, v.profile_firstname, v.profile_lastname, terms.show_updates_birthday);
}

function show_updates_meeting(v)
{
	return '<li data-icon=calendar><a href=# onclick=show_meeting('+v.id+')>'+v.title+'<p>'+v.ts+'</p></a></li>';
}

function show_updates_users(v)
{
	return do_user_list_html(v.id, v.title, '', terms.show_updates_users+v.url_title+', '+v.ts);
}

function show_updates(data)
{
	console.log(data);
	
	$("#front-feed-list").empty();
	
	
	var birthday_html = '';
	var other_html = '';
	
	$.each(data, function(k,vv)
	{
		$.each(vv, function(i, v)
		{
			switch(k)
			{
				case 'birthday': birthday_html += show_updates_birthday(v); break;
				//case 'mid': other_html += show_updates_meeting(v); break;
				case 'uid': other_html += show_updates_users(v); break;
			};
		});
	
	
	});
	
	$("#front-feed-list").prepend('<li data-role=list-divider data-theme=c>'+terms.show_updates_header+'</li>');
	$("#front-feed-list").append(birthday_html);
	$("#front-feed-list").append(other_html);
	$("#front-feed-list").listview("refresh");

}

var information_index = 0;

var current_information_shown = [];

function show_swipe_markers(pid, next_pid, prev_pid)
{
}

function show_information(msg)
{
	show_beep();
	
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


function show_front_page_refresh(data)
{
	$("#front-event-list").empty();
	$("#front-event-list").append(terms.show_front_page_refresh_loading);
	$("#front-event-list").listview("refresh");
	var now = new Date();

	var html = "<li data-role=list-divider data-theme=c>"+terms.show_front_page_refresh_header+"</li>";
	$.each(data, function(k,m)
	{
		var t = do_sqldate_to_jsdate(m.start_time);
		if (t > now)
		{
			html += '<li data-icon=calendar><a href=# onclick=show_meeting('+m.mid+')><h2>'+m.title+'</h2><p>'+m.club+', '+m.start_time+'</p></a></li>';
		}
	});
	
	$("#front-event-list").empty();
	$("#front-event-list").append(html);
	$("#front-event-list").listview("refresh");
}