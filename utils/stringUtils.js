//
// Collection of functions used to manipulate strings
//

(function(){

  var ld = require('./ld'), 
      tokenize,
      cutIndexString,
      checkIfIndexString,
      hasLowerCase,
      hasUpperCase;

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
  exports.cutIndexString = cutIndexString;
})();
