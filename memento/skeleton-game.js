(function() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const GAME_W = 600;
  const GAME_H = 150;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  const FG = '#1a1a1a';
  const BG_COLOR = '#F5F0E8';
  const isMobile = window.innerWidth <= 768;
  const S = isMobile ? 3 : 2;

  // Ground line - skeleton feet cross below this, line has gap for skeleton
  const GROUND_Y = 118;
  const FEET_BELOW = 3 * S;

  // Game state
  let gameRunning = false;
  let gameOver = false;
  let gameStarting = false; // for ground opening animation
  let score = 0;
  let highScore = 0;
  let speed = 6;
  let frameCount = 0;
  let groundExtend = 0; // 0 to GAME_W for opening animation

  const skeleton = {
    x: isMobile ? 30 : 40,
    y: 0,
    vy: 0,
    jumping: false,
    frame: 0,
    frameTimer: 0
  };

  const GRAVITY = 0.6;
  const JUMP_FORCE = -10;

  let obstacles = [];
  let obstacleTimer = 0;
  let nextObstacleIn = 50;

  // Skeleton based on reference - chunky pixel art style
  // Side view, 12 wide x 16 tall
  // Chunky skull, visible ribs, proper bone limbs

  const SKEL_IDLE = [
    [0,0,0,1,1,1,1,1,1,0,0,0], // skull top
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull
    [0,0,1,0,0,1,1,0,0,1,0,0], // eyes
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull mid
    [0,0,0,1,1,1,1,1,1,0,0,0], // jaw
    [0,0,0,0,1,0,0,1,0,0,0,0], // teeth
    [0,0,0,0,0,1,1,0,0,0,0,0], // neck
    [0,0,0,1,1,1,1,1,1,0,0,0], // shoulders
    [0,0,1,0,1,1,1,1,0,1,0,0], // arms + ribs
    [0,0,0,0,1,0,0,1,0,0,0,0], // rib gap
    [0,0,0,0,1,1,1,1,0,0,0,0], // lower torso
    [0,0,0,1,1,1,1,1,1,0,0,0], // pelvis
    [0,0,0,0,1,0,0,1,0,0,0,0], // upper legs
    [0,0,0,0,1,0,0,1,0,0,0,0], // legs
    [0,0,0,1,1,0,0,1,1,0,0,0], // feet
  ];

  const SKEL_RUN1 = [
    [0,0,0,1,1,1,1,1,1,0,0,0], // skull top
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull
    [0,0,1,0,0,1,1,0,0,1,0,0], // eyes
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull mid
    [0,0,0,1,1,1,1,1,1,0,0,0], // jaw
    [0,0,0,0,1,0,0,1,0,0,0,0], // teeth
    [0,0,0,0,0,1,1,0,0,0,0,0], // neck
    [0,1,0,1,1,1,1,1,1,0,0,0], // arm back + shoulders
    [1,0,0,0,1,1,1,1,0,1,0,0], // arm + ribs
    [0,0,0,0,1,0,0,1,0,0,0,0], // rib gap
    [0,0,0,0,1,1,1,1,0,0,0,0], // lower torso
    [0,0,0,1,1,1,1,1,1,0,0,0], // pelvis
    [0,0,0,0,1,0,0,0,1,0,0,0], // legs split
    [0,0,0,1,0,0,0,0,0,1,0,0], // legs wide
    [0,0,1,1,0,0,0,0,0,0,1,0], // lower legs
    [0,1,1,0,0,0,0,0,0,0,1,1], // feet
  ];

  const SKEL_RUN2 = [
    [0,0,0,1,1,1,1,1,1,0,0,0], // skull top
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull
    [0,0,1,0,0,1,1,0,0,1,0,0], // eyes
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull mid
    [0,0,0,1,1,1,1,1,1,0,0,0], // jaw
    [0,0,0,0,1,0,0,1,0,0,0,0], // teeth
    [0,0,0,0,0,1,1,0,0,0,0,0], // neck
    [0,0,0,1,1,1,1,1,1,0,1,0], // shoulders + arm front
    [0,0,1,0,1,1,1,1,0,0,0,1], // ribs + arm
    [0,0,0,0,1,0,0,1,0,0,0,0], // rib gap
    [0,0,0,0,1,1,1,1,0,0,0,0], // lower torso
    [0,0,0,1,1,1,1,1,1,0,0,0], // pelvis
    [0,0,0,1,0,0,0,1,0,0,0,0], // legs split
    [0,0,1,0,0,0,0,0,1,0,0,0], // legs wide
    [0,1,0,0,0,0,0,0,0,1,1,0], // lower legs
    [1,1,0,0,0,0,0,0,0,0,1,1], // feet
  ];

  const SKEL_JUMP = [
    [0,0,0,1,1,1,1,1,1,0,0,0], // skull top
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull
    [0,0,1,0,0,1,1,0,0,1,0,0], // eyes
    [0,0,1,1,1,1,1,1,1,1,0,0], // skull mid
    [0,0,0,1,1,1,1,1,1,0,0,0], // jaw
    [0,0,0,0,1,0,0,1,0,0,0,0], // teeth
    [0,0,0,0,0,1,1,0,0,0,0,0], // neck
    [0,1,0,1,1,1,1,1,1,0,1,0], // arms up + shoulders
    [1,0,0,0,1,1,1,1,0,0,0,1], // arms up + ribs
    [0,0,0,0,1,0,0,1,0,0,0,0], // rib gap
    [0,0,0,0,1,1,1,1,0,0,0,0], // lower torso
    [0,0,0,1,1,1,1,1,1,0,0,0], // pelvis
    [0,0,0,0,1,0,0,1,0,0,0,0], // legs together
    [0,0,0,1,1,0,0,1,1,0,0,0], // feet tucked
  ];

  // Tombstone ~10x14
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

    // High score - just the number, no "HI"
    if (highScore > 0) {
      const hs = String(Math.floor(highScore)).padStart(5, '0');
      const hiX = startX - 12 - hs.length * digitW;
      for (let i = 0; i < hs.length; i++) {
        drawPixels(DIGITS[hs[i]], hiX + i * digitW, 8, '#9b9590', DS);
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
    obstacles.push({
      x: GAME_W + 10,
      y: GROUND_Y - h + FEET_BELOW,
      w: w,
      h: h,
      sprite: sprite
    });
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

  function update() {
    if (!gameRunning || gameOver) return;

    frameCount++;
    score += speed * 0.015;
    speed = 6 + score * 0.008;
    if (speed > 16) speed = 16;

    skeleton.vy += GRAVITY;
    skeleton.y += skeleton.vy;

    const floorY = getFloorY(SKEL_RUN1.length);
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
    const spriteH = SKEL_RUN1.length * S;
    const skW = 10 * S;
    const skX = skeleton.x + 1 * S;
    const skY = skeleton.y + 1 * S;
    const skH = spriteH - 4 * S;

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

    // Ground line with gap for skeleton
    ctx.fillStyle = FG;
    const skelLeft = skeleton.x - 1;
    const skelRight = skeleton.x + 12 * S + 1;

    if (!gameRunning && !gameOver && !gameStarting) {
      // Before start: short ground with gap for skeleton
      const skelCenter = skeleton.x + 6 * S;
      const lineW = 14 * S + 40;
      const lineStart = skelCenter - lineW / 2;
      // Left segment
      ctx.fillRect(lineStart, GROUND_Y, skelLeft - lineStart, 1);
      // Right segment
      ctx.fillRect(skelRight, GROUND_Y, lineStart + lineW - skelRight, 1);
    } else if (gameStarting) {
      // Opening animation: ground extends with gap
      const skelCenter = skeleton.x + 6 * S;
      const halfExtend = groundExtend / 2;
      const startX = Math.max(0, skelCenter - halfExtend);
      const endX = Math.min(GAME_W, skelCenter + halfExtend);
      // Left segment (before skeleton)
      ctx.fillRect(startX, GROUND_Y, skelLeft - startX, 1);
      // Right segment (after skeleton)
      ctx.fillRect(skelRight, GROUND_Y, endX - skelRight, 1);
    } else {
      // Full ground line with gap for skeleton (when on ground)
      if (!skeleton.jumping) {
        ctx.fillRect(0, GROUND_Y, skelLeft, 1);
        ctx.fillRect(skelRight, GROUND_Y, GAME_W - skelRight, 1);
      } else {
        ctx.fillRect(0, GROUND_Y, GAME_W, 1);
      }
    }

    // Ground bumps (only when ground is full)
    if (gameRunning || gameOver) {
      for (let b of GROUND_BUMPS) {
        const bx = ((b.x * 5 - groundOffset * 0.5) % (GAME_W + 100));
        const drawX = bx < -10 ? bx + GAME_W + 100 : bx;
        if (drawX >= 0 && drawX < GAME_W) {
          ctx.fillRect(Math.floor(drawX), GROUND_Y + 3 + b.yOff, b.w, b.h);
        }
      }
    }

    // Skeleton
    let sprite;
    if (!gameRunning && !gameOver && !gameStarting) {
      sprite = SKEL_IDLE;
    } else if (skeleton.jumping) {
      sprite = SKEL_JUMP;
    } else {
      sprite = skeleton.frame === 0 ? SKEL_RUN1 : SKEL_RUN2;
    }
    drawPixels(sprite, skeleton.x, skeleton.y);

    // Obstacles
    for (let obs of obstacles) {
      drawPixels(obs.sprite, obs.x, obs.y);
    }

    // Score (only when game is active)
    if (gameRunning || gameOver) {
      drawScore();
    }

    // Game over
    if (gameOver) {
      ctx.fillStyle = FG;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 5);
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
    groundExtend = 0;
    const openSpeed = 25;
    function animateOpen() {
      groundExtend += openSpeed;
      if (groundExtend >= GAME_W * 1.5) {
        gameStarting = false;
        reset();
      } else {
        requestAnimationFrame(animateOpen);
      }
    }
    animateOpen();
  }

  // Controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== document.getElementById('birthInput')) {
      e.preventDefault();
      if (!gameRunning && !gameOver && !gameStarting) startOpening();
      else if (gameRunning) jump();
      else if (gameOver) reset();
    }
    if (e.code === 'ArrowUp' && document.activeElement !== document.getElementById('birthInput')) {
      e.preventDefault();
      if (!gameRunning && !gameOver && !gameStarting) startOpening();
      else if (gameRunning) jump();
      else if (gameOver) reset();
    }
  });

  canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver && !gameStarting) startOpening();
    else if (gameRunning) jump();
    else if (gameOver) reset();
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning && !gameOver && !gameStarting) startOpening();
    else if (gameRunning) jump();
    else if (gameOver) reset();
  }, { passive: false });

  let loopStarted = false;

  function initGame() {
    skeleton.y = getFloorY(SKEL_IDLE.length);
    draw();
    if (!loopStarted) {
      loopStarted = true;
      loop();
    }
  }

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
