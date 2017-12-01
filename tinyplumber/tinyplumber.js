"use strict";

var PIXI = require('pixi.js');
var pixiTiled = require('pixi-tiledmap');

const LEFT = 37;
const UP = 38;
const RIGHT = 39;

class InteractiveSprite extends PIXI.Sprite
{
    constructor(app, texture)
    {
        super(texture);
        this.app = app;
        this.speed_x = 0;
        this.speed_y = 0;
        this.maxspeed = 10;
        this.acceleration = 1;
        this.deceleration = 1;
        this.copy = new PIXI.Sprite(texture);

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

        if (this.app.debug)
        {
            this.texture = PIXI.Texture.WHITE;
            this.width = rect.width;
            this.height = rect.height;
            this.tint = 0x0000FF;
        }
        else
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
        this.on_ground = false;
    }

    onFrame()
    {
        this.horizontalAcceleration();
        this.verticalAcceleration();
        this.collision(this.app.map);

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
        console.log(this.width,this.height);

        if (this.on_ground)
        {
            if (!this.isJumping && (this.animation == 'jumping' || this.animation == 'speedjumping'))
                this.animation = this.animation == 'jumping' ? 'walking' : 'running';
        }

        if (this.app.isKeyDown(LEFT))
            this.scale.x = -Math.abs(this.scale.x);
    }

    collision(map)
    {
        for(let i in map.children)
            if ('properties' in map.children[i])
                if ('type' in map.children[i].properties)
                    if(map.children[i].properties.type == 'collision')
                    {
                        map.children[i].visible = this.app.debug;
                        for(let t in map.children[i].tiles)
                        {

                            let tile = map.children[i].tiles[t];
                            tile.visible = !this.app.debug;
                            this.horizontalCollision(map, tile);
                            this.verticalCollision(map, tile);
                        }
                    }
    }

    horizontalCollision(map, tile)
    {
        if (tile.y > this.y && (tile.y-this.height+1) < this.y)
        {
            while (tile.x < (this.x+this.width/2+this.speed_x) && tile.x >= (this.x+this.width/2))
                this.speed_x -= 1;
            while ((tile.x+tile.width) > (this.x-this.width/2+this.speed_x) && (tile.x+tile.width) <= (this.x-this.width/2))
                this.speed_x += 1;
            tile.visible = this.app.debug;
        }
    }

    verticalCollision(map, tile)
    {
        if (tile.x < this.x && (tile.x+tile.width) >= this.x)
        {
            if (this.speed_y != 0)
                this.on_ground = false;

            while (tile.y < (this.y+this.height+this.speed_y) && tile.y >= (this.y+this.height))
            {
                this.on_ground = true;
                this.speed_y -= 1;
            }
            while ((tile.y+tile.height) > (this.y+this.speed_y) && (tile.y+tile.height) <= this.y)
                this.speed_y += 1;

            tile.visible = this.app.debug;
        }
    }

    onKeyDown(event)
    {
        super.onKeyDown(event);
        if (event.keyCode == UP && this.on_ground)
        {
            this.isJumping = true;
            this.animation = (this.speed_x == this.maxspeed || this.speed_x == -this.maxspeed) ? 'speedjumping' : 'jumping';
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
        this.app = new PIXI.Application({transparent: true, height: 320*2, width: 800*2});
        document.body.appendChild(this.app.view);

        PIXI.loader
            .add("mario", "images/mario.png")
            .add("marioanimations", "json/mario.json")
            .add('assets/level1-1.tmx')
            .load((loader, resources) => this.onLoaded(loader, resources));
    }

    onLoaded(loader, resources)
    {
        this.map = new PIXI.extras.TiledMap( 'assets/level1-1.tmx' );
        this.plumber = new Plumber(this, resources.mario.texture, resources.marioanimations.data);
        this.map.addChild(this.plumber);

        this.plumber.x = 200;
        this.plumber.y = 200;
        this.plumber.width *= 1.25;
        this.plumber.height *= 1.25;
        this.map.width *= 2;
        this.map.height *= 2;

        this.app.stage.addChild(this.map);

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
        this.plumber.onKeyDown(event);
    }

    onKeyUp(event)
    {
        this.keys[event.keyCode] = false;
        this.plumber.onKeyUp(event);
    }

    isKeyDown(keyCode)
    {
        return keyCode in this.keys != -1 && this.keys[keyCode];
    }
}

global.TinyPlumber = TinyPlumber;
