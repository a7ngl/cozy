(function() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const FG = '#1a1a1a';
  const BG = '#F5F0E8';
  const SCALE = 2;

  let W, H;
  let gameRunning = false;
  let gameOver = false;
  let score = 0;
  let highScore = 0;
  let speed = 4;
  let frameCount = 0;

  // Ground
  const GROUND_Y_OFFSET = 20;
  let groundY;

  // Skeleton player
  const skeleton = {
    x: 40,
    y: 0,
    w: 20,
    h: 24,
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
  const MIN_GAP = 60;
  const MAX_GAP = 120;
  let nextObstacleIn = 80;

  // Ground texture dots
  let groundDots = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width = W;
    canvas.height = H;
    groundY = H - GROUND_Y_OFFSET;
    skeleton.y = groundY - skeleton.h;
    ctx.imageSmoothingEnabled = false;
  }

  // 8-bit skeleton sprites (pixel arrays where 1 = filled)
  // Each sprite is defined as [row][col], drawn at SCALE px per pixel
  const SKELETON_RUN1 = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,0,1,1,0,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,0,0,1,1,0,0,1,0],
    [1,0,0,0,1,1,0,0,0,1],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,1,0,0],
    [0,0,1,0,0,0,0,0,1,0],
    [0,1,1,0,0,0,0,0,0,0],
  ];

  const SKELETON_RUN2 = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,0,1,1,0,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,0,0,1,1,0,0,1,0],
    [1,0,0,0,1,1,0,0,0,1],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,0,1,0,0,0],
    [0,0,0,1,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,1,1,0],
  ];

  const SKELETON_JUMP = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,0,1,1,0,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,0,0,1,1,0,0,1,0],
    [1,0,0,0,1,1,0,0,0,1],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,0,0,1],
  ];

  // Tombstone obstacle sprite
  const TOMBSTONE = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,1,1,0,1,1],
    [1,1,0,0,1,0,1,1],
    [1,1,0,1,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
  ];

  // Cross obstacle sprite
  const CROSS = [
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
    [0,0,1,1,1,1,0,0],
  ];

  // Pixel font digits (5x5 each)
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

  function drawSprite(sprite, x, y, scale) {
    ctx.fillStyle = FG;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillRect(
            Math.floor(x + c * scale),
            Math.floor(y + r * scale),
            scale, scale
          );
        }
      }
    }
  }

  function drawScore() {
    const s = String(Math.floor(score)).padStart(5, '0');
    const digitW = 4 * SCALE;
    const gap = 2 * SCALE;
    const totalW = s.length * (digitW + gap);
    let startX = W - totalW - 10;

    // High score
    if (highScore > 0) {
      const hs = 'HI ' + String(Math.floor(highScore)).padStart(5, '0');
      ctx.fillStyle = '#9b9590';
      for (let i = 0; i < hs.length; i++) {
        const ch = hs[i];
        if (DIGITS[ch]) {
          drawSpriteColor(DIGITS[ch], startX - (hs.length - i) * (digitW + gap), 10, SCALE, '#9b9590');
        }
      }
    }

    for (let i = 0; i < s.length; i++) {
      drawSprite(DIGITS[s[i]], startX + i * (digitW + gap), 10, SCALE);
    }
  }

  function drawSpriteColor(sprite, x, y, scale, color) {
    ctx.fillStyle = color;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillRect(
            Math.floor(x + c * scale),
            Math.floor(y + r * scale),
            scale, scale
          );
        }
      }
    }
  }

  function spawnObstacle() {
    const type = Math.random() > 0.5 ? TOMBSTONE : CROSS;
    const spriteH = type.length * SCALE;
    const spriteW = type[0].length * SCALE;
    obstacles.push({
      x: W + 10,
      y: groundY - spriteH,
      w: spriteW,
      h: spriteH,
      sprite: type
    });
  }

  function initGroundDots() {
    groundDots = [];
    for (let i = 0; i < 40; i++) {
      groundDots.push({
        x: Math.random() * W,
        y: groundY + 4 + Math.random() * 12
      });
    }
  }

  function reset() {
    skeleton.y = groundY - skeleton.h * SCALE;
    skeleton.vy = 0;
    skeleton.jumping = false;
    skeleton.frame = 0;
    obstacles = [];
    obstacleTimer = 0;
    nextObstacleIn = 80;
    score = 0;
    speed = 4;
    gameOver = false;
    gameRunning = true;
    initGroundDots();
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
    score += speed * 0.02;
    speed = 4 + score * 0.005;

    // Skeleton physics
    skeleton.vy += GRAVITY;
    skeleton.y += skeleton.vy;

    const floorY = groundY - skeleton.h * SCALE;
    if (skeleton.y >= floorY) {
      skeleton.y = floorY;
      skeleton.vy = 0;
      skeleton.jumping = false;
    }

    // Animation frame
    skeleton.frameTimer++;
    if (skeleton.frameTimer > 8) {
      skeleton.frame = 1 - skeleton.frame;
      skeleton.frameTimer = 0;
    }

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= nextObstacleIn) {
      spawnObstacle();
      obstacleTimer = 0;
      nextObstacleIn = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Ground dots
    for (let d of groundDots) {
      d.x -= speed * 0.5;
      if (d.x < 0) d.x = W + Math.random() * 20;
    }

    // Collision
    const skX = skeleton.x * SCALE;
    const skY = skeleton.y;
    const skW = skeleton.w * SCALE * 0.6;
    const skH = skeleton.h * SCALE * 0.8;
    const skLeft = skX + (skeleton.w * SCALE - skW) / 2;
    const skTop = skY + (skeleton.h * SCALE - skH);

    for (let obs of obstacles) {
      const oLeft = obs.x + 2;
      const oTop = obs.y + 2;
      const oW = obs.w - 4;
      const oH = obs.h - 4;

      if (skLeft < oLeft + oW &&
          skLeft + skW > oLeft &&
          skTop < oTop + oH &&
          skTop + skH > oTop) {
        gameOver = true;
        if (score > highScore) highScore = score;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Ground line
    ctx.fillStyle = FG;
    ctx.fillRect(0, groundY, W, 1);

    // Ground dots
    for (let d of groundDots) {
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), SCALE, SCALE);
    }

    // Skeleton
    let sprite;
    if (skeleton.jumping) {
      sprite = SKELETON_JUMP;
    } else {
      sprite = skeleton.frame === 0 ? SKELETON_RUN1 : SKELETON_RUN2;
    }
    drawSprite(sprite, skeleton.x * SCALE, skeleton.y, SCALE);

    // Obstacles
    for (let obs of obstacles) {
      drawSprite(obs.sprite, obs.x, obs.y, SCALE);
    }

    // Score
    drawScore();

    // Game over text
    if (gameOver) {
      ctx.fillStyle = FG;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.font = '10px monospace';
      ctx.fillText('press space to restart', W / 2, H / 2 + 8);
    }

    // Start prompt
    if (!gameRunning && !gameOver) {
      ctx.fillStyle = FG;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('press space to start', W / 2, H / 2);
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
      if (!gameRunning && !gameOver) {
        reset();
      } else {
        jump();
      }
    }
    if (e.code === 'ArrowUp' && document.activeElement !== document.getElementById('birthInput')) {
      e.preventDefault();
      if (!gameRunning && !gameOver) {
        reset();
      } else {
        jump();
      }
    }
  });

  canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver) {
      reset();
    } else {
      jump();
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning && !gameOver) {
      reset();
    } else {
      jump();
    }
  }, { passive: false });

  // Init - wait for page2 to become visible before sizing
  let loopStarted = false;

  function initGame() {
    resize();
    if (W > 0 && H > 0) {
      initGroundDots();
      draw();
      if (!loopStarted) {
        loopStarted = true;
        loop();
      }
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

  // Also try init now in case page2 is already visible
  initGame();
  window.addEventListener('resize', resize);

  // Expose stop function for page transitions
  window.stopSkeletonGame = function() {
    gameRunning = false;
    gameOver = false;
  };
})();
