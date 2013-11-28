var promise = require("./promise.js");

function read(url) {
	return promise(function (pass, fail) {
		var xhr = new XMLHttpRequest();

		xhr.responseType = "arraybuffer";
		xhr.open("GET", url, true);
		xhr.send();

		xhr.onreadystatechange = function () {
			if (xhr.readyState !== 4) {
				return ;
			} else if (xhr.status !== 200) {
				fail(xhr.status);
			}

			pass(xhr.response);
		};
	});
}

module.exports = {
	read: read
};
