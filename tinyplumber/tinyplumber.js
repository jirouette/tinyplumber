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
        this.maxspeed = 16;
        this.acceleration = 1;
        this.deceleration = 1;

        this.animations = {'idle': []};
        this.animationIndex = 0;
        this.animationFrames = 8;
        this.animation = 'idle';

        this.anchor.x = 0.5;
    }

    onFrame()
    {
        this.animate();
        this.x += this.speed_x;
        this.y += this.speed_y;

        this.scale.x = (this.speed_x < 0) ? -Math.abs(this.scale.x) : Math.abs(this.scale.x);

    }

    animate()
    {
        if (!(this.animation in this.animations) || this.animations[this.animation].length == 0)
            return;
        this.animationIndex++;

        let i = Math.floor(this.animationIndex/this.animationFrames);

        if (i >= this.animations[this.animation].length)
        {
            this.animationIndex = 0;
            i = 0;
        }

        let rect = this.animations[this.animation][i];
        this.texture.frame = new PIXI.Rectangle(rect.x, rect.y, rect.width, rect.height);
    }

    onKeyDown(event)
    {
    }

    onKeyUp(event)
    {
    }
}

class Plumber extends InteractiveSprite
{
    constructor(app, texture, animations)
    {
        super(app, texture);

        this.animations = animations;
        this.jumpCurve = [4, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1]; // empirical
        this.jumpIndex = 0;
        this.isJumping = false;
    }

    onFrame()
    {
        this.horizontalAcceleration();
        this.verticalAcceleration();

        if (this.animation != 'jumping' && this.animation != 'speedjumping')
        {
            if (this.speed_x == 0)
                this.animation = 'idle';
            else if (this.speed_x == this.maxspeed || this.speed_x == -this.maxspeed)
                this.animation = 'running';
            else
                this.animation = 'walking';
        }

        super.onFrame();

        if (this.y > GROUND)
        {
            this.y = GROUND;
            if (!this.isJumping && (this.animation == 'jumping' || this.animation == 'speedjumping'))
                this.animation = this.animation == 'jumping' ? 'walking' : 'running';
        }
    }

    onKeyDown(event)
    {
        super.onKeyDown(event);
        if (event.keyCode == UP && this.y == GROUND)
        {
            this.isJumping = true;
            this.animation = (this.speed_x == this.maxspeed) ? 'speedjumping' : 'jumping';
        }
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
            .add("marioanimations", "json/mario.json")
            .load((loader, resources) => this.onLoaded(loader, resources));
    }

    onLoaded(loader, resources)
    {
        this.plumber = new Plumber(this, resources.mario.texture, resources.marioanimations.data);

        this.plumber.x = 200;
        this.plumber.y = GROUND;
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
