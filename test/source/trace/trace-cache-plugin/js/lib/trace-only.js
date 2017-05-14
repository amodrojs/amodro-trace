// This dep only exists in the already-traced.json cache file, not a real
// dependency. So if this file is present in the output, we know the trace
// cache was used.
define({
	name: 'trace-only'
});
