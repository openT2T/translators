var accessToken = "c.ZaUhrZPr3M0q8LeCjHVmwWygUBhQY3VhjYjQK43mr9alCY13Z87ED8EbYcKGbC9MXMsHvVvTKHAq5HLK7pZeikVpzIDJPrgNWr1SS4HWkB3LpRH3tugesTT21weHLcv0rkw1aeKhGm6mn7sY";
var Firebase = require("firebase");
var ref = new Firebase("https://developer-api.nest.com");
ref.authWithCustomToken(accessToken);
ref.once('value', function (snapshot) {
    var postsData = snapshot.val();
    console.log(postsData);
});