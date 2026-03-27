(function() {
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var GAME_W = 600;
  var GAME_H = 150;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  var FG = '#1a1a1a';
  var BG_COLOR = '#F5F0E8';
  var isMobile = window.innerWidth <= 768;
  var S = isMobile ? 3 : 2;

  var GROUND_Y = 118;
  var FEET_BELOW = 3 * S;

  var gameRunning = false;
  var gameOver = false;
  var gameStarting = false;
  var score = 0;
  var highScore = 0;
  var speed = 6;
  var frameCount = 0;
  var groundExtend = 0;

  var skeleton = { x: isMobile ? 30 : 40, y: 0, vy: 0, jumping: false, frame: 0, frameTimer: 0 };

  var GRAVITY = 0.6;
  var JUMP_FORCE = -10;

  var obstacles = [];
  var obstacleTimer = 0;
  var nextObstacleIn = 50;

  var SKEL_IDLE = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,1,1,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,0,1,1,1,1,0,1,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0]
  ];

  var SKEL_RUN1 = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,1,1,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,1,0,1,1,1,1,1,1,0,0,0],
    [1,0,0,0,1,1,1,1,0,1,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,1,1,0,0,0,1,0,0,0],
    [0,0,1,1,0,0,0,0,0,1,0,0],
    [0,1,1,0,0,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,0,0,0,0,1,1]
  ];

  var SKEL_RUN2 = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,1,1,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,1,0],
    [0,0,1,0,1,1,1,1,0,0,0,1],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,1,1,0,0,0,0],
    [0,0,1,1,0,0,1,0,0,0,0,0]
  ];

  var SKEL_JUMP = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,1,1,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,1,0,1,1,1,1,1,1,0,1,0],
    [1,0,0,0,1,1,1,1,0,0,0,1],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0]
  ];

  var WINGED_SKULL1 = [
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0]
  ];

  var WINGED_SKULL2 = [
    [1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1],
    [1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1],
    [0,1,1,1,0,1,0,1,1,0,1,0,1,1,1,0],
    [0,0,1,1,0,1,1,1,1,1,1,0,1,1,0,0],
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];

  var BAT1 = [
    [1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,0,1,1,1,0,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,0,1,0,0,0,0,0]
  ];

  var BAT2 = [
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,0,1,1,1,1,1,0,0,1,1],
    [1,0,0,0,0,1,1,1,0,0,0,0,1],
    [0,0,0,0,0,1,0,1,0,0,0,0,0]
  ];

  var TOMBSTONE_SMALL = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0,0,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,0,0,1,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1]
  ];

  var CROSS = [
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [1,1,1,1,1,1],
    [1,1,1,1,1,1],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,1,1,1,1,0]
  ];

  var TOMBSTONE_DOUBLE = [
    [0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  var DIGITS = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
  };

  var groundOffset = 0;
  var GROUND_BUMPS = [];
  for (var i = 0; i < 80; i++) {
    GROUND_BUMPS.push({
      x: i * 12 + Math.random() * 6,
      h: 1,
      w: Math.random() > 0.5 ? 2 : 1,
      yOff: Math.floor(Math.random() * 3)
    });
  }

  var FLY_Y = GROUND_Y - 42;

  function drawPixels(sprite, x, y, color, scale) {
    var ps = scale || S;
    ctx.fillStyle = color || FG;
    for (var r = 0; r < sprite.length; r++) {
      for (var c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillRect(Math.floor(x + c * ps), Math.floor(y + r * ps), ps, ps);
        }
      }
    }
  }

  function drawScore() {
    var DS = 2;
    var s = String(Math.floor(score)).padStart(5, '0');
    var digitW = (3 + 1) * DS;
    var startX = GAME_W - 15 - s.length * digitW;

    if (highScore > 0) {
      var hs = String(Math.floor(highScore)).padStart(5, '0');
      var hiX = startX - 12 - hs.length * digitW;
      for (var i = 0; i < hs.length; i++) {
        drawPixels(DIGITS[hs[i]], hiX + i * digitW, 8, '#9b9590', DS);
      }
    }

    for (var i = 0; i < s.length; i++) {
      drawPixels(DIGITS[s[i]], startX + i * digitW, 8, FG, DS);
    }
  }

  var GROUND_OBSTACLES = [
    { sprite: TOMBSTONE_SMALL, name: 'small' },
    { sprite: CROSS, name: 'cross' },
    { sprite: TOMBSTONE_DOUBLE, name: 'double' }
  ];

  function spawnObstacle() {
    var r = Math.random();

    if (score > 80 && r < 0.3) {
      var isSkull = Math.random() > 0.5;
      var sprite1 = isSkull ? WINGED_SKULL1 : BAT1;
      var sprite2 = isSkull ? WINGED_SKULL2 : BAT2;
      var h = sprite1.length * S;
      var w = sprite1[0].length * S;
      obstacles.push({ x: GAME_W + 10, y: FLY_Y, w: w, h: h, sprite: sprite1, sprite2: sprite2, flying: true, flyFrame: 0, flyTimer: 0 });
      return;
    }

    var type;
    if (score < 50) {
      type = r > 0.3 ? GROUND_OBSTACLES[0] : GROUND_OBSTACLES[1];
    } else {
      if (r < 0.4) type = GROUND_OBSTACLES[0];
      else if (r < 0.7) type = GROUND_OBSTACLES[1];
      else type = GROUND_OBSTACLES[2];
    }
    var sprite = type.sprite;
    var h2 = sprite.length * S;
    var w2 = sprite[0].length * S;
    obstacles.push({ x: GAME_W + 10, y: GROUND_Y - h2 + FEET_BELOW, w: w2, h: h2, sprite: sprite, flying: false });
  }

  function getFloorY(spriteRows) {
    return GROUND_Y - spriteRows * S + FEET_BELOW;
  }

  function reset() {
    skeleton.y = getFloorY(SKEL_RUN1.length);
    skeleton.vy = 0;
    skeleton.jumping = false;
    skeleton.frame = 0;
    obstacles = [];
    obstacleTimer = 0;
    nextObstacleIn = 60;
    score = 0;
    speed = 6;
    gameOver = false;
    gameRunning = true;
    groundOffset = 0;
  }

  function jump() {
    if (!skeleton.jumping && gameRunning && !gameOver) {
      skeleton.vy = JUMP_FORCE;
      skeleton.jumping = true;
    }
    if (gameOver) {
      reset();
    }
  }

  function updateStartingAnimation() {
    skeleton.frameTimer++;
    if (skeleton.frameTimer > 6) {
      skeleton.frame = 1 - skeleton.frame;
      skeleton.frameTimer = 0;
    }
  }

  function update() {
    if (gameStarting) {
      updateStartingAnimation();
      return;
    }
    if (!gameRunning || gameOver) return;

    frameCount++;
    score += speed * 0.015;
    speed = 6 + score * 0.008;
    if (speed > 14) speed = 14;

    skeleton.vy += GRAVITY;
    skeleton.y += skeleton.vy;

    var floorY = getFloorY(SKEL_RUN1.length);
    if (skeleton.y >= floorY) {
      skeleton.y = floorY;
      skeleton.vy = 0;
      skeleton.jumping = false;
    }

    skeleton.frameTimer++;
    if (skeleton.frameTimer > 6) {
      skeleton.frame = 1 - skeleton.frame;
      skeleton.frameTimer = 0;
    }

    groundOffset += speed;

    obstacleTimer++;
    var minGap = Math.max(40, 60 - score * 0.05);
    var maxGap = Math.max(70, 110 - score * 0.05);
    if (obstacleTimer >= nextObstacleIn) {
      spawnObstacle();
      obstacleTimer = 0;
      nextObstacleIn = minGap + Math.random() * (maxGap - minGap);
    }

    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= speed;
      if (o.flying) {
        o.flyTimer++;
        if (o.flyTimer > 8) {
          o.flyFrame = 1 - o.flyFrame;
          o.flyTimer = 0;
        }
      }
      if (o.x + o.w < -10) {
        obstacles.splice(i, 1);
      }
    }

    var spriteH = SKEL_RUN1.length * S;
    var skX = skeleton.x + 2 * S;
    var skY = skeleton.y + 2 * S;
    var skW = 8 * S;
    var skH = spriteH - 4 * S;

    for (var j = 0; j < obstacles.length; j++) {
      var obs = obstacles[j];
      var oX = obs.x + 2;
      var oY = obs.y + 2;
      var oW = obs.w - 4;
      var oH = obs.h - 4;
      if (skX < oX + oW && skX + skW > oX && skY < oY + oH && skY + skH > oY) {
        gameOver = true;
        if (score > highScore) highScore = score;
      }
    }
  }

  function draw() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.fillStyle = FG;
    var skelLeft = skeleton.x - 1;
    var skelRight = skeleton.x + 12 * S + 1;

    var gaps = [];
    if (!skeleton.jumping) {
      gaps.push({ l: skelLeft, r: skelRight });
    }

    if (!gameRunning && !gameOver && !gameStarting) {
      var skelCenter = skeleton.x + 6 * S;
      var lineW = 14 * S + 40;
      var lineStart = skelCenter - lineW / 2;
      ctx.fillRect(lineStart, GROUND_Y, skelLeft - lineStart, 1);
      ctx.fillRect(skelRight, GROUND_Y, lineStart + lineW - skelRight, 1);
    } else if (gameStarting) {
      var skelCenter2 = skeleton.x + 6 * S;
      var lineW2 = 14 * S + 40;
      var lineStart2 = skelCenter2 - lineW2 / 2;
      ctx.fillRect(lineStart2, GROUND_Y, skelLeft - lineStart2, 1);
      ctx.fillRect(skelRight, GROUND_Y, groundExtend - skelRight, 1);
    } else {
      var lineX = 0;
      gaps.sort(function(a, b) { return a.l - b.l; });
      for (var gi = 0; gi < gaps.length; gi++) {
        var gap = gaps[gi];
        if (gap.l > lineX) {
          ctx.fillRect(lineX, GROUND_Y, gap.l - lineX, 1);
        }
        lineX = Math.max(lineX, gap.r);
      }
      if (lineX < GAME_W) {
        ctx.fillRect(lineX, GROUND_Y, GAME_W - lineX, 1);
      }
    }

    for (var bi = 0; bi < GROUND_BUMPS.length; bi++) {
      var b = GROUND_BUMPS[bi];
      var bx = ((b.x * 5 - groundOffset * 0.5) % (GAME_W + 100));
      var drawX = bx < -10 ? bx + GAME_W + 100 : bx;
      if (drawX >= 0 && drawX < GAME_W) {
        if (!gameRunning && !gameOver && !gameStarting) {
          var sc = skeleton.x + 6 * S;
          var lw = 14 * S + 40;
          var ls = sc - lw / 2;
          if (drawX >= ls && drawX <= ls + lw) {
            ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + b.yOff, b.w, b.h);
          }
        } else if (gameStarting) {
          if (drawX <= groundExtend) {
            ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + b.yOff, b.w, b.h);
          }
        } else {
          ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + b.yOff, b.w, b.h);
        }
      }
    }

    var sprite;
    if (!gameRunning && !gameOver && !gameStarting) {
      sprite = SKEL_IDLE;
    } else if (skeleton.jumping) {
      sprite = SKEL_JUMP;
    } else {
      sprite = skeleton.frame === 0 ? SKEL_RUN1 : SKEL_RUN2;
    }
    drawPixels(sprite, skeleton.x, skeleton.y);

    for (var k = 0; k < obstacles.length; k++) {
      var ob = obstacles[k];
      if (ob.flying) {
        var fSprite = ob.flyFrame === 0 ? ob.sprite : ob.sprite2;
        drawPixels(fSprite, ob.x, ob.y);
      } else {
        drawPixels(ob.sprite, ob.x, ob.y);
      }
    }

    if (gameRunning || gameOver) {
      drawScore();
    }

    if (gameOver) {
      ctx.fillStyle = FG;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 5);
    }

    if (!gameRunning && !gameOver && !gameStarting) {
      ctx.fillStyle = FG;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('start', GAME_W / 2, GROUND_Y - 5);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function startOpening() {
    if (gameStarting || gameRunning) return;
    gameStarting = true;
    skeleton.y = getFloorY(SKEL_RUN1.length);
    var skelCenter = skeleton.x + 6 * S;
    var lineW = 14 * S + 40;
    groundExtend = skelCenter + lineW / 2;
    var openSpeed = 20;
    function animateOpen() {
      groundExtend += openSpeed;
      if (groundExtend >= GAME_W) {
        gameStarting = false;
        reset();
      } else {
        requestAnimationFrame(animateOpen);
      }
    }
    animateOpen();
  }

  document.addEventListener('keydown', function(e) {
    var birth = document.getElementById('birthInput');
    if (document.activeElement === birth) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!gameRunning && !gameOver && !gameStarting) startOpening();
      else if (gameRunning) jump();
      else if (gameOver) reset();
    }
  });

  canvas.addEventListener('click', function() {
    if (!gameRunning && !gameOver && !gameStarting) startOpening();
    else if (gameRunning) jump();
    else if (gameOver) reset();
  });

  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!gameRunning && !gameOver && !gameStarting) startOpening();
    else if (gameRunning) jump();
    else if (gameOver) reset();
  }, { passive: false });

  var loopStarted = false;

  function initGame() {
    skeleton.y = getFloorY(SKEL_IDLE.length);
    draw();
    if (!loopStarted) {
      loopStarted = true;
      loop();
    }
  }

  var page2 = document.getElementById('page2');
  if (page2) {
    var observer = new MutationObserver(function() {
      if (!page2.classList.contains('hidden')) {
        setTimeout(initGame, 50);
      }
    });
    observer.observe(page2, { attributes: true, attributeFilter: ['class'] });
  }

  initGame();

  window.stopSkeletonGame = function() {
    gameRunning = false;
    gameOver = false;
  };
})();
