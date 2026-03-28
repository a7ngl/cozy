(function() {
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var FG = '#1a1a1a';
  var BG_COLOR = '#F5F0E8';
  var isMobile = window.innerWidth <= 768;
  var S = isMobile ? 3 : 2;

  var GAME_W = 600;
  var GAME_H = isMobile ? 200 : 150;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  var GROUND_Y = isMobile ? 165 : 118;
  var FEET_BELOW = 3 * S;
  var GRAVITY = 0.6;
  var JUMP_FORCE = -10;
  var MAX_SPEED = 14;

  var gameRunning = false;
  var gameOver = false;
  var gameStarting = false;
  var introProgress = 0;
  var score = 0;
  var highScore = 0;
  var speed = 6;
  var frameCount = 0;
  var groundOffset = 0;
  var lastMilestone = 0;

  var skeleton = { x: isMobile ? 30 : 50, y: 0, vy: 0, jumping: false, frame: 0, frameTimer: 0 };

  var obstacles = [];
  var obstacleTimer = 0;
  var nextObstacleIn = 60;

  var clouds = [];
  var cloudTimer = 0;

  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playTone(freq, duration, type) {
    try {
      var ac = getAudio();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch(e) {}
  }
  function playJump() { playTone(440, 0.12, 'sine'); }
  function playDie() {
    playTone(200, 0.1, 'square');
    setTimeout(function() { playTone(150, 0.15, 'square'); }, 100);
    setTimeout(function() { playTone(100, 0.2, 'square'); }, 220);
  }
  function playMilestone() {
    playTone(660, 0.08, 'square');
    setTimeout(function() { playTone(880, 0.08, 'square'); }, 90);
    setTimeout(function() { playTone(1100, 0.12, 'square'); }, 180);
  }

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
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,0],
    [1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0],
    [1,1,0,0,1,0,0,1,1,1,1,1,0,0,1,0,0,1,1,0],
    [1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0]
  ];

  var CLOUD = [
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0]
  ];

  var DIGITS = {
    '0':[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1':[[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2':[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3':[[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4':[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5':[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6':[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7':[[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8':[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9':[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
  };


  var FLY_Y = GROUND_Y - 42;

  function drawPixels(sprite, x, y, color, scale) {
    var ps = scale || S;
    ctx.fillStyle = color || FG;
    for (var r = 0; r < sprite.length; r++) {
      for (var c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) ctx.fillRect(Math.floor(x + c * ps), Math.floor(y + r * ps), ps, ps);
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
      for (var i = 0; i < hs.length; i++) drawPixels(DIGITS[hs[i]], hiX + i * digitW, 12, '#9b9590', DS);
    }
    for (var i = 0; i < s.length; i++) drawPixels(DIGITS[s[i]], startX + i * digitW, 12, FG, DS);
  }

  function getFloorY(rows) { return GROUND_Y - rows * S + FEET_BELOW; }

  function spawnCloud() {
    clouds.push({
      x: GAME_W + 10,
      y: 10 + Math.random() * 25,
      speed: 1.5 + Math.random()
    });
  }

  function spawnObstacle() {
    var r = Math.random();
    if (score > 80 && r < 0.3) {
      var isSkull = Math.random() > 0.5;
      var sp1 = isSkull ? WINGED_SKULL1 : BAT1;
      var sp2 = isSkull ? WINGED_SKULL2 : BAT2;
      obstacles.push({ x: GAME_W + 10, y: FLY_Y, w: sp1[0].length * S, h: sp1.length * S, sprite: sp1, sprite2: sp2, flying: true, flyFrame: 0, flyTimer: 0 });
      return;
    }
    var types = [TOMBSTONE_SMALL, CROSS, TOMBSTONE_DOUBLE];
    var type;
    if (score < 50) type = r > 0.3 ? types[0] : types[1];
    else { if (r < 0.4) type = types[0]; else if (r < 0.7) type = types[1]; else type = types[2]; }
    obstacles.push({ x: GAME_W + 10, y: GROUND_Y - type.length * S + FEET_BELOW, w: type[0].length * S, h: type.length * S, sprite: type, flying: false });
  }

  function reset() {
    skeleton.y = getFloorY(SKEL_RUN1.length);
    skeleton.vy = 0; skeleton.jumping = false; skeleton.frame = 0;
    obstacles = []; clouds = [];
    obstacleTimer = 0; nextObstacleIn = 60;
    cloudTimer = 0;
    score = 0; speed = 6;
    gameOver = false; gameRunning = true;
    groundOffset = 0; lastMilestone = 0;
  }

  function jump() {
    if (!skeleton.jumping && gameRunning && !gameOver) {
      skeleton.vy = JUMP_FORCE;
      skeleton.jumping = true;
      playJump();
    }
    if (gameOver) reset();
  }

  function update() {
    if (gameStarting) {
      skeleton.vy += GRAVITY;
      skeleton.y += skeleton.vy;
      var fy = getFloorY(SKEL_RUN1.length);
      if (skeleton.y >= fy) { skeleton.y = fy; skeleton.vy = 0; skeleton.jumping = false; }
      skeleton.frameTimer++;
      if (skeleton.frameTimer > 6) { skeleton.frame = 1 - skeleton.frame; skeleton.frameTimer = 0; }
      return;
    }
    if (!gameRunning || gameOver) return;

    score += speed * 0.015;
    speed = Math.min(6 + score * 0.008, MAX_SPEED);

    var milestone = Math.floor(score / 100) * 100;
    if (milestone > 0 && milestone > lastMilestone) { lastMilestone = milestone; playMilestone(); }

    skeleton.vy += GRAVITY;
    skeleton.y += skeleton.vy;
    var floorY = getFloorY(SKEL_RUN1.length);
    if (skeleton.y >= floorY) { skeleton.y = floorY; skeleton.vy = 0; skeleton.jumping = false; }

    skeleton.frameTimer++;
    if (skeleton.frameTimer > 6) { skeleton.frame = 1 - skeleton.frame; skeleton.frameTimer = 0; }

    groundOffset += speed;

    cloudTimer++;
    if (cloudTimer > 60 + Math.random() * 60) { spawnCloud(); cloudTimer = 0; }
    for (var ci = clouds.length - 1; ci >= 0; ci--) {
      clouds[ci].x -= clouds[ci].speed;
      if (clouds[ci].x + CLOUD[0].length * S < 0) clouds.splice(ci, 1);
    }

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
      if (o.flying) { o.flyTimer++; if (o.flyTimer > 8) { o.flyFrame = 1 - o.flyFrame; o.flyTimer = 0; } }
      if (o.x + o.w < -10) obstacles.splice(i, 1);
    }

    var skX = skeleton.x + 2 * S, skY = skeleton.y + 2 * S;
    var skW = 8 * S, skH = SKEL_RUN1.length * S - 4 * S;
    for (var j = 0; j < obstacles.length; j++) {
      var obs = obstacles[j];
      if (skX < obs.x + obs.w - 2 && skX + skW > obs.x + 2 && skY < obs.y + obs.h - 2 && skY + skH > obs.y + 2) {
        gameOver = true;
        if (score > highScore) highScore = score;
        playDie();
      }
    }
  }

  function draw() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    for (var ci = 0; ci < clouds.length; ci++) {
      drawPixels(CLOUD, Math.floor(clouds[ci].x), Math.floor(clouds[ci].y), '#c8c3b8', 1);
    }

    ctx.fillStyle = FG;
    var skelLeft = skeleton.x - 1;
    var skelRight = skeleton.x + 12 * S + 1;
    var gaps = [];
    if (!skeleton.jumping) gaps.push({ l: skelLeft, r: skelRight });

    if (!gameRunning && !gameOver && !gameStarting) {
      var sc = skeleton.x + 6 * S, lw = 14 * S + 40, ls = sc - lw / 2;
      ctx.fillRect(ls, GROUND_Y, skelLeft - ls, 1);
      ctx.fillRect(skelRight, GROUND_Y, ls + lw - skelRight, 1);
    } else if (gameStarting) {
      var ease = 1 - Math.pow(1 - introProgress, 3);
      var sc2 = skeleton.x + 6 * S, lw2 = 14 * S + 40;
      var introL = Math.floor((sc2 - lw2 / 2) * (1 - ease));
      var introR = Math.floor(sc2 + lw2 / 2 + (GAME_W - sc2 - lw2 / 2) * ease);
      if (introL < skelLeft) ctx.fillRect(introL, GROUND_Y, skelLeft - introL, 1);
      ctx.fillRect(skelRight, GROUND_Y, introR - skelRight, 1);
    } else if (skeleton.jumping) {
      ctx.fillRect(0, GROUND_Y, GAME_W, 1);
    } else {
      ctx.fillRect(0, GROUND_Y, skelLeft, 1);
      ctx.fillRect(skelRight, GROUND_Y, GAME_W - skelRight, 1);
    }

    var sprite;
    if (!gameRunning && !gameOver && !gameStarting) sprite = SKEL_IDLE;
    else if (skeleton.jumping) sprite = SKEL_JUMP;
    else sprite = skeleton.frame === 0 ? SKEL_RUN1 : SKEL_RUN2;
    drawPixels(sprite, skeleton.x, skeleton.y);

    for (var k = 0; k < obstacles.length; k++) {
      var ob = obstacles[k];
      drawPixels(ob.flying ? (ob.flyFrame === 0 ? ob.sprite : ob.sprite2) : ob.sprite, ob.x, ob.y);
    }

    if (gameRunning || gameOver) drawScore();

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

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  function startOpening() {
    if (gameStarting || gameRunning) return;
    gameStarting = true;
    introProgress = 0;
    skeleton.y = getFloorY(SKEL_RUN1.length);
    skeleton.vy = JUMP_FORCE;
    skeleton.jumping = true;
    playJump();
    var startTime = null;
    var duration = 1000;
    function animateIntro(ts) {
      if (!startTime) startTime = ts;
      introProgress = Math.min((ts - startTime) / duration, 1);
      if (introProgress >= 1) {
        gameStarting = false;
        reset();
        skeleton.vy = 0;
        skeleton.jumping = false;
      } else {
        requestAnimationFrame(animateIntro);
      }
    }
    requestAnimationFrame(animateIntro);
  }

  document.addEventListener('keydown', function(e) {
    if (document.activeElement === document.getElementById('birthInput')) return;
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
    if (!loopStarted) { loopStarted = true; loop(); }
  }

  var page2 = document.getElementById('page2');
  if (page2) {
    new MutationObserver(function() {
      if (!page2.classList.contains('hidden')) setTimeout(initGame, 50);
    }).observe(page2, { attributes: true, attributeFilter: ['class'] });

    function isInputArea(t) {
      return t.tagName === 'INPUT' || t.tagName === 'BUTTON' || (t.closest && (t.closest('input') || t.closest('button')));
    }
    page2.addEventListener('click', function(e) {
      if (isInputArea(e.target)) return;
      if (!gameRunning && !gameOver && !gameStarting) startOpening();
      else if (gameRunning) jump();
      else if (gameOver) reset();
    });
    page2.addEventListener('touchstart', function(e) {
      if (isInputArea(e.target)) return;
      if (!gameRunning && !gameOver && !gameStarting) startOpening();
      else if (gameRunning) jump();
      else if (gameOver) reset();
    }, { passive: true });
  }

  initGame();

  window.stopSkeletonGame = function() { gameRunning = false; gameOver = false; };
})();
