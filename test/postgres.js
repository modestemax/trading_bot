var sys = require("sys");
var pg = require("postgres-pure");

var db = new pg.connect("pgsql://postgres:ameen*3n@localhost:5432/mbot");
db.query("SELECT * FROM pair", function (data) {
    console.log(data);
});
db.close();