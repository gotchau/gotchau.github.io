let room, human, robot;

let checkboxRoomHuman, checkboxRoomRobot, checkboxRobotHuman;
let checkboxAddNoise;
let checkboxNavTest;

function setup() {
  room = new Room(1200, 800);
  human = new Human(room.width * 3.0 / 4.0, room.height / 2);
  robot = new Robot(room.width * 1.0 / 4.0, room.height / 2);

  createCanvas(room.width, room.height);
  checkboxRoomHuman = createCheckbox('Помещение/Человек', false);
  checkboxRoomRobot = createCheckbox('Помещение/Робот', false);
  checkboxRobotHuman = createCheckbox('Робот/Человек', false);
  checkboxAddNoise = createCheckbox('Добавить шум', false);
  checkboxNavTest = createCheckbox('Тест навигации', true);

  angleMode(DEGREES);

  room.devices.push(new NavDevice(0, 0));
  room.devices.push(new NavDevice(0, room.height));
  room.devices.push(new NavDevice(room.width, 0));
  room.devices.push(new NavDevice(room.width, room.height));
}

function draw() {
  background(240);

  human.move();
  robot.move();

  room.display();
  human.display();
  robot.display();


  if (checkboxNavTest.checked()) {
    fill(255, 127);
    rectMode(CORNERS);
    rect(0, 0, room.width, room.height);

    if (checkboxRoomHuman.checked()) {
      displayCalculatePoint(human, room);
    }
    if (checkboxRoomRobot.checked()) {
      displayCalculatePoint(robot, room);
    }
    if (checkboxRobotHuman.checked()) {
      displayCalculatePoint(human, robot);
    }

  }
  else {
    if (checkboxRoomHuman.checked()) {
      displayRealDists(room, human);
    }
    if (checkboxRoomRobot.checked()) {
      displayRealDists(room, robot);
    }
    if (checkboxRobotHuman.checked()) {
      displayRealDists(robot, human);
    }
  }
}

function displayCalculatePoint(first, second) {
  let newPoint;

  first.devices.forEach(fDevice => {
    let points = [];

    second.devices.forEach(sDevice => {
      let x = sDevice.absoluteX;
      let y = sDevice.absoluteY;
      let d = noisePercent(dist(fDevice.absoluteX, fDevice.absoluteY, sDevice.absoluteX, sDevice.absoluteY), 0.05);

      points.push({ x, y, d });
    });

    newPoint = multilateration(points);

    for (const point of points) {
      lineWithDist(newPoint.x, newPoint.y, point.x, point.y);

      fill(0);
      noStroke();
      circle(newPoint.x, newPoint.y, 10, 10);
    }
  });
}

function multilateration(points) {
  if (points.length < 3)
    return undefined;

  let x = [], y = [];

  for (let i = 0; i < points.length; i++) {
    let point1 = points[i];
    let point2 = points[(i + 1) % points.length];
    let point3 = points[(i + 2) % points.length];

    let newPoint = trilateration(point1, point2, point3);
    x.push(newPoint.x);
    y.push(newPoint.y);
  }

  let medianX = calculateMedian(x);
  let medianY = calculateMedian(y);

  return createVector(medianX, medianY);
}

function calculateMedian(array) {
  array.sort((a, b) => a - b);
  const length = array.length;
  if (length === 0) {
    return undefined;
  }
  const middle = Math.floor(length / 2);
  if (length % 2 === 1) {
    return array[middle];
  } else {
    return (array[middle - 1] + array[middle]) / 2;
  }
}

function trilateration(p1, p2, p3) {
  let A = 2 * (p2.x - p1.x);
  let B = 2 * (p2.y - p1.y);
  let C = p1.d * p1.d - p2.d * p2.d - p1.x * p1.x + p2.x * p2.x - p1.y * p1.y + p2.y * p2.y;
  let D = 2 * (p3.x - p2.x);
  let E = 2 * (p3.y - p2.y);
  let F = p2.d * p2.d - p3.d * p3.d - p2.x * p2.x + p3.x * p3.x - p2.y * p2.y + p3.y * p3.y;

  let x = (C * E - F * B) / (E * A - B * D);
  let y = (C * D - A * F) / (B * D - A * E);

  return createVector(x, y);
}

function displayRealDists(first, second) {
  first.devices.forEach(fDevice => {
    second.devices.forEach(sDevice => {
      lineWithDist(fDevice.absoluteX, fDevice.absoluteY, sDevice.absoluteX, sDevice.absoluteY);
    });
  });
}

function drawDashedLine(x1, y1, x2, y2, dashLength, gapLength) {
  let totalLength = dist(x1, y1, x2, y2);
  let currentLength = 0;
  let drawingLine = true;

  while (currentLength < totalLength) {
    let x3 = lerp(x1, x2, currentLength / totalLength);
    let y3 = lerp(y1, y2, currentLength / totalLength);

    let x4, y4;
    if (drawingLine) {
      x4 = lerp(x1, x2, (currentLength + dashLength) / totalLength);
      y4 = lerp(y1, y2, (currentLength + dashLength) / totalLength);
    } else {
      x4 = lerp(x1, x2, (currentLength + gapLength) / totalLength);
      y4 = lerp(y1, y2, (currentLength + gapLength) / totalLength);
    }

    line(x3, y3, x4, y4);

    currentLength += dashLength + gapLength;
  }
}

function lineWithDist(x1, y1, x2, y2) {
  stroke('gray');
  strokeWeight(1);
  drawDashedLine(x1, y1, x2, y2, 10, 10);

  // Вычисляем длину линии
  let lineLength = checkboxAddNoise.checked() ? noisePercent(dist(x1, y1, x2, y2), 0.05) : dist(x1, y1, x2, y2);

  // Находим середину линии
  let middleX = (x1 + x2) / 2;
  let middleY = (y1 + y2) / 2;

  // Вычисляем угол наклона линии
  let angle = atan2(y2 - y1, x2 - x1);

  // Переносим и поворачиваем текст
  push();
  translate(middleX, middleY);
  rotate(x2 > x1 ? angle : angle + 180);

  // Добавляем текст с длиной линии
  noStroke();
  fill(51);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(nf(lineLength, 0, 2), 0, -10);

  // Возвращаемся к предыдущей системе координат
  pop();
}

function noisePercent(val, percent) {
  return val + val * (noise(frameCount * 0.05) - 0.5) * percent;
}

class Room {
  constructor(win, hin) {
    this.width = win;
    this.height = hin;
    this.devices = [];
  }

  display() {
    for (let i = 0; i < this.devices.length; i++) {
      fill(51);
      noStroke();
      circle(this.devices[i].x, this.devices[i].y, 50);

      stroke(51);
      strokeWeight(5);
      noFill();

      for (let j = 0; j < 4; j++) {
        arc(this.devices[i].x, this.devices[i].y, 70, 70, j * 90 + 10, (j + 1) * 90 - 10);
      }
    }
  }
}

class Robot {
  constructor(xin, yin) {
    this.x = xin;
    this.y = yin;
    this.angle = 0;
    this.speed = 3;
    this.angleSpeed = 3;

    this.devices = [
      new NavDevice(-35, 50),  // front left
      new NavDevice(35, 0),     // mid right
      new NavDevice(-35, -50)    // rear left
    ];
  }

  move() {
    // control
    if (keyIsDown(87)) {
      this.x += this.speed * cos(this.angle - 90);
      this.y += this.speed * sin(this.angle - 90);
    }
    if (keyIsDown(83)) {
      this.x -= this.speed * cos(this.angle - 90);
      this.y -= this.speed * sin(this.angle - 90);
    }
    if (keyIsDown(65)) {
      this.angle -= this.angleSpeed;
      this.angle = this.angle % 360 > 0 ? this.angle % 360 : 360 - this.angle % 360;
    }
    if (keyIsDown(68)) {
      this.angle += this.angleSpeed;
      this.angle = this.angle % 360 > 0 ? this.angle % 360 : 360 - this.angle % 360;
    }

    // absolute device coords calculationa
    for (let i = 0; i < this.devices.length; i++) {
      this.devices[i].absoluteX = this.x + this.devices[i].x * cos(this.angle) + this.devices[i].y * sin(this.angle);
      this.devices[i].absoluteY = this.y + this.devices[i].x * sin(this.angle) - this.devices[i].y * cos(this.angle);
    }
  }

  display() {
    noStroke();
    fill(51);

    textSize(15);
    text(`x: ${this.x.toFixed(2)}\ny: ${this.y.toFixed(2)}\nr: ${this.angle.toFixed(2)}`, this.x + 70, this.y + 70);

    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);

    rect(0, 0, 90, 120, 10);    //body
    rect(55, 35, 15, 55, 5);    //wheel
    rect(55, -35, 15, 55, 5);   //wheel
    rect(-55, 35, 15, 55, 5);   //wheel
    rect(-55, -35, 15, 55, 5);  //wheel

    stroke('white');
    strokeWeight(3);
    line(-20, -55, 20, -55);    //front lights
    stroke(color(210, 0, 0));
    line(-20, 55, 20, 55);      //rear lights

    // anchors display
    for (let i = 0; i < this.devices.length; i++) {
      fill('orange');
      noStroke();
      circle(this.devices[i].x, this.devices[i].y, 15);
    }
    pop();
  }
}

class Human {
  constructor(xin, yin) {
    this.x = xin;
    this.y = yin;
    this.angle = 0;
    this.speed = 3;
    this.angleSpeed = 3;

    this.devices = [new NavDevice(0, 0)];
  }

  move() {
    if (keyIsDown(UP_ARROW)) {
      this.x += this.speed * cos(this.angle - 90);
      this.y += this.speed * sin(this.angle - 90);
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.x -= this.speed * cos(this.angle - 90);
      this.y -= this.speed * sin(this.angle - 90);
    }
    if (keyIsDown(LEFT_ARROW)) {
      this.angle -= this.angleSpeed;
      this.angle = this.angle % 360 > 0 ? this.angle % 360 : 360 - this.angle % 360;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.angle += this.angleSpeed;
      this.angle = this.angle % 360 > 0 ? this.angle % 360 : 360 - this.angle % 360;
    }

    // absolute device coords calculationa
    for (let i = 0; i < this.devices.length; i++) {
      this.devices[i].absoluteX = this.x + this.devices[i].x * cos(this.angle) + this.devices[i].y * sin(this.angle);
      this.devices[i].absoluteY = this.y + this.devices[i].x * sin(this.angle) - this.devices[i].y * cos(this.angle);
    }
  }

  display() {
    noStroke();
    fill(51);

    textSize(15);
    text(`x: ${this.x.toFixed(2)}\ny: ${this.y.toFixed(2)}\nr: ${this.angle.toFixed(2)}`, this.x + 30, this.y + 30);

    push();
    translate(this.x, this.y);
    rotate(this.angle);

    noStroke();
    fill(51);

    circle(0, 0, 33);           //head
    rectMode(CENTER);
    rect(0, 2, 65, 23, 12);     //body

    // anchors display
    for (let i = 0; i < this.devices.length; i++) {
      fill('#008FFF');
      noStroke();
      circle(this.devices[i].x, this.devices[i].y, 15);
    }
    pop();
  }
}

class NavDevice {
  constructor(xin, yin) {
    this.x = xin;
    this.y = yin;
    this.d = 0;
    this.absoluteX = this.x;
    this.absoluteY = this.y;
  }
}