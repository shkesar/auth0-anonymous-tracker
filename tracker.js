(function(){
  window.getTracker = function (callback) {
    // call endpoint to get tracker data
    $.ajax({
      url: '@@URL',
      dataType: 'json',
      xhrFields: { withCredentials: true }
    }).done(function (tracker) {
      callback(null, tracker);
    });
  };
})();
