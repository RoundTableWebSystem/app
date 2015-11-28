var global_db_handle = null;

function db_get()
{

	var db = global_db_handle;
	if (db == null)
	{
		try
		{
			db = window.openDatabase(DATABASE_NAME, DATABASE_VERSION, DATABASE_DISPLAY, DATABASE_SIZE);
		}
		catch (err)
		{
			console.log(err);
			db = null;
		}
		
		global_db_handle = db;
	}
	return db;
}

function db_transaction(func)
{
	var db = db_get();
	if (db)
	{
		db.transaction(func, 
		function(err){ console.log("db_transaction: error"); console.log(err);},
		function(){ console.log("db_transaction: completed"); }
		);
	}
}

function db_read_transaction(func)
{
	var db = db_get();
	if (db)
	{
		db.readTransaction(func, 
		function(err){ console.log("db_read_transaction: error"); console.log(err);},
		function(){ console.log("db_read_transaction: completed"); }
		);
	}
}


function db_drop_table(name)
{
	db_transaction(function(tx)
	{
		var sql = "DROP TABLE IF EXISTS "+name;
		tx.executeSql(sql);
	});
}

function db_create_table(name, fields)
{
	db_transaction(function(tx)
	{
		var fields_string = fields.join();
		
		var sql = "DROP TABLE IF EXISTS "+name;
		tx.executeSql(sql);
		
		sql = "CREATE TABLE IF NOT EXISTS "+name+" ("+fields_string+")";
		tx.executeSql(sql);
	});
}

function db_get_data(sql, params, func)
{
	db_read_transaction(function(tx)
	{
		tx.executeSql(sql, params, function(tx,result) 
		{ 
			func(result.rows);
		},
		function(err)
		{
			console.log("db_get_data");
			console.log(err);
		});
	});
}

function db_put_one_row(tx, table, data)
{
	var fields = [];
	var values = [];
	var values_dummy = [];
	var data_expand = [];
	$.each(data, function(k,v) 
	{
		fields.push(k);
		values.push(v);
		values_dummy.push('?');
	});
	
	var fields_string = fields.join();
	var values_dummy_string = values_dummy.join();
	
	var sql = "INSERT INTO "+table+" ("+fields_string+") VALUES ("+values_dummy_string+")";
	tx.executeSql(sql, values);	
}

function db_put_data(table, data)
{
	if (Array.isArray(data))
	{
		db_transaction(function(tx)
		{
			for (var i=0; i<data.length; ++i)
			{
				db_put_one_row(tx, table, data[i]);
			}
		});
	}
	else
	{
		db_transaction(function(tx)
		{
			db_put_one_row(tx, table, data);
		});
	}
}