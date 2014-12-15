node-caldav (Work-in-Progress)
===========

A lightweight Node.JS Caldav Client

Usage
-----------

```sh

var caldav = require("node-caldav");

caldav.getList([caldav_baseurl],[username],[password],callback)

caldav.getEvents([caldav_calendarurl],[username],[password],[startDate],[endDate],callback)

```
