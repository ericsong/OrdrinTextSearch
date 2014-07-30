//
// Collection of functions for traversing menus and extracting data
//

(function(){

  var ordrin = require("ordrin-api"),
      sortUtils = require('./sortUtils'),
      stringUtils = require('./stringUtils'),
      ordrin_api = new ordrin.APIs("8l3kW3pv2UZXOebdQ-YU9qoUeE8GPPzj7_We-WxbKek", ordrin.TEST),
      getMatches,
      crawlMenu,
      findOptions,
      extractTray;
      
  //
  // Public
  //

  /**
  * Calculates the most similar items to target that the restaurant serves
  * @param {Integer} rid - restaurant id of the restaurant to search on
  * @param {String} target - String title of the desired dish. (ex. "Salmon Roll", "Sausage Pizza", etc)
  * @param {Integer} size - Number of matches to return 
  * @param {Function} callback - callback function to run on completion
  * @return {Array} List of top matches. Each list item contains name of dish and tray
  */
  getMatches = function get_matches(options, callback){
    var rid = options.rid,
        target = options.target,
        size = options.size;

    size = typeof size !== 'undefined' ? size : 10;

    ordrin_api.restaurant_details({rid: rid},
      function(err, data){
        var matches;

        matches = crawlMenu({ menu: data.menu, groupLevelMatching: options.groupLevelMatching }, target);		

        for(var i = 0; i < matches.length; i++){
          matches[i].score = sortUtils.calcMatchingScore(target, matches[i].group, matches[i].options);

          var traydata = extractTray(matches[i]);
          matches[i].name = traydata.name;
          matches[i].tray = traydata.tray;
          matches[i].price = traydata.price;
        }

        sortUtils.sortByMatchingScore(matches);
        for(var i = 0; i < matches.length; i++) {
          if(matches[i].group.id === "23290633")
            console.log("found");
        }

        callback(matches);
      }
    );
  }

  /**
   * Takes a menu and returns a list of all orderable items
   * @param {Menu} Menu object from Ordr.in's `Restaurant Details` API call
   * @return {Array} Array of OrderableItem objects. OrderableItem contains name of dish and tray.
   */
  getOrderableItems = function get_orderable_items(menu){
    var groups = menu; 
    var items = [];

    for(var i = 0; i < groups.length; i++){
      var groupitems = groups[i].children;
      for(var j = 0; j < groupitems.length; j++){
        var group_name = stringUtils.cutIndexString(groupitems[j].name);
        if(!groupitems[j].children){
          //if item has no options
          items.push({'name': group_name, 'tray': groupitems[j].id + "/1"});
        }else{
          //item has children 
          var option_groups = groupitems[j].children;
          for(var k = 0; k < option_groups.length; k++){
            var option_items = option_groups[k].children;
            for(var z = 0; z < option_items.length; z++){
              var option_name = stringUtils.cutIndexString(option_items[z].name);
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
  crawlMenu = function crawl_menu(options, target){
    var menu = options.menu,
        groupLevelMatching = options.groupLevelMatching,
        groups = menu, 
        items = [];

    if(typeof(groupLevelMatching) === 'undefined') groupLevelMatching = false;

    //find all orderable group level items
    for(var i = 0; i < groups.length; i++){
      var groupitems = groups[i].children;
      for(var j = 0; j < groupitems.length; j++){
        var group_name = stringUtils.cutIndexString(groupitems[j].name);
        items.push({'name': group_name, 'tray': groupitems[j].id + "/1", 'data': groupitems[j]});
      }
    }

    //find best group match
    items = sortUtils.sortGroupItems(items, target);
    var bestmatches = [];
    for(var i = 0; i < items.length; i++){
      bestmatches.push(items[i].data);
    }

    var matches = [];
    for(var i = 0; i < bestmatches.length; i++){
      if(groupLevelMatching || !bestmatches[i].children) {
        matches.push({
          group: bestmatches[i],
          options: []
        });
      }
      
      if(bestmatches[i].children){
        matches.push({
          group: bestmatches[i],
          options: findOptions(bestmatches[i], target)
        });
      }
    }

    return matches;
  }

  /**
   * Determine which options are wanted
   * @param {GroupItem} group - Group level item from ordr.in's menu. Function will search this group's options
   * @param {String} target - User inputted text decription
   * @return {Array} Array of option level items + score
   */
  findOptions = function find_options(group, target){
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
        option_items[option_items.length-1].score = sortUtils.itemCompare(option_groups[i].children[j].name, target);
      }	

      option_items.sort(function(a, b){
        if(a.score < b.score)
          return -1;
        else if(a.score > b.score)
          return 1;
        else
          return 0;
      });

      //run a loop, if element is > some threshold and items.length < maxitems, add to options
      for(var j = 0; j < option_items.length; j++){
        if(option_items[j].score < 2){
          chosen_options.push(option_items[j]);
          option_items.shift();
          j--;	

          //check if max item length was hit
          if(chosen_options.length === max_items)
            break;
        }
      }

      //if items.length is empty, add the top _minitems_ number of matches
      while(chosen_options.length < min_items){
        if(option_items.length > 0){
          chosen_options.push(option_items.shift());
        } else {
          console.log("breaking");
          break;
        }
      }

      all_options = all_options.concat(chosen_options);
    }
 
    return all_options;
  }

  /**
   * Extract tray and tray's name
   * @param {Selection} selection - {group, options}
   * @return {TrayData} {tray - orderable tray string, name - text description of tray}
   */
  extractTray = function extract_tray(selection){
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

  //Export public functions
  exports.getMatches = getMatches;
  exports.crawlMenu = crawlMenu;
  exports.findOptions = findOptions;
  exports.extractTray = extractTray;
})();
