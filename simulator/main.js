var external = require("./machine/external.js"),
		System = require("./machine/system.js"),
		gui = require("./gui.js");


external.then(function () {
	var s = new System(gui.canvas);
	gui.bind(s);
	gui.update();
});
