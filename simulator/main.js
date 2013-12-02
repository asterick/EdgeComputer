var System = require("./machine/system.js"),
		gui = require("./gui.js");

gui.bind(new System());
setTimeout(gui.update, 100);