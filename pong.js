/*global window, YUI */
"use strict";

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}

YUI().use('event-custom', function (Y) {
    window.PONG = (function () {
        var canvas = window.document.getElementById('pong'),
        context = canvas.getContext('2d'),
        intervalId,

        // base object for each sprite
        sprite = {
            context: context,
            fillStyle: 'black',

            intersects: function (other) {
                return !(
                    this.bottom < other.top ||
                    this.top > other.bottom ||
                    this.right < other.left ||
                    this.left > other.right
                );
            },

            // set x, y coords and bounding box
            place: function (x, y) {
                this.x = x;
                this.y = y;
                this.left = x;
                this.right = this.width + x;
                this.top = y;
                this.bottom = this.height + y;
                return this;
            },

            // true if sprite has been placed, false if missing values
            placed: function () {
                var properties = ['x', 'y', 'left', 'right', 'top', 'bottom'],
                i;

                for (i = 0; i < properties.length; i += 1) {
                    if (typeof this[properties[i]] !== 'number') {
                        return false;
                    }
                }

                return true;
            },

            clear: function () {
                this.context.clearRect(this.x, this.y, this.width, this.height);
                return this;
            },

            draw: function () {
                this.context.fillStyle = this.fillStyle;
                this.context.fillRect(this.x, this.y, this.width, this.height);
                return this;
            }
        },

        // base for each paddle
        paddle,

        // container for sprites
        sprites = {
            // Bottom of game. No need to define left, right or bottom, as they
            // should never be evaluated.
            bottom: {
                top: canvas.height
            },

            // Top of game. No need to define left or right, as they should
            // never be evaluated
            top: {
                top: 0,
                bottom: 0
            }
        },

        // update the game without user interaction
        update = function () {
            var ball = sprites.ball, key,
            paddle1 = sprites.paddle1,
            paddle2 = sprites.paddle2;

            paddle1.clear().move();
            paddle2.clear().move();
            ball.clear().move();

            for (key in sprites) {
                if (sprites.hasOwnProperty(key) && 
                    sprites[key] !== ball && 
                    ball.intersects(sprites[key])) {
                    ball.fire('pong:collision', ball, sprites[key]);
                }
            }

            paddle1.draw();
            paddle2.draw();
            ball.draw();
        },

        // reset the game
        reset = function () {
            window.clearInterval(intervalId);

            if (sprites.ball.placed()) {
                sprites.ball.clear();
            }
            sprites.ball.place(sprites.paddle1.right + 1, 1);

            sprites.ball.xPixelsPerTick = 10;
            sprites.ball.yPixelsPerTick = 11;

            intervalId = window.setInterval(update, 20);
        };

        // add event handling to sprite
        Y.augment(sprite, Y.EventTarget);
        sprite.publish('pong:collision');

        // paddles
        paddle = Object.create(sprite);
        paddle.width = 32;
        paddle.height = 128;
        paddle.setY = function (y) {
            var lowest = canvas.height - this.height;

            // simple object used to store next position
            this.next = {
                place: this.place
            };

            if (y < 0) {
                this.next.place(this.x, 0);
            } else if (y > lowest) {
                this.next.place(this.x, lowest);
            } else {
                this.next.place(this.x, y);
            }

            return this;
        };
        paddle.move = function () {
            if (this.next) {
                this.place(this.next.x, this.next.y);
            }
            return this;
        };

        sprites.paddle1 = Object.create(paddle);
        sprites.paddle1.fillStyle = 'blue';
        sprites.paddle1.place(0, 0);

        sprites.paddle2 = Object.create(paddle);
        sprites.paddle2.fillStyle = 'red';
        sprites.paddle2.place(
            canvas.width - sprites.paddle2.width, 
            canvas.height - sprites.paddle2.height
        );

        // ball
        sprites.ball = Object.create(sprite);
        sprites.ball.move = function () {
            this.place(this.x + this.xPixelsPerTick, this.y + this.yPixelsPerTick);
        };
        sprites.ball.reverseX = function () {
            this.xPixelsPerTick = 0 - this.xPixelsPerTick;
        };
        sprites.ball.reverseY = function () {
            this.yPixelsPerTick = 0 - this.yPixelsPerTick;
        };
        sprites.ball.width = 32;
        sprites.ball.height = 32;

        // events
        sprites.ball.on('pong:collision', function (ball, other) {
            if (other === sprites.paddle1) {
                ball.reverseX();
                ball.place(other.right, ball.y);
            } else if (other === sprites.paddle2) {
                ball.reverseX();
                ball.place(other.left - ball.width, ball.y);
            } else if (other === sprites.top || other === sprites.bottom) {
                ball.reverseY();
            }
        });

        return {
            // objects used privately, also available publicly
            sprite: sprite,
            paddle: paddle,
            sprites: sprites,
            update: update,
            reset: reset
        };
    }());
});

