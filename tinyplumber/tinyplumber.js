"use strict";

const LEFT = 37;
const UP = 38;
const RIGHT = 39;

const GROUND = 470;

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
    constructor(app, texture)
    {
        super(app, texture);

        this.maxspeed = 16;
        this.acceleration = 2;
        this.deceleration = 1;
        this.jumpCurve = [4, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1]; // empirical
        this.jumpIndex = 0;
        this.isJumping = false;
    }
    onFrame()
    {
        this.horizontalAcceleration();
        this.verticalAcceleration();

        super.onFrame();

        if (this.y > GROUND)
            this.y = GROUND;
    }

    onKeyDown(event)
    {
        super.onKeyDown(event);
        if (event.keyCode == UP && this.y == GROUND)
            this.isJumping = true;
    }

    onKeyUp(event)
    {
        super.onKeyUp(event);
        if (event.keyCode == UP)
            this.isJumping = false;
    }

    horizontalAcceleration()
    {
        let left = this.app.isKeyDown(LEFT);
        let right = this.app.isKeyDown(RIGHT);

        if (left && right && this.speed_x)
        {
            this.speed_x += (this.speed_x > 0) ? -this.deceleration : this.deceleration;
        }
        else
        {
            this.speed_x += right ? this.acceleration : (this.speed_x > 0) ? -this.deceleration : 0;
            this.speed_x += left ? -this.acceleration : (this.speed_x < 0) ? this.deceleration : 0;
        }

        if (this.speed_x > this.maxspeed)
            this.speed_x = this.maxspeed;
        if (this.speed_x < -this.maxspeed)
            this.speed_x = -this.maxspeed;
    }

    verticalAcceleration()
    {
        this.speed_y += 1;
        if (this.isJumping && this.jumpIndex < this.jumpCurve.length)
            this.speed_y -= this.jumpCurve[this.jumpIndex++];
        else if (this.jumpIndex > 0)
            this.jumpIndex--;
        else
            this.isJumping = false;

        if (this.speed_y > this.maxspeed)
            this.speed_y = this.maxspeed;
        if (this.speed_y < -this.maxspeed)
            this.speed_y = -this.maxspeed;
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
