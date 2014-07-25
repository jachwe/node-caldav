"use strict";

var https = require("https");
var xmljs = require("libxmljs");

module.exports = {

  /**
   * Get a list of Folders/Calendars from a given url
   *
   * @param  {String} url
   * @param  {String} user
   * @param  {String} pass
   * @param  {function} cb

   */

  getList: function (url, user, pass, cb) {

    var urlparts = /(https?)\:\/\/(.*?):?(\d*)?(\/.*\/?)/gi.exec(url);
    var protocol = urlparts[1];
    var host = urlparts[2];
    var port = urlparts[3] || (protocol === "https" ? 443 : 80);
    var path = urlparts[4];

    var xml = '<?xml version="1.0" encoding="utf-8" ?>\n' +
      ' <D:propfind xmlns:D="DAV:" xmlns:C="http://calendarserver.org/ns/">\n' +
      '     <D:prop>\n' +
      '             <D:displayname />\n' +
      '     </D:prop>\n' +
      ' </D:propfind>';

    var options = {
      rejectUnauthorized: false,
      hostname          : host,
      port              : port,
      path              : path,
      method            : 'PROPFIND',
      headers           : {
        "Content-type"  : "text/xml",
        "Content-Length": xml.length,
        "User-Agent"    : "calDavClient",
        "Connection"    : "close",
        "Depth"         : "1"
      }
    };

    if (user && pass) {
      var userpass = new Buffer(user + ":" + pass).toString('base64');
      options.headers["Authorization"] = "Basic " + userpass;
    }


    var req = https.request(options, function (res) {
      var s = "";
      res.on('data', function (chunk) {
        s += chunk;
      });

      req.on('close', function () {
        var reslist = [];
        try {
          var xmlDoc = xmljs.parseXml(s);
          // console.log(xmlDoc.toString() );
          var resp = xmlDoc.find("a:response", { a: 'DAV:'});
          for (var i in resp) {
            var el = resp[i];
            var href = el.get("a:href", { a: 'DAV:'});
            var dspn = el.get("a:propstat/a:prop/a:displayname", { a: 'DAV:'});
            if (dspn) {
              var resobj = {};
              resobj.displayName = dspn.text();
              resobj.href = href.text();
              reslist.push(resobj);
            }
          }
        }
        catch (e) {
          console.log("Error parsing response")
        }

        cb(reslist);

      });
    });

    req.end(xml);

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
    });

  },

  /**
   * Get a list of Events from a given Calendarurl
   *
   * @param  {String} url
   * @param  {String} user
   * @param  {String} pass
   * @param  {function} cb

   */
  getEvents: function (url, user, pass, cb) {

    var urlparts = /(https?)\:\/\/(.*?):?(\d*)?(\/.*\/?)/gi.exec(url);
    var protocol = urlparts[1];
    var host = urlparts[2];
    var port = urlparts[3] || (protocol === "https" ? 443 : 80);
    var path = urlparts[4];

    var xml = '<?xml version="1.0" encoding="utf-8" ?>\n' +
      '<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">\n' +
      '  <D:prop>\n' +
      '    <C:calendar-data/>\n' +
      '  </D:prop>\n' +
      '  <C:filter>\n' +
      '    <C:comp-filter name="VCALENDAR">\n' +
      '      <C:comp-filter name="VEVENT">\n' +
      '        <C:time-range start="20140617T112033Z"/>\n' +
      '      </C:comp-filter>\n' +
      '    </C:comp-filter>\n' +
      '  </C:filter>\n' +
      '</C:calendar-query>';

    var options = {
      rejectUnauthorized: false,
      hostname          : host,
      port              : port,
      path              : path,
      method            : 'REPORT',
      headers           : {
        "Content-type"  : "text/xml",
        "Content-Length": xml.length,
        "User-Agent"    : "calDavClient",
        "Connection"    : "close",
        "Depth"         : "1"
      }
    };

    if (user && pass) {
      var userpass = new Buffer(user + ":" + pass).toString('base64');
      options.headers["Authorization"] = "Basic " + userpass;
    }

    var req = https.request(options, function (res) {
      var s = "";
      res.on('data', function (chunk) {
        s += chunk;
      });

      req.on('close', function () {
        var reslist = [];
        try {
          var xmlDoc = xmljs.parseXml(s);
          // console.log(xmlDoc.toString() );
          var data = xmlDoc.find("a:response/a:propstat/a:prop/c:calendar-data", { a: 'DAV:', c: "urn:ietf:params:xml:ns:caldav" });
          for (var i in data) {
            var ics = data[i].text();
            var evs = ics.match(/BEGIN:VEVENT[\s\S]*END:VEVENT/gi);
            for (var x in evs) {
              var evobj = {};
              var evstr = evs[x];
              evstr = evstr.split("\n");
              for (var y in evstr) {
                var evpropstr = evstr[y];
                if (evpropstr.match(/BEGIN:|END:/gi)) {
                  continue;
                }
                var sp = evpropstr.split(":");
                var key = sp[0];
                var val = sp[1];
                if (key && val) {
                  evobj[key] = val;
                }

              }
              reslist.push(evobj)
            }

          }
          cb(reslist);
        }
        catch (e) {
          console.log("Error parsing response")
        }

      });
    });

    req.end(xml);

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
    });

  }
};