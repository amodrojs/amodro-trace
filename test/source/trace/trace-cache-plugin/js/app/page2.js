//Load common code that includes config, then load the app logic for this page.
requirejs(['app/common'], function (common) {
    requirejs(['app/main2']);
});
