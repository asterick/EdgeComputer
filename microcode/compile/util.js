function each(o, c) {
	if (Array.isArray(o)) {
		o.forEach(c);
	} else {
		Object.keys(o).forEach(function (k) {
			c(o[k], k, o);
		});
	}
}

function range(a, b, s) {
	if (b === undefined) {
		b = a;
		a = 0;
	}

	var o = [];
	s = s || (a < b ? 1 : -1);
	while ((b - a) / s > 0) { o.push(a); a += s; }
	return o;
}

module.exports = {
	range: range,
	each: each
};
