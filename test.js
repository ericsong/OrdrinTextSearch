var ordrin = require("ordrin-api");

var ordrin_api = new ordrin.APIs("8l3kW3pv2UZXOebdQ-YU9qoUeE8GPPzj7_We-WxbKek", ordrin.TEST);

var rid = "23878";

ordrin_api.restaurant_details({rid: rid},
	function(err, data){
		var groups = data.menu; 
		var items = [];

		for(var i = 0; i < groups.length; i++){
			var groupitems = groups[i].children;
			for(var j = 0; j < groupitems.length; j++){
				if(!groupitems[j].children){
					//if item has no options
					items.push(groupitems[j].name);
				}else{
					//item has children 
					var group_name = groupitems[j].name;
					var option_groups = groupitems[j].children;
					for(var k = 0; k < option_groups.length; k++){
						var option_items = option_groups[k].children;
						for(var z = 0; z < option_items.length; z++){
							var option_name = option_items[z].name;
							console.log(option_name + " " + group_name);
						}
					}
				}
			}
		}

		console.log(items);
	}
);

/*
//test orders
var orders = [];
orders.push('cucumber roll');

ordrin_api.restaurant_details({rid: rid},  
	function(err, data){
		var menu = data.menu;
		//create function that can iterate through entire menu tree

		console.log(findItemMatch(menu, orders[0]));
	}
);

function findItemMatch(menu, target){
	target = target.toLowerCase();

	var finds = [];
	var stack = [];
	for(var i = 0; i < menu.length; i++){
		stack.push(menu[i]);
	}

	//find items that match the target
	while(stack.length != 0){
		var item = stack.pop();
		var compString = item.name.toLowerCase();

		if(compString.indexOf(target) != -1){
			finds.push(item);
		}	


		if(item.children){
			for(var i = 0; i < item.children.length; i++){
				stack.push(item.children[i]);
			}
		}
	}

	////filter matches
	//remove 0.00 prices
	var nonDeals = [];
	for(var i = 0; i < finds.length; i++){
		if(!(finds[i].price === '0.00'))
			nonDeals.push(finds[i]);	
	}
	finds = nonDeals;

	//remove duplicates
	var uniques = [];
	for(var i = 0; i < finds.length; i++){
		//check if item already exists in uniques
		var unique = true;
		for(var j = 0; j < uniques.length; j++)
			if(uniques[j].name === finds[i].name)
				unique = false;		

		if(unique)
			uniques.push(finds[i]);
	}
	finds = uniques;

	//find shortest match
	var shortest;
	var s_length = 100000;

	for(var i = 0; i < finds.length; i++){
		if(finds[i].name.length < s_length){
			shortest = finds[i];
			s_length = shortest.name.length;
		}
	}

	return shortest;
}
*/
