//
// Collection of functions used to manipulate strings
//

(function(){

  var _ = require('underscore'),
      ld = require('./ld'), 
      tokenize,
      optimizeTarget,
      cutIndexString,
      checkIfIndexString,
      hasLowerCase,
      hasUpperCase,
      optimizeDebug = false,
      stop_words = ['and', 'with', 'or'],
      stop_words_regexp; 

  //
  // Init
  //
  stop_words_regexp = "\\b\(";
  stop_words_regexp += _.reduce(stop_words, function(memo, word){ return memo + word + '|' ;}, '');
  stop_words_regexp = stop_words_regexp.substring(0, stop_words_regexp.length-1);
  stop_words_regexp += "\)\\b";
  stop_words_regexp = new RegExp(stop_words_regexp, 'gi');

  //
  //Public
  //

  /**
   * Get a string's words
   * @param {String} str
   * @return {Array} Array containing all words in `str`
   */
  tokenize = function _tokenize(str){
    return str.split(" ");
  }

  /**
   * Return an optimized version of the string to be used for matching 
   * @param {String} target
   * @return {String} optimized target
   */
  optimizeTarget = function optimize_target(target) {
    if(optimizeDebug) {
      console.log("Input target: \t\t\t" , target);
    }

    //replace some special characters ['-'] with ' '
    target = target.replace(/-/gi, ' ');
    if(optimizeDebug) {
      console.log("- replace with ' ': \t\t" , target);
    }
        
    //remove special characters
    target = target.replace(/[^\w\s]/gi, '');
    if(optimizeDebug) {
      console.log("Special chars removed: \t\t" , target);
    }
 
    //remove stop words
    target = target.replace(stop_words_regexp, '');
    if(optimizeDebug) {
      console.log("removed stop words: \t\t" , target);
    }

    //remove () []
    if(optimizeDebug) {
      console.log("removed () []: \t\t\t" , target);
    }

    //remove runs of blank characters
    target = target.replace(/\s+/g, ' ');
    if(optimizeDebug) {
      console.log("blank char runs removed: \t" , target);
    } 

    //upper case all
    target = target.toUpperCase();
    if(optimizeDebug) {
      console.log("upper cased: \t\t\t" , target);
    }

    return target;
  }

  console.log(optimizeTarget("Glazed---Donut's! and Cupcakes"));
  

  /**
   * Cuts index off a menu item if it exists   //needs a lot of work. currently only works for *most* cases when separated by a period
   * @param {String} name  Menu item
   * @return {String} `name` without index
   */
  cutIndexString = function cut_index_string(name){
    var index_pos = name.indexOf('.');

    if(index_pos == 0 || index_pos == name.length){
      //no index detected or period at the very of the string...
      return name;
    }else{
      var index = name.substring(0, index_pos); 	
      var postindex = name.substring(index_pos+1);
      
      if(checkIfIndexString(index)){
        return postindex.trim();
      }else{
        return name;
      }
    }
  }

  //
  // Private
  //

  /**
   * Checks if str is an index to a menu item (ex. 2, 4, 10, A, B, C1, etc) 
   * @param {String} str
   * @return {Boolean} True if `str` is an index, False otherwise
   */
  checkIfIndexString = function check_if_index_string(str){
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
  hasLowerCase = function has_lower_case(str){
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
  hasUpperCase = function has_upper_case(str){
    if(str.toLowerCase() != str){
      return true;
    }else{
      return false;
    }
  }

  //Export public functions
  exports.tokenize = tokenize;
  exports.optimizeTarget = optimizeTarget;
  exports.cutIndexString = cutIndexString;
})();
