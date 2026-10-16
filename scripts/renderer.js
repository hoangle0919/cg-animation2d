import * as CG from './transforms.js';
import { Matrix } from './matrix.js';

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // limit_fps_flag:      bool
    // fps:                 int
    constructor(canvas, limit_fps_flag, fps) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.slide_idx = 0;
        this.limit_fps = limit_fps_flag;
        this.fps = fps;
        this.start_time = null;
        this.prev_time = null;

        this.models = {
            slide0: [
                {
                    vertices: this.regularPolygon(0, 0, 50, 500),
                    x: 0,
                    y: 0,
                    radius: 50,
                    velocity: {vx: 180, vy: 100},
                    radius: 50,
                    gravity: -800,
                    e_coeff: 0.95,
                    color: [255, 162, 162, 128],
                    transform: new Matrix(3, 3)
                },
                {
                    vertices: this.regularPolygon(0, 0, 70, 500),
                    x: 0,
                    y: 0,
                    radius: 70,
                    velocity: {vx: 110, vy: 90},
                    gravity: -800,
                    e_coeff: 0.85,
                    color: [43, 127, 255, 128],
                    transform: new Matrix(3, 3)
                },
                {
                    vertices: this.regularPolygon(0, 0, 90, 500),
                    x: 0,
                    y: 0,
                    radius: 90,
                    velocity: {vx: 100, vy: 150},
                    gravity: -800,
                    e_coeff: 0.45,
                    color: [49, 201, 80, 128],
                    transform: new Matrix(3, 3)
                }
            ],
            slide1: [
                {
                    vertices: this.regularPolygon(400, 300, 100, 7),
                    center: {x: 400, y: 300},
                    color: [255, 162, 162, 128],
                    rate: 0.5,
                    velocity: {vx: 0.1, vy: 0.1},
                    transform: new Matrix(3, 3)
                },
                {
                    vertices: this.regularPolygon(100, 200, 70, 5),
                    center: {x: 100, y: 200},
                    color: [43, 127, 255, 128],
                    rate: 0.5,
                    velocity: {vx: 0.1, vy: 0.1},
                    transform: new Matrix(3, 3)
                },
                {
                    vertices: this.regularPolygon(650, 500, 70, 3),
                    center: {x: 650, y: 500},
                    color: [49, 201, 80, 128],
                    rate: 0.5,
                    velocity: {vx: 0.1, vy: 0.1},
                    transform: new Matrix(3, 3)
                }
            ],
            slide2: [
                {
                    vertices: this.regularPolygon(240, 300, 95, 5),
                    center: {x: 240, y: 300},
                    color: [0, 128, 128, 255],
                    rate: 0.45,
                    sx_min: 0.45, sx_max: 1.35,
                    sy_min: 0.45, sy_max: 1.35,
                    transform: new Matrix(3, 3)
                },
                {
                    vertices: this.regularPolygon(570, 300, 85, 6),
                    center: {x: 570, y: 300},
                    color: [190, 50, 140, 255],
                    rate: 0.3,
                    sx_min: 0.35, sx_max: 1.7,
                    sy_min: 0.9,  sy_max: 1.15,
                    transform: new Matrix(3, 3)
                }
            ],
            slide3: this.kaleidoscope(10)
        };
    }

    regularPolygon(cx, cy, radius, sides) {
        let vertices = [];
        for (let i = 0; i < sides; i++) {
            let angle = Math.PI / 2 + i * 2 * Math.PI / sides;
            vertices.push(CG.Vector3(Math.round(cx + radius * Math.cos(angle)),
                                     Math.round(cy + radius * Math.sin(angle)), 1));
        }
        return vertices;
    }

    kaleidoscope(petals) {
        let colors = [[118, 36, 148, 255], [68, 80, 179, 255], [96, 223, 108, 255],
                      [221, 117, 28, 255], [219, 72, 173, 255]];
        let models = [];
        for (let i = 0; i < petals; i++) {
            models.push({
                vertices: [
                    CG.Vector3(0, 45, 1),
                    CG.Vector3(38, 130, 1),
                    CG.Vector3(0, 215, 1),
                    CG.Vector3(-38, 130, 1)
                ],
                base_angle: i * 2 * Math.PI / petals,
                phase: i * Math.PI / 4,
                color: colors[i % colors.length],
                transform: new Matrix(3, 3)
            });
        }
        return models;
    }

    // flag:  bool
    limitFps(flag) {
        this.limit_fps = flag;
    }

    // n:  int
    setFps(n) {
        this.fps = n;
    }

    // idx: int
    setSlideIndex(idx) {
        this.slide_idx = idx;
    }

    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;
        //console.log('animate(): t = ' + time.toFixed(1) + ', dt = ' + delta_time.toFixed(1));

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.drawSlide();

        // Invoke call for next frame in animation
        if (this.limit_fps) {
            setTimeout(() => {
                window.requestAnimationFrame((ts) => {
                    this.animate(ts);
                });
            }, Math.floor(1000.0 / this.fps));
        }
        else {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateTransforms(time, delta_time) {
        if (this.slide_idx === 0){
            let dt = delta_time/1000;

            for (let i = 0; i < this.models.slide0.length; i++) {
                let model = this.models.slide0[i];
                            
                let x_min = model.radius;
                let x_max = this.canvas.width - model.radius;
                let y_min = model.radius;
                let y_max = this.canvas.height - model.radius;

                model.velocity.vy += model.gravity * dt;
                model.x += model.velocity.vx * dt;
                model.y += model.velocity.vy * dt;
                
                // Bottom
                if (model.y >= y_max) {
                    model.y = y_max;
                    model.velocity.vy = -model.velocity.vy * model.e_coeff;
                }
                // Top
                if (model.y <= y_min) {
                    model.y = y_min;
                    model.velocity.vy = -model.velocity.vy * model.e_coeff;
                }
                // Right  
                if (model.x >= x_max) {
                    model.x = x_max;
                    model.velocity.vx = -model.velocity.vx * model.e_coeff;
                }
                // Left 
                if (model.x <= x_min) {
                    model.x = x_min;
                    model.velocity.vx = -model.velocity.vx * model.e_coeff;
                }

                let move = new Matrix(3, 3);
                CG.mat3x3Translate(move, model.x, model.y);
                model.transform = move;
            }
        }
        else if (this.slide_idx === 1) {
            let spin = 2 * Math.PI * 0.07 * time / 1000;
            for (let i = 0; i < this.models.slide1.length; i++) {
                let model = this.models.slide1[i];

                let to_origin = new Matrix(3, 3);
                let rotate = new Matrix(3, 3);
                let back = new Matrix(3, 3);

                CG.mat3x3Translate(to_origin, -model.center.x, -model.center.y);
                CG.mat3x3Rotate(rotate, spin * (i + 1)); // Different speed per polygon
                CG.mat3x3Translate(back, model.center.x, model.center.y);

                model.transform = Matrix.multiply([back, rotate, to_origin]);
            }
        }
        else if (this.slide_idx === 2) {
            for (let i = 0; i < this.models.slide2.length; i++) {
                let model = this.models.slide2[i];
                let wave = (Math.sin(2 * Math.PI * model.rate * time / 1000) + 1) / 2;
                let sx = model.sx_min + (model.sx_max - model.sx_min) * wave;
                let sy = model.sy_min + (model.sy_max - model.sy_min) * wave;

                let to_origin = new Matrix(3, 3);
                let scale = new Matrix(3, 3);
                let back = new Matrix(3, 3);
                CG.mat3x3Translate(to_origin, -model.center.x, -model.center.y);
                CG.mat3x3Scale(scale, sx, sy);
                CG.mat3x3Translate(back, model.center.x, model.center.y);

                model.transform = Matrix.multiply([back, scale, to_origin]);
            }
        }
        else if (this.slide_idx === 3) {
            let spin = 2 * Math.PI * 0.07 * time / 1000;
            for (let i = 0; i < this.models.slide3.length; i++) {
                let model = this.models.slide3[i];
                let pulse = 1 + 0.3 * Math.sin(2 * Math.PI * 0.35 * time / 1000 + model.phase);

                let move = new Matrix(3, 3);
                let rotate = new Matrix(3, 3);
                let scale = new Matrix(3, 3);
                CG.mat3x3Translate(move, 400, 300);
                CG.mat3x3Rotate(rotate, model.base_angle + spin);
                CG.mat3x3Scale(scale, pulse, pulse);

                model.transform = Matrix.multiply([move, rotate, scale]);
            }
        }
    }

    applyTransform(transform, vertices) {
        let moved = [];
        for (let i = 0; i < vertices.length; i++) {
            moved.push(transform.mult(vertices[i]));
        }
        return moved;
    }

    //
    drawSlide() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.slide_idx) {
            case 0:
                this.drawSlide0();
                break;
            case 1:
                this.drawSlide1();
                break;
            case 2:
                this.drawSlide2();
                break;
            case 3:
                this.drawSlide3();
                break;
        }
    }

    //
    drawSlide0() {
        // TODO: draw bouncing ball (circle that changes direction whenever it hits an edge)


        // Following lines are example of drawing a single polygon
        // (this should be removed/edited after you implement the slide)
        for (let i = 0; i < this.models.slide0.length; i++) {
            let model = this.models.slide0[i];
            this.drawConvexPolygon(this.applyTransform(model.transform, model.vertices), model.color);
        }
    }

    //
    drawSlide1() {
        // TODO: draw at least 3 polygons that spin about their own centers
        //   - have each polygon spin at a different speed / direction
        for (let i = 0; i < this.models.slide1.length; i++) {
            let model = this.models.slide1[i];
            this.drawConvexPolygon(this.applyTransform(model.transform, model.vertices), model.color);
        }

    }

    //
    drawSlide2() {
        for (let i = 0; i < this.models.slide2.length; i++) {
            let model = this.models.slide2[i];
            this.drawConvexPolygon(this.applyTransform(model.transform, model.vertices), model.color);
        }
    }

    //
    drawSlide3() {
        for (let i = 0; i < this.models.slide3.length; i++) {
            let model = this.models.slide3[i];
            this.drawConvexPolygon(this.applyTransform(model.transform, model.vertices), model.color);
        }
    }

    // vertex_list:  array of object [Matrix(3, 1), Matrix(3, 1), ..., Matrix(3, 1)]
    // color:        array of int [R, G, B, A]
    drawConvexPolygon(vertex_list, color) {
        this.ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
        this.ctx.beginPath();
        let x = vertex_list[0].values[0][0] / vertex_list[0].values[2][0];
        let y = vertex_list[0].values[1][0] / vertex_list[0].values[2][0];
        this.ctx.moveTo(x, y);
        for (let i = 1; i < vertex_list.length; i++) {
            x = vertex_list[i].values[0][0] / vertex_list[i].values[2][0];
            y = vertex_list[i].values[1][0] / vertex_list[i].values[2][0];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
};

export { Renderer };
