const viewport = document.getElementById('viewport');
const world = document.getElementById('world');
const player = document.getElementById('player');
const npcLayer = document.getElementById('npcLayer');
const areaLayer = document.getElementById('areaLayer');
const speaker = document.getElementById('speaker');
const dialogue = document.getElementById('dialogue');
const chapter = document.getElementById('chapter');
const clueCount = document.getElementById('clueCount');
const dayCount = document.getElementById('dayCount');
const rankBadge = document.getElementById('rankBadge');
const preyCount = document.getElementById('preyCount');
const accusePanel = document.getElementById('accusePanel');
const notebook = document.getElementById('notebook');
const notebookBtn = document.getElementById('notebookBtn');
const restartBtn = document.getElementById('restartBtn');
const notes = document.getElementById('notes');
const denInterior = document.getElementById('denInterior');
const denTitle = document.getElementById('denTitle');
const denText = document.getElementById('denText');
const denActions = document.getElementById('denActions');
const interiorDecor = document.getElementById('interiorDecor');
const leaveDen = document.getElementById('leaveDen');
const huntScene = document.getElementById('huntScene');
const murderCutscene = document.getElementById('murderCutscene');
const playOverlay = document.getElementById('playOverlay');
const playBtn = document.getElementById('playBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const instructionsDialog = document.getElementById('instructions');
const overlayText = playOverlay.querySelector('p');
const pcModeBtn = document.getElementById('pcModeBtn');
const mobileModeBtn = document.getElementById('mobileModeBtn');
const mobileControls = document.getElementById('mobileControls');
const previewCat = document.getElementById('previewCat');
const previewName = document.getElementById('previewName');
const prefixDisplay = document.getElementById('prefixDisplay');
const peltPicker = document.getElementById('peltPicker');
const changeNameBtn = document.getElementById('changeNameBtn');
const genderBtn = document.getElementById('genderBtn');
const furBush = document.getElementById('furBush');
const suspectBoard = document.getElementById('suspectBoard');

const worldWidth = 3200;
const groundY = 90;
let firstMurderer = 'Ravenstripe';
let controlMode = 'pc';
let audioContext;
const keys = new Set();

let foundClues;
let questioned;
let cast;
let game;

const baseCast = [
    ['Whiskerstar', 'Leader', 'Tom', 308, 224, '#d6c9a8', '#7a674a', 'Whiskerstar saw Willowfur arguing near the medicine den before moonhigh.'],
    ['Ashfall', 'Deputy', 'Tom', 506, 96, '#777a78', '#d4d4c8', 'Ashfall confirms Ravenstripe left the warrior den after everyone settled.'],
    ['Mistclaw', 'Warrior', 'Tom', 1160, 90, '#8fa0a6', '#eef6f5', 'Mistclaw says the killer smelled of pine resin.'],
    ['Ravenstripe', 'Warrior', 'Tom', 1660, 90, '#171717', '#4b4b4b', 'Ravenstripe denies everything too quickly and has a scratched ear.'],
    ['Brindleleaf', 'Warrior', 'Tom', 2060, 90, '#a76d3f', '#4d2d1c', 'Brindleleaf saw dark fur snagged on the elder den brambles.'],
    ['Cloudspark', 'Warrior', 'She-cat', 2350, 90, '#f0eee1', '#c4b892', 'Cloudspark heard a splash from the muddy stream path after the attack.'],
    ['Pinefoot', 'Warrior', 'Tom', 2590, 90, '#6a4d34', '#263d23', 'Pinefoot says Ravenstripe handled pine resin while repairing the camp barrier.'],
    ['Sorreltail', 'Warrior', 'She-cat', 2950, 90, '#c55f45', '#f0b172', 'Sorreltail says Willowfur discovered stolen prey hidden under Ravenstripe’s nest.']
];

const extraCats = {
    Leafsong: { rank: 'Medicine Cat', gender: 'She-cat', fur: '#8db35d', mark: '#f2e7b8' },
    Oakwhisker: { rank: 'Elder', gender: 'Tom', fur: '#6b5138', mark: '#cab07b' },
    Pebblekit: { rank: 'Kit', gender: 'Tom', fur: '#c99762', mark: '#f5d095' },
    Mosskit: { rank: 'Kit', gender: 'She-cat', fur: '#ded8c4', mark: '#857d67' },
    Tinykit: { rank: 'Kit', gender: 'She-cat', fur: '#514132', mark: '#b8a087' },
    Reedpaw: { rank: 'Apprentice', gender: 'Tom', fur: '#7c5a38', mark: '#d6b073' },
    Fernpaw: { rank: 'Apprentice', gender: 'She-cat', fur: '#bbb5a2', mark: '#776854' },
    Nettleclaw: { rank: 'Sunclan Warrior', gender: 'Tom', fur: '#d09b42', mark: '#5a3920' },
    Dawnpelt: { rank: 'Sunclan Warrior', gender: 'She-cat', fur: '#e6c77d', mark: '#9b6a2f' },
    Russetfang: { rank: 'Sunclan Deputy', gender: 'Tom', fur: '#9f4f33', mark: '#f0a35d' }
};

const mateCandidates = new Set(['Mistclaw', 'Brindleleaf', 'Cloudspark', 'Sorreltail']);

const firstLines = {
    Whiskerstar: ['My ears heard anger by the medicine den. Willowfur hissed that someone had stolen prey.', 'A leader must see truth through fog. Ask who left camp with mud on their paws.'],
    Ashfall: ['I counted the nests. Ravenstripe slipped out after the camp went quiet.', 'Find what clung to his pelt. The forest keeps receipts.'],
    Mistclaw: ['Willowfur brushed past me earlier. Later, the clearing smelled sharp with pine resin.', 'The hunting grounds are good for clearing fear from your chest.'],
    Ravenstripe: ['Murder? I was asleep. No, I did not leave camp. Why are you staring at my ear?', 'Willowfur made enemies. Maybe ask Brindleleaf. Stop circling me.'],
    Brindleleaf: ['The elder den brambles caught a tuft of torn fur.', 'Warrior life means watching shadows even after the clan starts purring again.'],
    Cloudspark: ['There was a splash by the stream path. Then pawsteps, heavy and fast.', 'The borders are quiet today, but quiet can still hide claws.'],
    Pinefoot: ['Ravenstripe and I patched the pine-barrier. Resin stuck to his paws.', 'The fighting grounds are open now. Reedpaw and Fernpaw are always training.'],
    Sorreltail: ['Willowfur found missing prey under Ravenstripe’s moss. She was going to tell Whiskerstar at dawn.', 'A fresh mouse can say more than a moon of boasting.']
};

const denDetails = {
    'Leader Den': ['A quiet stone-scented den tucked behind Highrock.', '<div class="nest"></div><div class="nest"></div>', ['Whiskerstar']],
    Nursery: ['Warm moss, soft bracken, and curious kits. They tumble over each other and beg for stories.', '<div class="nest"></div><div class="inside-kit one"></div><div class="inside-kit two"></div><div class="inside-kit three"></div>', ['Pebblekit', 'Mosskit', 'Tinykit']],
    'Warrior Den': ['Crowded nests ring the walls. Once you are a warrior, you can sleep here to advance time.', '<div class="nest"></div><div class="nest"></div><div class="nest"></div>', ['Brindleleaf', 'Cloudspark', 'Sorreltail']],
    'Elder Den': ['Dry leaves and old stories fill the air.', '<div class="nest"></div><div class="nest"></div>', ['Oakwhisker']],
    'Medicine Den': ['A leafy den woven from ferns, ivy, and sweet-smelling herbs.', '<div class="leaf-pile"></div><div class="herb-bundle"></div>', ['Leafsong']]
};

const playerState = {
    x: 120,
    y: 0,
    velocityY: 0,
    speed: 6,
    moving: false,
    insideDen: false
};

function freshCast() {
    return baseCast.map(([name, rank, gender, x, bottom, fur, mark, clue]) => ({
        name,
        rank,
        gender,
        x,
        bottom,
        fur,
        mark,
        clue
    }));
}

function catMarkup() {
    return '<span class="tail"></span><span class="body"></span><span class="head"></span><span class="leg l1"></span><span class="leg l2"></span><span class="leg l3"></span><span class="leg l4"></span>';
}

const pelts = [
    { name: 'Brown', fur: '#b77b4f', mark: '#5d3f2c' },
    { name: 'Black', fur: '#3a3733', mark: '#7c8087' },
    { name: 'Cream', fur: '#e6d4a8', mark: '#9b7350' },
    { name: 'Gray', fur: '#8b96a3', mark: '#cfd9e0' },
    { name: 'Ginger', fur: '#cf7a3a', mark: '#f4c79a' }
];

let currentPrefix = 'Bramble';
let currentFurIndex = 0;

const genderCycle = ['tom', 'she-cat', 'non-binary'];
const genderLabels = { tom: 'Tom', 'she-cat': 'She-cat', 'non-binary': 'Non-binary' };
let currentGender = 'tom';

function cycleGender() {
    const next = (genderCycle.indexOf(currentGender) + 1) % genderCycle.length;
    currentGender = genderCycle[next];
    if (game) {
        game.gender = currentGender;
    }
    updateTitlePreview();
}

function playerPrefix() {
    return game?.playerPrefix || currentPrefix || 'Bramble';
}

function apprenticeName() {
    return `${playerPrefix()}paw`;
}

function warriorName() {
    return `${playerPrefix()}claw`;
}

function playerName() {
    return game?.rank === 'Apprentice' ? apprenticeName() : warriorName();
}

function playerFur() {
    return game?.playerFur || pelts[currentFurIndex].fur;
}

function playerMark() {
    return game?.playerMark || pelts[currentFurIndex].mark;
}

function sanitizePrefix(raw) {
    const cleaned = (raw || '').trim().replace(/[^a-zA-Z]/g, '').slice(0, 12);
    if (!cleaned) {
        return 'Bramble';
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

const baseAlibis = {
    Whiskerstar: 'Slept in the leader den behind Highrock. Ashfall checked on them at moonhigh.',
    Ashfall: 'Counted the warrior nests at moonhigh. Saw one warrior slip out toward the medicine den.',
    Mistclaw: 'Hunted along the river path with Cloudspark before dawn.',
    Ravenstripe: 'Says they were curled in the warrior den all night, eyes closed.',
    Brindleleaf: 'Listened to Oakwhisker tell stories at the elder den until very late.',
    Cloudspark: 'Washed thorns from her paws at the stream until moonset.',
    Pinefoot: 'Repaired the pine barrier at the camp edge.',
    Sorreltail: 'Returned moss bedding to the nursery for the queens.'
};

function alibiFor(name) {
    if (name === firstMurderer) {
        return `${name} was seen near Willowfur's nest before moonhigh. They will not say why they were there.`;
    }
    return baseAlibis[name] || `${name} was asleep through the night.`;
}

function updateTitlePreview() {
    const pelt = pelts[currentFurIndex];
    if (prefixDisplay) {
        prefixDisplay.textContent = currentPrefix;
    }
    if (previewName) {
        previewName.textContent = `${currentPrefix}paw`;
    }
    if (previewCat) {
        previewCat.innerHTML = catMarkup();
        previewCat.style.setProperty('--fur', pelt.fur);
        previewCat.style.setProperty('--mark', pelt.mark);
    }
    if (genderBtn) {
        genderBtn.textContent = genderLabels[currentGender];
    }
}

function selectPelt(index) {
    currentFurIndex = index;
    if (game) {
        const pelt = pelts[index];
        game.playerFur = pelt.fur;
        game.playerMark = pelt.mark;
        game.playerFurIndex = index;
        if (player) {
            player.style.setProperty('--fur', pelt.fur);
            player.style.setProperty('--mark', pelt.mark);
        }
    }
    if (peltPicker) {
        peltPicker.querySelectorAll('.pelt-swatch').forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === index);
        });
    }
    updateTitlePreview();
}

function buildPeltPicker() {
    if (!peltPicker) {
        return;
    }
    peltPicker.innerHTML = '';
    pelts.forEach((pelt, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pelt-swatch';
        btn.title = pelt.name;
        btn.setAttribute('aria-label', `${pelt.name} pelt`);
        btn.style.setProperty('--swatch', pelt.fur);
        if (index === currentFurIndex) {
            btn.classList.add('selected');
        }
        btn.addEventListener('click', () => selectPelt(index));
        peltPicker.appendChild(btn);
    });
}

function promptForPrefix() {
    const raw = window.prompt('Enter your name prefix (letters only). It becomes "<name>paw" then "<name>claw".', currentPrefix);
    if (raw === null) {
        return;
    }
    currentPrefix = sanitizePrefix(raw);
    if (game) {
        game.playerPrefix = currentPrefix;
    }
    updateTitlePreview();
}

function setMessage(who, text) {
    speaker.textContent = who;
    dialogue.textContent = text;
}

function playButtonSound() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return;
    }
    audioContext = audioContext || new AudioCtx();
    const now = audioContext.currentTime;
    const blip = audioContext.createOscillator();
    const sparkle = audioContext.createOscillator();
    const gain = audioContext.createGain();

    blip.type = 'triangle';
    blip.frequency.setValueAtTime(420, now);
    blip.frequency.exponentialRampToValueAtTime(760, now + 0.055);
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(1200, now);
    sparkle.frequency.exponentialRampToValueAtTime(1680, now + 0.04);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    blip.connect(gain);
    sparkle.connect(gain);
    gain.connect(audioContext.destination);
    blip.start(now);
    sparkle.start(now);
    blip.stop(now + 0.1);
    sparkle.stop(now + 0.065);
}

function resetGame(showOverlay = true) {
    if (game?.dayTimer) {
        clearTimeout(game.dayTimer);
    }
    foundClues = new Set();
    questioned = new Set();
    cast = freshCast();
    firstMurderer = chooseMurderer();
    applyMysteryClues();
    game = {
        started: false,
        gender: '',
        day: 1,
        firstLimit: 3,
        rank: 'Apprentice',
        currentArea: 'camp',
        firstSolved: false,
        secondSeen: false,
        awaitingClanReturn: false,
        clanGathered: false,
        ashstarLeader: false,
        moonpoolDone: false,
        prey: 0,
        preyInMouth: false,
        mouseVisible: false,
        mouseTimer: null,
        trust: {},
        mate: null,
        rose: false,
        roseWon: false,
        ticTacToeDone: false,
        moonpoolClosed: false,
        deputyDay: null,
        patrolSelected: [],
        patrolPending: null,
        abandonedKitFound: false,
        abandonedKit: null,
        gatheringActive: false,
        lastGatheringDay: null,
        firstGatheringDone: false,
        ashstarAwayReturnDay: null,
        ended: false,
        kitsAsked: false,
        kitsHad: false,
        expectingKits: false,
        kitsDueDay: null,
        kitStage: null,
        kitNames: ['Stormkit', 'Dewkit', 'Brightkit'],
        playerKits: [],
        ghostMode: false,
        ghostStartDay: null,
        mateKilled: false,
        oldAgePrompted: false,
        nurseryKitAges: [
            { base: 'Pebble', bornDay: 1, fur: '#c99762', mark: '#f5d095' },
            { base: 'Moss', bornDay: 1, fur: '#ded8c4', mark: '#857d67' },
            { base: 'Tiny', bornDay: 1, fur: '#514132', mark: '#b8a087' }
        ],
        playerPrefix: currentPrefix,
        playerFurIndex: currentFurIndex,
        playerFur: pelts[currentFurIndex].fur,
        playerMark: pelts[currentFurIndex].mark,
        suspectStatus: {},
        alibiUsed: false,
        furBushFound: false
    };
    playerState.x = 120;
    playerState.y = 0;
    playerState.velocityY = 0;
    playerState.insideDen = false;
    denInterior.hidden = true;
    huntScene.hidden = true;
    murderCutscene.hidden = true;
    playOverlay.hidden = !showOverlay;
    playBtn.textContent = 'Start';
    overlayText.textContent = 'Find the murderer before the trail goes cold, then live as a warrior of Moonclan.';
    accusePanel.innerHTML = '';
    if (furBush) {
        furBush.hidden = false;
    }
    keys.clear();
    updateControlsVisibility();
    setScene('camp');
    renderAll();
    setMessage(apprenticeName(), 'Choose PC or Mobile, then press Start to begin your life in Moonclan.');
    updateTitlePreview();
}

function chooseMurderer() {
    const eligible = cast.filter((cat) => !['Leader', 'Deputy'].includes(cat.rank));
    return eligible[Math.floor(Math.random() * eligible.length)].name;
}

function applyMysteryClues() {
    const culprit = firstMurderer;
    cast.forEach((cat) => {
        if (cat.name === 'Whiskerstar') {
            cat.clue = `Whiskerstar heard Willowfur threaten to expose ${culprit} before dawn.`;
        } else if (cat.name === 'Ashfall') {
            cat.clue = `Ashfall confirms ${culprit} left the warrior den after everyone settled.`;
        } else if (cat.name === 'Mistclaw') {
            cat.clue = `Mistclaw says the killer smelled of pine resin, the same scent on ${culprit}.`;
        } else if (cat.name === culprit) {
            cat.clue = `${culprit} denies everything too quickly and has a fresh scratch.`;
        } else if (cat.name === 'Brindleleaf') {
            cat.clue = `Brindleleaf saw fur matching ${culprit}'s pelt snagged on elder den brambles.`;
        } else if (cat.name === 'Cloudspark') {
            cat.clue = `Cloudspark heard pawsteps racing toward ${culprit}'s nest.`;
        } else if (cat.name === 'Pinefoot') {
            cat.clue = `Pinefoot says ${culprit} handled pine resin while repairing the camp barrier.`;
        } else if (cat.name === 'Sorreltail') {
            cat.clue = `Sorreltail says Willowfur found stolen prey hidden near ${culprit}'s nest.`;
        }
    });
}

function startGame() {
    game.started = true;
    game.gender = currentGender;
    playOverlay.classList.add('fade-out');
    setTimeout(() => {
        playOverlay.hidden = true;
        playOverlay.classList.remove('fade-out');
        updateControlsVisibility();
    }, 520);
    setMessage('Moonclan', `You are ${apprenticeName()}, a ${game.gender}. Willowfur has been murdered. Find the killer before day ${game.firstLimit} ends.`);
    bumpDayTimer();
    renderInvestigationActions();
}

function showLoss(reason) {
    resetGame(true);
    overlayText.textContent = `${reason} Press Start to try again.`;
    setMessage('Moonclan', reason);
}

function setControlMode(mode) {
    controlMode = mode;
    pcModeBtn.classList.toggle('selected', mode === 'pc');
    mobileModeBtn.classList.toggle('selected', mode === 'mobile');
    updateControlsVisibility();
}

function updateControlsVisibility() {
    mobileControls.hidden = controlMode !== 'mobile' || !game?.started || !playOverlay.hidden;
}

function addNote(note) {
    if (!foundClues.has(note)) {
        foundClues.add(note);
        updateHud();
    }
}

function trustFor(name) {
    return game.trust[name] || 0;
}

function dailyText(name, lines) {
    return lines[(game.day + name.length) % lines.length];
}

function rotatingText(name, lines) {
    game.clickLines = game.clickLines || {};
    const index = game.clickLines[name] || 0;
    game.clickLines[name] = index + 1;
    return lines[index % lines.length];
}

function murdererCat() {
    return cast.find((cat) => cat.name === firstMurderer) || { name: firstMurderer, fur: '#171717', mark: '#4b4b4b' };
}

function updateHud() {
    const clueTotal = Math.min(6, foundClues.size);
    const mateTrust = game.mate ? trustFor(game.mate) : Math.max(0, ...Object.values(game.trust));
    clueCount.textContent = game.firstSolved ? `Trust ${mateTrust}/3${game.rose ? ' Rose' : ''}` : `Clues ${clueTotal}/6`;
    dayCount.textContent = game.firstSolved ? `Day ${game.day}` : `Day ${game.day}/${game.firstLimit}`;
    rankBadge.textContent = game.rank;
    preyCount.textContent = `Prey ${game.prey}${game.preyInMouth ? ' (in mouth)' : ''}`;
    notes.innerHTML = Array.from(foundClues).map((note) => `<li>${note}</li>`).join('');
}

function updateChapter() {
    if (!game.started) {
        chapter.textContent = 'Press Play to begin.';
    } else if (game.ghostMode) {
        chapter.textContent = 'You walk as a Starclan ghost. The living only feel your presence.';
    } else if (!game.firstSolved && game.day > game.firstLimit) {
        chapter.textContent = 'The trail went cold.';
    } else if (game.gatheringActive) {
        chapter.textContent = 'The Gathering is tonight.';
    } else if (game.ashstarLeader) {
        chapter.textContent = game.moonpoolDone ? 'Ashstar has nine lives. You are deputy.' : 'Ashstar must travel to the Moonpool.';
    } else if (game.awaitingClanReturn) {
        chapter.textContent = 'Return to camp. The clan must gather.';
    } else if (game.firstSolved) {
        chapter.textContent = `${firstMurderer} is exiled. Warrior life has opened beyond camp.`;
    } else {
        chapter.textContent = 'A cold dawn. Willowfur lies silent beside the elder den.';
    }
}

function setScene(area) {
    game.currentArea = area;
    world.classList.remove('scene-camp', 'scene-borders', 'scene-hunting', 'scene-fighting', 'scene-moonpool', 'scene-sunclan', 'scene-gathering');
    world.classList.add(`scene-${area}`);
    const starts = { camp: 120, borders: 650, hunting: 650, fighting: 650, sunclan: 650, moonpool: 1480, gathering: 860 };
    playerState.x = starts[area] || 120;
    playerState.y = 0;
    game.mouseVisible = false;
    clearTimeout(game.mouseTimer);
    renderAll();
}

function renderAll() {
    world.classList.toggle('mystery-solved', Boolean(game.firstSolved));
    renderCats();
    renderAreas();
    updateHud();
    updateChapter();
}

function renderCats() {
    npcLayer.innerHTML = '';
    player.innerHTML = catMarkup();
    player.classList.toggle('ghost-player', Boolean(game.ghostMode));
    if (!game.ghostMode) {
        player.style.setProperty('--fur', playerFur());
        player.style.setProperty('--mark', playerMark());
    } else {
        player.style.removeProperty('--fur');
        player.style.removeProperty('--mark');
    }

    if (game.currentArea === 'fighting') {
        addExtraNpc('Reedpaw', 760, groundY, () => setMessage('Reedpaw (Tom)', rotatingText('Reedpaw', ['Watch this battle move!', 'Fernpaw says I kick too much dust.', 'One day I will guard the border.'])));
        addExtraNpc('Fernpaw', 900, groundY, () => setMessage('Fernpaw (She-cat)', rotatingText('Fernpaw', ['Press hard, turn fast, never show your belly.', 'Reedpaw brags too much.', 'Training dust gets everywhere.'])));
        if (shouldShowLivingCat('Pinefoot')) {
            addNpc('Pinefoot', 'Warrior', 1120, groundY, '#6a4d34', '#263d23', () => setMessage('Pinefoot (Tom)', rotatingText('Pinefoot', ['Keep your claws sheathed for practice.', 'Good footwork wins fights.', 'The apprentices are improving.'])));
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'gathering') {
        addNpc('Ashstar', 'Leader', 900, groundY + 160, '#777a78', '#d4d4c8', () => setMessage('Ashstar', 'Moonclan has faced danger and stands together.'));
        addNpc('Sunstar', 'Leader', 1070, groundY + 160, '#d09b42', '#5a3920', () => setMessage('Sunstar', 'Sunclan reports strong patrols and full bellies.'));
        addNpc('Dawnstar', 'Leader', 1240, groundY + 160, '#b7a369', '#f2d597', () => setMessage('Dawnstar', 'Dawnclan brings news of dry leaves and quick prey.'));
        if (shouldShowLivingCat('Cloudspark')) {
            addNpc('Cloudspark', 'Warrior', 740, groundY, '#f0eee1', '#c4b892', () => setMessage('Cloudspark', 'So many clan scents in one clearing makes my whiskers twitch.'));
        }
        if (shouldShowLivingCat('Mistclaw')) {
            addNpc('Mistclaw', 'Warrior', 1460, groundY, '#8fa0a6', '#eef6f5', () => setMessage('Mistclaw', 'Gatherings are peaceful, but every warrior still watches.'));
        }
        addExtraNpc('Nettleclaw', 1640, groundY, () => setMessage('Nettleclaw', 'Tonight we listen. Tomorrow the border matters again.'));
        addExtraNpc('Dawnpelt', 1840, groundY, () => setMessage('Dawnpelt', 'Dawnclan cats sit beneath the great tree.'));
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'borders') {
        if (shouldShowLivingCat('Cloudspark')) {
            addNpc('Cloudspark', 'Warrior', 760, groundY, '#f0eee1', '#c4b892', () => setMessage('Cloudspark (She-cat)', rotatingText('Cloudspark', ['Sunclan scent is fresh here.', 'Stay behind the river line.', 'The border stones shifted in the rain.'])));
        }
        if (shouldShowLivingCat('Mistclaw')) {
            addNpc('Mistclaw', 'Warrior', 1030, groundY, '#8fa0a6', '#eef6f5', () => setMessage('Mistclaw (Tom)', rotatingText('Mistclaw', ['This is where patrols prove themselves.', 'Do not step into Sunclan territory.', 'Want a paw-game on the stones?'])));
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'sunclan') {
        addExtraNpc('Nettleclaw', 760, groundY, () => setMessage('Nettleclaw (Tom)', 'Get out of Sunclan territory before I call the patrol.'));
        addExtraNpc('Dawnpelt', 980, groundY, () => setMessage('Dawnpelt (She-cat)', 'Moonclan paws do not belong past the river.'));
        addExtraNpc('Russetfang', 1210, groundY, () => setMessage('Russetfang (Tom)', 'Leave. This border is not yours.'));
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'hunting') {
        if (shouldShowLivingCat('Brindleleaf')) {
            addNpc('Brindleleaf', 'Warrior', 760, groundY, '#a76d3f', '#4d2d1c', () => setMessage('Brindleleaf (Tom)', rotatingText('Brindleleaf', ['Stay downwind of the mouse path.', 'The river is too deep to swim.', 'Ferns hide both prey and trouble.'])));
        }
        if (shouldShowLivingCat('Sorreltail')) {
            addNpc('Sorreltail', 'Warrior', 980, groundY, '#c55f45', '#f0b172', () => speak(cast.find((cat) => cat.name === 'Sorreltail')));
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'moonpool' && (!game.moonpoolDone || game.ghostMode)) {
        if (game.ghostMode) {
            deadCats().forEach((cat, index) => {
                const col = index % 4;
                const row = Math.floor(index / 4);
                addDeadNpc(cat, 1280 + col * 220, groundY + 28 + row * 70);
            });
        } else {
            addStarclanNpc('Silverstar', 1390);
            addStarclanNpc('Moonwhisper', 1660);
            addStarclanNpc('Frostheart', 1900);
        }
        return;
    }

    if (game.currentArea !== 'camp') {
        renderGhostCats();
        return;
    }

    cast.forEach((cat) => {
        if (!shouldShowLivingCat(cat.name)) {
            return;
        }
        if (cat.name === 'Whiskerstar' && game.ashstarLeader) {
            return;
        }
        addNpc(cat.name, cat.rank, cat.x, cat.bottom, cat.fur, cat.mark, () => speak(cat));
    });
    renderAbandonedKitInCamp();
    renderCampKits();
    renderGhostCats();
}

function renderCampKits() {
    [...game.nurseryKitAges, ...game.playerKits].forEach((kit, index) => {
        const stage = growthStage(kit.bornDay);
        const suffix = stage === 'warrior' ? 'heart' : stage === 'apprentice' ? 'paw' : 'kit';
        const name = `${kit.base}${suffix}`;
        if (!shouldShowLivingCat(name)) {
            return;
        }
        const x = stage === 'warrior' ? 1780 + index * 82 : stage === 'apprentice' ? 1220 + index * 78 : 880 + index * 64;
        addNpc(name, stage === 'warrior' ? 'Warrior' : stage === 'apprentice' ? 'Apprentice' : 'Kit', x, groundY, kit.fur, kit.mark, () => setMessage(name, rotatingText(name, [
            stage === 'kit' ? `${name} tumbles through the clearing.` : `${name} asks to practice patrol steps.`,
            stage === 'warrior' ? `${name} says, "I can go on patrol now."` : `${name} bats at a moss scrap.`,
            `${name} smells of warm moss and milk.`
        ])));
    });
}

function growthStage(bornDay) {
    const age = game.day - bornDay;
    if (age >= 12) {
        return 'warrior';
    }
    if (age >= 6) {
        return 'apprentice';
    }
    return 'kit';
}

function renderAbandonedKitInCamp() {
    if (!game.abandonedKit) {
        return;
    }
    const rank = game.abandonedKit.stage === 'warrior' ? 'Warrior' : game.abandonedKit.stage === 'apprentice' ? 'Apprentice' : 'Kit';
    const suffix = game.abandonedKit.stage === 'warrior' ? 'heart' : game.abandonedKit.stage === 'apprentice' ? 'paw' : 'kit';
    const name = `River${suffix}`;
    if (!shouldShowLivingCat(name)) {
        return;
    }
    addNpc(name, rank, game.abandonedKit.stage === 'warrior' ? 1880 : 980, groundY, '#8f8068', '#e1d3ae', () => {
        if (game.abandonedKit.stage === 'apprentice') {
            accusePanel.innerHTML = '<button id="trainRiverpaw" type="button">Train Riverpaw</button><button id="huntRiverpaw" type="button">Hunt with Riverpaw</button><button id="fightRiverpaw" type="button">Fight Train</button>';
            document.getElementById('trainRiverpaw').addEventListener('click', () => setMessage('Training', 'You practice battle crouches with Riverpaw until their paws stop tangling.'));
            document.getElementById('huntRiverpaw').addEventListener('click', () => setMessage('Hunting', 'Riverpaw tracks a mouse trail beside you and learns to stay downwind.'));
            document.getElementById('fightRiverpaw').addEventListener('click', () => setMessage('Fighting Grounds', 'You spar gently with Riverpaw, teaching them to dodge, tap, and keep their claws sheathed.'));
        }
        setMessage(name, rotatingText(name, [
        game.abandonedKit.stage === 'kit' ? 'The abandoned kit presses close to your paws.' : 'Your apprentice watches you carefully.',
        game.abandonedKit.stage === 'warrior' ? 'Riverheart says, "Thank you for mentoring me."' : 'They are growing braver every day.',
        'They smell faintly of river reeds.'
    ]));
    });
}

function addNpc(name, rank, x, bottom, fur, mark, handler) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `cat npc ${rank.toLowerCase()}`;
    node.style.left = `${x}px`;
    node.style.bottom = `${bottom}px`;
    node.style.setProperty('--fur', fur);
    node.style.setProperty('--mark', mark);
    node.style.setProperty('--eye', rank === 'Leader' ? '#f7df6e' : '#b7f2a0');
    node.innerHTML = `${catMarkup()}<span class="nameplate">${name}</span>`;
    node.addEventListener('click', () => {
        if (game?.ghostMode && rank !== 'Starclan' && !isDeadCatName(name)) {
            setMessage(name, ghostFeelingLine(name));
            return;
        }
        handler();
    });
    npcLayer.appendChild(node);
}

function addExtraNpc(name, x, bottom, handler) {
    const cat = extraCats[name];
    addNpc(name, cat.rank, x, bottom, cat.fur, cat.mark, handler);
}

function addStarclanNpc(name, x) {
    addNpc(name, 'Starclan', x, groundY + 28, '#d9ecff', '#ffffff', () => setMessage(`${name} (Starclan)`, starclanLine(name)));
    npcLayer.lastElementChild.classList.add('starclan');
}

function shouldShowLivingCat(name) {
    if (game.firstSolved && name === firstMurderer) {
        return false;
    }
    if (game.mateKilled && name === game.mate) {
        return false;
    }
    if (game.patrolPending && game.patrolPending.cats.includes(name)) {
        return false;
    }
    return true;
}

function deadCats() {
    const dead = [
        { name: 'Silverstar', rank: 'Leader', fur: '#d9ecff', mark: '#ffffff', homeScene: 'camp' },
        { name: 'Moonwhisper', rank: 'Deputy', fur: '#cfdfff', mark: '#ffffff', homeScene: 'camp' },
        { name: 'Frostheart', rank: 'Warrior', fur: '#e8f5ff', mark: '#b9d4ff', homeScene: 'camp' },
        { name: 'Littlekit', rank: 'Kit', fur: '#f5f0ff', mark: '#b7ccff', homeScene: 'camp' },
        { name: 'Hawkfeather', rank: 'Warrior', fur: '#cfd9e9', mark: '#7c8ba2', homeScene: 'borders' },
        { name: 'Stoneclaw', rank: 'Deputy', fur: '#c9d4dd', mark: '#e8eef3', homeScene: 'borders' },
        { name: 'Briarwhisker', rank: 'Elder', fur: '#dac9b9', mark: '#fff5e8', homeScene: 'borders' },
        { name: 'Tallnose', rank: 'Warrior', fur: '#cfe1f2', mark: '#eaf3ff', homeScene: 'hunting' },
        { name: 'Mossheart', rank: 'Warrior', fur: '#d9ecdf', mark: '#ecf5ee', homeScene: 'hunting' }
    ];
    if (game.ashstarLeader) {
        dead.push({ name: 'Whiskerstar', rank: 'Leader', fur: '#d6c9a8', mark: '#ffffff', homeScene: 'camp' });
    }
    if (game.mateKilled && game.mate) {
        const mate = cast.find((cat) => cat.name === game.mate);
        dead.push({ name: game.mate, rank: 'Warrior', fur: mate?.fur || '#ddeaff', mark: mate?.mark || '#ffffff', homeScene: 'camp' });
    }
    return dead;
}

function isDeadCatName(name) {
    return deadCats().some((cat) => cat.name === name);
}

function renderGhostCats() {
    if (!game.ghostMode || game.currentArea === 'moonpool') {
        return;
    }
    const placements = {
        camp: [640, 1160, 1660, 2160],
        borders: [690, 1320, 1880],
        hunting: [820, 1640]
    };
    const xs = placements[game.currentArea];
    if (!xs) {
        return;
    }
    const sceneCats = deadCats().filter((cat) => cat.homeScene === game.currentArea);
    sceneCats.slice(0, xs.length).forEach((cat, index) => {
        addDeadNpc(cat, xs[index], groundY + 34 + (index % 2) * 22);
    });
}

function addDeadNpc(cat, x, bottom) {
    addNpc(cat.name, 'Starclan', x, bottom, cat.fur, cat.mark, () => setMessage(`${cat.name} (${cat.rank}, Starclan)`, starclanLine(cat.name)));
    npcLayer.lastElementChild.classList.add('starclan');
}

const starclanLines = {
    Silverstar: [
        'Silverstar tilts a starry head. "I led Moonclan when these stones were younger."',
        '"A leader\'s strength is patience, {WARRIOR}. You learned it well."',
        '"Watch the apprentices. Even Starclan still teaches them in dreams."',
        '"The stars hold every name we ever called. None of you are forgotten."'
    ],
    Moonwhisper: [
        '"Being deputy was hard. Being a guide is harder. I am proud of you."',
        '"Stars do not blink. They count every brave choice you ever made."',
        '"If a cat ever betrays the warrior code, you will feel cold here."',
        '"You can hear the wind without ears now. Listen for the kits."'
    ],
    Frostheart: [
        'Frostheart bumps your shoulder. "Remember when winter froze the river? You\'d have loved fishing."',
        '"Up here, prey runs forever. We hunt for the joy of it."',
        '"Tell the kits I am proud of every one of them."',
        '"I died too soon, but Starclan made me whole again."'
    ],
    Littlekit: [
        'Littlekit pounces on a dust-mote of starlight. "Play with me, {WARRIOR}!"',
        'Littlekit yawns. "Starclan is a soft nest with no claws."',
        'Littlekit tilts their head. "Why are the living cats sad? It is so warm here."',
        'Littlekit nudges your paw. "I have a thousand mossballs now."'
    ],
    Hawkfeather: [
        '"I patrolled this border for twelve seasons. The scent never lies."',
        '"Sunclan is not your enemy. Carelessness is."',
        '"Stand here long enough and you remember every paw that crossed this line."',
        '"My eyes were sharper than my claws. Tell the deputies that."'
    ],
    Stoneclaw: [
        '"My bones lie under these river stones. I keep watch even now."',
        '"A deputy carries the clan in their chest, {WARRIOR}. You did well."',
        '"Borders shift, but pride should not."',
        '"I would have liked to meet your mate. They sound brave."'
    ],
    Briarwhisker: [
        '"Pull up a tail, young one. Elders never run out of stories, even in Starclan."',
        '"I outlived three leaders and still watched kits become warriors."',
        '"The brambles up here do not snag fur. It is the only thing I miss."',
        '"You will find old elders telling new stories every dawn."'
    ],
    Tallnose: [
        '"Mice still squeak in Starclan. They run faster, though."',
        '"I taught half of Moonclan to hunt downwind. Tell them I still watch."',
        '"You smell of pine. Were you stalking near the roots?"',
        '"The fern path catches every misstep. Step lightly when you walk it."'
    ],
    Mossheart: [
        '"This forest is greener up close, when you walk it as a star."',
        '"I died chasing a fox away from the queens. I would do it again."',
        '"Bring the apprentices a clean catch and the prey-pile will sing."',
        '"Listen to the moss. It speaks softer than the wind, but truer."'
    ],
    Whiskerstar: [
        '"My old camp still feels close, {WARRIOR}. Thank you for naming the cat that took my life."',
        '"Lead with patience. That is the only lesson worth handing on."',
        '"Tell Ashstar her lives are well-earned."',
        '"I am at peace, even with blood on the brambles."'
    ]
};

function starclanLine(name) {
    if (name === game.mate) {
        return rotatingText(`mate-${name}`, [
            `${name} presses a starry muzzle to yours. "I found you again. The murderer cannot follow us here."`,
            `${name} curls beside you. "Starclan is gentler than I expected."`,
            `${name} purrs. "We get to walk together for as long as the stars hold."`,
            `${name} looks toward the camp. "Our kits are still down there. They are doing well."`
        ]);
    }
    const lines = starclanLines[name];
    if (lines) {
        const W = warriorName();
        return rotatingText(name, lines.map((line) => line.replaceAll('{WARRIOR}', W)));
    }
    return rotatingText(name, [
        'The stars under their paws ripple like water.',
        'They say, "The living path is quiet to us, but we still watch."',
        'Their pelt glitters as they tell you Starclan remembers every brave heart.'
    ]);
}

function ghostFeelingLine(name) {
    const W = warriorName();
    return rotatingText(`ghost-${name}`, [
        `${name} shivers. "Did you feel cold stars brush past?"`,
        `${name} looks through you. "Something unseen is standing here."`,
        `${name} lowers their ears. "Starclan feels close today."`,
        `${name} stares at empty air. "Maybe it is ${W}, watching over us."`,
        `${name} flicks their tail. "The wind smells of moss and old ash."`,
        `${name} pauses mid-step. "I felt a paw on my shoulder. There is nothing there."`,
        `${name} murmurs, "${W}, if you can hear me, the clan still misses you."`,
        `${name} blinks slowly. "I dreamed of stars last night. They knew my name."`,
        `${name} touches the ground with their nose. "The earth feels colder where you stand."`
    ]);
}

function renderAreas() {
    areaLayer.innerHTML = '';
    if (!game.firstSolved || game.currentArea !== 'camp') {
        if (game.currentArea !== 'camp') {
            addAreaButton('camp', Math.max(80, playerState.x - 240), 'Return to Camp');
        }
        if (game.currentArea === 'gathering') {
            addAreaButton('camp', playerState.x + 360, 'Finish Gathering');
        }
        if (game.currentArea === 'borders') {
            addAreaButton('sunclan', playerState.x + 220, 'Sunclan');
            addAreaButton('tictactoe', playerState.x + 520, 'Tic Tac Toe');
        }
        return;
    }

    addAreaButton('borders', 650, 'Borders');
    addAreaButton('hunting', 1210, 'Hunting Grounds');
    addAreaButton('fighting', 1840, 'Fighting Grounds');
    if (game.ghostMode || (game.ashstarLeader && !game.moonpoolClosed)) {
        addAreaButton('moonpool', 2680, 'Moonpool');
    }
}

function addAreaButton(area, x, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `area-gate ${area}`;
    button.style.left = `${x}px`;
    button.textContent = label;
    button.addEventListener('click', () => visitArea(area));
    areaLayer.appendChild(button);
}

function renderInvestigationActions() {
    if (!game.started || game.firstSolved || game.day > game.firstLimit) {
        return;
    }
    accusePanel.innerHTML = '<button id="solveBtn" type="button">Solve</button><button id="endDayBtn" type="button">End Day</button>';
    document.getElementById('solveBtn').addEventListener('click', showAccusationButtons);
    document.getElementById('endDayBtn').addEventListener('click', endInvestigationDay);
}

function showAccusationButtons() {
    if (game.firstSolved) {
        return;
    }
    chapter.textContent = 'Name the killer.';
    accusePanel.innerHTML = '';
    cast.forEach((cat) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = cat.name;
        button.addEventListener('click', () => accuse(cat.name));
        accusePanel.appendChild(button);
    });
}

function speak(cat) {
    if (!game.started) {
        return;
    }
    if (game.ashstarLeader && cat.name === 'Ashstar') {
        setMessage('Ashstar', game.moonpoolDone ? 'Starclan has granted my lives. You are my deputy now.' : 'Come with me to the Moonpool, deputy.');
        return;
    }
    if (game.firstSolved) {
        game.talkCounts = game.talkCounts || {};
        game.talkCounts[cat.name] = (game.talkCounts[cat.name] || 0) + 1;
        if (game.talkCounts[cat.name] % 6 === 0 && trustFor(cat.name) < 3) {
            game.trust[cat.name] = trustFor(cat.name) + 1;
            addNote(`${cat.name} trust increased to ${trustFor(cat.name)}/3 from spending time together.`);
        }
        if (game.preyInMouth) {
            givePrey(cat.name);
            return;
        }
        if (canMateWith(cat) && game.rose && trustFor(cat.name) >= 3 && !game.mate) {
            proposeMate(cat.name);
            return;
        }
        if (cat.name === game.mate) {
            setMessage(`${cat.name} (${cat.gender})`, `${cat.name} purrs. "The clan feels safer with you beside me."`);
            return;
        }
        if (game.deputyDay === game.day && cat.name !== 'Ashstar') {
            setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, `Wow, you are deputy now? Congratulations, ${warriorName()}. Moonclan trusts your paws.`);
            return;
        }
        const trust = ` Trust ${trustFor(cat.name)}/3.`;
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, `${rotatingText(cat.name, [
            firstLines[cat.name]?.[1] || 'They flick their tail in greeting.',
            'The camp feels different today.',
            'Keep your ears open. Every day changes the forest.'
        ])}${trust}`);
        return;
    }

    if (!game.firstSolved && cat.name === firstMurderer) {
        const line = questioned.has(cat.name)
            ? `Stop asking me things. Willowfur should have kept her nose out of my nest.`
            : `Murder? I was asleep. No, I did not leave camp. Why are you staring at my scratch?`;
        questioned.add(cat.name);
        addNote(`${cat.rank} ${cat.name}: ${cat.clue}`);
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, line);
        maybeEnableAccusation();
        return;
    }

    const line = (firstLines[cat.name]?.[questioned.has(cat.name) ? 1 : 0] || 'They twitch their whiskers.').replaceAll('Ravenstripe', firstMurderer);
    questioned.add(cat.name);
    addNote(`${cat.rank} ${cat.name}: ${cat.clue}`);
    setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, line);
    maybeEnableAccusation();
}

function inspectEvidence(label) {
    if (!game.started || game.firstSolved) {
        return;
    }
    const notesByEvidence = {
        'Torn fur': `A torn tuft matching ${firstMurderer}'s pelt clings to elder-den brambles.`
    };
    addNote(notesByEvidence[label]);
    setMessage('Evidence', notesByEvidence[label]);
    maybeEnableAccusation();
}

function openFurBush() {
    if (!game.started || game.firstSolved || game.furBushFound) {
        return;
    }
    if (game.currentArea !== 'camp') {
        return;
    }
    const labels = ['old leaves', 'dry twig', 'tuft of moss', 'pebble', 'spider web'];
    const trueIndex = Math.floor(Math.random() * 5);
    accusePanel.innerHTML = '<div class="fur-search" id="furSearch"></div>';
    const search = document.getElementById('furSearch');
    for (let i = 0; i < 5; i += 1) {
        const clump = document.createElement('button');
        clump.type = 'button';
        clump.className = 'fur-clump';
        clump.textContent = '?';
        clump.addEventListener('click', () => {
            if (clump.classList.contains('checked')) {
                return;
            }
            clump.classList.add('checked');
            if (i === trueIndex) {
                game.furBushFound = true;
                furBush.hidden = true;
                inspectEvidence('Torn fur');
                accusePanel.innerHTML = '';
                renderInvestigationActions();
            } else {
                clump.textContent = labels[i];
                setMessage('Bush', `You part the leaves and find ${labels[i]}. Keep searching.`);
            }
        });
        search.appendChild(clump);
    }
    setMessage('Bush', 'A bush hides something. Part each clump until you find the torn fur.');
}

function buildSuspectBoard() {
    if (!suspectBoard) {
        return;
    }
    suspectBoard.innerHTML = '';
    if (!game.started || game.firstSolved) {
        return;
    }
    const status = game.suspectStatus || {};
    const alibiSpent = Boolean(game.alibiUsed);
    cast.forEach((cat) => {
        const row = document.createElement('div');
        row.className = `suspect-row ${status[cat.name] || ''}`;

        const name = document.createElement('span');
        name.className = 'suspect-name';
        name.textContent = `${cat.rank} ${cat.name}`;
        row.appendChild(name);

        const crossBtn = document.createElement('button');
        crossBtn.type = 'button';
        crossBtn.textContent = 'Cross';
        if (status[cat.name] === 'crossed') {
            crossBtn.classList.add('active');
        }
        crossBtn.addEventListener('click', (event) => {
            event.preventDefault();
            game.suspectStatus[cat.name] = status[cat.name] === 'crossed' ? '' : 'crossed';
            buildSuspectBoard();
        });
        row.appendChild(crossBtn);

        const checkBtn = document.createElement('button');
        checkBtn.type = 'button';
        checkBtn.textContent = 'Check';
        if (status[cat.name] === 'checked') {
            checkBtn.classList.add('active');
        }
        checkBtn.addEventListener('click', (event) => {
            event.preventDefault();
            game.suspectStatus[cat.name] = status[cat.name] === 'checked' ? '' : 'checked';
            buildSuspectBoard();
        });
        row.appendChild(checkBtn);

        const alibiBtn = document.createElement('button');
        alibiBtn.type = 'button';
        alibiBtn.textContent = 'Alibi';
        alibiBtn.disabled = alibiSpent;
        alibiBtn.title = alibiSpent ? 'You only get one alibi check per game.' : 'Reveal what this cat says they were doing.';
        alibiBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (game.alibiUsed) {
                return;
            }
            game.alibiUsed = true;
            const text = alibiFor(cat.name);
            addNote(`Alibi for ${cat.name}: ${text}`);
            setMessage(`${cat.name}'s alibi`, text);
            buildSuspectBoard();
        });
        row.appendChild(alibiBtn);

        suspectBoard.appendChild(row);
    });
}

function maybeEnableAccusation() {
    if (foundClues.size < 6 || game.firstSolved) {
        return;
    }
    chapter.textContent = 'The pattern is clear. Name the killer.';
    showAccusationButtons();
}

function accuse(name) {
    if (name !== firstMurderer) {
        showLoss(`You accused ${name}, but the real murderer was ${firstMurderer}. You lost.`);
        return;
    }
    game.firstSolved = true;
    game.rank = 'Warrior';
    game.day = Math.max(game.day, 2);
    addNote(`${firstMurderer} was cast out. They vanished beyond the border, but their glare promised this was not over.`);
    addNote('Whiskerstar made you a warrior for exposing the murderer.');
    accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    if (furBush) {
        furBush.hidden = true;
    }
    renderAll();
    setMessage('Whiskerstar', `Good job, ${warriorName()}. ${firstMurderer} is cast out. From this day forward, you are a warrior.`);
}

function endInvestigationDay() {
    game.day += 1;
    updateHud();
    if (game.day > game.firstLimit) {
        showLoss('You took too long to find the murderer.');
        return;
    }
    setMessage('Moonclan', `Night falls. Day ${game.day} begins.`);
    renderInvestigationActions();
    bumpDayTimer();
}

const AUTO_DAY_MS = 4 * 60 * 1000;

function bumpDayTimer() {
    if (!game) {
        return;
    }
    clearTimeout(game.dayTimer);
    if (!game.started || game.ended) {
        return;
    }
    game.dayTimer = setTimeout(autoAdvanceDay, AUTO_DAY_MS);
}

function autoAdvanceDay() {
    if (!game?.started || game.ended || !playOverlay.hidden) {
        return;
    }
    if (playerState.insideDen || game.gatheringActive) {
        bumpDayTimer();
        return;
    }
    if (!game.firstSolved) {
        endInvestigationDay();
        return;
    }
    sleepInWarriorDen();
}

function enterDen(name) {
    const detail = denDetails[name];
    if (!detail || !game.started || game.currentArea !== 'camp') {
        return;
    }
    if (game.ghostMode) {
        setMessage('Starclan', 'Your starry paws drift past the ferns. Living dens are no longer for you.');
        return;
    }
    playerState.insideDen = true;
    keys.clear();
    denTitle.textContent = name;
    denText.textContent = detail[0];
    interiorDecor.innerHTML = `${detail[1]}<div id="denCatLayer" class="den-cat-layer"></div>`;
    denActions.innerHTML = '';
    denInterior.hidden = false;
    denInterior.querySelector('.interior-scene').classList.toggle('leafy', name === 'Medicine Den' || name === 'Nursery');

    const denCatLayer = document.getElementById('denCatLayer');
    detail[2].filter((catName) => !(game.ashstarLeader && catName === 'Whiskerstar'))
        .filter((catName) => shouldShowLivingCat(catName))
        .forEach((catName, index) => {
        addDenCat(denCatLayer, catName, 70 + index * 145, () => talkInsideDen(catName));
    });

    renderPlayerKitsInDen(denCatLayer);

    if (name === 'Warrior Den' && game.rank !== 'Apprentice') {
        const sleepButton = document.createElement('button');
        sleepButton.type = 'button';
        sleepButton.textContent = 'Sleep until dawn';
        sleepButton.addEventListener('click', sleepInWarriorDen);
        denActions.appendChild(sleepButton);
    }
    setMessage(name, `You duck inside the ${name.toLowerCase()}.`);
}

function addDenCat(layer, name, x, handler) {
    const fullCat = cast.find((cat) => cat.name === name) || extraCats[name] || { rank: 'Cat', gender: 'Unknown', fur: '#9b7350', mark: '#5d3f2c' };
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'cat npc den-cat';
    node.style.left = `${x}px`;
    node.style.bottom = '28px';
    node.style.setProperty('--fur', fullCat.fur);
    node.style.setProperty('--mark', fullCat.mark);
    node.innerHTML = `${catMarkup()}<span class="nameplate">${name}</span>`;
    node.addEventListener('click', () => {
        if (game?.ghostMode && !isDeadCatName(name)) {
            setMessage(name, ghostFeelingLine(name));
            return;
        }
        handler();
    });
    layer.appendChild(node);
}

function renderPlayerKitsInDen(layer) {
    if (denTitle.textContent !== 'Nursery' || !game.kitStage) {
        return;
    }
    game.kitNames.forEach((kitName, index) => {
        const label = game.kitStage === 'warriors' ? kitName.replace('kit', 'heart') : game.kitStage === 'apprentices' ? kitName.replace('kit', 'paw') : kitName;
        const node = document.createElement('button');
        node.type = 'button';
        node.className = `cat npc den-cat player-kit ${game.kitStage}`;
        node.style.left = `${420 + index * 110}px`;
        node.style.bottom = game.kitStage === 'newborn' ? '18px' : '28px';
        node.style.setProperty('--fur', [playerFur(), '#d9c39a', '#6d5440'][index]);
        node.style.setProperty('--mark', [playerMark(), '#8b6a44', '#d6b073'][index]);
        node.innerHTML = `${catMarkup()}<span class="nameplate">${label}</span>`;
        node.addEventListener('click', () => {
            if (game.ghostMode) {
                setMessage(label, ghostFeelingLine(label));
                return;
            }
            setMessage(label, dailyText(label, [
                `${label} tumbles over your paws.`,
                `${label} asks when they can see the borders.`,
                `${label} promises to be the bravest cat in Moonclan.`
            ]));
        });
        layer.appendChild(node);
    });
}

function talkInsideDen(name) {
    if (game.ghostMode && !isDeadCatName(name)) {
        setMessage(name, ghostFeelingLine(name));
        return;
    }
    const lines = {
        Pebblekit: 'Pebblekit squeaks, "When I am big, I am going to catch a fox by the tail!"',
        Mosskit: 'Mosskit whispers, "I saw a black cat near the thorns once."',
        Tinykit: 'Tinykit purrs so loudly the moss shakes.',
        Brindleleaf: 'Brindleleaf says, "Warriors sleep lightly. Trouble likes the dark."',
        Cloudspark: 'Cloudspark says, "The training grounds are good for clearing your head."',
        Sorreltail: game.preyInMouth ? 'Sorreltail blinks warmly at the prey in your mouth.' : 'Sorreltail says, "A fresh mouse can say more than boasting."',
        Oakwhisker: 'Oakwhisker rasps, "An exiled cat can still find a path back through anger."',
        Leafsong: 'Leafsong sorts herbs. "The Moonpool will show what the living miss."',
        Whiskerstar: 'Whiskerstar rests quietly. "One day, choose your deputy with care."'
    };
    const fullCat = cast.find((cat) => cat.name === name) || extraCats[name];
    const gender = fullCat?.gender ? ` (${fullCat.gender})` : '';
    setMessage(`${name}${gender}`, rotatingText(name, [lines[name] || 'They twitch their whiskers in greeting.', 'Today the den smells of moss and warm fur.', 'They blink slowly and listen.']));
}

function exitDen() {
    playerState.insideDen = false;
    denInterior.hidden = true;
    setMessage(playerName(), 'Back in the clearing.');
}

function visitArea(area) {
    if (area === 'tictactoe') {
        openTicTacToe();
        return;
    }
    if (area === 'moonpool' && !game.ashstarLeader && !game.ghostMode) {
        setMessage('Moonpool', 'The Moonpool path is not available yet.');
        return;
    }
    if (area === 'moonpool' && game.moonpoolClosed && !game.ghostMode) {
        setMessage('Moonpool', 'Starclan has gone silent. You cannot return to the Moonpool.');
        return;
    }
    if (game.currentArea === 'moonpool' && area === 'camp' && game.moonpoolDone && !game.ghostMode) {
        game.moonpoolClosed = true;
    }
    if (area === 'camp' && game.awaitingClanReturn) {
        setScene('camp');
        gatherClanAfterMurder();
        return;
    }
    setScene(area);
    accusePanel.innerHTML = '';
    if (area === 'camp') {
        setMessage('Camp', 'You return to Moonclan camp.');
        if (game.moonpoolClosed) {
            renderAreas();
        }
        if (game.firstSolved) {
            const sleepLabel = game.ghostMode ? 'Drift Until Dusk' : 'Sleep in Warrior Den';
            accusePanel.innerHTML = `<button id="sleepBtn" type="button">${sleepLabel}</button>`;
            document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
            if (!game.ghostMode && game.preyInMouth) {
                accusePanel.insertAdjacentHTML('beforeend', '<button id="givePreyCampBtn" type="button">Give Prey to Sorreltail</button>');
                document.getElementById('givePreyCampBtn').addEventListener('click', () => givePrey('Sorreltail'));
            }
            renderDeputyActions();
        } else {
            renderInvestigationActions();
        }
    } else if (area === 'hunting') {
        setMessage('Hunting Grounds', 'Wait for a mouse, then press Down or S when it appears.');
        accusePanel.innerHTML = '<button id="waitMouseBtn" type="button">Wait for Mouse</button>';
        document.getElementById('waitMouseBtn').addEventListener('click', scheduleMouse);
    } else if (area === 'moonpool') {
        accusePanel.innerHTML = game.ghostMode || game.moonpoolDone ? '' : '<button id="moonpoolBtn" type="button">Receive Starclan Lives</button>';
        if (!game.moonpoolDone && !game.ghostMode) {
            document.getElementById('moonpoolBtn').addEventListener('click', moonpoolCeremony);
        }
        setMessage('Moonpool', game.ghostMode ? 'The Moonpool welcomes your ghost. Starclan cats gather to speak.' : 'The water shines with stars. Ashstar steps forward to receive lives.');
    } else if (area === 'borders') {
        setMessage('Borders', `Border trees crowd close. Old ${firstMurderer} scent lingers in the mud.`);
    } else if (area === 'sunclan') {
        setMessage('Sunclan Border', 'You cross the river stones into Sunclan scent. Their patrol bristles at you.');
    } else if (area === 'fighting') {
        setMessage('Fighting Grounds', 'Reedpaw and Fernpaw train with moss balls and quick battle turns.');
    }
}

function openTicTacToe() {
    accusePanel.innerHTML = '<div id="tttBoard" class="ttt-board"></div>';
    const board = document.getElementById('tttBoard');
    const cells = Array(9).fill('');
    let playerTurn = true;

    function draw() {
        board.innerHTML = '';
        cells.forEach((value, index) => {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'ttt-cell';
            cell.textContent = value;
            cell.addEventListener('click', () => {
                if (!playerTurn || cells[index]) {
                    return;
                }
                cells[index] = 'X';
                playerTurn = false;
                if (finishTicTacToe(cells)) {
                    return;
                }
                const open = cells.map((v, i) => v ? null : i).filter((v) => v !== null);
                if (open.length) {
                    cells[open[Math.floor(Math.random() * open.length)]] = 'O';
                }
                playerTurn = true;
                if (!finishTicTacToe(cells)) {
                    draw();
                }
            });
            board.appendChild(cell);
        });
    }

    draw();
    setMessage('Mistclaw', 'Press your paw onto the stones as X. I will play O.');
}

function finishTicTacToe(cells) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const winner = wins.map((line) => line.every((i) => cells[i] === 'X') ? 'X' : line.every((i) => cells[i] === 'O') ? 'O' : '').find(Boolean);
    if (!winner && cells.some((cell) => !cell)) {
        return false;
    }
    if (winner !== 'X') {
        accusePanel.innerHTML = '';
        setMessage('Mistclaw', 'Better luck next time. Step up to the stones again whenever you want.');
        return true;
    }
    game.ticTacToeDone = true;
    accusePanel.innerHTML = '';
    if (!game.roseWon) {
        game.roseWon = true;
        game.rose = true;
        addNote('Mistclaw gave you a special rose for finishing border tic-tac-toe.');
        setMessage('Mistclaw', 'Good job. You win. Take this special rose.');
    } else {
        setMessage('Mistclaw', 'Good job. You win again, though I have no more roses to give.');
    }
    renderAreas();
    updateHud();
    return true;
}

function scheduleMouse() {
    if (game.preyInMouth) {
        setMessage('Hunting Grounds', 'You already have prey in your mouth. Bring it back first.');
        return;
    }
    setMessage('Hunting Grounds', 'You crouch and wait. Listen for tiny paws...');
    clearTimeout(game.mouseTimer);
    game.mouseTimer = setTimeout(spawnMouse, 700 + Math.random() * 1800);
}

function spawnMouse() {
    if (game.currentArea !== 'hunting' || game.preyInMouth) {
        return;
    }
    game.mouseVisible = true;
    huntScene.hidden = false;
    huntScene.classList.add('mouse-ready');
    huntScene.querySelector('.hunt-cat').innerHTML = catMarkup();
    setMessage('Hunting Grounds', 'A mouse darts out. Press Down or S now!');
    setTimeout(() => {
        if (game.mouseVisible) {
            game.mouseVisible = false;
            huntScene.hidden = true;
            huntScene.classList.remove('mouse-ready');
            setMessage('Hunting Grounds', 'The mouse escaped into the roots.');
        }
    }, 2200);
}

function catchMouse() {
    if (!game.mouseVisible || game.currentArea !== 'hunting') {
        return;
    }
    game.mouseVisible = false;
    game.preyInMouth = true;
    game.prey += 1;
    huntScene.classList.add('caught');
    addNote('You caught a mouse in the hunting grounds.');
    updateHud();
    setTimeout(() => {
        huntScene.hidden = true;
        huntScene.classList.remove('mouse-ready', 'caught');
        setMessage('Hunting Grounds', 'You caught the mouse and hold it carefully in your mouth.');
    }, 900);
}

function givePrey(name = 'Sorreltail') {
    if (!game.preyInMouth) {
        setMessage(name, 'You need to catch prey and hold it in your mouth first.');
        return;
    }
    game.preyInMouth = false;
    game.trust[name] = Math.min(3, trustFor(name) + 1);
    addNote(`${name} trust increased to ${trustFor(name)}/3.`);
    const cat = cast.find((entry) => entry.name === name);
    const mateLine = cat && canMateWith(cat) ? ' A special rose can make you mates at 3/3.' : ' This cat can be your friend, but not your mate.';
    setMessage(name, `${name} accepts the prey. Trust ${trustFor(name)}/3.${mateLine}`);
    updateHud();
}

function proposeMate(name) {
    const cat = cast.find((entry) => entry.name === name);
    if (!game.rose || trustFor(name) < 3 || game.mate || !cat || !canMateWith(cat)) {
        return;
    }
    game.rose = false;
    game.mate = name;
    addNote(`${name} became your mate after you gave the special rose.`);
    setMessage(name, `${name} accepts the special rose. "Yes. I will be your mate."`);
    updateHud();
}

function canMateWith(cat) {
    if (!mateCandidates.has(cat.name)) {
        return false;
    }
    if (game.gender === 'non-binary') {
        return true;
    }
    const playerGender = game.gender === 'tom' ? 'Tom' : 'She-cat';
    return cat.gender !== playerGender;
}

function playerCarriesKits() {
    if (game.gender === 'she-cat') {
        return true;
    }
    if (game.gender === 'tom') {
        return false;
    }
    const mate = cast.find((cat) => cat.name === game.mate);
    if (mate?.gender === 'She-cat') {
        return false;
    }
    return true;
}

function sleepInWarriorDen() {
    if (!game.firstSolved) {
        setMessage('Warrior Den', 'You cannot rest yet. Willowfur still needs justice.');
        return;
    }
    if (game.ended) {
        return;
    }
    bumpDayTimer();
    game.day += 1;
    if (!game.ghostMode && game.day >= 40) {
        endOldAge();
        return;
    }
    if (game.ghostMode) {
        if (updateGhostTimeline()) {
            updateHud();
            updateChapter();
            renderAll();
            return;
        }
        updateHud();
        if (game.ashstarLeader && game.day % 7 === 0 && game.lastGatheringDay !== game.day) {
            startGathering();
            return;
        }
        setMessage('Starclan', `You drift through another moon. Day ${game.day} begins for the living.`);
        updateChapter();
        renderAll();
        return;
    }
    if (game.ashstarAwayReturnDay && game.day >= game.ashstarAwayReturnDay) {
        game.ashstarAwayReturnDay = null;
        setMessage('Ashstar', 'Ashstar returns from speaking with Sunstar. The border agreement is tense but peaceful.');
    }
    const apprenticeMeeting = updatePatrolAndApprenticeTimeline();
    const kitMeeting = updateKitsTimeline();
    updateHud();
    if (apprenticeMeeting || kitMeeting) {
        renderAll();
        renderDeputyActions();
        updateChapter();
        return;
    }
    if (game.ashstarLeader && game.day % 7 === 0 && game.lastGatheringDay !== game.day) {
        startGathering();
        return;
    }
    if (game.patrolPending && game.patrolPending.reportDay <= game.day) {
        resolvePatrol();
        return;
    }
    if (game.day === 10 && game.mate && !game.kitsAsked && !game.kitsHad) {
        askForKits();
        return;
    }
    if (!game.secondSeen && game.day >= 7) {
        showSecondMurder();
        return;
    }
    setMessage('Warrior Den', `You sleep in the warrior den. Dawn of day ${game.day} arrives.`);
    renderDeputyActions();
    updateChapter();
}

function endOldAge() {
    if (game.oldAgePrompted) {
        return;
    }
    game.oldAgePrompted = true;
    keys.clear();
    playOverlay.hidden = false;
    playOverlay.classList.remove('fade-out');
    updateControlsVisibility();
    playBtn.textContent = 'Become Ghost';
    overlayText.textContent = 'You died peacefully from old age after 40 moons. Do you want to keep playing as a ghost?';
    accusePanel.innerHTML = '<button id="restartAfterDeathBtn" type="button">Restart Instead</button>';
    document.getElementById('restartAfterDeathBtn').addEventListener('click', () => {
        playBtn.textContent = 'Start';
        showLoss('You died from old age.');
    });
    setMessage('Starclan', 'Your paws grow light. Starclan opens above you.');
}

function becomeGhost() {
    game.ghostMode = true;
    game.ghostStartDay = game.day;
    game.rank = 'Ghost';
    game.started = true;
    playBtn.textContent = 'Start';
    playOverlay.classList.add('fade-out');
    setTimeout(() => {
        playOverlay.hidden = true;
        playOverlay.classList.remove('fade-out');
        updateControlsVisibility();
    }, 520);
    accusePanel.innerHTML = '<button id="sleepBtn" type="button">Drift Until Dusk</button>';
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    addNote('You chose to keep playing as a ghost. Living cats only sense your presence. You can no longer enter dens or organize patrols, but rivers cannot push your starry pelt back.');
    renderAll();
    setMessage('Starclan', 'Your pelt turns starry. You can float through Moonclan and visit the Moonpool whenever you want.');
    bumpDayTimer();
}

function updateGhostTimeline() {
    if (!game.ghostMode || game.mateKilled || !game.mate || game.day < game.ghostStartDay + 10) {
        return false;
    }
    game.mateKilled = true;
    addNote(`${firstMurderer} returned for revenge and killed ${game.mate}. ${game.mate} has joined you in Starclan.`);
    setMessage('Starclan', `${game.mate}'s starry shape appears beside you. ${firstMurderer} wanted revenge for being exposed.`);
    return true;
}

function renderDeputyActions() {
    if (!game.ashstarLeader || game.ghostMode || game.currentArea !== 'camp' || game.deputyDay === game.day || game.patrolPending) {
        return;
    }
    accusePanel.innerHTML = '<button id="organizePatrolBtn" type="button">Organize Patrol</button><button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
    document.getElementById('organizePatrolBtn').addEventListener('click', organizePatrol);
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
}

function organizePatrol() {
    const options = patrolOptions();
    game.patrolSelected = [];
    accusePanel.innerHTML = '<div class="patrol-picker" id="patrolPicker"></div><button id="sendPatrolBtn" type="button">Send Patrol</button>';
    const picker = document.getElementById('patrolPicker');
    options.forEach((name) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.addEventListener('click', () => {
            if (game.patrolSelected.includes(name)) {
                game.patrolSelected = game.patrolSelected.filter((cat) => cat !== name);
                button.classList.remove('selected');
            } else if (game.patrolSelected.length < 3) {
                game.patrolSelected.push(name);
                button.classList.add('selected');
            } else {
                setMessage('Patrol', 'Only 3 cats can go on patrol.');
            }
        });
        picker.appendChild(button);
    });
    document.getElementById('sendPatrolBtn').addEventListener('click', sendPatrol);
    setMessage('Deputy Duties', 'Choose exactly 3 cats for patrol.');
}

function patrolOptions() {
    const base = cast
        .filter((cat) => ['Warrior', 'Leader'].includes(cat.rank) && !['Whiskerstar', 'Ashstar', firstMurderer].includes(cat.name))
        .map((cat) => cat.name);
    const grownNursery = game.nurseryKitAges
        .filter((kit) => growthStage(kit.bornDay) !== 'kit')
        .map((kit) => `${kit.base}${growthStage(kit.bornDay) === 'warrior' ? 'heart' : 'paw'}`);
    const grownPlayerKits = game.playerKits
        .filter((kit) => growthStage(kit.bornDay) !== 'kit')
        .map((kit) => `${kit.base}${growthStage(kit.bornDay) === 'warrior' ? 'heart' : 'paw'}`);
    const abandoned = game.abandonedKit && game.abandonedKit.stage !== 'kit'
        ? [`River${game.abandonedKit.stage === 'warrior' ? 'heart' : 'paw'}`]
        : [];
    return [...new Set([...base, ...grownNursery, ...grownPlayerKits, ...abandoned])];
}

function sendPatrol() {
    if (game.patrolSelected.length !== 3) {
        setMessage('Deputy Duties', 'Choose exactly 3 cats before sending the patrol.');
        return;
    }
    game.patrolPending = { cats: [...game.patrolSelected], reportDay: game.day + 1 };
    addNote(`${game.patrolSelected.join(', ')} left on patrol.`);
    accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    setMessage('Patrol', `${game.patrolSelected.join(', ')} head out. They will return tomorrow with news.`);
    renderCats();
}

function resolvePatrol() {
    const cats = game.patrolPending.cats;
    game.patrolPending = null;
    const outcomes = ['sunclan-scent', 'fresh-prey', 'fox-track', 'quiet-border', 'abandoned-kit'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    if (!game.abandonedKitFound && outcome === 'abandoned-kit') {
        game.abandonedKitFound = true;
        game.abandonedKit = { stage: 'kit', foundDay: game.day };
        addNote(`${cats.join(', ')} found an abandoned kit near the border. You became their mentor.`);
        renderAll();
        setMessage('Patrol Report', `${cats.join(', ')} found an abandoned kit by the river reeds. You take responsibility for mentoring Riverkit.`);
        return;
    }
    const reports = {
        'sunclan-scent': 'fresh Sunclan scent near the river stones',
        'fresh-prey': 'a rabbit trail and a clear hunting path',
        'fox-track': 'old fox tracks that faded before the pine roots',
        'quiet-border': 'a quiet border and newly marked stones',
        'abandoned-kit': 'nothing unusual, though the reeds were noisy'
    };
    addNote(`${cats.join(', ')} returned from patrol with news: ${reports[outcome]}.`);
    setMessage('Patrol Report', `${cats.join(', ')} report ${reports[outcome]}.`);
    renderCats();
    renderDeputyActions();
}

function updatePatrolAndApprenticeTimeline() {
    if (!game.abandonedKit) {
        return false;
    }
    if (game.day >= game.abandonedKit.foundDay + 7 && game.abandonedKit.stage !== 'warrior') {
        game.abandonedKit.stage = 'warrior';
        addNote('Riverpaw earned the warrior name Riverheart after your mentorship.');
        setMessage('Ashstar', 'Let all cats old enough to catch their own prey gather beneath Highrock. Riverpaw, from this moment you are Riverheart, a warrior of Moonclan.');
        return true;
    } else if (game.day >= game.abandonedKit.foundDay + 2 && game.abandonedKit.stage === 'kit') {
        game.abandonedKit.stage = 'apprentice';
        addNote('Riverkit became Riverpaw, and you are their mentor.');
        setMessage('Ashstar', `Let all cats gather beneath Highrock. Riverkit, from this day you are Riverpaw. ${warriorName()} will be your mentor and teach you to hunt, fight, and patrol.`);
        return true;
    }
    return false;
}

function startGathering() {
    game.gatheringActive = true;
    game.lastGatheringDay = game.day;
    setScene('gathering');
    accusePanel.innerHTML = '<button id="finishGatheringBtn" type="button">Finish Gathering</button>';
    document.getElementById('finishGatheringBtn').addEventListener('click', finishGathering);
    setMessage('Gathering', 'Night falls. Moonclan, Sunclan, and Dawnclan meet beneath the great tree.');
}

function finishGathering() {
    const first = !game.firstGatheringDone;
    game.firstGatheringDone = true;
    game.gatheringActive = false;
    setScene('camp');
    const sleepLabel = game.ghostMode ? 'Drift Until Dusk' : 'Sleep in Warrior Den';
    accusePanel.innerHTML = `<button id="sleepBtn" type="button">${sleepLabel}</button>`;
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    if (first) {
        game.ashstarAwayReturnDay = game.day + 1;
        setMessage('Ashstar', 'The Gathering ends. Ashstar announces they will leave to speak privately with Sunstar and return tomorrow.');
    } else {
        setMessage('Camp', 'The Gathering ends, and Moonclan returns home under starlight.');
    }
}

function askForKits() {
    game.kitsAsked = true;
    accusePanel.innerHTML = '<button id="kitsYesBtn" type="button">Have Kits</button><button id="kitsNoBtn" type="button">Not Yet</button>';
    document.getElementById('kitsYesBtn').addEventListener('click', () => {
        game.expectingKits = true;
        game.kitsDueDay = game.day + 3;
        addNote(`You and ${game.mate} are expecting kits in three days.`);
        accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
        document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
        const birthText = playerCarriesKits()
            ? `You will have kits with ${game.mate}. They should arrive in three days.`
            : `${game.mate} will have kits. They should arrive in three days.`;
        setMessage('Nursery', birthText);
    });
    document.getElementById('kitsNoBtn').addEventListener('click', () => {
        accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
        document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
        setMessage(game.mate, 'You decide to wait before having kits.');
    });
    setMessage(game.mate, `Day 10 has come. Do you want to have kits with ${game.mate}?`);
}

function updateKitsTimeline() {
    updateNurseryKitTimeline();
    let meetingText = '';
    if (game.expectingKits && game.kitsDueDay && game.day >= game.kitsDueDay) {
        const mate = cast.find((cat) => cat.name === game.mate);
        const playerColor = playerFur();
        const playerMarkColor = playerMark();
        const furMix = mixColors(playerColor, mate?.fur || '#c55f45');
        const markMix = mixColors(playerMarkColor, mate?.mark || '#f0b172');
        const names = ['Storm', 'Dew', 'Bright', 'Leaf', 'Rain', 'Spark', 'Minnow', 'Briar', 'Light'];
        const kitCount = 1 + Math.floor(Math.random() * 4);
        const furPatterns = [
            { fur: furMix, mark: markMix },
            { fur: mate?.fur || '#d9c39a', mark: playerMarkColor },
            { fur: playerColor, mark: mate?.mark || '#f0b172' },
            { fur: mixColors(playerColor, '#d9c39a'), mark: mixColors(markMix, mate?.mark || '#f0b172') }
        ];
        for (let index = 0; index < kitCount; index += 1) {
            game.playerKits.push({
                base: names[index],
                bornDay: game.day,
                fur: furPatterns[index].fur,
                mark: furPatterns[index].mark
            });
        }
        const text = playerCarriesKits() ? `You have ${kitCount} kit${kitCount === 1 ? '' : 's'} in camp.` : `${game.mate} has ${kitCount} kit${kitCount === 1 ? '' : 's'} in camp.`;
        addNote(text);
        setMessage('Camp', `${text} They carry both your fur colors.`);
        game.kitsHad = true;
        game.expectingKits = false;
        game.kitsDueDay = null;
    }
    const apprenticeNames = [];
    const warriorNames = [];
    [...game.nurseryKitAges, ...game.playerKits].forEach((kit) => {
        const stage = growthStage(kit.bornDay);
        if (stage === 'apprentice' && !kit.apprenticeAnnounced) {
            kit.apprenticeAnnounced = true;
            addNote(`${kit.base}kit became ${kit.base}paw.`);
            apprenticeNames.push(`${kit.base}kit is now ${kit.base}paw`);
        }
        if (stage === 'warrior' && !kit.warriorAnnounced) {
            kit.warriorAnnounced = true;
            addNote(`${kit.base}paw earned a warrior name.`);
            warriorNames.push(`${kit.base}paw is now ${kit.base}heart`);
        }
    });
    if (apprenticeNames.length || warriorNames.length) {
        const announcements = [...apprenticeNames, ...warriorNames].join('. ');
        meetingText = `Let all cats old enough to catch their own prey gather beneath Highrock. ${announcements}.`;
        setMessage('Ashstar', meetingText);
        return true;
    }
    return false;
}

function updateNurseryKitTimeline() {
    // Existing nursery kits share the same growth rules as later kits.
}

function mixColors(a, b) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const r = (((pa >> 16) & 255) + ((pb >> 16) & 255)) >> 1;
    const g = (((pa >> 8) & 255) + ((pb >> 8) & 255)) >> 1;
    const blue = ((pa & 255) + (pb & 255)) >> 1;
    return `#${[r, g, blue].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function showSecondMurder() {
    game.currentArea = 'borders';
    setScene('borders');
    game.secondSeen = true;
    murderCutscene.hidden = false;
    murderCutscene.querySelector('.runner-cat').innerHTML = catMarkup();
    const culprit = murdererCat();
    const runner = murderCutscene.querySelector('.runner-cat');
    runner.style.setProperty('--fur', culprit.fur);
    runner.style.setProperty('--mark', culprit.mark);
    setMessage('Borders', `A shape bursts through the ferns. ${firstMurderer} races past with blood on their muzzle.`);
    setTimeout(() => {
        murderCutscene.hidden = true;
        game.awaitingClanReturn = true;
        addNote(`On day 7, you saw ${firstMurderer} run from camp with blood on them.`);
        updateChapter();
        setMessage('Borders', `${firstMurderer} vanishes beyond the trees. Return to camp.`);
        renderAreas();
    }, 2600);
}

function gatherClanAfterMurder() {
    if (!game.awaitingClanReturn || game.clanGathered) {
        return;
    }
    game.awaitingClanReturn = false;
    game.clanGathered = true;
    game.ashstarLeader = true;
    game.rank = 'Deputy';
    game.deputyDay = game.day;
    const deputy = cast.find((cat) => cat.name === 'Ashfall');
    if (deputy) {
        deputy.name = 'Ashstar';
        deputy.rank = 'Leader';
        deputy.x = 308;
        deputy.bottom = 224;
    }
    addNote('Only after you returned to camp did the clan gather around Whiskerstar.');
    addNote('Ashfall became Ashstar and named you deputy.');
    accusePanel.innerHTML = '<button id="moonpoolShortcut" type="button">Go to Moonpool</button>';
    document.getElementById('moonpoolShortcut').addEventListener('click', () => visitArea('moonpool'));
    renderAll();
    setMessage('Ashstar', `Whiskerstar is dead. ${firstMurderer} came back. I name you deputy, ${warriorName()}. The clan will congratulate you today; tomorrow, your patrol duties begin.`);
}

function moonpoolCeremony() {
    game.moonpoolDone = true;
    addNote('Starclan granted Ashstar nine lives at the Moonpool.');
    updateChapter();
    accusePanel.innerHTML = '<button id="returnCampAfterMoonpool" type="button">Return to Camp</button>';
    document.getElementById('returnCampAfterMoonpool').addEventListener('click', () => visitArea('camp'));
    setMessage('Starclan', 'Silver cats gather around the Moonpool. Ashstar receives nine lives, and you return to camp as deputy.');
}

function movePlayer() {
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    playerState.moving = false;

    const previousX = playerState.x;

    if (game.started && left && !playerState.insideDen) {
        playerState.x -= playerState.speed;
        player.classList.add('facing-left');
        playerState.moving = true;
    }
    if (game.started && right && !playerState.insideDen) {
        playerState.x += playerState.speed;
        player.classList.remove('facing-left');
        playerState.moving = true;
    }

    if (!game.ghostMode && touchesRiver(playerState.x)) {
        playerState.x = previousX + (playerState.x > previousX ? -42 : 42);
        setMessage(warriorName(), 'I can’t swim! The river pushes you back.');
    }

    playerState.velocityY -= 0.75;
    playerState.y += playerState.velocityY;
    if (playerState.y <= 0) {
        playerState.y = 0;
        playerState.velocityY = 0;
        player.classList.remove('jumping');
    }

    playerState.x = Math.max(28, Math.min(worldWidth - 120, playerState.x));
    player.style.left = `${playerState.x}px`;
    player.style.bottom = `${groundY + playerState.y}px`;
    player.classList.toggle('walking', playerState.moving);

    const viewportWidth = viewport.clientWidth;
    const cameraX = Math.max(0, Math.min(worldWidth - viewportWidth, playerState.x - viewportWidth * 0.44));
    world.style.transform = `translateX(${-cameraX}px)`;
    requestAnimationFrame(movePlayer);
}

function touchesRiver(x) {
    const rivers = {
        borders: [1485, 1660],
        hunting: [2390, 2580],
        sunclan: [520, 700]
    };
    const range = rivers[game.currentArea];
    return Boolean(range && x >= range[0] && x <= range[1]);
}

function jump() {
    if (game.started && playerState.y === 0 && !playerState.insideDen) {
        playerState.velocityY = 16;
        player.classList.add('jumping');
    }
}

document.querySelectorAll('.evidence').forEach((item) => {
    item.addEventListener('click', () => inspectEvidence(item.dataset.evidence));
});

if (furBush) {
    furBush.addEventListener('click', openFurBush);
}

document.querySelectorAll('.den').forEach((den) => {
    den.addEventListener('click', () => enterDen(den.dataset.den));
});

document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) {
        playButtonSound();
    }
});

leaveDen.addEventListener('click', exitDen);
pcModeBtn.addEventListener('click', () => setControlMode('pc'));
mobileModeBtn.addEventListener('click', () => setControlMode('mobile'));
playBtn.addEventListener('click', () => {
    if (game.oldAgePrompted && !game.ghostMode) {
        becomeGhost();
        return;
    }
    startGame();
});
instructionsBtn.addEventListener('click', () => instructionsDialog.showModal());
changeNameBtn.addEventListener('click', promptForPrefix);
genderBtn.addEventListener('click', cycleGender);
buildPeltPicker();
updateTitlePreview();
restartBtn.addEventListener('click', () => resetGame(true));

mobileControls.querySelectorAll('.mobile-key').forEach((button) => {
    const key = button.dataset.key;
    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (key === 'ArrowUp') {
            jump();
            return;
        }
        if (key === 'ArrowDown') {
            keys.add(key);
            catchMouse();
            return;
        }
        keys.add(key);
    });
    button.addEventListener('pointerup', () => keys.delete(key));
    button.addEventListener('pointercancel', () => keys.delete(key));
    button.addEventListener('pointerleave', () => keys.delete(key));
});

window.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('button')) {
        playButtonSound();
    }
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
        keys.add(event.key);
    }
    if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) {
        event.preventDefault();
        jump();
    }
    if (['ArrowDown', 's', 'S'].includes(event.key)) {
        catchMouse();
    }
});

window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
});

notebookBtn.addEventListener('click', () => {
    if (foundClues.size === 0) {
        notes.innerHTML = '<li>No clues yet.</li>';
    }
    buildSuspectBoard();
    notebook.showModal();
});

resetGame(true);
requestAnimationFrame(movePlayer);
