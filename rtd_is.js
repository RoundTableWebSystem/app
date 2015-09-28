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