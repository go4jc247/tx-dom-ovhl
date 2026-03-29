// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIAL MODE — Texas 42 Training System
// ═══════════════════════════════════════════════════════════════════════════════

(function(){
try {
console.log('[Tutorial] IIFE starting...');

// ── Tutorial State ──────────────────────────────────────────────────────────
let TUT_ACTIVE = false;
let TUT_LESSON = 0;
let TUT_STEP = 0;
let TUT_TYPING = false;
let TUT_TYPE_TIMER = null;
let TUT_WAITING_FOR = null; // null, 'click_next', 'bid', 'trump', 'play'
let TUT_HAND_ACTIVE = false;
let TUT_AI_FORCE_PASS = false;
let TUT_ON_HAND_END = null;
let TUT_ON_TRICK_END = null;
let TUT_ON_BID_DONE = null;
let TUT_ON_TRUMP_DONE = null;
let TUT_AUDIO = null; // current narration Audio object
let TUT_AUDIO_MUTED = false;

// ── DOM references ──────────────────────────────────────────────────────────
const tutOverlay = document.getElementById('tutorialOverlay');
const tutText = document.getElementById('tutorialText');
const tutCursor = document.getElementById('tutorialCursor');
const tutNext = document.getElementById('tutorialNext');
const tutPrev = document.getElementById('tutorialPrev');
const tutSkip = document.getElementById('tutorialSkip');
const tutLessonNum = document.getElementById('tutorialLessonNum');
const tutTermBody = document.getElementById('tutorialTermBody');

// ── Expose TUT_ACTIVE globally ──────────────────────────────────────────────
window.TUT_ACTIVE = false;
Object.defineProperty(window, 'TUT_ACTIVE', {
  get: () => TUT_ACTIVE,
  set: v => { TUT_ACTIVE = v; }
});

// ── Typewriter Effect ───────────────────────────────────────────────────────
function tutType(text, cb) {
  if (TUT_TYPE_TIMER) { clearInterval(TUT_TYPE_TIMER); TUT_TYPE_TIMER = null; }
  TUT_TYPING = true;
  tutText.textContent = '';
  tutCursor.style.display = '';
  let i = 0;
  const speed = 18;
  TUT_TYPE_TIMER = setInterval(() => {
    if (i < text.length) {
      tutText.textContent += text[i];
      i++;
      tutTermBody.scrollTop = tutTermBody.scrollHeight;
    } else {
      clearInterval(TUT_TYPE_TIMER);
      TUT_TYPE_TIMER = null;
      TUT_TYPING = false;
      if (cb) cb();
    }
  }, speed);
}

function tutSkipTyping() {
  if (!TUT_TYPING) return false;
  if (TUT_TYPE_TIMER) { clearInterval(TUT_TYPE_TIMER); TUT_TYPE_TIMER = null; }
  const lesson = TUTORIAL_LESSONS[TUT_LESSON];
  if (lesson) {
    const step = lesson.steps[TUT_STEP];
    if (step && step.text) tutText.textContent = step.text;
  }
  TUT_TYPING = false;
  return true;
}

// ── Audio narration ─────────────────────────────────────────────────────────
function tutStopAudio() {
  if (TUT_AUDIO) { TUT_AUDIO.pause(); TUT_AUDIO.currentTime = 0; TUT_AUDIO = null; }
}
function tutPlayAudio(file) {
  tutStopAudio();
  if (TUT_AUDIO_MUTED || !file) return;
  TUT_AUDIO = new Audio('./assets/audio/tutorial/' + file);
  TUT_AUDIO.play().catch(() => {}); // ignore autoplay blocks
}

// ── Show/Hide overlay ───────────────────────────────────────────────────────
function tutShow() { tutOverlay.style.display = 'flex'; }
function tutHide() { tutOverlay.style.display = 'none'; }

function tutUpdateCounter() {
  tutLessonNum.textContent = (TUT_LESSON + 1) + '/' + TUTORIAL_LESSONS.length;
}

// ── Button handlers ─────────────────────────────────────────────────────────
tutNext.addEventListener('click', () => {
  if (tutSkipTyping()) return;
  tutAdvance();
});
tutPrev.addEventListener('click', () => {
  if (TUT_STEP > 0) { TUT_STEP--; tutRunStep(); }
  else if (TUT_LESSON > 0) { TUT_LESSON--; TUT_STEP = 0; tutRunStep(); }
});
tutSkip.addEventListener('click', () => { tutEnd(); });

// ── Advance ─────────────────────────────────────────────────────────────────
function tutAdvance() {
  const lesson = TUTORIAL_LESSONS[TUT_LESSON];
  if (!lesson) { tutEnd(); return; }
  TUT_STEP++;
  if (TUT_STEP >= lesson.steps.length) {
    TUT_LESSON++;
    TUT_STEP = 0;
    if (TUT_LESSON >= TUTORIAL_LESSONS.length) { tutEnd(); return; }
  }
  tutRunStep();
}

// ── Run current step ────────────────────────────────────────────────────────
function tutRunStep() {
  const lesson = TUTORIAL_LESSONS[TUT_LESSON];
  if (!lesson) { tutEnd(); return; }
  const step = lesson.steps[TUT_STEP];
  if (!step) { tutAdvance(); return; }

  tutUpdateCounter();
  tutShow();
  tutPrev.style.display = (TUT_LESSON > 0 || TUT_STEP > 0) ? '' : 'none';

  // Play narration audio if available
  if (step.audio) tutPlayAudio(step.audio);
  else tutStopAudio();

  switch (step.type) {
    case 'text':
      tutNext.textContent = step.nextLabel || 'Continue \u25B6';
      tutNext.style.display = '';
      document.body.classList.add('tutShowGame');
      document.body.classList.remove('tutDimGame');
      // Pause game interaction during text steps
      waitingForPlayer1 = false;
      if (typeof disablePlayer1Clicks === 'function') disablePlayer1Clicks();
      tutType(step.text);
      break;

    case 'text_dim':
      tutNext.textContent = step.nextLabel || 'Continue \u25B6';
      tutNext.style.display = '';
      document.body.classList.add('tutDimGame');
      document.body.classList.remove('tutShowGame');
      // Pause game interaction during text steps
      waitingForPlayer1 = false;
      if (typeof disablePlayer1Clicks === 'function') disablePlayer1Clicks();
      tutType(step.text);
      break;

    case 'deal':
      tutNext.textContent = step.nextLabel || 'Continue \u25B6';
      tutNext.style.display = '';
      document.body.classList.remove('tutDimGame');
      document.body.classList.add('tutShowGame');
      if (step.text) tutType(step.text);
      if (step.hands) tutDealHand(step.hands, step.dealer || 0);
      break;

    case 'bid':
      tutNext.style.display = 'none';
      document.body.classList.remove('tutDimGame');
      document.body.classList.add('tutShowGame');
      // Hide tutorial overlay so bid panel is fully visible
      tutHide();
      TUT_AI_FORCE_PASS = step.aiPass !== false;
      TUT_WAITING_FOR = 'bid';
      TUT_ON_BID_DONE = () => {
        TUT_WAITING_FOR = null;
        TUT_ON_BID_DONE = null;
        // Advance to trump step — finalizeBidding already showed the trump overlay.
        setTimeout(() => tutAdvance(), 800);
      };
      // Start bidding round — init if needed, then start
      if (session && session.phase === PHASE_NEED_BID) {
        initBiddingRound();
        enableBiddingPreview();
        startBiddingRound();
      }
      break;

    case 'trump':
      tutNext.style.display = 'none';
      document.body.classList.remove('tutDimGame');
      document.body.classList.add('tutShowGame');
      // Hide tutorial overlay so trump panel is fully visible
      tutHide();
      TUT_WAITING_FOR = 'trump';
      TUT_ON_TRUMP_DONE = () => {
        TUT_WAITING_FOR = null;
        TUT_ON_TRUMP_DONE = null;
        tutShow();
        setTimeout(() => tutAdvance(), 600);
      };
      break;

    case 'play':
      tutNext.style.display = 'none';
      document.body.classList.remove('tutDimGame');
      document.body.classList.add('tutShowGame');
      if (step.text) tutType(step.text);
      TUT_WAITING_FOR = 'play';
      // Re-enable player interaction for play phase
      if (session && session.game.current_player === 0) {
        waitingForPlayer1 = true;
        enablePlayer1Clicks();
        updatePlayer1ValidStates();
      }
      TUT_ON_TRICK_END = () => {
        if (step.textPerTrick) {
          const tNum = session.game.trick_number;
          if (step.textPerTrick[tNum]) tutType(step.textPerTrick[tNum]);
        }
      };
      TUT_ON_HAND_END = () => {
        TUT_WAITING_FOR = null;
        TUT_ON_TRICK_END = null;
        TUT_ON_HAND_END = null;
        if (step.resultText) {
          tutType(step.resultText, () => {
            tutNext.textContent = 'Continue \u25B6';
            tutNext.style.display = '';
          });
        } else {
          setTimeout(() => tutAdvance(), 1200);
        }
      };
      break;

    default:
      tutAdvance();
  }
}

// ── Deal predetermined hand ─────────────────────────────────────────────────
function tutDealHand(hands, dealer) {
  initGameMode('T42');
  session.team_marks = [0, 0];
  session.marks_to_win = 7;
  session.dealer = dealer;
  session.contract = "NORMAL";
  session.current_bid = 0;
  session.bid_marks = 1;
  session.moon_shoot = false;

  const handsCopy = hands.map(h => h.map(t => [t[0], t[1]]));
  session.game.set_hands(handsCopy, 0);
  session.game.set_trump_suit(null);
  session.game.set_active_players([0, 1, 2, 3]);
  session.phase = PHASE_NEED_BID;
  session.status = "Tutorial — Bidding...";

  shadowLayer.innerHTML = '';
  spriteLayer.innerHTML = '';
  sprites.length = 0;
  currentTrick = 0;
  playedThisTrick = [];
  team1TricksWon = 0;
  team2TricksWon = 0;
  team3TricksWon = 0;
  zIndexCounter = 100;
  isAnimating = false;
  waitingForPlayer1 = false;

  // Show T42 player indicators
  for (let h = 5; h <= 6; h++) {
    const el = document.getElementById('playerIndicator' + h);
    if (el) el.style.display = 'none';
  }
  for (let h = 1; h <= 4; h++) {
    const el = document.getElementById('playerIndicator' + h);
    if (el) el.style.display = '';
  }
  positionPlayerIndicators();

  // Hide trump display
  document.getElementById('trumpDisplay').classList.remove('visible');

  createPlaceholders();

  const gameHands = session.game.hands;
  for (let p = 0; p < session.game.player_count; p++) {
    sprites[p] = [];
    const playerNum = seatToPlayer(p);
    for (let h = 0; h < session.game.hand_size; h++) {
      const tile = gameHands[p][h];
      if (!tile) continue;
      const sprite = makeSprite(tile);
      const pos = getHandPosition(playerNum, h);
      if (pos) {
        sprite.setPose(pos);
        if (sprite._shadow) shadowLayer.appendChild(sprite._shadow);
        spriteLayer.appendChild(sprite);
        const data = { sprite, tile, originalSlot: h };
        sprites[p][h] = data;
        if (p === 0) {
          sprite.addEventListener('click', () => handlePlayer1Click(sprite));
          sprite.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            handlePlayer1Click(sprite);
          }, { passive: false });
        }
      }
    }
  }

  // Flip player 1 tiles face-up
  for (const data of (sprites[0] || [])) {
    if (data && data.sprite) data.sprite.setFaceUp(true);
  }

  team1Score = 0; team2Score = 0;
  team1Marks = 0; team2Marks = 0;
  updateScoreDisplay();
  TUT_HAND_ACTIVE = true;
}

// ── Tutorial Start/End ──────────────────────────────────────────────────────
function tutStart() {
  TUT_ACTIVE = true;
  window.TUT_ACTIVE = true;
  TUT_LESSON = 0;
  TUT_STEP = 0;
  TUT_HAND_ACTIVE = false;

  hideStartScreen();
  initGameMode('T42');
  document.getElementById('trumpDisplay').classList.remove('visible');

  // Hide bid/trump overlays
  document.getElementById('bidBackdrop').style.display = 'none';
  document.getElementById('trumpBackdrop').style.display = 'none';

  tutRunStep();
}

function tutEnd() {
  TUT_ACTIVE = false;
  window.TUT_ACTIVE = false;
  TUT_HAND_ACTIVE = false;
  TUT_WAITING_FOR = null;
  TUT_AI_FORCE_PASS = false;
  TUT_ON_HAND_END = null;
  TUT_ON_TRICK_END = null;
  TUT_ON_BID_DONE = null;
  TUT_ON_TRUMP_DONE = null;
  if (TUT_TYPE_TIMER) { clearInterval(TUT_TYPE_TIMER); TUT_TYPE_TIMER = null; }
  tutStopAudio();

  tutHide();
  document.body.classList.remove('tutDimGame', 'tutShowGame');
  shadowLayer.innerHTML = '';
  spriteLayer.innerHTML = '';
  sprites.length = 0;

  // Hide game overlays
  document.getElementById('bidBackdrop').style.display = 'none';
  document.getElementById('trumpBackdrop').style.display = 'none';

  showStartScreen();
}

// ── Hook: Tutorial button ───────────────────────────────────────────────────
const tutBtn = document.getElementById('btnStartTutorial');
if (tutBtn) tutBtn.addEventListener('click', () => tutStart());

// ── Hook: AI bidding override ───────────────────────────────────────────────
const _origProcessAIBidRef = processAIBid;
window.processAIBid = function(seat) {
  if (TUT_ACTIVE && TUT_AI_FORCE_PASS) {
    biddingState.passCount++;
    biddingState.bids.push({ seat, playerNumber: seatToPlayer(seat), bid: "pass" });
    return { action: "pass" };
  }
  return _origProcessAIBidRef(seat);
};
processAIBid = window.processAIBid;

// ── Hook: finalizeBidding → tutorial callback ───────────────────────────────
const _origFinalizeRef = finalizeBidding;
const _wrappedFinalize = function() {
  const result = _origFinalizeRef.apply(this, arguments);
  if (TUT_ACTIVE && TUT_ON_BID_DONE) {
    setTimeout(() => { if (TUT_ON_BID_DONE) TUT_ON_BID_DONE(); }, 500);
  }
  return result;
};
window.finalizeBidding = _wrappedFinalize;
finalizeBidding = _wrappedFinalize;

// ── Hook: confirmTrumpSelection → tutorial callback ─────────────────────────
const _origConfirmTrumpRef = confirmTrumpSelection;
const _wrappedConfirmTrump = function() {
  const phaseBefore = session ? session.phase : null;
  if (TUT_ACTIVE) console.log('[Tutorial] confirmTrumpSelection called, selectedTrump:', selectedTrump, 'phase:', phaseBefore);
  const result = _origConfirmTrumpRef.apply(this, arguments);
  const phaseAfter = session ? session.phase : null;
  // Only fire callback if trump was actually set (phase changed from NEED_TRUMP)
  if (TUT_ACTIVE && TUT_ON_TRUMP_DONE && session && phaseAfter !== phaseBefore) {
    console.log('[Tutorial] Trump confirmed! Phase changed:', phaseBefore, '->', phaseAfter);
    setTimeout(() => { if (TUT_ON_TRUMP_DONE) TUT_ON_TRUMP_DONE(); }, 500);
  } else if (TUT_ACTIVE && TUT_ON_TRUMP_DONE) {
    console.log('[Tutorial] confirmTrumpSelection called but phase unchanged:', phaseBefore, '- NOT firing callback');
  }
  return result;
};
window.confirmTrumpSelection = _wrappedConfirmTrump;
confirmTrumpSelection = _wrappedConfirmTrump;

// ── Hook: showHandEndPopup → tutorial callback ──────────────────────────────
const _origShowHandEnd = showHandEndPopup;
const _wrappedShowHandEnd = function() {
  if (TUT_ACTIVE && TUT_ON_HAND_END) {
    setTimeout(() => { if (TUT_ON_HAND_END) TUT_ON_HAND_END(); }, 300);
    return;
  }
  return _origShowHandEnd.apply(this, arguments);
};
window.showHandEndPopup = _wrappedShowHandEnd;
showHandEndPopup = _wrappedShowHandEnd;

// ── Hook: collectToHistory → trick end callback ─────────────────────────────
const _origCollectToHistory = collectToHistory;
const _wrappedCollect = async function() {
  const result = await _origCollectToHistory.apply(this, arguments);
  if (TUT_ACTIVE && TUT_ON_TRICK_END) TUT_ON_TRICK_END();
  return result;
};
window.collectToHistory = _wrappedCollect;
collectToHistory = _wrappedCollect;

// ── Lesson definitions ──────────────────────────────────────────────────────
const TUTORIAL_LESSONS = [
  // LESSON 1: THE DOMINOES
  {
    title: 'The Dominoes',
    steps: [
      { type: 'text_dim', audio: 'L1_S1_welcome.mp3', text: 'Welcome to Texas 42 Training!\n\nThis tutorial will teach you how to play one of the best card-style domino games ever invented.\n\nLet\'s start with the basics.' },
      { type: 'text_dim', audio: 'L1_S2_domino_set.mp3', text: 'Texas 42 uses a standard Double-Six domino set \u2014 28 dominoes total.\n\nEach domino has two ends, with a number from 0 to 6 on each side.\n\nExamples: [6|6], [5|3], [2|0]' },
      { type: 'text_dim', audio: 'L1_S3_four_players.mp3', text: 'Four players sit around the table. All 28 dominoes are dealt out \u2014 7 each.\n\nYou (Player 1) sit at the bottom. Your partner (Player 4) sits across from you at the top.\n\nPlayers 2 and 3 are your opponents.' },
      { type: 'deal', audio: 'L1_S4_deal.mp3', text: 'Here are your 7 dominoes at the bottom of the screen.\n\nYour opponents\' and partner\'s dominoes are face-down.\n\nTap any of your dominoes to see how they sort!',
        hands: [
          [[6,4],[5,5],[3,3],[6,2],[4,1],[5,0],[6,6]],
          [[5,4],[3,2],[6,1],[4,0],[2,2],[5,1],[6,3]],
          [[4,4],[6,5],[3,1],[2,0],[5,2],[1,0],[4,3]],
          [[1,1],[0,0],[6,0],[5,3],[4,2],[3,0],[2,1]]
        ], dealer: 3 }
    ]
  },
  // LESSON 2: SUITS & DOUBLES
  {
    title: 'Suits & Doubles',
    steps: [
      { type: 'text', text: 'SUITS\n\nDominoes are grouped into 7 suits: blanks (0s), aces (1s), deuces (2s), treys (3s), fours (4s), fives (5s), and sixes (6s).\n\nA domino belongs to a suit if it has that number on either end.' },
      { type: 'text', text: 'The "sixes" suit contains:\n[6|6] [6|5] [6|4] [6|3] [6|2] [6|1] [6|0]\n\nThat\'s 7 dominoes in every suit.\n\nThe DOUBLE is the highest: [6|6] is king of sixes.' },
      { type: 'text', text: 'DOUBLES are special:\n\n[6|6] = highest six\n[5|5] = highest five\n[4|4] = highest four\n...down to...\n[0|0] = highest blank\n\nThe lowest in the sixes suit is [6|0].\nThe lowest in the fives suit is [5|0].' },
      { type: 'text', text: 'Each domino belongs to TWO suits. The [6|4] belongs to both sixes AND fours.\n\nWhen a suit is led in a trick, you must follow that specific suit. More on this during play!' }
    ]
  },
  // LESSON 3: COUNT DOMINOES
  {
    title: 'Count Dominoes',
    steps: [
      { type: 'text', text: 'COUNT DOMINOES\n\nSome dominoes are worth extra points:\n\n5-COUNT (5 pts each):\n  [5|0]  [4|1]  [3|2]\n\n10-COUNT (10 pts each):\n  [5|5]  [6|4]' },
      { type: 'text', text: 'Total count: 3 x 5 pts = 15\n             2 x 10 pts = 20\nCount total = 35 points\n\nPlus 7 tricks x 1 pt each = 7\n\n35 + 7 = 42 total points\n\nThat\'s where the name "42" comes from!' },
      { type: 'text', text: 'In your hand, look for count:\n\n  [6|4] = 10 points\n  [5|5] = 10 points\n  [5|0] = 5 points\n  [4|1] = 5 points\n\nThat\'s 30 points of count! Very strong.' }
    ]
  },
  // LESSON 4: BIDDING & TRUMP
  {
    title: 'Bidding & Trump',
    steps: [
      { type: 'text', text: 'THE BIDDING PHASE\n\nAfter dealing, players bid clockwise starting left of the shuffler.\n\nYou bid how many of 42 points your team can win.\n\nMinimum bid: 30\nMaximum bid: 42\n\nYou can pass if your hand is weak.' },
      { type: 'text', text: 'The highest bidder wins the bid and chooses the trump suit.\n\nIf everyone passes, the dominoes are reshuffled.\n\nBidding 30 means your team needs 30 of 42 points to earn a mark.' },
      { type: 'text', text: 'WHEN TO BID 30 (rule of thumb):\n\nYou need at least:\n\u2022 3 dominoes in your best suit, including the double\n\u2022 Plus 2 other doubles\n\nExample: [6|6] [6|4] [6|2] + [3|3] [5|5]\n= 3 sixes with double + 2 side doubles = bid 30!' },
      { type: 'text', text: 'Your hand: [6|6] [6|4] [6|2] [5|5] [5|0] [4|1] [3|3]\n\n3 sixes with double [6|6] + doubles [5|5] and [3|3].\n\nSolid 30-bid hand! Let\'s bid.', nextLabel: 'Start Bidding \u25B6' },
      { type: 'bid', text: 'Use the slider to set 30, then tap "Bid".\n\nThe other players will pass.', aiPass: true },
      { type: 'trump', text: 'You won the bid! Pick trump.\n\nYou have 3 sixes with [6|6]. Slide to 6, then tap "Confirm Trump".' }
    ]
  },
  // LESSON 6: PLAYING TRICKS
  {
    title: 'Playing Tricks',
    steps: [
      { type: 'text', text: 'HOW TRICKS WORK\n\nBid winner leads the first trick.\n\nEach player follows clockwise.\nYou MUST follow the led suit if you can.\n\nCan\'t follow? Play anything \u2014 including trump!' },
      { type: 'text', text: 'WHO WINS THE TRICK:\n\n1. If trump was played \u2192 highest trump wins\n2. Otherwise \u2192 highest of the led suit wins\n\nWinner leads the next trick.\nAfter 7 tricks, count points.' },
      { type: 'text', text: 'STRATEGY TIP:\n\nLead strong trumps first! [6|6] can\'t be beaten.\n\nThis pulls trumps from opponents AND wins the trick.\n\nLet\'s play!', nextLabel: 'Start Playing \u25B6' },
      { type: 'play', text: 'You lead first. Click a domino to play it.\n\nTry leading with your strongest trump!',
        resultText: 'Hand complete! Check the score \u2014 did your team make the bid?' }
    ]
  },
  // LESSON 7: SCORING
  {
    title: 'Scoring',
    steps: [
      { type: 'text_dim', text: 'SCORING\n\nAfter 7 tricks:\n\u2022 Count your team\'s points (tricks + count dominoes won)\n\u2022 Bidding team got >= bid? Earn 1 MARK\n\u2022 Bidding team fell short ("set")? Opponents get 1 MARK\n\nFirst team to 7 marks wins the game!' },
      { type: 'text_dim', text: 'EXAMPLE:\n\nYou bid 30 with sixes trump.\nYour team won 5 tricks (5) + [5|5] (10) + [6|4] (10) + [4|1] (5)\n\nTotal: 5+10+10+5 = 30. Made it!\nYour team earns 1 mark.\n\nIf you only got 28 \u2192 opponents get the mark (set!)' },
      { type: 'text_dim', text: 'KEY FACTS:\n\n\u2022 Each trick = 1 point\n\u2022 [5|0] [4|1] [3|2] = 5 pts each\n\u2022 [5|5] [6|4] = 10 pts each\n\u2022 42 total points available\n\u2022 1 mark per hand won\n\u2022 7 marks to win the game\n\nBoth teammates\' tricks count together!' }
    ]
  },
  // LESSON 8: FOLLOWING SUIT
  {
    title: 'Following Suit',
    steps: [
      { type: 'text_dim', text: 'FOLLOWING SUIT\n\nWhen someone leads a domino, its suit is the higher number.\n\nIf P2 leads [5|3] \u2192 fives suit.\nYou MUST play a five if you have one.\n\nNo fives? Play anything \u2014 trump to steal the trick!' },
      { type: 'text_dim', text: 'TRUMPING A TRICK\n\nWhen you can\'t follow suit, playing trump wins.\n\nBut if multiple players trump, highest trump wins.\n\nExample: P2 leads [5|3]. You have no fives but [6|2] is trump.\nPlay [6|2] \u2192 you\'ve trumped it!' },
      { type: 'text_dim', text: 'WHEN TRUMP IS LED\n\nIf someone leads a trump, everyone must play trump if they have one.\n\nNo trump left? Play anything, but you can\'t win.\n\nThis is why leading trumps early is powerful \u2014 it drains opponents\' trumps!' }
    ]
  },
  // LESSON 9: PRACTICE HAND
  {
    title: 'Practice Hand',
    steps: [
      { type: 'text_dim', text: 'PRACTICE TIME!\n\nFull hand: deal \u2192 bid \u2192 trump \u2192 play 7 tricks \u2192 score.\n\nReady?', nextLabel: 'Deal Me In! \u25B6' },
      { type: 'deal', text: 'Study your hand. Look for trump candidates, doubles, and count dominoes.\n\nBid when ready!',
        hands: [
          [[5,5],[5,3],[5,1],[4,4],[6,4],[3,2],[5,0]],
          [[6,6],[6,3],[2,2],[4,0],[1,0],[3,1],[6,1]],
          [[4,3],[2,1],[6,5],[0,0],[4,2],[3,0],[6,2]],
          [[1,1],[3,3],[2,0],[6,0],[4,1],[5,2],[5,4]]
        ], dealer: 3, nextLabel: 'Start Bidding \u25B6' },
      { type: 'bid', text: '4 fives with [5|5]! Plus [4|4] and count dominoes.\n\nBid 30 with fives as trump.', aiPass: true },
      { type: 'trump', text: 'Pick fives as trump \u2014 you have four including the double!' },
      { type: 'play', text: 'Play all 7 tricks! Lead strong trumps first.\n\n[5|5] is unbeatable. [6|4] is 10-count trump. [5|0] and [3|2] are 5-count.',
        resultText: 'Great practice! You\'re getting the hang of it.' }
    ]
  },
  // LESSON 10: NELLO
  {
    title: 'Nello',
    steps: [
      { type: 'text_dim', text: 'SPECIAL BID: NEL-O (Nello)\n\n"I will win ZERO tricks!"\n\nAvailable when you bid the maximum (42).\n\nSucceed (0 tricks) \u2192 your team earns 1 mark\nWin even 1 trick \u2192 opponents get the mark' },
      { type: 'text_dim', text: 'NELLO RULES:\n\n\u2022 Your partner sits out\n\u2022 You vs. both opponents (3 players)\n\u2022 No trump suit\n\u2022 You lead first\n\u2022 Avoid winning ANY trick\n\nNello hands need lots of LOW dominoes.' },
      { type: 'text_dim', text: 'GOOD NELLO HANDS:\n\n\u2022 Many blanks (low numbers)\n\u2022 No doubles (doubles are highest in suit)\n\u2022 Low offs\n\nExample: [0|0] [1|0] [2|0] [3|0] [4|0] [2|1] [3|1]\nAll very low \u2014 hard to win any trick!' }
    ]
  },
  // LESSON 11: DOUBLES AS TRUMP
  {
    title: 'Doubles as Trump',
    steps: [
      { type: 'text_dim', text: 'SPECIAL TRUMP: DOUBLES\n\nInstead of a regular suit, declare ALL doubles as trump!\n\n[6|6] = highest trump\n[5|5] [4|4] [3|3] [2|2] [1|1] [0|0]\n\n7 trump dominoes \u2014 one in every suit.' },
      { type: 'text_dim', text: 'WHEN TO BID DOUBLES:\n\nNeed 4+ doubles, ideally 5+.\n\nExample: [6|6] [4|4] [3|3] [2|2] [1|1] [5|0] [6|3]\n5 doubles! Bid 30 with Doubles trump.\n\n[6|6] pulls doubles from opponents. Very powerful.' },
      { type: 'text_dim', text: 'DOUBLES FOLLOW ME:\n\nWhen doubles are trump and you lead a double, opponents must play a double if they have one.\n\nThis house rule (ON by default) makes doubles-as-trump very strong!' }
    ]
  },
  // LESSON 12: FINAL CHALLENGE
  {
    title: 'Final Challenge',
    steps: [
      { type: 'text_dim', text: 'YOU\'VE LEARNED THE BASICS!\n\nReview:\n\u2022 28 dominoes, 7 each, 4 players, 2 teams\n\u2022 Bid 30-42 on points your team can win\n\u2022 Pick trump (your strongest suit)\n\u2022 Follow suit, use trumps strategically\n\u2022 35 count + 7 tricks = 42 points\n\u2022 First to 7 marks wins!' },
      { type: 'text_dim', text: 'QUICK REFERENCE:\n\n5-count: [5|0] [4|1] [3|2]\n10-count: [5|5] [6|4]\n\nBid 30: 3 trumps + double + 2 side doubles\nLead strong trumps early!\nProtect your count dominoes!', nextLabel: 'Play Final Hand \u25B6' },
      { type: 'deal', text: 'Final challenge! Study, bid smart, play to win.\n\nGood luck!',
        hands: [
          [[4,4],[4,3],[4,1],[4,0],[6,6],[3,2],[5,0]],
          [[5,5],[6,5],[5,2],[3,3],[2,1],[1,0],[6,3]],
          [[6,4],[6,2],[6,1],[2,2],[3,0],[5,1],[0,0]],
          [[1,1],[5,4],[5,3],[2,0],[4,2],[6,0],[3,1]]
        ], dealer: 3, nextLabel: 'Start Bidding \u25B6' },
      { type: 'bid', text: '4 fours with the double! Plus [6|6], [3|2] (5-count), [5|0] (5-count).\n\nBid 30 with confidence!', aiPass: true },
      { type: 'trump', text: 'Pick fours as trump \u2014 4 of them + the double!\n\n[4|4] unbeatable, [6|6] dominant off-suit.' },
      { type: 'play', text: 'Lead trumps, play [6|6] for off-suit tricks.\n\nProtect [5|0] and [3|2] \u2014 5 pts each!',
        resultText: 'Congratulations! You\'ve completed the Texas 42 Tutorial!\n\nYou\'re ready to play for real. Hit "New Game" and choose Texas 42!' }
    ]
  }
];

window.tutStart = tutStart;
window.tutEnd = tutEnd;
window.TUTORIAL_LESSONS = TUTORIAL_LESSONS;

console.log('[Tutorial] Texas 42 Training System loaded');
} catch(e) { console.error('[Tutorial] IIFE ERROR:', e.message, e.stack); }
})();

