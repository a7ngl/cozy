(function() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Fixed internal resolution
  const GAME_W = 600;
  const GAME_H = 150;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  const FG = '#1a1a1a';
  const BG_COLOR = '#F5F0E8';
  const isMobile = window.innerWidth <= 768;
  const S = isMobile ? 3 : 2; // 3x on mobile for bigger sprites, 2x on desktop

  // Ground line position - skeleton feet will cross below this
  const GROUND_Y = 120;
  // Skeleton stands so feet are BELOW ground line (like chrome dino)
  const FEET_BELOW_GROUND = 4 * S; // feet pixels below ground

  // Game state
  let gameRunning = false;
  let gameOver = false;
  let score = 0;
  let highScore = 0;
  let speed = 6;
  let frameCount = 0;

  // Skeleton player
  const skeleton = {
    x: isMobile ? 30 : 40,
    y: GROUND_Y,
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

  // Redesigned skeleton - thinner, more skeletal with visible bones
  // 14 wide x 18 tall
  const SKEL_RUN1 = [
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // skull top
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull
    [0,0,0,1,0,1,1,1,0,1,1,0,0,0], // eyes
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull bottom
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // jaw teeth
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // neck
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,0,1,0,1,1,1,1,1,1,0,1,0,0], // ribs + arms out
    [0,1,0,0,0,1,1,1,1,0,0,0,1,0], // ribs + arms
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // lower ribs
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // pelvis
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0], // hip joints
    [0,0,0,0,1,0,0,0,0,1,0,0,0,0], // upper legs
    [0,0,0,1,0,0,0,0,0,0,1,0,0,0], // legs
    [0,0,1,0,0,0,0,0,0,0,0,1,0,0], // lower legs - right forward
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0], // right foot forward
    [0,1,1,0,0,0,0,0,0,0,0,0,1,0], // left foot back + right foot
  ];

  const SKEL_RUN2 = [
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // skull top
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull
    [0,0,0,1,0,1,1,1,0,1,1,0,0,0], // eyes
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull bottom
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // jaw teeth
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // neck
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,0,1,0,1,1,1,1,1,1,0,1,0,0], // ribs + arms out
    [0,1,0,0,0,1,1,1,1,0,0,0,1,0], // ribs + arms
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // lower ribs
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // pelvis
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0], // hip joints
    [0,0,0,0,0,0,1,1,0,0,0,0,0,0], // upper legs together
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0], // legs splitting
    [0,0,0,0,1,0,0,0,0,1,0,0,0,0], // lower legs - left forward
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0], // left foot forward
    [0,0,0,1,0,0,0,0,0,0,1,1,0,0], // left foot + right foot back
  ];

  const SKEL_JUMP = [
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // skull top
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull
    [0,0,0,1,0,1,1,1,0,1,1,0,0,0], // eyes
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0], // skull bottom
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // jaw
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // neck
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,1,0,0,1,1,1,1,1,1,0,0,1,0], // ribs + arms up
    [1,0,0,0,0,1,1,1,1,0,0,0,0,1], // ribs + arms up
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0], // lower ribs
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // spine
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0], // pelvis
    [0,0,0,0,1,0,0,0,0,1,0,0,0,0], // legs tucked
    [0,0,0,1,0,0,0,0,0,0,1,0,0,0], // legs spread
    [0,0,1,1,0,0,0,0,0,0,1,1,0,0], // feet dangling
  ];

  // Tombstone ~10x14 (slightly smaller to match new scale)
  const TOMBSTONE_SMALL = [
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
    [1,1,1,1,1,1,1,1,1,1],
  ];

  // Cross ~6x18
  const CROSS = [
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
    [0,1,1,1,1,0],
  ];

  // Double tombstone ~20x14
  const TOMBSTONE_DOUBLE = [
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
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
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
      w: Math.random() > 0.5 ? 2 : 1,
      yOff: Math.floor(Math.random() * 6)
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
    const DS = 2;
    const s = String(Math.floor(score)).padStart(5, '0');
    const digitW = (3 + 1) * DS;
    let startX = GAME_W - 15 - s.length * digitW;

    if (highScore > 0) {
      const hs = String(Math.floor(highScore)).padStart(5, '0');
      const hiX = startX - 8 - hs.length * digitW - 16;
      ctx.fillStyle = '#9b9590';
      ctx.fillRect(hiX, 8, DS, 5 * DS);
      ctx.fillRect(hiX + 2 * DS, 8, DS, 5 * DS);
      ctx.fillRect(hiX, 8 + 2 * DS, 3 * DS, DS);
      ctx.fillRect(hiX + 4 * DS, 8, DS, 5 * DS);
      for (let i = 0; i < hs.length; i++) {
        drawPixels(DIGITS[hs[i]], hiX + 7 * DS + i * digitW, 8, '#9b9590', DS);
      }
    }

    for (let i = 0; i < s.length; i++) {
      drawPixels(DIGITS[s[i]], startX + i * digitW, 8, FG, DS);
    }
  }

  const OBSTACLE_TYPES = [
    { sprite: TOMBSTONE_SMALL, name: 'small' },
    { sprite: CROSS, name: 'cross' },
    { sprite: TOMBSTONE_DOUBLE, name: 'double' },
  ];

  function spawnObstacle() {
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
    // Obstacles sit ON the ground line (bottom aligned to ground + a bit below)
    obstacles.push({
      x: GAME_W + 10,
      y: GROUND_Y - h + FEET_BELOW_GROUND,
      w: w,
      h: h,
      sprite: sprite
    });
  }

  function reset() {
    const spriteH = SKEL_RUN1.length * S;
    // Position skeleton so last ~4 rows (feet) are below ground line
    skeleton.y = GROUND_Y - spriteH + FEET_BELOW_GROUND;
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
    const floorY = GROUND_Y - spriteH + FEET_BELOW_GROUND;
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

    // Collision
    const skW = 14 * S;
    const skX = skeleton.x + 2 * S;
    const skY = skeleton.y + 2 * S;
    const skH = spriteH - 6 * S;

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
        ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + b.yOff, b.w, b.h);
      }
    }

    // Skeleton - drawn ON TOP of ground line (feet cross it)
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
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 5);
    }

    // Start prompt
    if (!gameRunning && !gameOver) {
      ctx.fillStyle = FG;
      ctx.font = '14px monospace';
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
    skeleton.y = GROUND_Y - spriteH + FEET_BELOW_GROUND;
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
