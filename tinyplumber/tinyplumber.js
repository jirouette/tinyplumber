
var TinyPlumber = (function()
{
    var init = function()
    {
        var type = "WebGL";
        if(!PIXI.utils.isWebGLSupported())
          type = "canvas";

        PIXI.utils.sayHello(type);
    };

    return {
        'init': init
    };
})();
