Front = {};

// Make sure all our links call a function on our router
$(document).on('click', 'a', function() {
  Front.navigate(this.href);
  return false;
});

// Determine if browser supports actual links or # links
Front.usePushState = !!(window.history && window.history.pushState)

// Create a Reactive variable data
Front.data = $.Meteor.ReactiveVar([]);
// Create a Reactive variable links
Front.links = $.Meteor.ReactiveVar([]);
// Holder for a template, eventually all templates
Front.templates = {};
// Holder for all of our defined routing rules
Front.routes = []

// Statically set the value of the 'data' reactive variable
Front.data.set([
  {
    slug: "google",
    title: "Google.com"
  },
  {
    slug: "yahoo",
    title: "Yahoo.com"
  }
]);

// Statically set the value of the 'links' reactive variable
Front.links.set([
  {
    slug: "google",
    title: "Google.com"
  },
  {
    slug: "yahoo",
    title: "Yahoo.com"
  }
]);

Front.loadTemplates = function() {
  // Read template in from file
  var jqxhr = $.get('list-template.hbs');
  // When template is loaded
  jqxhr.always(function(template) {
    // Create an object from template
    Front.templates = {
      innerHTML: template,
      name: 'list',
      getAttribute: function(attr) {
        return attr ? this[attr] : -1;
      }
    };
    // Pass a jquery instance of obj to compile it
    // into spacebars and then load the 'list' template
    $("#list")
      .blaze( $(Front.templates).spacebars()['list'] )
      .reactive( 'links', Front.links )
      .render();
  });
}

Front.navigate = function(path) {
  // Fallback check for # url change
  if (Front.usePushState) {
    window.history.pushState({}, "", path)
  } else {
    path = path.replace(/(\/\/|[^\/])*/, "") // If the URL is absolute, make it relative
    window.location.hash = '#' + path
  }
  Front.load();
}

Front.start = function() {
  // Setup all template here
  Front.loadTemplates();
  // Fallback check for # url change
  if (Front.usePushState) {
    $(window).on('popstate', Front.load)
  } else {
    $(window).on('hashchange', Front.load)
  }
  Front.load();
}

Front.load = function() {
  // Fallback check for # url change
  var url;
  if (Front.usePushState) {
    url = location.pathname
  } else {
    url = location.hash.slice(1) || "/"
  }
  for (var i = 0; i < Front.routes.length; i++) {
    var route = Front.routes[i];
    var matches = url.match(route.regexp);
    if (matches) {
      route.callback.apply(null, matches.slice(1));
      return;
    }
  }
}

Front.route = function(path, callback) {
  path = path.replace(/:\w+/g, '([^/?]+)');
  var regexp = new RegExp("^" + path + "$");
  Front.routes.push({
    regexp: regexp,
    callback: callback
  });
}

Front.Router = function(routes) {
  for (var path in routes) {
    var callback = routes[path];
    Front.route(path, callback);
  }
}

new Front.Router({
  '/': function() {
    Front.links.set(
      Front.data.get()
    );
  },
  '/:slug': function(slug) {
    // Set the value of the reactive variable
    Front.links.set([
      _.findWhere(Front.data.get(), { slug: slug })
    ]);
  }
});

Front.start();

if (WebSocket) {
  $("#status").html("Connecting...");

  var connectionReconnector, ws;

  var connect = function() {

    ws = new WebSocket(
      (window.location.protocol.indexOf('https') < 0 ? 'ws' : 'wss')
      + '://' + window.location.hostname
      + (window.location.port == '' ? '' : (':' + window.location.port) )
      + "/" + "ws/"
      + 'Adam' );

    ws.onopen = function() {

      clearInterval(connectionReconnector);

      $("#status").html("Connected");

      setTimeout(function() {

        var messageObject = {
          action: "ping"
        };

        ws.send(
          JSON.stringify(messageObject)
        );

      }, 1000);

    };

    ws.onclose = function() {
      $("#status").html("Disconnected... attempting to reconnect");
      clearInterval(connectionReconnector);
      connectionReconnector = setInterval(connect, 1000);
    };

    ws.onmessage = function(message) {

      var messageObject = JSON.parse(message.data),
          action        = messageObject.action,
          data          = messageObject.data;

      if (action === "pong") {
        setTimeout(function() {
          messageObject.action = "ping";
          ws.send(JSON.stringify(messageObject));
        }, 1000);
      }

      console.log(action, data);

    };
  };

  connect();

} else {
  $("#status").html("Your browser is not supported.");
}
