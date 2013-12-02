var System = require("./machine/system.js"),
		template = require("./templates/main.html");

var s = new System();

document.body.innerHTML = template();