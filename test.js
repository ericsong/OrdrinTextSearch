var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app);
var ordrin = require("ordrin-api");
var ld = require("./ld");

var ordrin_api = new ordrin.APIs("8l3kW3pv2UZXOebdQ-YU9qoUeE8GPPzj7_We-WxbKek", ordrin.TEST);

app.configure(function(){
	app.set('port', process.env.PORT || 8000);
	app.set('address', process.env.ADDRESS || 'localhost');
	app.use(express.bodyParser());
});

app.get('/TextSearch', function(req, res){
	var rid = req.query.rid;
	var target = req.query.target;
	var size = req.query.size;


	getTrays(rid, target, size, 
		function(data){
			res.send(data);
		}
	);
});

server.listen(app.get('port'), function(){
	console.log("Listening on port " + app.get('port'));
});

/**
 * Calculates the most similar items to target that the restaurant serves
 * @param {Integer} rid - restaurant id of the restaurant to search on
 * @param {String} target - String title of the desired dish. (ex. "Salmon Roll", "Sausage Pizza", etc)
 * @param {Integer} size - Number of matches to return 
 * @param {Function} callback - callback function to run on completion
 * @return {Array} List of top matches. Each list item contains name of dish and tray
 */
function getTrays(rid, target, size, callback){
	size = typeof size !== 'undefined' ? size : 10;

	ordrin_api.restaurant_details({rid: rid},
		function(err, data){
			var matches;

			var items = sortItems(getOrderableItems(data.menu), target);
			matches = items.slice(0, size);

			callback(matches);
		}
	);
}

/**
 * Takes a menu and returns a list of all orderable items
 * @param {Menu} Menu object from Ordr.in's `Restaurant Details` API call
 * @return {Array} Array of OrderableItem objects. OrderableItem contains name of dish and tray.
 */
function getOrderableItems(menu){
	var groups = menu; 
	var items = [];

	for(var i = 0; i < groups.length; i++){
		var groupitems = groups[i].children;
		for(var j = 0; j < groupitems.length; j++){
			var group_name = cutIndex(groupitems[j].name);
			if(!groupitems[j].children){
				//if item has no options
				items.push({'name': group_name, 'tray': groupitems[j].id + "/1"});
			}else{
				//item has children 
				var option_groups = groupitems[j].children;
				for(var k = 0; k < option_groups.length; k++){
					var option_items = option_groups[k].children;
					for(var z = 0; z < option_items.length; z++){
						var option_name = cutIndex(option_items[z].name);
						items.push({'name': option_name + " " + group_name, 'tray': groupitems[j].id + "/9," + option_items[z].id});
					}
				}
			}
		}
	}

	return items;
}

/**
 * Sorting function for OrderableItems
 * @param {Array} items - Array of OrderableItems
 * @param {String} target - String description of dish to match to
 * @return {Array} `items` sorted by best match to least
 */
function sortItems(items, target){
	return items.sort(
		function(a, b){
			if(ld.compScore(target, a.name) <= ld.compScore(target, b.name))
				return -1;
			else
				return 1;	
		}
	);
}

/**
 * Cuts index off a menu item if it exists   //needs a lot of work. currently only works for *most* cases when separated by a period
 * @param {String} name  Menu item
 * @return {String} `name` without index
 */
function cutIndex(name){
	var index_pos = name.indexOf('.');

	if(index_pos == 0 || index_pos == name.length){
		//no index detected or period at the very of the string...
		return name;
	}else{
		var index = name.substring(0, index_pos); 	
		var postindex = name.substring(index_pos+1);
		
		if(checkIndexString(index)){
			return postindex.trim();
		}else{
			return name;
		}
	}
}

/**
 * Checks if str is an index to a menu item (ex. 2, 4, 10, A, B, C1, etc) 
 * @param {String} str
 * @return {Boolean} True if `str` is an index, False otherwise
 */
function checkIndexString(str){
	if(str.length > 4){
		return false;
	}else if(hasLowerCase(str) && hasUpperCase(str)){
		return false;
	}else{
		return true;
	}
}

/**
 * Checks if str contains a lower case char
 * @param {String} str
 * @return {Boolean} True if `str` contains a lowercase char, False otherwise
 */
function hasLowerCase(str){
	if(str.toUpperCase() != str){
		return true;
	}else{
		return false;
	}
}

/**
 * Checks if str contains an upper case char
 * @param {String} str
 * @return {Boolean} True if `str` contains an uppercase char, False otherwise
 */
function hasUpperCase(str){
	if(str.toLowerCase() != str){
		return true;
	}else{
		return false;
	}
}

/*
			ordrin_api.order_guest(
				{
					rid: rid,
					tray: tray,
					tip: '10.05',
					delivery_date: 'ASAP',
					delivery_time: 'ASAP',
					first_name: 'Eric',
					last_name: 'Song',
					addr: '902 Broadway',
					city: 'New York',
					state: 'NY',
					zip: '10010',
					phone: '212-555-1212',
					em: 'regonics@gmail.com',
					card_name: 'Eric Song',
					card_number: '4111111111111111',
					card_cvc: '173',
					card_expiry: '01/2018',
					card_bill_addr: '14 Mary Ellen Drive',
					card_bill_city: 'Edison',
					card_bill_state: 'NJ',
					card_bill_zip: '08820',
					card_bill_phone: '2018938715'
				},
				function(err, data){
					console.log(err);
					console.log(data);
				}
			);
*/


