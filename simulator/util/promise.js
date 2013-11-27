// Minimal promise model
function promise(context) {
	var that = {},
			_successListen = [],
			_errorListen = [],
			_success, _error;

	function onSuccess() {
		_success = arguments;
		_successListen.forEach(function (l) {
			l.apply(that, _success);
		});
		_successListen = null;
	}

	function onFail() {
		_error = arguments;
		_errorListen.forEach(function (l) {
			l.apply(that, _error);
		});
		_errorListen = null;
	}

	function listen(result, listeners, args) {
		if (result) {
			Array.prototype.slice.call(args, 0).forEach(function (a) {
				a.apply(that, result);
			});
		} else {
			listeners.push.apply(listeners, args);
		}
		return that;
	}

	that.success = function() { return listen(_success, _successListen, arguments); };
	that.failure = function () { return listen(_error, _errorListen, arguments); };

	that.then = function (yay, nay) {
		that.success(yay);
		if (nay) { that.failure(nay); }
		return that;
	};

	context.call(that, onSuccess, onFail);

	return that;
}

promise.all = function (a) {
	var all = Array.isArray(a) ? a : Array.prototype.slice.call(arguments, 0);

	return promise(function (success, failure) {
		var pending = all.length,
				responses = [],
				failed;

		all.forEach(function (p, i) {
			p.then(function () {
				responses[i] = arguments;
				if (!--pending) {
					success.apply(null, responses);
				}
			}, function () {
				if (failed) { return ; }
				failed = true;
				failure.apply(null, [i].concat(Array.prototype.slice.call(arguments, 0)));
			});
		});
	});
};

module.exports = promise;
