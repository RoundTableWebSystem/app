var gps_current_position = null;

function gps_boot()
{
	console.log("gps boot");
	if (navigator.geolocation) 
	{
		navigator.geolocation.getCurrentPosition(gps_pos);
    }
	else
	{
		console.log("gps not supported");
	}
}

function gps_pos(pos)
{
	console.log("gps pos");
	gps_current_position = pos;
	do_update_gps(pos);
}
 
function gps_watch()
{
	navigator.geolocation.watchPosition(gps_pos);
}
