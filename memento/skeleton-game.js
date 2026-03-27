(function() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Fixed internal resolution (same as Chrome dino)
  const GAME_W = 600;
  const GAME_H = 150;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  const FG = '#1a1a1a';
  const BG_COLOR = '#F5F0E8';
  const S = 2; // consistent sprite scale on both desktop and mobile

  // Ground
  const GROUND_Y = 130;

  // Game state
  let gameRunning = false;
  let gameOver = false;
  let score = 0;
  let highScore = 0;
  let speed = 6;
  let frameCount = 0;

  // Skeleton player (similar proportions to chrome dino t-rex)
  const skeleton = {
    x: 25,
    y: GROUND_Y,
    w: 20,
    h: 22,
    vy: 0,
    jumping: false,
    frame: 0,
    frameTimer: 0
  };

  const GRAVITY = 0.6;
  const JUMP_FORCE = -10;

  // Obstacles
  let obstacles = [];
  let obstacleTimer = 0;
  let nextObstacleIn = 50;

  // Ground texture
  let groundSegments = [];

  // Skeleton sprites (pixel art, each cell = 1px at game resolution)
  // ~20x22 sprite to match t-rex proportions
  const SKEL_RUN1 = [
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],
  ];

  const SKEL_RUN2 = [
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],
  ];

  const SKEL_JUMP = [
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
  ];

  // Tombstone ~12x18
  const TOMBSTONE_SMALL = [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,1,1,1],
    [1,1,1,0,1,1,1,1,0,1,1,1],
    [1,1,1,0,0,0,1,0,0,1,1,1],
    [1,1,1,0,1,0,0,0,0,1,1,1],
    [1,1,1,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  // Cross ~8x24
  const CROSS = [
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
  ];

  // Double tombstone ~24x18
  const TOMBSTONE_DOUBLE = [
    [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  // Score font (3x5 digits)
  const DIGITS = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  };

  // Ground scroll
  let groundOffset = 0;
  const GROUND_BUMPS = [];
  for (let i = 0; i < 200; i++) {
    GROUND_BUMPS.push({
      x: i * 5 + Math.random() * 3,
      h: Math.random() > 0.7 ? 2 : 1,
      w: Math.random() > 0.5 ? 2 : 1
    });
  }

  function drawPixels(sprite, x, y, color, scale) {
    const ps = scale || S;
    ctx.fillStyle = color || FG;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillRect(Math.floor(x + c * ps), Math.floor(y + r * ps), ps, ps);
        }
      }
    }
  }

  function drawScore() {
    const s = String(Math.floor(score)).padStart(5, '0');
    const digitW = 4;
    const gap = 1;
    let startX = GAME_W - 10 - s.length * (digitW + gap);

    // High score
    if (highScore > 0) {
      const hs = String(Math.floor(highScore)).padStart(5, '0');
      const hiX = startX - 8 - hs.length * (digitW + gap) - 12;
      // "HI"
      ctx.fillStyle = '#9b9590';
      ctx.fillRect(hiX, 8, 1, 5);
      ctx.fillRect(hiX+2, 8, 1, 5);
      ctx.fillRect(hiX, 10, 3, 1);
      ctx.fillRect(hiX+4, 8, 1, 5);
      for (let i = 0; i < hs.length; i++) {
        drawPixels(DIGITS[hs[i]], hiX + 7 + i * (digitW + gap), 8, '#9b9590', 1);
      }
    }

    for (let i = 0; i < s.length; i++) {
      drawPixels(DIGITS[s[i]], startX + i * (digitW + gap), 8, FG, 1);
    }
  }

  const OBSTACLE_TYPES = [
    { sprite: TOMBSTONE_SMALL, name: 'small' },
    { sprite: CROSS, name: 'cross' },
    { sprite: TOMBSTONE_DOUBLE, name: 'double' },
  ];

  function spawnObstacle() {
    // Weighted random: more small tombstones early, more variety later
    let type;
    const r = Math.random();
    if (score < 50) {
      type = r > 0.3 ? OBSTACLE_TYPES[0] : OBSTACLE_TYPES[1];
    } else {
      if (r < 0.4) type = OBSTACLE_TYPES[0];
      else if (r < 0.7) type = OBSTACLE_TYPES[1];
      else type = OBSTACLE_TYPES[2];
    }
    const sprite = type.sprite;
    const h = sprite.length * S;
    const w = sprite[0].length * S;
    obstacles.push({
      x: GAME_W + 10,
      y: GROUND_Y - h,
      w: w,
      h: h,
      sprite: sprite
    });
  }

  function reset() {
    const spriteH = SKEL_RUN1.length * S;
    skeleton.y = GROUND_Y - spriteH;
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

  function update() {
    if (!gameRunning || gameOver) return;

    frameCount++;
    score += speed * 0.015;
    speed = 6 + score * 0.008;
    if (speed > 16) speed = 16;

    // Skeleton physics
    skeleton.vy += GRAVITY;
    skeleton.y += skeleton.vy;

    const spriteH = SKEL_RUN1.length * S;
    const floorY = GROUND_Y - spriteH;
    if (skeleton.y >= floorY) {
      skeleton.y = floorY;
      skeleton.vy = 0;
      skeleton.jumping = false;
    }

    // Animation frame
    skeleton.frameTimer++;
    if (skeleton.frameTimer > 6) {
      skeleton.frame = 1 - skeleton.frame;
      skeleton.frameTimer = 0;
    }

    // Ground scroll
    groundOffset += speed;

    // Obstacles
    obstacleTimer++;
    const minGap = Math.max(30, 55 - score * 0.1);
    const maxGap = Math.max(60, 100 - score * 0.1);
    if (obstacleTimer >= nextObstacleIn) {
      spawnObstacle();
      obstacleTimer = 0;
      nextObstacleIn = minGap + Math.random() * (maxGap - minGap);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < -10) {
        obstacles.splice(i, 1);
      }
    }

    // Collision (with slight hitbox reduction for fairness)
    const skX = skeleton.x + 8;
    const skY = skeleton.y + 6;
    const skW = 24;
    const skH = spriteH - 10;

    for (let obs of obstacles) {
      const oX = obs.x + 2;
      const oY = obs.y + 2;
      const oW = obs.w - 4;
      const oH = obs.h - 2;

      if (skX < oX + oW && skX + skW > oX && skY < oY + oH && skY + skH > oY) {
        gameOver = true;
        if (score > highScore) highScore = score;
      }
    }
  }

  function draw() {
    // Clear with background color
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Ground line
    ctx.fillStyle = FG;
    ctx.fillRect(0, GROUND_Y, GAME_W, 1);

    // Ground bumps (scrolling)
    for (let b of GROUND_BUMPS) {
      const bx = ((b.x * 5 - groundOffset * 0.5) % (GAME_W + 100));
      const drawX = bx < -10 ? bx + GAME_W + 100 : bx;
      if (drawX >= 0 && drawX < GAME_W) {
        ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + Math.floor(Math.random() * 8), b.w, b.h);
      }
    }

    // Skeleton
    let sprite;
    if (skeleton.jumping) {
      sprite = SKEL_JUMP;
    } else {
      sprite = skeleton.frame === 0 ? SKEL_RUN1 : SKEL_RUN2;
    }
    drawPixels(sprite, skeleton.x, skeleton.y);

    // Obstacles
    for (let obs of obstacles) {
      drawPixels(obs.sprite, obs.x, obs.y);
    }

    // Score
    drawScore();

    // Game over
    if (gameOver) {
      ctx.fillStyle = FG;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 5);
    }

    // Start prompt
    if (!gameRunning && !gameOver) {
      ctx.fillStyle = FG;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('start', GAME_W / 2, GAME_H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== document.getElementById('birthInput')) {
      e.preventDefault();
      if (!gameRunning && !gameOver) reset();
      else jump();
    }
    if (e.code === 'ArrowUp' && document.activeElement !== document.getElementById('birthInput')) {
      e.preventDefault();
      if (!gameRunning && !gameOver) reset();
      else jump();
    }
  });

  canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver) reset();
    else jump();
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning && !gameOver) reset();
    else jump();
  }, { passive: false });

  // Init
  let loopStarted = false;

  function initGame() {
    const spriteH = SKEL_RUN1.length * S;
    skeleton.y = GROUND_Y - spriteH;
    draw();
    if (!loopStarted) {
      loopStarted = true;
      loop();
    }
  }

  // Watch for page2 becoming visible
  const page2 = document.getElementById('page2');
  if (page2) {
    const observer = new MutationObserver(() => {
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
