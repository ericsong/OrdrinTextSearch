//
// Collection of functions used for comparing and sorting various items
//

(function(){

  var ld = require('./ld'),
      stringUtils = require('./stringUtils'),
      isWordMatch,
      sortItems,
      sortGroupItems,
      groupCompare,
      itemCompare,
      calcMatchingScore,
      sortByMatchingScore;
  
  //
  // Public
  //

  /**
   * Sorting function for OrderableItems
   * @param {Array} items - Array of OrderableItems
   * @param {String} target - String description of dish to match to
   * @return {Array} `items` sorted by best match to least
   */
  sortItems = function sort_items(items, target){
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
   * Checks if two words are the same while accounting for spelling errors
   * @param {String} a
   * @param {String} b
   * @param {Boolean} True is similar, False if not
   */
  isWordMatch = function is_word_match(a, b){
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
   * Sort array of group level items 
   * @param {Array} items - array of menu group level items
   * @param {String} target - user inputted text description
   * @return {Array} `items` sorted from best match to least
   */
  sortGroupItems = function sort_group_items(items, target){
    target = stringUtils.optimizeTarget(target);
    return items.sort(
      function(a, b){
        if(groupCompare(stringUtils.optimizeTarget(a.name), target) < groupCompare(stringUtils.optimizeTarget(b.name), target))
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
  groupCompare = function group_compare(str, target){
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
   */
  itemCompare = function item_compare(str, target){
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
   * Calculate a score representing how well group/option combination matches to target
   * @param {String} target - User inputted text description
   * @param {GroupItem} group - Group level item from ordr.in's menu
   * @param {Array} options - Array of option level items from ordr.in's menu
   * @return {MatchingScore} hit_score - number of tokens in `target` that matched, miss_score - number of tokens in `group` and `options` that missed, size_score - string length of `group` and `options`
   */
  calcMatchingScore = function calc_matching_score(target, group, options){
    if(typeof(options)==='undefined') options = [];

    //tokenize target
    var target_tokens = stringUtils.tokenize(target);
    var match_tokens = stringUtils.tokenize(group.name);

    for(var i = 0; i < options.length; i++){
      match_tokens = match_tokens.concat(stringUtils.tokenize(options[i].name));
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
  sortByMatchingScore = function sort_by_matching_score(items){
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

  //Export public functions
  exports.isWordMatch = isWordMatch; 
  exports.sortItems = sortItems; 
  exports.sortGroupItems = sortGroupItems; 
  exports.groupCompare = groupCompare; 
  exports.itemCompare = itemCompare; 
  exports.calcMatchingScore = calcMatchingScore; 
  exports.sortByMatchingScore = sortByMatchingScore; 
})();
