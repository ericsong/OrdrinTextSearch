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

	getMatches(rid, target, size, 
		function(data){
			res.send(data);
		}
	);
});

app.get('/testOrder', function(req, res){
   	var rid = req.query.rid;
	var tray = req.query.tray;

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
function getMatches(rid, target, size, callback){
	size = typeof size !== 'undefined' ? size : 10;

	ordrin_api.restaurant_details({rid: rid},
		function(err, data){
			var matches;

	/*
			matches = sortItems(getOrderableItems(data.menu), target).slice(0, 5);
			for(var i = 0; i < 5; i++){
				matches[i].score = calcMatchingScore(target, matches[i]);
			}

			matches = matches.concat(crawl_menu(data.menu, target));
	*/

			matches = crawl_menu(data.menu, target);		
			for(var i = 0; i < matches.length; i++){
				matches[i].score = calcMatchingScore(target, matches[i].group, matches[i].options);

				var traydata = extractTray(matches[i]);
				matches[i].name = traydata.name;
				matches[i].tray = traydata.tray;
				matches[i].price = traydata.price;
			}

			sortByMatchingScore(matches);

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
 * Find matches by intelligently "reading" through the menu and adding options as needed
 * @param {Menu} Menu object from Ordr.in's `Restaurant Details` API call
 * @param {String} target - user inputted text description
 * @return {Array} Array of matches {group - groupitem, options - optionitems}
 */
function crawl_menu(menu, target){
	var groups = menu; 
	var items = [];

	//find all orderable group level items
	for(var i = 0; i < groups.length; i++){
		var groupitems = groups[i].children;
		for(var j = 0; j < groupitems.length; j++){
			var group_name = cutIndex(groupitems[j].name);
			items.push({'name': group_name, 'tray': groupitems[j].id + "/1", 'data': groupitems[j]});
		}
	}

	//find best group match
	items = sortGroupItems(items, target);
	var bestmatches = [];
	for(var i = 0; i < items.length; i++){
		bestmatches.push(items[i].data);
	}

	var matches = [];
	for(var i = 0; i < bestmatches.length; i++){
		if(!bestmatches[i].children){
			matches.push({
				group: bestmatches[i],
			    	options: []
			});
		}else{
			matches.push({
				group: bestmatches[i],
				options: findOptions(bestmatches[i], target)
			});
		}
	}

	return matches;
}

/**
 * Extract tray and tray's name
 * @param {Selection} selection - {group, options}
 * @return {TrayData} {tray - orderable tray string, name - text description of tray}
 */
function extractTray(selection){
	//generate tray name
	var tray_name = "";

	tray_name = selection.group.name;
	
	if(selection.options.length > 0){
		tray_name += " with";
		for(var i = 0; i < selection.options.length; i++){
			tray_name += " " + selection.options[i].name + " and";
		}

		tray_name = tray_name.slice(0, tray_name.length - 4);
	}

	//generate tray string
	var tray_string = "";
	
	tray_string = selection.group.id + "/1";

	for(var i = 0; i < selection.options.length; i++){
		tray_string += "," + selection.options[i].id;
	}
	
	//calculate price
	var price = 0;

	price = parseFloat(selection.group.price);
	for(var i = 0; i < selection.options.length; i++){
		price += parseFloat(selection.options[i].price);
	}

	return {name: tray_name, tray: tray_string, price: price.toFixed(2)};	
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
 * Sort array of group level items 
 * @param {Array} items - array of menu group level items
 * @param {String} target - user inputted text description
 * @return {Array} `items` sorted from best match to least
 */
function sortGroupItems(items, target){
	return items.sort(
		function(a, b){
			if(groupCompare(a.name, target) < groupCompare(b.name, target))
	    			return 1;
			else
	    			return -1;
		}		    
	);
}

/**
 * Calculate a score for how well a menu group's name matches a text
 * @param {String} str - Group menu's name
 * @param {String} target - User inputted text description
 * @return {Number} score value. Higher is better
 */
function groupCompare(str, target){
	var score = 0;
	var target_tokens = target.split(" ");
	var targets = [];

	for(var i = 0; i < target_tokens.length; i++){	
		var new_target = "";
		for(var j = i; j < target_tokens.length; j++){
			new_target += target_tokens[j] + " ";
		}

		targets.push(new_target.trim());
	}

	for(var i = 0; i < targets.length; i++){
	    	var target_string = targets[i];
		for(var j = 0; j < str.length - target_string.length; j++){
		    	var str_string = str.substring(j, j+ target_string.length);

			var ld_score = ld.levDist(str_string, target_string);
			var c_score = target_string.length / (ld_score + 1);

			if(c_score > score)
				score = c_score;
		}
	}

	return score;
}

/**
 * Determine which options are wanted
 * @param {GroupItem} group - Group level item from ordr.in's menu. Function will search this group's options
 * @param {String} target - User inputted text decription
 * @return {Array} Array of option level items + score
 */
function findOptions(group, target){
	var option_groups = group.children;
	var all_options = [];	

	//add best matching sub options	
	for(var i = 0; i < option_groups.length; i++){
		var chosen_options = [];

		//determine max/min options
		var max_items = option_groups[i].max_child_select;
		var min_items = option_groups[i].min_child_select;

		//add all suboptions and generate a matching score
		var option_items = [];
		for(var j = 0; j < option_groups[i].children.length; j++){
		    	option_items.push(option_groups[i].children[j]);
			option_items[option_items.length-1].score = itemCompare(option_groups[i].children[j].name, target);
		}	

		option_items.sort(function(a, b){
			if(a.score < b.score)
				return -1;
			else if(a.score > b.score)
				return 1;
			else
				return 0;
		});

		console.log(option_items[0]);
		console.log(option_items[1]);
		console.log(option_items[2]);

		//run a loop, if element is > some threshold and items.length < maxitems, add to options
		for(var j = 0; j < option_items.length; j++){
			if(option_items[j].score < 2){
				chosen_options.push(option_items[j]);
				option_items.shift();
				j--;	

				//check if max item length was hit
				if(chosen_options.length == max_items)
					break;
			}
		}

		//if items.length is empty, add the top _minitems_ number of matches
		while(chosen_options.length < min_items){
			chosen_options.push(option_items.shift());
		}
	
		all_options = all_options.concat(chosen_options);
	}

	return all_options;
}

/**
 */
function itemCompare(str, target){
	var score = 9999999999;

	for(var i = 0; i < target.length - str.length; i++){
		var target_substring = target.substring(i, i + str.length);
		var ld_score = ld.levDist(str, target_substring);
		if(ld_score < score)
			score = ld_score;
	}

	return score;
}

/**
 * Get a string's words
 * @param {String} str
 * @return {Array} Array containing all words in `str`
 */
function tokenize(str){
	return str.split(" ");
}

/**
 * Calculate a score representing how well group/option combination matches to target
 * @param {String} target - User inputted text description
 * @param {GroupItem} group - Group level item from ordr.in's menu
 * @param {Array} options - Array of option level items from ordr.in's menu
 * @return {MatchingScore} hit_score - number of tokens in `target` that matched, miss_score - number of tokens in `group` and `options` that missed, size_score - string length of `group` and `options`
 */
function calcMatchingScore(target, group, options){
	if(typeof(options)==='undefined') options = [];

	//tokenize target
	var target_tokens = tokenize(target);
	var match_tokens = tokenize(group.name);

	for(var i = 0; i < options.length; i++){
		match_tokens = match_tokens.concat(tokenize(options[i].name));
	}

	//number of tokens in target that get matched under group/items
	var hit_score = 0;
	for(var i = 0; i < target_tokens.length; i++){
		for(var j = 0; j < match_tokens.length; j++){
			if(isWordMatch(target_tokens[i], match_tokens[j])){
				hit_score++;
				break;
			}	    
		}
	}

	//number of tokens in group/items that do not matched in target
	var miss_score = 0;
	for(var i = 0; i < match_tokens.length; i++){
	    	var hit = false;
		for(var j = 0; j < target_tokens.length; j++){
			if(isWordMatch(match_tokens[i], target_tokens[j])){
				hit = true;
			}
		}

		if(!hit)
		    miss_score++;
	}	    

	var size_score = group.name.length;
	for(var i = 0; i < options.length; i++)
		size_score += options[i].name.length;

	return {hit_score: hit_score, miss_score: miss_score, size_score: size_score};
}


/**
 * Sort an array based on its "Matching Score"
 * @param {Array} items
 * @param {Array} `items` sorted from best match to least
 */
function sortByMatchingScore(items){
	return items.sort(
		function(a, b){
			if(a.score.hit_score < b.score.hit_score){
	    			return 1;
			}else if(a.score.hit_score > b.score.hit_score){
	    			return -1;
			}else{
				if(a.score.miss_score > b.score.miss_score){
					return 1;
				}else if(a.score.miss_score < b.score.miss_score){
				   	return -1; 
				}else{
					if(a.score.size_score > b.score.size_score){
						return 1;	
					}else if(a.score.size_score < b.score.size_score){
						return -1;
					}else{
						return 0;
					}
				}
			}
		}		    
	);
}

/**
 * Checks if two words are the same while accounting for spelling errors
 * @param {String} a
 * @param {String} b
 * @param {Boolean} True is similar, False if not
 */
function isWordMatch(a, b){
	var min_length = (a.length < b.length) ? a.length : b.length;
	var error_margin;

	if(min_length < 5)
		error_margin = 0;
	else if(min_length < 8)
	    	error_margin = 1;
	else
	    	error_margin = 2;


	var ld_score = ld.levDist(a, b);
	
	if(ld_score <= error_margin)
	    return true;
	else
	    return false;
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
