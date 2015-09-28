var swipe_manager_pages = [];
var swipe_manager_index = 0;
var swipe_manager_count = 0;

function swipe_manager_reset()
{
	console.log("swipe_manager_reset");
	swipe_manager_pages = [];
	swipe_manager_index = 0;
	swipe_manager_count = 0;
}

function swipe_manager_add(page)
{
	console.log("swipe_manager_add "+page);
	swipe_manager_pages.push(page);
	swipe_manager_count ++;
}

function swipe_manager_closure()
{
	show_swipe_markers(swipe_manager_pages[0], swipe_manager_pages[1], false);
	show_swipe_markers(swipe_manager_pages[1], false, swipe_manager_pages[0]);

	console.log("swipe_manager_closure");
	console.log(swipe_manager_pages);
}

function swipe_manager_init()
{
	console.log("swipe_manager_init");
	$("body").on("swipeleft", function() 
	{
		console.log("swipe_left "+swipe_manager_index);
		if (swipe_manager_count > 0)
		{
			swipe_manager_index++;
			if (swipe_manager_index >= swipe_manager_count) swipe_manager_index = swipe_manager_count -1;
			show_page(swipe_manager_pages[swipe_manager_index], {transition: 'slide'});
			console.log(swipe_manager_pages[swipe_manager_index]);
		}
		
	});

	$("body").on("swiperight", function() 
	{
		console.log("swipe_right "+swipe_manager_index);
		if (swipe_manager_count > 0)
		{
			swipe_manager_index--;
			if (swipe_manager_index<0) swipe_manager_index=0;
			
			show_page(swipe_manager_pages[swipe_manager_index], {transition: 'slide', reverse: true});
			console.log(swipe_manager_pages[swipe_manager_index]);
		}
	});
	
}