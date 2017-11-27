"use strict";

const LEFT = 37;
const RIGHT = 39;

class InteractiveSprite extends PIXI.Sprite
{
    constructor(app, texture)
    {
        super(texture);
        this.app = app;
        this.speed_x = 0;
        this.speed_y = 0;
    }

    onFrame()
    {
        this.x += this.speed_x;
        this.y += this.speed_y;
    }

    onKeyDown(event)
    {
        if (this.app.debug)
            console.log("onKeyDown"+event);
    }

    onKeyUp(event)
    {
        if (this.app.debug)
            console.log("onKeyDown"+event);
    }
}

class Plumber extends InteractiveSprite
{
    onFrame()
    {
        let maxspeed = 16;
        let acceleration = 2;
        let deceleration = 1;
        let leftDown = this.app.isKeyDown(LEFT);
        let rightDown = this.app.isKeyDown(RIGHT);

        if (leftDown && rightDown && this.speed_x)
        {
            this.speed_x += (this.speed_x > 0) ? -deceleration : deceleration;
        }
        else
        {
            this.speed_x += rightDown ? acceleration : (this.speed_x > 0) ? -deceleration : 0;
            this.speed_x += leftDown ? -acceleration : (this.speed_x < 0) ? deceleration : 0;
        }

        if (this.speed_x > maxspeed)
            this.speed_x = maxspeed;
        if (this.speed_x < -maxspeed)
            this.speed_x = -maxspeed;

        super.onFrame();
    }

};

class TinyPlumber
{
    constructor(debug = false)
    {
        this.keys = {};
        this.debug = debug;
        PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
        this.app = new PIXI.Application({transparent: true});
        document.body.appendChild(this.app.view);

        PIXI.loader
            .add("mario", "images/mario.png")
            .add("background", "images/background.png")
            .load((loader, resources) => this.onLoaded(loader, resources));
    }

    onLoaded(loader, resources)
    {
        this.plumber = new Plumber(this, resources.mario.texture);
        this.plumber.texture.frame = new PIXI.Rectangle(197, 48, 14, 28);

        this.plumber.x = 200;
        this.plumber.y = 470;
        this.plumber.width *= 3;
        this.plumber.height *= 3;

        this.app.stage.addChild(new PIXI.Sprite(resources.background.texture));
        this.app.stage.addChild(this.plumber);

        this.onFrame();
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onFrame()
    {
        window.requestAnimationFrame(() => this.onFrame());
        this.plumber.onFrame();
    }

    onKeyDown(event)
    {
        this.keys[event.keyCode] = true;
        for (let i in this.app.stage.children)
            if (this.app.stage.children[i] instanceof InteractiveSprite)
                this.app.stage.children[i].onKeyDown(event);
    }

    onKeyUp(event)
    {
        this.keys[event.keyCode] = false;
        for (let i in this.app.stage.children)
            if (this.app.stage.children[i] instanceof InteractiveSprite)
                this.app.stage.children[i].onKeyUp(event);
    }

    isKeyDown(keyCode)
    {
        return keyCode in this.keys != -1 && this.keys[keyCode];
    }
}
