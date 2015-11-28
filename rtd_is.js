function is_offline_data_updated()
{
	var last_update = localStorage.getItem(DATABASE_LAST_UPDATE_FIELD);
	
	if (last_update == null || last_update == 0)
	{
		return false;
	}
	else
	{
		return true;
	}
}

function is_active_member(member)
{
	if (member.profile_ended !== undefined)
	{
		var exit_date = do_sqldate_to_jsdate(member.profile_ended).getTime();
		
		if (exit_date < do_get_current_ts())
		{
			return false;
		}
	}
	return true;
}


function is_logged_in()
{
	return do_get_userdata() != null;
}

function is_ios()
{
	return /iPad|iPhone|iPod/.test(navigator.platform);
}


function is_mail_read(id)
{
	if (current_mail_read != null)
	{
		for (var i=0; i<current_mail_read.length; ++i)
		{
			if (id == current_mail_read[i]) return true;
		}
	}
	return false;
}

function is_online()
{
	return navigator.onLine;
}