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
const furTuft = document.getElementById('furTuft');
const suspectBoard = document.getElementById('suspectBoard');
const preyPile = document.getElementById('preyPile');
const preyPileLabel = document.getElementById('preyPileLabel');

const PREY_PILE_MAX = 30;

function updatePreyPileLabel() {
    if (!preyPileLabel) return;
    preyPileLabel.textContent = game?.preyPile != null ? `Prey pile ${game.preyPile}/${PREY_PILE_MAX}` : '';
}

function preyPileClick() {
    if (!game?.started) return;
    if (game.ghostMode) {
        setMessage('Prey Pile', 'Your starry paws drift through the prey-pile. The living tend it now.');
        return;
    }
    if (!game.preyInMouth) {
        if (game.preyPile <= 0) {
            setMessage('Prey Pile', 'The prey-pile is empty. The clan needs a new patrol.');
            return;
        }
        accusePanel.innerHTML = '<button id="takePreyYes" type="button">Yes, take prey</button><button id="takePreyNo" type="button">No, leave it</button>';
        document.getElementById('takePreyYes').addEventListener('click', () => {
            if (game.preyPile <= 0) {
                accusePanel.innerHTML = '';
                setMessage('Prey Pile', 'The prey-pile is empty.');
                return;
            }
            game.preyPile -= 1;
            game.preyInMouth = true;
            addNote(`You took a piece of prey from the pile. ${game.preyPile}/${PREY_PILE_MAX} left.`);
            setMessage('Prey Pile', `You pick a fresh mouse off the pile and carry it in your mouth. ${game.preyPile}/${PREY_PILE_MAX} left.`);
            accusePanel.innerHTML = '';
            updatePreyPileLabel();
            updateHud();
        });
        document.getElementById('takePreyNo').addEventListener('click', () => {
            accusePanel.innerHTML = '';
            setMessage('Prey Pile', 'You leave the pile alone.');
        });
        setMessage('Prey Pile', `Take prey from the pile? It currently holds ${game.preyPile}/${PREY_PILE_MAX} fresh-kill.`);
        return;
    }
    if (game.preyPile >= PREY_PILE_MAX) {
        setMessage('Prey Pile', 'The prey-pile is overflowing. Save the prey for someone hungry.');
        return;
    }
    accusePanel.innerHTML = '<button id="dropPreyYes" type="button">Yes, add to pile</button><button id="dropPreyNo" type="button">No, keep it</button>';
    document.getElementById('dropPreyYes').addEventListener('click', () => {
        game.preyInMouth = false;
        game.preyPile = Math.min(PREY_PILE_MAX, game.preyPile + 1);
        addNote(`You added a piece of prey to the pile. Now ${game.preyPile}/${PREY_PILE_MAX} fresh-kill.`);
        let extra = '';
        const trustChance = Math.max(0.05, 0.4 - trustFor('Whiskerstar') * 0.02);
        if (Math.random() < trustChance && trustFor('Whiskerstar') < trustMax('Whiskerstar')) {
            game.trust.Whiskerstar = trustFor('Whiskerstar') + 1;
            addNote(`Whiskerstar noticed your contribution. Trust ${trustFor('Whiskerstar')}/${trustMax('Whiskerstar')}.`);
            extra = ` Whiskerstar dips her head from across camp — trust ${trustFor('Whiskerstar')}/${trustMax('Whiskerstar')}.`;
        }
        setMessage('Prey Pile', `You drop the prey on the pile. ${game.preyPile}/${PREY_PILE_MAX}.${game.preyPile >= PREY_PILE_MAX ? ' The pile is overflowing.' : ''}${extra}`);
        accusePanel.innerHTML = '';
        updatePreyPileLabel();
        updateHud();
    });
    document.getElementById('dropPreyNo').addEventListener('click', () => {
        accusePanel.innerHTML = '';
        setMessage('Prey Pile', 'You keep the prey for now.');
    });
    setMessage('Prey Pile', 'Drop the prey onto the pile?');
}

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
    ['Whiskerstar', 'Leader', 'Tom', 308, 224, '#d6c9a8', '#7a674a', 'gold', '#f7df6e', 'Whiskerstar saw Willowfur arguing near the medicine den before moonhigh.'],
    ['Ashfall', 'Deputy', 'Tom', 506, 96, '#777a78', '#d4d4c8', 'pale yellow', '#e8e26b', 'Ashfall confirms Ravenstripe left the warrior den after everyone settled.'],
    ['Mistclaw', 'Warrior', 'Tom', 1160, 90, '#8fa0a6', '#eef6f5', 'sky blue', '#7ec4ff', 'Mistclaw says the killer smelled of pine resin.'],
    ['Ravenstripe', 'Warrior', 'Tom', 1660, 90, '#171717', '#4b4b4b', 'amber', '#f5a83a', 'Ravenstripe seems calm but has a small scratch on one ear.'],
    ['Brindleleaf', 'Warrior', 'Tom', 2060, 90, '#a76d3f', '#4d2d1c', 'leaf green', '#9bd86b', 'Brindleleaf saw dark fur snagged on the elder den brambles.'],
    ['Cloudspark', 'Warrior', 'She-cat', 2350, 90, '#f0eee1', '#c4b892', 'icy blue', '#d8edff', 'Cloudspark heard a splash from the muddy stream path after the attack.'],
    ['Pinefoot', 'Warrior', 'She-cat', 2590, 90, '#6a4d34', '#263d23', 'copper', '#e87a3a', 'Pinefoot says Ravenstripe handled pine resin while repairing the camp barrier.'],
    ['Sorreltail', 'Warrior', 'She-cat', 760, 90, '#c55f45', '#f0b172', 'emerald', '#4dd07a', 'Sorreltail says Willowfur discovered stolen prey hidden under Ravenstripe’s nest.']
];

const extraCats = {
    Rosesong: { rank: 'Medicine Cat', gender: 'She-cat', fur: '#f4c5d4', mark: '#dcdcdc' },
    Oakwhisker: { rank: 'Elder', gender: 'Tom', fur: '#6b5138', mark: '#cab07b' },
    Pebblekit: { rank: 'Kit', gender: 'Tom', fur: '#c99762', mark: '#f5d095' },
    Mosskit: { rank: 'Kit', gender: 'She-cat', fur: '#ded8c4', mark: '#857d67' },
    Tinykit: { rank: 'Kit', gender: 'She-cat', fur: '#514132', mark: '#b8a087' },
    Snowkit: { rank: 'Kit', gender: 'She-cat', fur: '#f0eee8', mark: '#cfd6dc' },
    Mosspaw: { rank: 'Medicine Cat Apprentice', gender: 'She-cat', fur: '#ded8c4', mark: '#857d67' },
    Mossleaf: { rank: 'Medicine Cat', gender: 'She-cat', fur: '#ded8c4', mark: '#857d67' },
    Birchstep: { rank: 'Warrior', gender: 'Tom', fur: '#9b8260', mark: '#574330' },
    Hollyfoot: { rank: 'Warrior', gender: 'She-cat', fur: '#3e3a36', mark: '#7d8b7e' },
    Reedpaw: { rank: 'Apprentice', gender: 'Tom', fur: '#7c5a38', mark: '#d6b073' },
    Fernpaw: { rank: 'Apprentice', gender: 'She-cat', fur: '#bbb5a2', mark: '#776854' },
    Nettleclaw: { rank: 'Sunclan Warrior', gender: 'Tom', fur: '#d09b42', mark: '#5a3920' },
    Dawnpelt: { rank: 'Sunclan Warrior', gender: 'She-cat', fur: '#e6c77d', mark: '#9b6a2f' },
    Russetfang: { rank: 'Sunclan Deputy', gender: 'Tom', fur: '#9f4f33', mark: '#f0a35d' },
    Hollybriar: { rank: 'Dawnclan Warrior', gender: 'She-cat', fur: '#785137', mark: '#caa37b' },
    Quailfoot: { rank: 'Dawnclan Warrior', gender: 'Tom', fur: '#a5905f', mark: '#3e2b18' },
    Ashberry: { rank: 'Dawnclan Warrior', gender: 'She-cat', fur: '#65574b', mark: '#f0d28b' }
};

const mateCandidates = new Set(['Mistclaw', 'Ravenstripe', 'Brindleleaf', 'Cloudspark', 'Sorreltail', 'Princess', 'Birchstep', 'Hollyfoot']);
const SMUDGE_CAT = { name: 'Princess', rank: 'Kittypet', gender: 'She-cat', fur: '#e8c895', mark: '#a86b3c' };

const firstLines = {
    Whiskerstar: ['My ears heard anger by the medicine den. Willowfur hissed at someone with {EYES} eyes — they had stolen prey.', 'A leader must see truth through fog. Look for the one whose eyes will not meet yours.'],
    Ashfall: ['I counted the nests. A warrior with {EYES} eyes slipped out after the camp went quiet. My mate Pinefoot was beside me asleep the whole night.', 'Find what clung to their pelt. The forest keeps receipts. Pinefoot would have noticed too if she had not been so tired.'],
    Mistclaw: ['Willowfur brushed past me earlier. Later, the clearing smelled sharp with pine resin — and a pair of {EYES} eyes flashed past me in the dark.', 'The hunting grounds are good for clearing fear from your chest.'],
    Ravenstripe: ['Such terrible news about Willowfur. I was asleep when it happened.', 'I hope they find whoever did this. The clan needs peace.'],
    Brindleleaf: ['The elder den brambles caught a tuft of torn fur. I looked up and met {EYES} eyes for half a heartbeat before they were gone.', 'Warrior life means watching shadows even after the clan starts purring again.'],
    Cloudspark: ['There was a splash by the stream path. Then pawsteps, heavy and fast — and {EYES} eyes glinting back at me through the reeds.', 'The borders are quiet today, but quiet can still hide claws.'],
    Pinefoot: ['Another warrior and I patched the pine-barrier. Resin stuck to their paws — I remember their {EYES} eyes more than anything else.', 'The fighting grounds are open now. Reedpaw and Fernpaw are always training.'],
    Sorreltail: ['Willowfur found missing prey under a warrior\'s moss. She told me their eyes were {EYES} and she was going to tell Whiskerstar at dawn.', 'A fresh mouse can say more than a moon of boasting.']
};

const denDetails = {
    'Leader Den': ['A quiet stone-scented den tucked behind Highrock. Empty for now.', '<div class="nest"></div><div class="nest"></div>', []],
    Nursery: ['Warm moss and soft bracken. A small kit is curled tight, fast asleep.', '<div class="nest"></div>', ['Snowkit']],
    'Warrior Den': ['Crowded nests ring the walls. Once you are a warrior, you can sleep here to advance time.', '<div class="nest"></div><div class="nest"></div><div class="nest"></div>', ['Hollyfoot', 'Birchstep']],
    'Elder Den': ['Dry leaves and old stories fill the air.', '<div class="nest"></div><div class="nest"></div>', ['Oakwhisker']],
    'Medicine Den': ['A leafy den woven from ferns, ivy, and sweet-smelling herbs.', '<div class="leaf-pile"></div><div class="herb-bundle"></div>', ['Rosesong']]
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
    return baseCast.map(([name, rank, gender, x, bottom, fur, mark, eyes, eyeColor, clue]) => ({
        name,
        rank,
        gender,
        x,
        bottom,
        fur,
        mark,
        eyes,
        eyeColor,
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

const RANDOM_PREFIXES = ['Stone', 'River', 'Sky', 'Storm', 'Frost', 'Ember', 'Sun', 'Shade', 'Dusk', 'Pebble', 'Flame', 'Wind', 'Hawk', 'Thorn', 'Mist', 'Berry', 'Ivy', 'Heather', 'Holly', 'Birch', 'Robin', 'Lark', 'Cinder', 'Spark', 'Reed', 'Oak', 'Fern', 'Briar', 'Petal', 'Dawn', 'Ash', 'Cloud', 'Brook', 'Leaf', 'Maple'];

function randomizeTitleChoices() {
    currentPrefix = RANDOM_PREFIXES[Math.floor(Math.random() * RANDOM_PREFIXES.length)];
    currentFurIndex = Math.floor(Math.random() * pelts.length);
    currentGender = genderCycle[Math.floor(Math.random() * genderCycle.length)];
    if (game) {
        game.playerPrefix = currentPrefix;
        game.playerFurIndex = currentFurIndex;
        game.playerFur = pelts[currentFurIndex].fur;
        game.playerMark = pelts[currentFurIndex].mark;
        game.gender = currentGender;
    }
    if (peltPicker) {
        peltPicker.querySelectorAll('.pelt-swatch').forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === currentFurIndex);
        });
    }
    updateTitlePreview();
}

function undoTitleChange() {
    currentPrefix = 'Bramble';
    currentFurIndex = 0;
    currentGender = 'tom';
    setControlMode('pc');
    if (game) {
        game.playerPrefix = currentPrefix;
        game.playerFurIndex = currentFurIndex;
        game.playerFur = pelts[0].fur;
        game.playerMark = pelts[0].mark;
        game.gender = currentGender;
    }
    if (peltPicker) {
        peltPicker.querySelectorAll('.pelt-swatch').forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === 0);
        });
    }
    updateTitlePreview();
}

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

const friendlyLines = {
    Mistclaw: [
        'Mistclaw bumps your shoulder. "I always feel calmer when you patrol with me."',
        'Mistclaw says, "Save me a spot at the prey-pile, would you?"',
        'Mistclaw chuckles. "I trust your nose more than my own these days."'
    ],
    Brindleleaf: [
        'Brindleleaf grins. "You hunt cleaner than half the warriors here."',
        'Brindleleaf nods to you. "Walk the ferns with me later, hm?"',
        'Brindleleaf says, "I could use your eyes on the elder den brambles tomorrow."'
    ],
    Cloudspark: [
        'Cloudspark butts her head against you. "There you are. The day was missing something."',
        'Cloudspark purrs. "You always smell of pine and sun."',
        'Cloudspark says softly, "I sleep better when I know you are nearby."'
    ],
    Sorreltail: [
        'Sorreltail flicks her tail playfully. "Did you come to share tongues, or just to stare?"',
        'Sorreltail nudges your paw. "Sit. The clearing is warm today."',
        'Sorreltail says, "I saved a thrush for you on the prey-pile."'
    ],
    Pinefoot: [
        'Pinefoot grunts approvingly. "Solid work this moon. The clan notices."',
        'Pinefoot says, "Drop by the barrier later. I want a second opinion on the new pine."',
        'Pinefoot smiles, rare and small. "You make this place feel steadier."'
    ],
    Ravenstripe: [
        'Ravenstripe huffs. "Fine. You are not the worst cat to share a sunbeam with."',
        'Ravenstripe lowers his head. "I owe you for the trust. I will not forget."',
        'Ravenstripe says, "Hunt with me at moonhigh. The river path is mine alone."'
    ],
    Birchstep: [
        'Birchstep nods to you. "I patrol better when you are nearby."',
        'Birchstep says, "Come share fresh-kill with me at sunhigh."',
        'Birchstep grins. "I trust your nose. Lead the next hunt."'
    ],
    Hollyfoot: [
        'Hollyfoot grooms her dark pelt and looks up. "Sit a while. I do not mind the company."',
        'Hollyfoot murmurs, "I dreamed of you guarding my back in a fight."',
        'Hollyfoot says quietly, "You are a good warrior. The clan is lucky."'
    ]
};

const flirtyLines = {
    Mistclaw: [
        'Mistclaw winds against your side. "I keep finding excuses to stand near you."',
        'Mistclaw murmurs, "If you ever wanted to share a nest, I would not say no."',
        'Mistclaw rests his head on your shoulder. "Stay a heartbeat longer. Please."'
    ],
    Brindleleaf: [
        'Brindleleaf swishes his tail across yours. "Is it strange that I dream about you most nights?"',
        'Brindleleaf says quietly, "I would chase the sun off the moor for you, you know."',
        'Brindleleaf grins. "Nothing tastes as good as prey we share."'
    ],
    Cloudspark: [
        'Cloudspark presses her nose to yours. "Some warriors are clouds. You are the sky."',
        'Cloudspark whispers, "I have wanted to ask. Will you let me curl beside you tonight?"',
        'Cloudspark glances away, then back. "I have said too much, but I do not regret it."'
    ],
    Sorreltail: [
        'Sorreltail laughs, eyes warm. "Quit looking at me like that. The whole clan can tell."',
        'Sorreltail brushes her tail under your chin. "Maybe I will let you catch me one day."',
        'Sorreltail says, "If you ever ask the right question, I have the right answer."'
    ],
    Pinefoot: [
        'Pinefoot tips her head. "Ashfall is lucky. I hope someone treats you the same way."',
        'Pinefoot watches you carefully. "Friends like you keep this clan steady."',
        'Pinefoot rests her paw briefly on yours. "I will always have your back, warrior."'
    ],
    Ravenstripe: [
        'Ravenstripe glances sideways. "Stop making me feel things, will you?"',
        'Ravenstripe says low, "If anyone is going to share my nest, it had better be you."',
        'Ravenstripe almost smiles. "I never asked for company. I am asking now."'
    ],
    Birchstep: [
        'Birchstep brushes his tail along yours. "I have been wondering... would you share my nest?"',
        'Birchstep murmurs, "I sleep easier when you are close."',
        'Birchstep says softly, "Tell me you feel it too."'
    ],
    Hollyfoot: [
        'Hollyfoot leans into your shoulder. "Some bonds keep a clan steady. I want one with you."',
        'Hollyfoot whispers, "You make the warrior code feel less heavy."',
        'Hollyfoot says, "If you ever asked, my answer is yes."'
    ]
};

function kittypetReactionFor(name) {
    const lines = {
        Whiskerstar: 'Whiskerstar dips her head. "Love finds strange paths. The clan does not own your heart."',
        Ashfall: 'Ashfall shrugs. "If she keeps you steady, that is enough for me."',
        Mistclaw: 'Mistclaw flicks an ear. "A kittypet? Bold choice. I am happy if you are."',
        Ravenstripe: 'Ravenstripe huffs. "A kittypet, hm. The clan will gossip about it until newleaf."',
        Brindleleaf: 'Brindleleaf grins. "Bring her by the camp clearing. I want to meet her."',
        Cloudspark: 'Cloudspark purrs warmly. "She must be brave. Tell her she is welcome here."',
        Pinefoot: 'Pinefoot says softly, "Twoleg fence or no, love is love. Give her my regards."',
        Sorreltail: 'Sorreltail tips her head. "I have river-stories that would make her tail puff. Bring her by."',
        Ashstar: `Ashstar narrows her eyes. "A kittypet, ${warriorName()}? She does not know the warrior code. Be careful with this one."`
    };
    return lines[name];
}

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

let rainSource = null;
let rainGain = null;

function startRainSound() {
    if (rainSource) {
        return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return;
    }
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.6;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, audioContext.currentTime + 1.4);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
    rainSource = source;
    rainGain = gain;
}

function stopRainSound() {
    if (!rainSource || !audioContext) {
        return;
    }
    const now = audioContext.currentTime;
    rainGain.gain.cancelScheduledValues(now);
    rainGain.gain.setValueAtTime(rainGain.gain.value, now);
    rainGain.gain.linearRampToValueAtTime(0, now + 0.8);
    const stopping = rainSource;
    setTimeout(() => {
        try { stopping.stop(); } catch (err) { /* already stopped */ }
    }, 900);
    rainSource = null;
    rainGain = null;
}

function updateRainSound() {
    if (isRaining()) {
        startRainSound();
    } else {
        stopRainSound();
    }
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
    stopRainSound();
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
        mateDay: null,
        rose: false,
        roseInMouth: false,
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
            { base: 'Pebble', bornDay: 1, fur: '#c99762', mark: '#f5d095', gender: 'Tom' },
            { base: 'Moss', bornDay: 1, fur: '#ded8c4', mark: '#857d67', gender: 'She-cat' },
            { base: 'Tiny', bornDay: 1, fur: '#514132', mark: '#b8a087', gender: 'She-cat' }
        ],
        playerPrefix: currentPrefix,
        playerFurIndex: currentFurIndex,
        playerFur: pelts[currentFurIndex].fur,
        playerMark: pelts[currentFurIndex].mark,
        suspectStatus: {},
        alibiUsed: false,
        furBushFound: false,
        kittypetMet: false,
        smudgeClicks: 0,
        kittypetMateRevealed: false,
        kittypetReactionShown: {},
        trustReachedDay: {},
        battleStats: {
            playerMaxHp: 20,
            playerDmg: 5,
            playerHeal: 4
        },
        opponents: {
            Reedpaw: { maxHp: 20, dmg: 5, heal: 3, wins: 0 },
            Fernpaw: { maxHp: 35, dmg: 9, heal: 5, wins: 0 },
            Pinefoot: { maxHp: 55, dmg: 14, heal: 1, wins: 0 },
            Ravenstripe: { maxHp: 55, dmg: 15, heal: 4, wins: 0 },
            Rogue: { maxHp: 60, dmg: 19, heal: 20, wins: 0 }
        },
        rogueDefeated: false,
        patrolDeaths: [],
        preyPile: 10,
        sunclanState: 'aggressive',
        sunclanProgress: 0,
        sunclanGiftDay: -1,
        dawnclanState: 'neutral',
        dawnclanProgress: 0,
        clueGivers: [],
        scaredCats: []
    };
    chooseClueGiversAndScared();
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
    if (furTuft) {
        furTuft.hidden = true;
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

const SCARED_LINES = [
    "I... I don't want to talk about it. Please.",
    "I didn't see anything that night. I swear it on Starclan.",
    "Don't ask me. My pelt still crawls thinking about it.",
    "Just leave it alone. I am not the one to ask.",
    "Whoever did this is still in camp. I am keeping my head down.",
    "Please — talk to a braver cat than me."
];

function chooseClueGiversAndScared() {
    if (!game) return;
    const eligible = cast.filter((c) => c.name !== firstMurderer);
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    game.clueGivers = shuffled.slice(0, 2).map((c) => c.name);
    const scaredEligible = shuffled.slice(2)
        .filter((c) => c.name !== 'Whiskerstar' && c.name !== 'Ashfall');
    game.scaredCats = scaredEligible.slice(0, 4).map((c) => c.name);
}

function applyMysteryClues() {
    const culprit = firstMurderer;
    const culpritCat = cast.find((c) => c.name === culprit);
    const eyes = culpritCat?.eyes || 'pale';
    cast.forEach((cat) => {
        if (cat.name === 'Whiskerstar') {
            cat.clue = `Whiskerstar heard Willowfur arguing with a cat before dawn. Their eyes caught the moonlight — ${eyes}. Willowfur threatened to expose them.`;
        } else if (cat.name === 'Ashfall') {
            cat.clue = `Ashfall watched the warrior den after dark. One cat slipped out and turned back once — eyes flashed ${eyes} in the starlight before they vanished into the brambles.`;
        } else if (cat.name === 'Mistclaw') {
            cat.clue = `Mistclaw says the killer reeked of pine resin and stared straight at him as they passed. He remembers ${eyes} eyes, and nothing else.`;
        } else if (cat.name === culprit) {
            cat.clue = `${cat.name} stays oddly calm for a clan in mourning. A fresh scratch is healing on one ear, and they avoid your gaze.`;
        } else if (cat.name === 'Brindleleaf') {
            cat.clue = `Brindleleaf says fur was snagged on the elder den brambles. He looked up in time to see ${eyes} eyes blink and disappear into the dark.`;
        } else if (cat.name === 'Cloudspark') {
            cat.clue = `Cloudspark heard pawsteps splash through the mud after the attack. She glimpsed ${eyes} eyes glinting at her over the stream before the cat fled.`;
        } else if (cat.name === 'Pinefoot') {
            cat.clue = `Pinefoot says only a few cats helped repair the camp barrier this moon. The one who handled the pine resin had ${eyes} eyes — she remembers that much.`;
        } else if (cat.name === 'Sorreltail') {
            cat.clue = `Sorreltail says Willowfur was furious about stolen prey hidden in a warrior's nest. The warrior in question had ${eyes} eyes — Willowfur said so the night before she died.`;
        }
    });
}

function startGame() {
    game.started = true;
    game.gender = currentGender;
    game.playerPrefix = currentPrefix;
    game.playerFurIndex = currentFurIndex;
    game.playerFur = pelts[currentFurIndex].fur;
    game.playerMark = pelts[currentFurIndex].mark;
    if (player) {
        player.style.setProperty('--fur', game.playerFur);
        player.style.setProperty('--mark', game.playerMark);
    }
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

function trustMax(name) {
    return name === 'Whiskerstar' ? 5 : 3;
}

function trustFor(name) {
    return game.trust[name] || 0;
}

function trustLabel(name) {
    if (game?.mate === name) return '(Mates)';
    return `Trust ${trustFor(name)}/${trustMax(name)}.`;
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

function moonclanRoster() {
    const names = new Set();
    if (!game.ashstarLeader) names.add('Whiskerstar');
    names.add(game.ashstarLeader ? 'Ashstar' : 'Ashfall');
    ['Mistclaw', 'Ravenstripe', 'Brindleleaf', 'Cloudspark', 'Pinefoot', 'Sorreltail',
     'Rosesong', 'Oakwhisker', 'Birchstep', 'Hollyfoot', 'Reedpaw', 'Fernpaw', 'Snowkit']
        .forEach((n) => names.add(n));
    (game.nurseryKitAges || []).forEach((kit) => {
        const stage = growthStage(kit.bornDay);
        let name;
        if (kit.base === 'Moss') {
            name = stage === 'warrior' ? 'Mossleaf' : stage === 'apprentice' ? 'Mosspaw' : 'Mosskit';
        } else {
            const suffix = stage === 'warrior' ? 'heart' : stage === 'apprentice' ? 'paw' : 'kit';
            name = `${kit.base}${suffix}`;
        }
        names.add(name);
    });
    const filtered = new Set();
    names.forEach((n) => { if (shouldShowLivingCat(n)) filtered.add(n); });
    return filtered;
}

function moonclanFullTrustStats() {
    const roster = moonclanRoster();
    let trusted = 0;
    roster.forEach((name) => {
        const max = trustMax(name);
        if (max > 0 && trustFor(name) >= max) trusted += 1;
    });
    return { trusted, total: roster.size };
}

function updateHud() {
    const clueTotal = Math.min(2, foundClues.size);
    if (game.firstSolved) {
        const stats = moonclanFullTrustStats();
        clueCount.textContent = `Trust ${stats.trusted}/${stats.total} (in all)`;
    } else {
        clueCount.textContent = `Clues ${clueTotal}/2`;
    }
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

function isRaining() {
    return game?.started && game.day >= 17 && (game.day - 17) % 17 < 2;
}

function renderAll() {
    world.classList.toggle('mystery-solved', Boolean(game.firstSolved));
    world.classList.toggle('raining', isRaining());
    updateRainSound();
    if (notebookBtn) {
        notebookBtn.hidden = Boolean(game.firstSolved);
    }
    const inventoryBtn = document.getElementById('inventoryBtn');
    if (inventoryBtn) {
        inventoryBtn.hidden = !game.firstSolved;
    }
    updatePreyPileLabel();
    renderCats();
    renderAreas();
    updateHud();
    updateChapter();
}

function renderCats() {
    npcLayer.innerHTML = '';
    player.innerHTML = catMarkup();
    player.classList.toggle('ghost-player', Boolean(game.ghostMode));
    player.classList.toggle('holding-rose', !!game?.roseInMouth);
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
        if (game.firstSolved && firstMurderer === 'Pinefoot') {
            const ravenCat = cast.find((cat) => cat.name === 'Ravenstripe');
            if (ravenCat && shouldShowLivingCat('Ravenstripe')) {
                addNpc('Ravenstripe', 'Warrior', 1120, groundY, ravenCat.fur, ravenCat.mark, () => setMessage('Ravenstripe (Tom)', rotatingText('RavenstripeFight', ['I will sharpen any warrior willing to spar.', 'Pinefoot used to teach here. I do my best to fill her place.', 'Claws sheathed. Pride too.'])));
            }
        } else if (shouldShowLivingCat('Pinefoot')) {
            addNpc('Pinefoot', 'Warrior', 1120, groundY, '#6a4d34', '#263d23', () => setMessage('Pinefoot (She-cat)', rotatingText('Pinefoot', ['Keep your claws sheathed for practice.', 'Good footwork wins fights.', 'The apprentices are improving.'])));
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'gathering') {
        const branchY = groundY + 200;
        const leaderLines = {
            Ashstar: [
                'Moonclan has faced danger and stands together.',
                'Our apprentices grow stronger with every patrol.',
                'Greenleaf prey runs full. We have shared what we can.',
                'Starclan has spoken of trials ahead. We will be ready.'
            ],
            Hawkstar: [
                'Sunclan reports strong patrols and full bellies.',
                'A fox crossed our border but we drove it off.',
                'Our medicine cat warns of fever in the queens.',
                'We met an old kittypet near the twoleg fence; we left them be.'
            ],
            Dawnstar: [
                'Dawnclan brings news of dry leaves and quick prey.',
                'Our river is shallower this moon. The fish run early.',
                'We mourn an elder who joined Starclan two sunrises ago.',
                'The dawn winds carry rain. Be ready, all of you.'
            ]
        };
        const gatheringNum = game.lastGatheringDay || 0;
        const pickLine = (name) => {
            const lines = leaderLines[name];
            return lines[gatheringNum % lines.length];
        };
        for (let i = 0; i < 3; i += 1) {
            const branch = document.createElement('div');
            branch.className = 'gathering-branch';
            branch.style.left = `${860 + i * 170}px`;
            branch.style.bottom = `${branchY - 16}px`;
            npcLayer.appendChild(branch);
        }
        addNpc('Ashstar', 'Leader', 900, branchY, '#777a78', '#d4d4c8', () => setMessage('Ashstar', pickLine('Ashstar')));
        addNpc('Hawkstar', 'Leader', 1070, branchY, '#d09b42', '#5a3920', () => setMessage('Hawkstar', pickLine('Hawkstar')));
        addNpc('Dawnstar', 'Leader', 1240, branchY, '#b7a369', '#f2d597', () => setMessage('Dawnstar', pickLine('Dawnstar')));

        const moonclanPool = ['Cloudspark', 'Mistclaw', 'Brindleleaf', 'Sorreltail', 'Pinefoot'].filter((n) => shouldShowLivingCat(n));
        const sunclanPool = ['Nettleclaw', 'Dawnpelt', 'Russetfang'];
        const dawnclanPool = ['Hollybriar', 'Quailfoot', 'Ashberry'];
        const combinedPool = [
            ...moonclanPool.map((name) => ({ name, kind: 'moonclan' })),
            ...sunclanPool.map((name) => ({ name, kind: 'sunclan' })),
            ...dawnclanPool.map((name) => ({ name, kind: 'dawnclan' }))
        ];
        for (let i = combinedPool.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [combinedPool[i], combinedPool[j]] = [combinedPool[j], combinedPool[i]];
        }
        const guests = combinedPool.slice(0, 5);
        const guestSpots = [620, 880, 1500, 1740, 1980];
        guests.forEach((guest, i) => {
            const x = guestSpots[i % guestSpots.length];
            if (guest.kind === 'moonclan') {
                const cat = cast.find((c) => c.name === guest.name);
                if (!cat) return;
                addNpc(guest.name, cat.rank, x, groundY, cat.fur, cat.mark, () => setMessage(guest.name, `${guest.name} murmurs about the night sky and watches the leaders.`));
            } else if (guest.kind === 'dawnclan') {
                addExtraNpc(guest.name, x, groundY, () => clickOtherClanCat(guest.name, 'dawnclan'));
            } else {
                addExtraNpc(guest.name, x, groundY, () => clickOtherClanCat(guest.name, 'sunclan'));
            }
        });
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'borders') {
        const mistclawGone = game.firstSolved && firstMurderer === 'Mistclaw';
        if (shouldShowLivingCat('Cloudspark')) {
            const x = mistclawGone ? 1030 : 760;
            const lines = mistclawGone
                ? ['I keep the border now that Mistclaw is gone.', 'Patrols still need to prove themselves out here.', 'Want a paw-game on the stones? I learned it from Mistclaw.']
                : ['Sunclan scent is fresh here.', 'Stay behind the river line.', 'The border stones shifted in the rain.'];
            addNpc('Cloudspark', 'Warrior', x, groundY, '#f0eee1', '#c4b892', () => setMessage('Cloudspark (She-cat)', rotatingText('Cloudspark', lines)));
        }
        if (shouldShowLivingCat('Mistclaw')) {
            addNpc('Mistclaw', 'Warrior', 1030, groundY, '#8fa0a6', '#eef6f5', () => setMessage('Mistclaw (Tom)', rotatingText('Mistclaw', ['This is where patrols prove themselves.', 'Do not step into Sunclan territory.', 'Want a paw-game on the stones?'])));
        }
        if (!game.rogueDefeated) {
            const rogueNode = document.createElement('button');
            rogueNode.type = 'button';
            rogueNode.className = 'cat npc warrior rogue';
            rogueNode.dataset.catName = 'Rogue';
            rogueNode.style.left = '1400px';
            rogueNode.style.bottom = `${groundY}px`;
            rogueNode.style.setProperty('--fur', '#7a3520');
            rogueNode.style.setProperty('--mark', '#1e1009');
            rogueNode.innerHTML = `${catMarkup()}<span class="nameplate">Rogue</span>`;
            rogueNode.addEventListener('click', () => {
                if (game.ghostMode) {
                    setMessage('Rogue', 'The rogue paces, oblivious. Ghosts cannot reach them.');
                    return;
                }
                if (!game.battle || game.battle.ended) {
                    startBattle('Rogue');
                }
            });
            npcLayer.appendChild(rogueNode);
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'sunclan') {
        addExtraNpc('Nettleclaw', 760, groundY, () => clickOtherClanCat('Nettleclaw', 'sunclan'));
        addExtraNpc('Dawnpelt', 980, groundY, () => clickOtherClanCat('Dawnpelt', 'sunclan'));
        addExtraNpc('Russetfang', 1210, groundY, () => clickOtherClanCat('Russetfang', 'sunclan'));
        markSunclanPreyHolder();

        const fence = document.createElement('div');
        fence.className = 'twoleg-fence';
        fence.style.left = '1500px';
        fence.style.bottom = `${groundY}px`;
        npcLayer.appendChild(fence);

        const kittypetNode = document.createElement('button');
        kittypetNode.type = 'button';
        kittypetNode.className = 'cat npc warrior kittypet';
        kittypetNode.style.left = '1560px';
        kittypetNode.style.bottom = `${groundY + 80}px`;
        kittypetNode.style.setProperty('--fur', '#e8c895');
        kittypetNode.style.setProperty('--mark', '#a86b3c');
        kittypetNode.dataset.catName = 'Princess';
        kittypetNode.innerHTML = `${catMarkup()}<span class="collar"></span><span class="nameplate">Princess</span>`;
        kittypetNode.addEventListener('click', () => {
            if (game.ghostMode) {
                setMessage('Princess', 'Princess tilts her head, sensing nothing. The living cannot hear ghosts.');
                return;
            }
            if (!game.kittypetMet) {
                game.kittypetMet = true;
                setMessage('Princess (She-cat, Kittypet)', 'I am Princess. I live with twolegs in the nest beyond this fence. They feed me out of a noisy can.');
                return;
            }
            if (game.mate === 'Princess') {
                setMessage('Princess (She-cat, your mate)', rotatingText('mate-Princess', mateDialogue('Princess')));
                return;
            }
            game.smudgeClicks = (game.smudgeClicks || 0) + 1;
            if (game.firstSolved && !game.mate && game.smudgeClicks >= 3 && canMateWith(SMUDGE_CAT)) {
                askForCatMate(SMUDGE_CAT);
                return;
            }
            const trustShown = Math.min(3, game.smudgeClicks);
            setMessage(`Princess (She-cat, Kittypet — trust ${trustShown}/3)`, rotatingText('Princess', [
                'My twolegs play soft music at sunhigh. The walls hum with it.',
                'The fence is warm under my paws. Sometimes I sit here for whole sunrises.',
                'A bigger kittypet from another nest hisses at me through the wires. I hiss back.',
                'My collar has a tiny silver bell. Twolegs say it stops me from catching birds.',
                'I have never tasted a real mouse. Is it nicer than the soft brown pellets?',
                'I would join your clan, but I would miss my warm cushion.'
            ]));
        });
        npcLayer.appendChild(kittypetNode);

        renderGhostCats();
        return;
    }

    if (game.currentArea === 'hunting') {
        const graves = [
            {
                name: 'Willowfur',
                x: 2700,
                lines: [
                    'A flat stone marks where Willowfur rests.',
                    'You bow your head. The forest is gentler here.',
                    'Sorreltail must visit too — the stone is brushed clean.',
                    "Willowfur's name is etched lightly into the stone."
                ]
            },
            {
                name: 'Frostheart',
                x: 2820,
                lines: [
                    'A stone for Frostheart, a warrior of the old days. Her name is carved in pale lines.',
                    'You can almost feel her starry eyes watching from above.',
                    'Frostheart died chasing a fox from the queens. The clan still tells the story.'
                ]
            },
            {
                name: 'Mossheart',
                x: 2940,
                lines: [
                    'Mossheart sleeps under this stone. A clan-elder once, now of Starclan.',
                    'The moss grows thick here, as if Mossheart still tends it.',
                    'You whisper a thank-you. Some warriors are remembered by every season.'
                ]
            }
        ];
        graves.forEach((info) => {
            const grave = document.createElement('button');
            grave.type = 'button';
            grave.className = 'willowfur-grave';
            grave.style.left = `${info.x}px`;
            grave.style.bottom = `${groundY}px`;
            grave.innerHTML = `<span class="grave-stone"></span><span class="grave-name">${info.name}</span>`;
            grave.addEventListener('click', () => {
                setMessage(`${info.name}'s grave`, rotatingText(`grave-${info.name}`, info.lines));
            });
            npcLayer.appendChild(grave);
        });

        if (shouldShowLivingCat('Brindleleaf')) {
            addNpc('Brindleleaf', 'Warrior', 760, groundY, '#a76d3f', '#4d2d1c', () => setMessage('Brindleleaf (Tom)', rotatingText('Brindleleaf', ['Stay downwind of the mouse path.', 'The river is too deep to swim.', 'Ferns hide both prey and trouble.'])));
        }
        renderGhostCats();
        return;
    }

    if (game.currentArea === 'moonpool' && (!game.moonpoolDone || game.ghostMode)) {
        if (game.ghostMode) {
            const all = deadCats();
            const slots = [];
            for (let xs = 720; xs < 1460; xs += 120) slots.push(xs);
            for (let xs = 1940; xs < 2960; xs += 120) slots.push(xs);
            for (let i = slots.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [slots[i], slots[j]] = [slots[j], slots[i]];
            }
            all.forEach((cat, index) => {
                const baseX = slots[index % slots.length];
                const x = baseX + Math.random() * 24 - 12;
                const y = groundY + Math.random() * 14;
                addDeadNpc(cat, x, y);
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
        if (kit.base === 'Moss' && stage !== 'kit') {
            return;
        }
        const kitSpots = [620, 1240, 1900, 2440, 760, 1520, 2240];
        const apprenticeSpots = [580, 1200, 1880, 2380, 760];
        const warriorSpots = [1780, 1960, 2160, 2360, 1880];
        const x = stage === 'warrior'
            ? warriorSpots[index % warriorSpots.length]
            : stage === 'apprentice'
                ? apprenticeSpots[index % apprenticeSpots.length]
                : kitSpots[index % kitSpots.length];
        const genderLabel = kit.gender ? ` (${kit.gender})` : '';
        let lines;
        if (stage === 'kit') {
            lines = [
                `${name} tumbles through the clearing.`,
                `${name} bats at a moss scrap.`,
                `${name} smells of warm moss and milk.`
            ];
        } else if (stage === 'apprentice') {
            lines = [
                `${name} stretches into a battle crouch. "Watch how low I can go!"`,
                `${name} says, "Take me out for a real hunt soon."`,
                `${name} murmurs, "I want to earn my warrior name before greenleaf ends."`
            ];
        } else {
            lines = [
                `${name} says, "I can join any patrol you need."`,
                `${name} stretches their shoulders. "I will keep the borders sharp."`,
                `${name} dips their head. "Honor the warrior code."`
            ];
        }
        addNpc(name, stage === 'warrior' ? 'Warrior' : stage === 'apprentice' ? 'Apprentice' : 'Kit', x, groundY, kit.fur, kit.mark, () => {
            if (game.firstSolved && (stage === 'kit' || stage === 'apprentice')) {
                if (game.preyInMouth) {
                    offerPreyToCat({ name, rank: stage === 'kit' ? 'Kit' : 'Apprentice', gender: kit.gender || 'Unknown' });
                    return;
                }
                game.talkCounts = game.talkCounts || {};
                game.talkCounts[name] = (game.talkCounts[name] || 0) + 1;
                if (game.talkCounts[name] % 6 === 0 && trustFor(name) < trustMax(name)) {
                    game.trust[name] = trustFor(name) + 1;
                    addNote(`${name} trust increased to ${trustFor(name)}/${trustMax(name)} from spending time together.`);
                }
                const trustLine = ` ${trustLabel(name)}`;
                setMessage(`${name}${genderLabel}`, `${rotatingText(name, lines)}${trustLine}`);
                return;
            }
            setMessage(`${name}${genderLabel}`, rotatingText(name, lines));
        });
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
        const genderLabel = game.abandonedKit.gender ? ` (${game.abandonedKit.gender})` : '';
        setMessage(`${name}${genderLabel}`, rotatingText(name, [
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
    node.dataset.catName = name;
    if (name === 'Ravenstripe') {
        node.classList.add('scarred-ear');
    }
    node.style.left = `${x}px`;
    node.style.bottom = `${bottom}px`;
    node.style.setProperty('--fur', fur);
    node.style.setProperty('--mark', mark);
    const castEntry = cast?.find((c) => c.name === name);
    const eyeHex = castEntry?.eyeColor || (rank === 'Leader' ? '#f7df6e' : '#b7f2a0');
    node.style.setProperty('--eye', eyeHex);
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
    const handler = game.ghostMode
        ? () => setMessage(`${name} (Starclan)`, starclanLine(name))
        : () => setMessage(`${name} (Starclan)`, `${name} drifts past in a starry hush. The living cannot hear their voices, only sense their presence.`);
    addNpc(name, 'Starclan', x, groundY + 28, '#d9ecff', '#ffffff', handler);
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
    if (game.patrolDeaths && game.patrolDeaths.some((c) => c.name === name)) {
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
    if (game.patrolDeaths) {
        game.patrolDeaths.forEach((c) => dead.push({ ...c, homeScene: c.homeScene || 'camp' }));
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
    const ranges = {
        camp: [560, 2500],
        borders: [560, 1430],
        hunting: [560, 2300]
    };
    const range = ranges[game.currentArea];
    if (!range) {
        return;
    }
    const [minX, maxX] = range;
    const sceneCats = deadCats().filter((cat) => cat.homeScene === game.currentArea);
    const slots = [];
    for (let xs = minX; xs < maxX; xs += 220) {
        slots.push(xs);
    }
    for (let i = slots.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    sceneCats.forEach((cat, index) => {
        const baseX = slots[index % slots.length] ?? minX;
        const x = baseX + Math.random() * 30 - 15;
        const y = groundY + Math.random() * 22;
        addDeadNpc(cat, x, y);
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
    if (game.firstSolved
        && game.matePatrolDeath
        && game.day < game.matePatrolDeath.day + 3
        && cat.name !== game.matePatrolDeath.name) {
        const lookupName = game.ashstarLeader && cat.name === 'Ashstar' ? 'Ashstar' : cat.name;
        const line = pityLineFor(lookupName);
        if (line) {
            setMessage(`${cat.name} (${cat.gender})`, line);
            return;
        }
    }
    if (game.firstSolved && game.mate === 'Princess' && game.kittypetMateRevealed && cat.name !== 'Princess') {
        const lookup = game.ashstarLeader && cat.name === 'Ashstar' ? 'Ashstar' : cat.name;
        if (!game.kittypetReactionShown[lookup] && kittypetReactionFor(lookup)) {
            game.kittypetReactionShown[lookup] = true;
            setMessage(lookup, kittypetReactionFor(lookup));
            return;
        }
    }
    if (game.ashstarLeader && cat.name === 'Ashstar') {
        const pinefootKilled = firstMurderer === 'Pinefoot';
        const lines = pinefootKilled
            ? [
                'Ashstar stares into the embers. "I never thought my mate Pinefoot could turn to darkness. Willowfur died for it."',
                game.moonpoolDone
                    ? 'Starclan has granted my lives, but the grief stays. Pinefoot was my heart, and she chose the dark.'
                    : 'Come with me to the Moonpool. Even now, I hear Pinefoot in my dreams. I do not know if I forgive her.'
            ]
            : [
                game.moonpoolDone ? 'Starclan has granted my lives. You are my deputy now.' : 'Come with me to the Moonpool, deputy.',
                'Pinefoot keeps watch on the camp barrier while we plan. She is steady, my mate.'
            ];
        setMessage('Ashstar (Tom)', rotatingText('AshstarTalk', lines));
        return;
    }
    if (!game.firstSolved && cat.name === 'Ashfall' && firstMurderer === 'Pinefoot') {
        const pinefootLines = [
            'Ashfall lowers his head. "Pinefoot... my mate. She slipped out of our nest in the dark and I did not stop her. I am sorry."',
            'Ashfall whispers, "Her pelt smelled of pine resin when she came back. I did not want to believe it."'
        ];
        const idx = questioned.has(cat.name) ? 1 : 0;
        if (!questioned.has(cat.name) && questioned.size < 2) {
            addNote(`${cat.rank} ${cat.name}: Ashfall confirms his mate Pinefoot left the warrior den that night.`);
        }
        questioned.add(cat.name);
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, pinefootLines[idx]);
        maybeEnableAccusation();
        return;
    }
    if (game.firstSolved) {
        game.talkCounts = game.talkCounts || {};
        game.trustReachedDay = game.trustReachedDay || {};
        game.talkCounts[cat.name] = (game.talkCounts[cat.name] || 0) + 1;
        if (game.talkCounts[cat.name] % 6 === 0 && trustFor(cat.name) < trustMax(cat.name)) {
            game.trust[cat.name] = trustFor(cat.name) + 1;
            addNote(`${cat.name} trust increased to ${trustFor(cat.name)}/${trustMax(cat.name)} from spending time together.`);
        }
        if (trustFor(cat.name) >= 3 && game.trustReachedDay[cat.name] === undefined) {
            game.trustReachedDay[cat.name] = game.day;
        }
        if (game.preyInMouth) {
            offerPreyToCat(cat);
            return;
        }
        if (canMateWith(cat) && game.rose && game.roseInMouth && trustFor(cat.name) >= 3 && !game.mate) {
            proposeMate(cat.name);
            return;
        }
        const daysAtMax = game.trustReachedDay[cat.name] !== undefined
            ? game.day - game.trustReachedDay[cat.name]
            : -1;
        if (canMateWith(cat) && trustFor(cat.name) >= 3 && !game.mate && !game.rose && daysAtMax >= 3) {
            askForCatMate(cat);
            return;
        }
        if (cat.name === game.mate) {
            const lines = mateDialogue(cat.name);
            setMessage(`${cat.name} (${cat.gender}, your mate)`, rotatingText(`mate-${cat.name}`, lines));
            return;
        }
        if (game.deputyDay === game.day && cat.name !== 'Ashstar') {
            setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, `Wow, you are deputy now? Congratulations, ${warriorName()}. Moonclan trusts your paws.`);
            return;
        }
        const trustLvl = trustFor(cat.name);
        let pool;
        if (trustLvl >= 3 && canMateWith(cat) && flirtyLines[cat.name]) {
            pool = flirtyLines[cat.name];
        } else if (trustLvl >= 3 && friendlyLines[cat.name]) {
            pool = friendlyLines[cat.name];
        } else {
            pool = postSolvePool(cat.name);
        }
        const trust = ` ${trustLabel(cat.name)}`;
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, `${rotatingText(`${cat.name}-t${trustLvl}`, pool)}${trust}`);
        return;
    }

    if (!game.firstSolved && cat.name === firstMurderer) {
        const line = questioned.has(cat.name)
            ? `It's awful. Willowfur was a good warrior. I hope they catch whoever did it soon.`
            : `Such terrible news about Willowfur. I was asleep when it happened. Sorry I can't help more.`;
        questioned.add(cat.name);
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, line);
        maybeEnableAccusation();
        return;
    }

    if (!game.firstSolved && (game.scaredCats || []).includes(cat.name)) {
        const scared = SCARED_LINES[Math.floor(Math.random() * SCARED_LINES.length)];
        setMessage(`${cat.name}, ${cat.rank} (${cat.gender})`, scared);
        return;
    }

    const culpritEyes = cast.find((c) => c.name === firstMurderer)?.eyes || 'pale';
    const line = (firstLines[cat.name]?.[questioned.has(cat.name) ? 1 : 0] || 'They twitch their whiskers.').replaceAll('{EYES}', culpritEyes);
    const isClueGiver = !game.firstSolved && (game.clueGivers || []).includes(cat.name);
    if (isClueGiver && !questioned.has(cat.name)) {
        addNote(`${cat.rank} ${cat.name}: ${cat.clue}`);
    }
    questioned.add(cat.name);
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
                revealFurTuft();
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

function revealFurTuft() {
    if (!furTuft) {
        return;
    }
    const culprit = cast.find((cat) => cat.name === firstMurderer);
    const fur = culprit?.fur || '#3a2a1f';
    furTuft.style.setProperty('--murderer-fur', fur);
    furTuft.hidden = false;
    setMessage('Bush', 'A clump of torn fur catches on the brambles. Click it to look closer.');
}

function inspectFurTuft() {
    if (!furTuft || furTuft.hidden) {
        return;
    }
    furTuft.hidden = true;
    const culprit = cast.find((cat) => cat.name === firstMurderer);
    const colorWord = describeFur(culprit?.fur || '#3a2a1f');
    addNote(`Torn fur tuft: a ${colorWord} pelt color, matching ${firstMurderer}.`);
    setMessage('Evidence', `The fur is ${colorWord} — the same shade as ${firstMurderer}'s pelt.`);
    maybeEnableAccusation();
}

function describeFur(hex) {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return 'dark';
    const v = parseInt(m[1], 16);
    const r = (v >> 16) & 255;
    const g = (v >> 8) & 255;
    const b = v & 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 200) return 'pale cream';
    if (lum > 160) return 'light tan';
    if (lum > 110) {
        if (r > g && r > b) return 'reddish';
        if (g > r && g > b) return 'mossy';
        if (b > r) return 'cool grey';
        return 'tawny brown';
    }
    if (lum > 60) {
        if (r > g + 20) return 'rich russet';
        if (g > r + 10) return 'dark olive';
        return 'dark brown';
    }
    return 'inky black';
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
        if (cat.rank === 'Leader' || cat.rank === 'Deputy') {
            return;
        }
        const row = document.createElement('div');
        row.className = `suspect-row ${status[cat.name] || ''}`;

        const name = document.createElement('span');
        name.className = 'suspect-name';
        name.textContent = `${cat.rank} ${cat.name}`;
        row.appendChild(name);

        const crossBtn = document.createElement('button');
        crossBtn.type = 'button';
        crossBtn.textContent = 'Eliminate';
        crossBtn.title = 'Mark this cat as ruled out — they are not the murderer.';
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
        checkBtn.textContent = 'Suspect';
        checkBtn.title = 'Flag this cat as a likely suspect.';
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
    if (foundClues.size < 2 || game.firstSolved) {
        return;
    }
    chapter.textContent = 'You have enough clues. Press Solve when you are ready to name the killer.';
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
    if (furTuft) {
        furTuft.hidden = true;
    }
    renderAll();
    setMessage('Whiskerstar', `Good job, ${warriorName()}. ${firstMurderer} is cast out. From this day forward, you are a warrior.`);
}

function endInvestigationDay() {
    game.day += 1;
    decayPreyPile();
    updateHud();
    updatePreyPileLabel();
    if (game.day > game.firstLimit) {
        showLoss('You took too long to find the murderer.');
        return;
    }
    setMessage('Moonclan', `Night falls. Day ${game.day} begins.`);
    renderInvestigationActions();
    bumpDayTimer();
}

const AUTO_DAY_MS_INVESTIGATION = 2 * 60 * 1000 + 5 * 1000;
const AUTO_DAY_MS_POST_SOLVE = 3 * 60 * 1000 + 5 * 1000;

function bumpDayTimer() {
    if (!game) {
        return;
    }
    clearTimeout(game.dayTimer);
    if (!game.started || game.ended) {
        return;
    }
    const ms = game.firstSolved ? AUTO_DAY_MS_POST_SOLVE : AUTO_DAY_MS_INVESTIGATION;
    game.dayTimer = setTimeout(autoAdvanceDay, ms);
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
    let denCats = detail[2].slice();
    if (name === 'Medicine Den' && mosskitMedicineCat()) {
        denCats = [...denCats, mosskitName()];
    }
    if (name === 'Elder Den' && mosskitName() === 'Mosspaw' && Math.random() < 0.5) {
        denCats = [...denCats, 'Mosspaw'];
        denText.textContent = `${detail[0]} Mosspaw is here, dabbing marigold paste onto Oakwhisker's stiff shoulder.`;
    }
    denCats.filter((catName) => !(game.ashstarLeader && catName === 'Whiskerstar'))
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
    if (name === 'Leader Den') {
        const relationsButton = document.createElement('button');
        relationsButton.type = 'button';
        relationsButton.textContent = 'Clan relationships';
        relationsButton.addEventListener('click', () => {
            const sun = clanRelationLabel(game.sunclanState);
            const dawn = clanRelationLabel(game.dawnclanState);
            setMessage('Clan Relationships', `Sunclan: ${sun}. Dawnclan: ${dawn}. (Give prey or fight to shift relations — Dawnclan only at Gatherings.)`);
        });
        denActions.appendChild(relationsButton);
    }
    setMessage(name, `You duck inside the ${name.toLowerCase()}.`);
}

function addDenCat(layer, name, x, handler) {
    const fullCat = cast.find((cat) => cat.name === name) || extraCats[name] || { rank: 'Cat', gender: 'Unknown', fur: '#9b7350', mark: '#5d3f2c' };
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `cat npc den-cat${name === 'Snowkit' ? ' sleeping-cat' : ''}`;
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

function oakwhiskerStoryClans() {
    return 'Oakwhisker settles deeper into the leaves. "Sunclan are the orderly ones. Their leader now is Hawkstar — they keep tally-sticks for every patrol and every piece of prey, sort their dens by rank. Sharp clan, sharp tongues. Hawkstar is not the first leader of Sunclan, mind you — the first was Sunstar himself. He fell so long ago that even Starclan no longer keeps his face among them. Three founders raised the clans together: Sunstar, Moonstar, and Dawnstar. Two are dust now. Only Dawnstar still breathes. He leads Dawnclan still, older than dirt itself, and Dawnclan lives a long, long sun\'s walk past the river fork — through marsh and pine. You cannot simply pad over there alone, young one. The road is too long, the ground too treacherous for a single warrior. That is why Dawnclan only meets us at Gatherings."';
}

function oakwhiskerStoryMurder() {
    const culprit = firstMurderer;
    if (!game.firstSolved) {
        return `Oakwhisker's eyes narrow. "Willowfur's killer is still loose, kit. Find them first. When the truth is out, come back to me — I have more to tell."`;
    }
    return `Oakwhisker lowers his voice. "Listen close. ${culprit} did not kill Willowfur over a piece of prey. Many moons ago, ${culprit}'s own sister was named deputy of Moonclan. She was sharp-eyed and fair — the clan loved her. ${culprit} did not. One dusk, ${culprit} caught her alone in the brambles and tore her throat out, so the deputy spot would fall to a weaker cat. The clan never knew who had done it. But Willowfur did. She had been gathering moss in those same brambles, and she saw it all. She kept silent — fear, pity, hope ${culprit} would change. They never did. When Willowfur finally hinted she was going to speak, ${culprit} silenced her too. I know because I was in those brambles with Willowfur the night the deputy died. I was younger then, faster. I slipped away before they saw me. I have carried it in my old bones all these moons, waiting for the right ear. Yours, apparently."`;
}

function oakwhiskerStoryOrigin() {
    return 'Oakwhisker\'s voice softens. "You do not remember it, but I do. You were a tiny scrap of fur when one of our patrols found you mewling on the Sunclan border, alone in the brambles. No mother in sight. No scent we could follow. Whiskerstar carried you back to camp himself. You have known no home but Moonclan. Mossheart took you to her belly without a second thought — she was already heavy with kits of her own, but she had milk enough for one more, and a heart wider than the sky. A moon after she kitted Pebblekit, Mosskit, and Tinykit, an infection from the birthing took her in the night. Rosesong did all she could. It was not enough. Mossheart joined Starclan before her own litter ever opened their eyes. As for the murder, kit — Whiskerstar set that hunt on your shoulders because you were the only apprentice in the clan at the time, older than Mossheart\'s kits and old enough to think for yourself. He believed it would prove what kind of warrior you would become. I believe he was right."';
}

function showOakwhiskerStories() {
    setMessage('Oakwhisker (Elder)', 'Oakwhisker tucks his tail close. "Sit, kit. I have stories. Pick one."');
    accusePanel.innerHTML = '<button id="oakStoryClans" type="button">Tell me about the other clans</button><button id="oakStoryMurder" type="button">Tell me about the murder</button><button id="oakStoryOrigin" type="button">Tell me about my parents</button><button id="oakStoryDone" type="button">That\'s enough for now</button>';
    document.getElementById('oakStoryClans').addEventListener('click', () => setMessage('Oakwhisker (Elder)', oakwhiskerStoryClans()));
    document.getElementById('oakStoryMurder').addEventListener('click', () => setMessage('Oakwhisker (Elder)', oakwhiskerStoryMurder()));
    document.getElementById('oakStoryOrigin').addEventListener('click', () => setMessage('Oakwhisker (Elder)', oakwhiskerStoryOrigin()));
    document.getElementById('oakStoryDone').addEventListener('click', () => {
        accusePanel.innerHTML = '';
        setMessage('Oakwhisker (Elder)', 'Oakwhisker dips his head and closes his eyes. "Come back when you want another, young one."');
    });
}

function talkInsideDen(name) {
    if (game.ghostMode && !isDeadCatName(name)) {
        setMessage(name, ghostFeelingLine(name));
        return;
    }
    const candidateData = extraCats[name] || cast.find((c) => c.name === name);
    if (game.firstSolved && candidateData?.rank === 'Warrior' && mateCandidates.has(name)) {
        speak({ name, rank: candidateData.rank, gender: candidateData.gender, fur: candidateData.fur, mark: candidateData.mark });
        return;
    }
    if (name === 'Oakwhisker') {
        showOakwhiskerStories();
        return;
    }
    if (name === 'Mosspaw' && denTitle.textContent === 'Elder Den') {
        const elderLines = [
            'Mosspaw dabs marigold paste onto Oakwhisker\'s stiff shoulder. "Hold still, please. The cold mornings make this ache worse for him."',
            'Mosspaw chews comfrey root into a poultice. "Oakwhisker\'s joints stiffen when the wind shifts. Rosesong taught me which leaves help most."',
            'Mosspaw smiles up at you, a sprig of tansy between her teeth. "This one is for his cough. Elders deserve a steady paw, do they not?"'
        ];
        setMessage('Mosspaw (Medicine Cat Apprentice)', rotatingText('mosspaw-elderden', elderLines));
        return;
    }
    const denLines = {
        Snowkit: [
            'Snowkit is curled tight in the moss, breathing slow and steady.',
            'Their tiny paws twitch as they chase a mouse in their dream.',
            'A faint squeak escapes them, then silence again.',
            'Snowkit shifts a little, snuggling deeper into the bracken.',
            'A soft purr rumbles through Snowkit, even in sleep.',
            'Snowkit is so small the moss almost swallows them.',
            'Their whiskers twitch, then settle. Whatever dream it was, it passed.',
            "Snowkit's ear flicks, brushed by a passing breeze."
        ],
        Birchstep: [
            'Birchstep stretches and yawns. "Long patrol earlier. The wind kept shifting."',
            'Birchstep flicks an ear. "The new apprentices have quick paws. Watch them."',
            'Birchstep murmurs, "I caught the scent of fox by the old pine. Stay alert."'
        ],
        Hollyfoot: [
            'Hollyfoot grooms her dark pelt with sharp tongue strokes. "A clean coat is a quiet hunter."',
            'Hollyfoot nods to you. "I prefer fighting at dusk. The shadows do half the work."',
            'Hollyfoot watches the den entrance through one half-open eye.'
        ],
        Oakwhisker: [
            'Oakwhisker rasps, "An exiled cat can still find a path back through anger."',
            'Oakwhisker chuckles. "I remember when these stones were warmer in summer. The forest forgets nothing."',
            'Oakwhisker shifts in the leaves. "Listen more than you speak, young one. Stories live in old bones."',
            'Oakwhisker scratches behind his ear. "I outlived three deputies. Almost a fourth."',
            'Oakwhisker says, "When I was your age, I caught a fox on the river path. Almost. Mostly."',
            'Oakwhisker yawns. "Wake me when the prey runs at dawn. Or do not. I will sleep through it."',
            'Oakwhisker murmurs, "Mossheart would have loved seeing you grow. Hold onto that, young one."',
            'Oakwhisker says, "Time slows in the elder den. Visit more, warrior."'
        ],
        Rosesong: [
            'Rosesong sorts herbs. "The Moonpool will show what the living miss."',
            'Rosesong holds out a sprig of catmint. "If a cough comes, find me before sunset."',
            'Rosesong studies you a moment. "Your spirit feels strong today. Hold onto that."',
            'Rosesong stirs a poultice. "Marigold and yarrow — sting, then mend."',
            'Rosesong says, "Mosspaw is a quick study. The clan is lucky."',
            'Rosesong whispers, "Starclan walked through my dream last night."',
            'Rosesong glances toward the nursery. "Snowkit will need watching when she wakes. So small."',
            'Rosesong dips her head. "Bring me word if anyone takes ill, however small."'
        ],
        Mosspaw: [
            'Mosspaw bundles dried marigold leaves. "These are for scratches. I packed them this morning."',
            'Mosspaw says, "Rosesong is teaching me which herbs grow near the river stones."',
            'Mosspaw whispers, "Sometimes I dream of Starclan. Rosesong says it is a good sign."',
            'Mosspaw sniffs at a sprig. "Catmint, finally fresh again."',
            'Mosspaw says, "I want to visit the Moonpool one day with Rosesong."',
            'Mosspaw stretches. "Carrying herbs all day is harder than warrior training, I think."',
            'Mosspaw murmurs, "Snowkit had a sniffle. I made her a small bundle of tansy."',
            'Mosspaw says, "If anyone is hurt, I can patch them up. Just ask."'
        ],
        Mossleaf: [
            'Mossleaf grinds yarrow with a smooth stone. "This is for poison and bad bellies."',
            'Mossleaf nods. "I have my full medicine name now. Rosesong and I split the herb patrols."',
            'Mossleaf studies you. "Your scent is a little tense. Rest, warrior."',
            'Mossleaf hangs catmint to dry. "The kits will need this in leafbare."',
            'Mossleaf says, "My first dream as Mossleaf was of Willowfur. She blessed my new name."',
            'Mossleaf murmurs, "Rosesong says I am ready for the Moonpool ceremonies."',
            'Mossleaf checks her supplies. "Cobweb, marigold, tansy — all stocked."',
            'Mossleaf dips her head. "If any cat is hurt, my paws are quick."'
        ]
    };
    const fullCat = cast.find((cat) => cat.name === name) || extraCats[name];
    const gender = fullCat?.gender ? ` (${fullCat.gender})` : '';
    const lines = denLines[name] || [`${name} twitches their whiskers in greeting.`];
    setMessage(`${name}${gender}`, rotatingText(`den-${name}`, lines));
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
            if (!game.ghostMode && game.mate === 'Princess' && !game.kittypetMateRevealed) {
                accusePanel.insertAdjacentHTML('beforeend', '<button id="tellClanBtn" type="button">Tell the clan about Princess</button>');
                document.getElementById('tellClanBtn').addEventListener('click', tellClanAboutPrincess);
            }
            renderDeputyActions();
        } else {
            renderInvestigationActions();
        }
    } else if (area === 'hunting') {
        if (game.ghostMode) {
            setMessage('Hunting Grounds', 'Your starry paws drift past the prey. Hunting is for the living.');
            accusePanel.innerHTML = '';
        } else {
            setMessage('Hunting Grounds', 'Wait for a mouse, then press Down or S when it appears.');
            accusePanel.innerHTML = '<button id="waitMouseBtn" type="button">Wait for Mouse</button>';
            document.getElementById('waitMouseBtn').addEventListener('click', scheduleMouse);
        }
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
        if (!game.ghostMode) {
            ensureOpponents();
            const opts = [];
            if (game.opponents.Reedpaw.wins < 4) {
                opts.push('Reedpaw');
            } else if (game.opponents.Fernpaw.wins < 1) {
                opts.push('Reedpaw', 'Fernpaw');
            } else {
                opts.push(firstMurderer === 'Pinefoot' ? 'Ravenstripe' : 'Pinefoot');
            }
            accusePanel.innerHTML = opts.map((name) => `<button class="fightOpponentBtn" data-opponent="${name}" type="button">Battle ${name}</button>`).join('');
            accusePanel.querySelectorAll('.fightOpponentBtn').forEach((btn) => {
                btn.addEventListener('click', () => startBattle(btn.dataset.opponent));
            });
        }
    }
}

function ensureOpponents() {
    if (!game.opponents) {
        game.opponents = {
            Reedpaw: { maxHp: 20, dmg: 5, heal: 3, wins: 0 },
            Fernpaw: { maxHp: 35, dmg: 9, heal: 5, wins: 0 },
            Pinefoot: { maxHp: 55, dmg: 14, heal: 1, wins: 0 },
            Ravenstripe: { maxHp: 55, dmg: 15, heal: 4, wins: 0 },
            Rogue: { maxHp: 60, dmg: 19, heal: 20, wins: 0 }
        };
    }
}

function currentTrainingOpponent() {
    ensureOpponents();
    if (game.opponents.Reedpaw.wins < 4) return 'Reedpaw';
    if (game.opponents.Fernpaw.wins < 1) return 'Fernpaw';
    return firstMurderer === 'Pinefoot' ? 'Ravenstripe' : 'Pinefoot';
}

function opponentIntro(name) {
    const lines = {
        Reedpaw: 'Reedpaw bows playfully. "Show me what you know, warrior."',
        Fernpaw: 'Fernpaw drops into a low crouch. "I have been waiting for you."',
        Pinefoot: 'Pinefoot stretches her shoulders. "I will not go easy. Earn it."',
        Ravenstripe: 'Ravenstripe grins, tail twitching. "Finally — a real fight."',
        Rogue: 'A scarred rogue snarls from the bracken. "This strip is mine now. Leave or bleed!"'
    };
    return lines[name] || `${name} steps up to face you.`;
}

function startBattle(opponentName) {
    if (game.ghostMode) {
        setMessage('Battle', 'Your starry claws pass through them. Ghosts cannot fight the living.');
        return;
    }
    ensureOpponents();
    const opp = game.opponents[opponentName];
    const stats = game.battleStats;
    if (!opp || !stats) return;
    game.battle = {
        opponent: opponentName,
        playerHp: stats.playerMaxHp,
        enemyHp: opp.maxHp,
        turn: 'player',
        ended: false
    };
    renderBattleUI();
    setMessage(opponentName, opponentIntro(opponentName));
}

function renderBattleUI() {
    const stats = game.battleStats;
    const b = game.battle;
    const opp = game.opponents[b.opponent];
    accusePanel.innerHTML = `
        <div class="battle">
            <div class="battle-row">
                <div class="battle-side">
                    <div class="battle-name">${warriorName()}</div>
                    <div class="battle-bar"><span class="battle-fill" style="width:${Math.max(0, b.playerHp / stats.playerMaxHp) * 100}%;"></span></div>
                    <div class="battle-hp">${Math.max(0, b.playerHp)}/${stats.playerMaxHp}</div>
                </div>
                <div class="battle-vs">VS</div>
                <div class="battle-side">
                    <div class="battle-name">${b.opponent}</div>
                    <div class="battle-bar enemy"><span class="battle-fill" style="width:${Math.max(0, b.enemyHp / opp.maxHp) * 100}%;"></span></div>
                    <div class="battle-hp">${Math.max(0, b.enemyHp)}/${opp.maxHp}</div>
                </div>
            </div>
            <div class="battle-actions">
                <button id="battleScratch" type="button" ${b.turn !== 'player' || b.ended ? 'disabled' : ''}>Scratch (${stats.playerDmg})</button>
                <button id="battleHeal" type="button" ${b.turn !== 'player' || b.ended ? 'disabled' : ''}>Heal (+${stats.playerHeal})</button>
            </div>
        </div>
    `;
    if (!b.ended) {
        document.getElementById('battleScratch').addEventListener('click', () => playerBattleAction('scratch'));
        document.getElementById('battleHeal').addEventListener('click', () => playerBattleAction('heal'));
    }
}

function playBattleAnimation(target, type) {
    const opponentName = game.battle?.opponent;
    const node = target === 'enemy'
        ? (opponentName ? npcLayer.querySelector(`[data-cat-name="${opponentName}"]`) : null)
        : player;
    if (!node) {
        return;
    }
    node.classList.add(type === 'scratch' ? 'fx-scratched' : 'fx-healed');
    setTimeout(() => {
        node.classList.remove('fx-scratched', 'fx-healed');
    }, 700);
}

function playerBattleAction(action) {
    const b = game.battle;
    const stats = game.battleStats;
    if (!b || b.ended || b.turn !== 'player') {
        return;
    }
    if (action === 'scratch') {
        b.enemyHp -= stats.playerDmg;
        playBattleAnimation('enemy', 'scratch');
        setMessage('Battle', `You scratch ${b.opponent} for ${stats.playerDmg} damage.`);
    } else {
        b.playerHp = Math.min(stats.playerMaxHp, b.playerHp + stats.playerHeal);
        playBattleAnimation('player', 'heal');
        setMessage('Battle', `You lick a wound and recover ${stats.playerHeal} health.`);
    }
    b.turn = 'enemy';
    renderBattleUI();
    if (b.enemyHp <= 0) {
        endBattle('win');
        return;
    }
    setTimeout(enemyBattleTurn, 700);
}

function enemyBattleTurn() {
    const b = game.battle;
    const stats = game.battleStats;
    if (!b || b.ended) {
        return;
    }
    const opp = game.opponents[b.opponent];
    const atFullHp = b.enemyHp >= opp.maxHp;
    const heal = !atFullHp && Math.random() < 0.45;
    if (heal) {
        b.enemyHp = Math.min(opp.maxHp, b.enemyHp + opp.heal);
        playBattleAnimation('enemy', 'heal');
        setMessage('Battle', `${b.opponent} licks their wounds and recovers ${opp.heal} health.`);
    } else {
        b.playerHp -= opp.dmg;
        playBattleAnimation('player', 'scratch');
        setMessage('Battle', `${b.opponent} rakes their claws across you for ${opp.dmg} damage.`);
    }
    b.turn = 'player';
    renderBattleUI();
    if (b.playerHp <= 0) {
        endBattle('lose');
    }
}

function rand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

const CLAN_FRIENDLY_LADDER = ['extremely-angry', 'aggressive', 'neutral', 'peaceful', 'good-friends'];

const SUNCLAN_GIFT_CATS = ['Nettleclaw', 'Dawnpelt', 'Russetfang'];

function sunclanFriendlyEnough() {
    return game?.sunclanState === 'peaceful' || game?.sunclanState === 'good-friends';
}

function sunclanGiftHolder() {
    if (!sunclanFriendlyEnough()) return null;
    return SUNCLAN_GIFT_CATS[(game.day || 1) % SUNCLAN_GIFT_CATS.length];
}

function sunclanGiftPending() {
    return sunclanGiftHolder() && game.sunclanGiftDay !== game.day;
}

function markSunclanPreyHolder() {
    if (!sunclanGiftPending()) return;
    const holder = sunclanGiftHolder();
    const node = npcLayer.querySelector(`[data-cat-name="${holder}"]`);
    if (!node || node.querySelector('.mouth-prey')) return;
    const mouse = document.createElement('span');
    mouse.className = 'mouth-prey';
    mouse.style.cssText = 'position:absolute;width:14px;height:9px;background:#6b4326;border:1px solid #2c1a0e;border-radius:50%;top:32px;right:-4px;z-index:5;box-shadow:-3px 1px 0 #2c1a0e inset;';
    node.appendChild(mouse);
}

function clanRelationLabel(state) {
    return state.replace('-', ' ');
}

function bumpClanFriendly(clan) {
    const stateKey = `${clan}State`;
    const progKey = `${clan}Progress`;
    game[progKey] = (game[progKey] || 0) + 1;
    if (game[progKey] >= 3) {
        game[progKey] = 0;
        const i = CLAN_FRIENDLY_LADDER.indexOf(game[stateKey]);
        if (i >= 0 && i < CLAN_FRIENDLY_LADDER.length - 1) {
            game[stateKey] = CLAN_FRIENDLY_LADDER[i + 1];
            addNote(`${clan === 'sunclan' ? 'Sunclan' : 'Dawnclan'} relations are now ${clanRelationLabel(game[stateKey])}.`);
        }
    }
}

function worsenClan(clan) {
    const stateKey = `${clan}State`;
    const map = {
        'aggressive': 'extremely-angry',
        'neutral': 'aggressive',
        'peaceful': 'neutral',
        'good-friends': 'peaceful'
    };
    if (map[game[stateKey]]) {
        game[stateKey] = map[game[stateKey]];
        game[`${clan}Progress`] = 0;
        addNote(`${clan === 'sunclan' ? 'Sunclan' : 'Dawnclan'} relations worsened to ${clanRelationLabel(game[stateKey])}.`);
    }
}

const CLAN_CAT_LINES = {
    Nettleclaw: {
        'extremely-angry': `Nettleclaw lunges a step forward, fangs bared. "One more pawstep and I gut you, Moonclan filth."`,
        'aggressive': `Nettleclaw flattens his ears, growling deep. "You stink of Moonclan. Turn around before I shred that pelt."`,
        'neutral': `Nettleclaw studies you, tail twitching. "Speak quickly. Sunclan does not have time for strays."`,
        'peaceful': `Nettleclaw nods curtly. "Moonclan walks lighter than I remember. Good."`,
        'good-friends': `Nettleclaw bumps his shoulder against yours. "If trouble ever finds you, send word. I owe Moonclan a debt now."`
    },
    Dawnpelt: {
        'extremely-angry': `Dawnpelt spits, fur spiked along her spine. "I will scar your face if you breathe near me again."`,
        'aggressive': `Dawnpelt curls her lip. "Crawl back to your camp before I rip a notch in your ear."`,
        'neutral': `Dawnpelt watches you over her shoulder. "Say what you came to say. Then go."`,
        'peaceful': `Dawnpelt's whiskers soften. "It is good when borders mean lines, not blood."`,
        'good-friends': `Dawnpelt purrs softly. "Come share tongues. Sunclan and Moonclan need not always squabble."`
    },
    Russetfang: {
        'extremely-angry': `Russetfang's claws scrape the stone. "Hawkstar will hear of this trespass. Pray it is me you face and not him."`,
        'aggressive': `Russetfang growls, voice cold. "You are not welcome here, apprentice. Leave on your own paws or be carried."`,
        'neutral': `Russetfang straightens, deputy poise sharp. "State your purpose. I have a patrol to run."`,
        'peaceful': `Russetfang inclines his head. "Tell your leader Russetfang sends respect."`,
        'good-friends': `Russetfang's eyes warm. "If Sunclan ever needs Moonclan paws, I trust we can ask. The same is true the other way."`
    }
};

function clanSayLine(name, state) {
    const perCat = CLAN_CAT_LINES[name];
    if (perCat && perCat[state]) return perCat[state];
    const fallback = {
        'extremely-angry': `${name} bristles, claws unsheathed. "Get away from us. NOW."`,
        'aggressive': `${name} snarls. "Leave our land before I make you bleed for it."`,
        'neutral': `${name} eyes you carefully. "We are not enemies today. Speak."`,
        'peaceful': `${name} dips their head. "Always good to see a Moonclan paw at our border."`,
        'good-friends': `${name} purrs. "Friend! Sit a moment, share words."`
    };
    return fallback[state] || `${name} watches you silently.`;
}

function offerPreyToOtherClan(name, clan) {
    const previousPanel = accusePanel.innerHTML;
    accusePanel.innerHTML = '<button id="otherPreyYes" type="button">Yes, give prey</button><button id="otherPreyNo" type="button">No, keep it</button>';
    document.getElementById('otherPreyYes').addEventListener('click', () => {
        game.preyInMouth = false;
        bumpClanFriendly(clan);
        const stateKey = `${clan}State`;
        const stutterLine = game[stateKey] === 'aggressive'
            ? `${name} stutters as they accept it. "T-t-thank you, Moonclan." Sunclan relations may soften.`
            : `${name} accepts the prey. "Moonclan is generous today."`;
        addNote(`You gave a piece of prey to ${name}.`);
        setMessage(name, stutterLine);
        accusePanel.innerHTML = previousPanel;
        updateHud();
    });
    document.getElementById('otherPreyNo').addEventListener('click', () => {
        accusePanel.innerHTML = previousPanel;
        setMessage(name, `You decide to keep the prey for your own clan.`);
    });
    setMessage(name, `Give your prey to ${name} of ${clan === 'sunclan' ? 'Sunclan' : 'Dawnclan'}?`);
}

function fightOtherClanCat(name, clan) {
    worsenClan(clan);
    const stateKey = `${clan}State`;
    setMessage(name, `${name} hisses and claws back. ${clan === 'sunclan' ? 'Sunclan' : 'Dawnclan'} relations are now ${clanRelationLabel(game[stateKey])}.`);
}

function clickOtherClanCat(name, clan) {
    if (game.ghostMode) {
        setMessage(name, `${name} senses a starry presence and shivers. They cannot hear you.`);
        return;
    }
    if (clan === 'sunclan' && sunclanGiftPending() && sunclanGiftHolder() === name && !game.preyInMouth) {
        game.preyInMouth = true;
        game.prey += 1;
        game.sunclanGiftDay = game.day;
        const node = npcLayer.querySelector(`[data-cat-name="${name}"] .mouth-prey`);
        if (node) node.remove();
        addNote(`${name} of Sunclan shared a piece of prey with you.`);
        setMessage(name, `${name} drops a fresh-killed mouse at your paws. "Sunclan eats well today. Take this back to Moonclan."`);
        updateHud();
        return;
    }
    if (game.preyInMouth) {
        offerPreyToOtherClan(name, clan);
        return;
    }
    const state = game[`${clan}State`];
    setMessage(`${name} (${clan === 'sunclan' ? 'Sunclan' : 'Dawnclan'} — ${clanRelationLabel(state)})`, clanSayLine(name, state));
    accusePanel.innerHTML = `<button id="fightClanCatBtn" type="button">Fight ${name}</button><button id="leaveClanCatBtn" type="button">Walk away</button>`;
    document.getElementById('fightClanCatBtn').addEventListener('click', () => {
        accusePanel.innerHTML = '';
        fightOtherClanCat(name, clan);
    });
    document.getElementById('leaveClanCatBtn').addEventListener('click', () => {
        accusePanel.innerHTML = '';
    });
}

function decayPreyPile() {
    if (game?.preyPile == null) return;
    game.preyPile = Math.max(0, game.preyPile - 3);
}

function rollPatrolPrey(catCount) {
    if (Math.random() < 0.25) return 0;
    const ranges = { 1: [1, 3], 2: [2, 4], 3: [3, 5] };
    const range = ranges[catCount] || [0, 0];
    return rand(range[0], range[1]);
}

function endBattle(result) {
    const stats = game.battleStats;
    const b = game.battle;
    const opp = game.opponents[b.opponent];
    b.ended = true;
    if (result === 'win') {
        opp.wins += 1;
        if (b.opponent === 'Rogue') {
            game.rogueDefeated = true;
            addNote('You drove the rogue off the border for good.');
            accusePanel.innerHTML = '';
            setMessage('Border', 'The rogue limps away into the bracken and vanishes past the river.');
            renderCats();
            return;
        }
        stats.playerMaxHp += rand(3, 5);
        stats.playerDmg += rand(1, 2);
        stats.playerHeal += 1;
        opp.maxHp += rand(1, 2);
        opp.dmg += rand(1, 2);
        const next = currentTrainingOpponent();
        const advanced = next !== b.opponent;
        addNote(`You won a sparring round against ${b.opponent}. (Now ${stats.playerMaxHp} HP, ${stats.playerDmg} damage.)`);
        const label = advanced ? `Battle ${next}` : `Battle ${b.opponent} Again`;
        accusePanel.innerHTML = `<button id="rematchBtn" type="button">${label}</button><button id="leaveBattleBtn" type="button">Leave</button>`;
        document.getElementById('rematchBtn').addEventListener('click', () => startBattle(next));
        document.getElementById('leaveBattleBtn').addEventListener('click', () => visitArea('fighting'));
        setMessage(b.opponent, advanced
            ? `${b.opponent} flops down. "Mercy! Good fight. ${next} wants a turn now."`
            : `${b.opponent} flops down. "Mercy! Good fight, warrior."`);
        return;
    }
    addNote(`You were knocked out fighting ${b.opponent}. Rosesong patched you up.`);
    accusePanel.innerHTML = '';
    setMessage('Battle', `${b.opponent}'s last hit puts you out cold...`);
    setTimeout(() => {
        visitArea('camp');
        setTimeout(() => {
            enterDen('Medicine Den');
            setMessage('Rosesong', 'You woke up fast. You got knocked out during the battle. Rest a moment and try again whenever you want.');
        }, 400);
    }, 900);
}

function tttHostName() {
    return game.firstSolved && firstMurderer === 'Mistclaw' ? 'Cloudspark' : 'Mistclaw';
}

function openTicTacToe() {
    if (game.ghostMode) {
        setMessage('Border Stones', 'Your paws cannot move the stones any longer. The living play this game.');
        return;
    }
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
    setMessage(tttHostName(), `Press your paw onto the stones as X. I will play O.`);
}

function finishTicTacToe(cells) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const winner = wins.map((line) => line.every((i) => cells[i] === 'X') ? 'X' : line.every((i) => cells[i] === 'O') ? 'O' : '').find(Boolean);
    if (!winner && cells.some((cell) => !cell)) {
        return false;
    }
    if (winner !== 'X') {
        accusePanel.innerHTML = '';
        setMessage(tttHostName(), 'Better luck next time. Step up to the stones again whenever you want.');
        return true;
    }
    game.ticTacToeDone = true;
    accusePanel.innerHTML = '';
    if (!game.roseWon) {
        game.roseWon = true;
        game.rose = true;
        addNote('Mistclaw gave you a special rose for finishing border tic-tac-toe.');
        setMessage(tttHostName(), 'Good job. You win. Take this special rose.');
    } else {
        setMessage(tttHostName(), 'Good job. You win again, though I have no more roses to give.');
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
    const huntCat = huntScene.querySelector('.hunt-cat');
    huntCat.innerHTML = catMarkup();
    huntCat.style.setProperty('--fur', playerFur());
    huntCat.style.setProperty('--mark', playerMark());
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

function eatMouseInMouth() {
    if (!game.preyInMouth || game.ghostMode) {
        return;
    }
    game.preyInMouth = false;
    if (game.battleStats) {
        game.battleStats.playerMaxHp += 1;
    }
    addNote(`You ate the mouse. Max battle health is now ${game.battleStats?.playerMaxHp ?? '?'}.`);
    setMessage(playerName(), `You eat the mouse. Strength settles into your bones — max health up by 1.`);
    updateHud();
}

function downActionPressed() {
    if (game.preyInMouth && (game.currentArea !== 'hunting' || !game.mouseVisible)) {
        eatMouseInMouth();
        return;
    }
    catchMouse();
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

function offerPreyToCat(cat) {
    if (!game.preyInMouth) {
        return;
    }
    const previousPanel = accusePanel.innerHTML;
    accusePanel.innerHTML = '<button id="preyYesBtn" type="button">Yes, give prey</button><button id="preyNoBtn" type="button">No, keep it</button>';
    document.getElementById('preyYesBtn').addEventListener('click', () => {
        accusePanel.innerHTML = previousPanel;
        if (cat.name === 'Oakwhisker') {
            setMessage('Oakwhisker', 'Oakwhisker shakes his greying muzzle. "Keep it, young one. My belly is full of stories these days. Take that catch to the kits or the apprentices — they need it more than my old bones do."');
            return;
        }
        givePrey(cat.name);
    });
    document.getElementById('preyNoBtn').addEventListener('click', () => {
        accusePanel.innerHTML = previousPanel;
        setMessage(`${cat.name} (${cat.gender})`, `${cat.name} eyes the prey in your mouth, but you keep it for now.`);
    });
    setMessage(`${cat.name} (${cat.gender})`, `Do you want to give the prey to ${cat.name}?`);
}

function givePrey(name = 'Sorreltail') {
    if (!game.preyInMouth) {
        setMessage(name, 'You need to catch prey and hold it in your mouth first.');
        return;
    }
    game.preyInMouth = false;
    game.trust[name] = Math.min(trustMax(name), trustFor(name) + 1);
    addNote(`${name} trust increased to ${trustFor(name)}/${trustMax(name)}.`);
    const cat = cast.find((entry) => entry.name === name);
    const mateLine = game.mate === name
        ? ''
        : cat && canMateWith(cat) ? ' A special rose can make you mates at 3/3.' : ' This cat can be your friend, but not your mate.';
    setMessage(name, `${name} accepts the prey. ${trustLabel(name)}${mateLine}`);
    updateHud();
}

function proposeMate(name) {
    const fromCast = cast.find((entry) => entry.name === name);
    const fromExtras = extraCats[name];
    const cat = fromCast || (fromExtras ? { name, ...fromExtras } : null);
    if (!game.rose || !game.roseInMouth || trustFor(name) < 3 || game.mate || !cat || !canMateWith(cat)) {
        return;
    }
    accusePanel.innerHTML = '<button id="roseYesBtn" type="button">Yes, give the rose</button><button id="roseNoBtn" type="button">No</button>';
    document.getElementById('roseYesBtn').addEventListener('click', () => {
        game.rose = false;
        game.roseInMouth = false;
        game.mate = name;
        game.mateDay = game.day;
        updateRoseVisual();
        addNote(`${name} became your mate after you gave the special rose.`);
        setMessage(name, `${name} accepts the special rose. "Yes. I will be your mate."`);
        accusePanel.innerHTML = '';
        updateHud();
    });
    document.getElementById('roseNoBtn').addEventListener('click', () => {
        accusePanel.innerHTML = '';
    });
    setMessage(`${name} (${cat.gender})`, `Give the rose to ${name} and ask them to be your mate?`);
}

function tellClanAboutPrincess() {
    if (game.kittypetMateRevealed) {
        return;
    }
    game.kittypetMateRevealed = true;
    addNote('You told Moonclan that Princess, a kittypet from beyond the fence, is your mate.');
    setMessage('Moonclan', 'Word spreads through the camp. Some cats blink in surprise, others purr at the news. Talk to them and see how each one feels.');
    visitArea('camp');
}

function askForCatMate(cat) {
    if (game.mate) {
        return;
    }
    accusePanel.innerHTML = '<button id="acceptMateBtn" type="button">Yes</button><button id="declineMateBtn" type="button">Not yet</button>';
    document.getElementById('acceptMateBtn').addEventListener('click', () => {
        game.mate = cat.name;
        game.mateDay = game.day;
        addNote(`${cat.name} asked you to be their mate, and you said yes.`);
        setMessage(cat.name, `${cat.name} touches their nose to yours. "Then it is settled. We are mates."`);
        accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
        document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
        updateHud();
    });
    document.getElementById('declineMateBtn').addEventListener('click', () => {
        addNote(`${cat.name} asked to be your mate. You asked them to wait.`);
        setMessage(cat.name, `${cat.name} dips their head. "Take your time. I am not going anywhere."`);
        accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
        document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    });
    setMessage(`${cat.name} (${cat.gender})`, `${cat.name} steps close, voice soft. "I have been thinking. Will you be my mate?"`);
}

function canMateWith(cat) {
    if (!cat || cat.rank === 'Leader' || cat.rank === 'Deputy') {
        return false;
    }
    if (cat.rank && (cat.rank.startsWith('Sunclan') || cat.rank.startsWith('Dawnclan'))) {
        return false;
    }
    if (['Pinefoot', 'Whiskerstar', 'Ashfall', 'Ashstar'].includes(cat.name)) {
        return false;
    }
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
    decayPreyPile();
    updatePreyPileLabel();
    if (!game.ghostMode && game.day >= 45) {
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
        setMessage('Ashstar', 'Ashstar returns from speaking with Hawkstar. The border agreement is tense but peaceful.');
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
    if (game.mate && game.mateDay != null && game.day >= game.mateDay + 10 && !game.kitsAsked && !game.kitsHad) {
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
                setMessage('Patrol', 'No more than 3 cats can go on a patrol.');
            }
        });
        picker.appendChild(button);
    });
    document.getElementById('sendPatrolBtn').addEventListener('click', sendPatrol);
    setMessage('Deputy Duties', 'Choose 1 to 3 cats for patrol. A solo patrol can end badly.');
}

function patrolOptions() {
    const base = cast
        .filter((cat) => ['Warrior', 'Leader'].includes(cat.rank) && !['Whiskerstar', 'Ashstar', firstMurderer].includes(cat.name))
        .map((cat) => cat.name);
    const grownNursery = game.nurseryKitAges
        .filter((kit) => growthStage(kit.bornDay) !== 'kit')
        .map((kit) => {
            if (kit.base === 'Moss') {
                return growthStage(kit.bornDay) === 'warrior' ? 'Mossleaf' : 'Mosspaw';
            }
            return `${kit.base}${growthStage(kit.bornDay) === 'warrior' ? 'heart' : 'paw'}`;
        });
    const grownPlayerKits = game.playerKits
        .filter((kit) => growthStage(kit.bornDay) !== 'kit')
        .map((kit) => `${kit.base}${growthStage(kit.bornDay) === 'warrior' ? 'heart' : 'paw'}`);
    const abandoned = game.abandonedKit && game.abandonedKit.stage !== 'kit'
        ? [`River${game.abandonedKit.stage === 'warrior' ? 'heart' : 'paw'}`]
        : [];
    return [...new Set([...base, ...grownNursery, ...grownPlayerKits, ...abandoned])];
}

function sendPatrol() {
    if (game.patrolSelected.length < 1 || game.patrolSelected.length > 3) {
        setMessage('Deputy Duties', 'Choose 1 to 3 cats before sending the patrol.');
        return;
    }
    game.patrolPending = { cats: [...game.patrolSelected], reportDay: game.day + 1 };
    addNote(`${game.patrolSelected.join(', ')} left on patrol.`);
    accusePanel.innerHTML = '<button id="sleepBtn" type="button">Sleep in Warrior Den</button>';
    document.getElementById('sleepBtn').addEventListener('click', sleepInWarriorDen);
    const warning = game.patrolSelected.length === 1
        ? ' A lone patrol is a risky thing.'
        : '';
    setMessage('Patrol', `${game.patrolSelected.join(', ')} head out. They will return tomorrow with news.${warning}`);
    renderCats();
}

function mosskitMedicineCat() {
    const moss = (game.nurseryKitAges || []).find((kit) => kit.base === 'Moss');
    return moss && growthStage(moss.bornDay) !== 'kit';
}

function mosskitName() {
    const moss = (game.nurseryKitAges || []).find((kit) => kit.base === 'Moss');
    if (!moss) return null;
    const stage = growthStage(moss.bornDay);
    if (stage === 'warrior') return 'Mossleaf';
    if (stage === 'apprentice') return 'Mosspaw';
    return 'Mosskit';
}

function findClanCatData(name) {
    const c = cast.find((cat) => cat.name === name);
    if (c) return c;
    const allKits = [...(game.nurseryKitAges || []), ...(game.playerKits || [])];
    for (const kit of allKits) {
        const stage = growthStage(kit.bornDay);
        const suffix = stage === 'warrior' ? 'heart' : stage === 'apprentice' ? 'paw' : 'kit';
        if (`${kit.base}${suffix}` === name) {
            return {
                name,
                rank: stage === 'warrior' ? 'Warrior' : stage === 'apprentice' ? 'Apprentice' : 'Kit',
                fur: kit.fur,
                mark: kit.mark,
                gender: kit.gender
            };
        }
    }
    if (game.abandonedKit) {
        const stage = game.abandonedKit.stage;
        const suffix = stage === 'warrior' ? 'heart' : stage === 'apprentice' ? 'paw' : 'kit';
        if (`River${suffix}` === name) {
            return {
                name,
                rank: stage === 'warrior' ? 'Warrior' : 'Apprentice',
                fur: '#8f8068',
                mark: '#e1d3ae',
                gender: game.abandonedKit.gender
            };
        }
    }
    return null;
}

function handlePatrolDeath(name) {
    const info = findClanCatData(name) || { name, rank: 'Warrior', fur: '#9b7350', mark: '#5d3f2c' };
    game.patrolDeaths = game.patrolDeaths || [];
    game.patrolDeaths.push({
        name: info.name || name,
        rank: info.rank || 'Warrior',
        fur: info.fur || '#9b7350',
        mark: info.mark || '#5d3f2c',
        gender: info.gender,
        homeScene: 'camp'
    });
    if (name === game.mate) {
        game.matePatrolDeath = { name, day: game.day };
    }
    addNote(`${name} did not return from the lone patrol. The forest swallowed them.`);
    setMessage('Patrol Report', `${name} did not return from the patrol. The clan grieves. Their body was never found.`);
    renderAll();
    renderDeputyActions();
}

function mateDialogue(name) {
    const map = {
        Mistclaw: [
            'Mistclaw bumps your shoulder. "Best decision I ever made — sharing a nest with you."',
            'Mistclaw purrs. "I saved a thrush for you on the prey-pile."',
            'Mistclaw says, "The borders feel safer when we patrol together."',
            'Mistclaw leans against you. "You are my favorite warrior in any clan."',
            'Mistclaw murmurs, "Tell me about your dream last night."',
            'Mistclaw flicks his tail. "Walk to the river with me at sunhigh?"',
            'Mistclaw says softly, "I am proud of you. Every day."'
        ],
        Brindleleaf: [
            'Brindleleaf grins. "I knew you would say yes one day. Glad I waited."',
            'Brindleleaf says, "Hunt with me at moonrise. The fern path is mine."',
            'Brindleleaf nudges your nose. "I dreamed about our future kits."',
            'Brindleleaf says, "Whatever the clan throws at us, we handle it together."',
            'Brindleleaf curls his tail around yours. "I am yours."',
            'Brindleleaf says, "Bring back a vole for me and I will brag about you all day."',
            'Brindleleaf murmurs, "Stay close tonight. The moon feels heavy."'
        ],
        Cloudspark: [
            'Cloudspark nuzzles you. "Some warriors are clouds. You are the sky."',
            'Cloudspark whispers, "I sleep better with you near."',
            'Cloudspark says, "I would chase any fox from this camp for you."',
            'Cloudspark purrs. "Tell me a story while I groom your fur."',
            'Cloudspark leans her head on yours. "We are a good pair."',
            'Cloudspark says, "Promise me you will not take risks alone."',
            'Cloudspark says quietly, "Every dawn I wake glad you are my mate."'
        ],
        Sorreltail: [
            'Sorreltail laughs. "Look at us. Mates. The clan still teases me about it."',
            'Sorreltail brushes her tail under your chin. "Caught a thrush. Want to share?"',
            'Sorreltail says, "If you ever need a quiet ear, I am here."',
            'Sorreltail purrs. "I picked the best mate. Tell anyone who asks."',
            'Sorreltail says, "Walk the river with me. I want to see the dragonflies."',
            'Sorreltail murmurs, "The kits will love you when they come."',
            'Sorreltail nuzzles you. "Stay a heartbeat longer."'
        ],
        Pinefoot: [
            'Pinefoot rests her head against yours. "I will always have your back, warrior."',
            'Pinefoot says, "We patrol the barrier well together."',
            'Pinefoot murmurs, "I never thought I would say this — but you are my world."',
            'Pinefoot purrs. "If trouble comes, I am the first claw out beside you."',
            'Pinefoot says, "Bring me a story from the borders tonight."',
            'Pinefoot says quietly, "I am proud of the cat you are."',
            'Pinefoot whispers, "Every season with you is greenleaf."'
        ],
        Birchstep: [
            'Birchstep brushes his tail along yours. "Best moon of my life when you said yes."',
            'Birchstep says, "I sleep easier with you in the warrior den."',
            'Birchstep murmurs, "Patrol the river path with me at dusk?"',
            'Birchstep purrs. "I caught a vole — your favorite, I think."',
            'Birchstep nudges your shoulder. "I am proud of you, warrior."',
            'Birchstep says, "Tell me what you want for the future. I want all of it with you."',
            'Birchstep says softly, "Stay close. The wind is cold tonight."'
        ],
        Hollyfoot: [
            'Hollyfoot leans into your shoulder. "We hold this clan together, you and I."',
            'Hollyfoot whispers, "You make the warrior code feel less heavy."',
            'Hollyfoot says, "I trained at dawn. I want to spar with you next."',
            'Hollyfoot purrs. "Some bonds keep a clan steady. Ours does."',
            'Hollyfoot says, "If you ever doubt yourself, look at me. I do not."',
            'Hollyfoot says softly, "Promise we always patrol home before nightfall."',
            'Hollyfoot dips her head. "Glad to share a nest with you."'
        ],
        Princess: [
            'Princess purrs against your side. "I miss you when the twolegs lock me indoors at night."',
            'Princess whispers, "I told the twolegs about you, but they only laughed."',
            'Princess butts her head into your shoulder. "Stay a little longer."',
            'Princess says, "Tell me what the camp smells like today. I want to picture it."',
            'Princess says, "Did you bring a thrush? My twolegs do not give me real prey."',
            'Princess says, "I dreamed I was a warrior last night. It felt nice."',
            'Princess murmurs, "I will sit on the fence every dusk hoping to see you."'
        ]
    };
    return map[name] || [
        `${name} purrs. "The clan feels safer with you beside me."`,
        `${name} says, "Stay close tonight."`,
        `${name} bumps your shoulder. "I am glad we are mates."`,
        `${name} murmurs, "Tell me about your day."`,
        `${name} says, "Walk with me at sunhigh."`,
        `${name} dips their head. "I am proud of you."`,
        `${name} purrs. "Best decision I ever made."`
    ];
}

function postSolvePool(name) {
    if (name === 'Ashfall') {
        if (firstMurderer === 'Pinefoot') {
            return [
                'Ashfall lowers his head. "I still feel Pinefoot beside me sometimes. The grief is heavy."',
                'Ashfall stares at the empty nest. "I keep listening for her purr."',
                'Ashfall says quietly, "I will keep being deputy. The clan still needs me."',
                'Ashfall murmurs, "Some nights I dream of Pinefoot before the dark took her."',
                `Ashfall says, "${warriorName()}, you have been a kind shoulder. Thank you."`,
                'Ashfall watches the nursery. "Kits remind me of better days."',
                'Ashfall says, "The patrols come back tired. I am proud of them."',
                'Ashfall flicks his tail. "Tomorrow I will run the dawn patrol myself."'
            ];
        }
        return [
            'Ashfall dips his head. "I will be a steady deputy for as long as the clan needs me."',
            'Ashfall says, "Pinefoot says hello. She is sharpening claws by the barrier."',
            'Ashfall watches the apprentices. "They remind me of when I was a paw."',
            'Ashfall stretches. "A long patrol clears the head."',
            'Ashfall murmurs, "The clan moves on. That is good."',
            'Ashfall says, "Bring me word if you spot anything strange at the borders."',
            'Ashfall purrs softly. "Pinefoot brought back catmint this morning. Rosesong was thrilled."',
            'Ashfall flicks his ear. "Dawn patrols this moon — I will lead them."'
        ];
    }
    const pools = {
        Whiskerstar: (() => {
            const base = [
                'Whiskerstar paces near Highrock. "The forest grows quieter every season."',
                'Whiskerstar says, "Lead the patrols well. Ashfall is a good deputy."',
                'Whiskerstar studies the camp. "Every nest is full again. That gives me peace."',
                'Whiskerstar murmurs, "Starclan watches over us all."',
                `Whiskerstar dips her head. "You have grown into your warrior name, ${warriorName()}."`,
                'Whiskerstar says, "Rest when you can. The clan needs you sharp."',
                'Whiskerstar watches the kits play. "They are why we hold the borders."',
                'Whiskerstar adds, "Tomorrow may bring trials. Be ready, but not afraid."'
            ];
            if (game?.preyPile != null && game.preyPile < 10) {
                base.unshift('Whiskerstar glances toward the prey-pile. "It is too thin. The clan needs more prey — send out patrols."');
            }
            return base;
        })(),
        Mistclaw: [
            'Mistclaw murmurs, "I still wonder how it all unraveled. Willowfur deserved more."',
            'Mistclaw says, "The hunting paths have been kind this moon."',
            'Mistclaw flicks his ear. "Want to spar later? I am rusty."',
            'Mistclaw nods. "I patrol well with you. We make a good pair."',
            'Mistclaw stretches. "Sunhigh always brings the sleepy mice out."',
            'Mistclaw watches the borders. "Sunclan has been quiet. Suspiciously so."',
            'Mistclaw says, "I dreamed of the Moonpool last night. Strange thoughts."',
            'Mistclaw rests his tail on yours. "Glad you are here, friend."'
        ],
        Ravenstripe: [
            'Ravenstripe stretches in a sunbeam. "Quiet days are a gift."',
            'Ravenstripe huffs. "Reedpaw asked me to teach him a battle move. I might."',
            'Ravenstripe says, "I will prowl the eastern edge tonight."',
            'Ravenstripe watches the entrance. "I keep an eye on the camp during sunhigh."',
            'Ravenstripe murmurs, "I do not love crowds, but I love this clan."',
            'Ravenstripe says, "Hunt with me when you have time. The river path is best at dawn."',
            'Ravenstripe yawns. "Old bones, even on a warrior."',
            'Ravenstripe glances at you. "If you ever need a quiet ear, mine is open."'
        ],
        Brindleleaf: [
            'Brindleleaf says, "Some moons I dream about Willowfur. The clan remembers her."',
            'Brindleleaf nods to you. "The fern path is thick with prey this season."',
            'Brindleleaf stretches. "Want to share fresh-kill at the prey-pile?"',
            'Brindleleaf says, "Reedpaw will make a fine warrior soon."',
            'Brindleleaf watches the sky. "The clouds say rain is coming."',
            'Brindleleaf murmurs, "I patrol the elder den brambles every dawn now."',
            'Brindleleaf says, "Oakwhisker told me a story about your kithood. Curious."',
            'Brindleleaf grins. "If you ever need a hunting partner, I am here."'
        ],
        Cloudspark: [
            'Cloudspark stares toward the river. "The borders feel calmer this moon."',
            'Cloudspark says, "I caught a thrush bigger than my head this morning."',
            'Cloudspark dips her head. "The kits asked me to play moss-ball. I obliged."',
            'Cloudspark stretches. "Mistclaw and I trained at dawn. He is faster than he looks."',
            'Cloudspark watches the nursery. "Snowkit is so still when she sleeps."',
            'Cloudspark murmurs, "I would like to see the Moonpool one day."',
            'Cloudspark says, "If a fox comes near our border, I will be the first to shout."',
            'Cloudspark purrs. "Glad to share tongues with you."'
        ],
        Pinefoot: [
            'Pinefoot says, "The barrier is holding. The clan is safe."',
            'Pinefoot stretches. "Ashfall and I patrolled twice today. The borders are sharp."',
            'Pinefoot watches the apprentices. "Reedpaw needs work on his stance."',
            'Pinefoot says, "I taught a battle move at sunhigh. Fernpaw learned it cold."',
            'Pinefoot nods. "Birchstep brought new branches for the barrier."',
            'Pinefoot murmurs, "Dawn patrols are my favorite. Quiet woods, good thinking."',
            'Pinefoot says, "If trouble comes, I will be the first claw out."',
            'Pinefoot purrs. "Glad to call you a clanmate."'
        ],
        Sorreltail: [
            'Sorreltail glances at the prey-pile. "Willowfur loved a fresh thrush. I leave one out for her sometimes."',
            'Sorreltail says, "I caught two voles this morning. Want to share?"',
            'Sorreltail stretches. "The river path was quiet. No fox prints."',
            `Sorreltail dips her head. "Good day, ${warriorName()}."`,
            'Sorreltail watches Cloudspark. "She is patient with the kits."',
            'Sorreltail murmurs, "The medicine den smells like marigold today."',
            'Sorreltail says, "If you bring me prey, I will share a story."',
            'Sorreltail says, "Some moons feel longer than others. This one is gentle."'
        ],
        Birchstep: [
            'Birchstep stretches. "Long patrol earlier. The wind kept shifting."',
            'Birchstep flicks an ear. "Reedpaw and Fernpaw are quick studies. The clan is in good paws."',
            'Birchstep says, "I caught a fox scent near the old pine. Worth keeping eyes open."',
            'Birchstep watches you. "Glad you came to the den. Quiet here today."',
            'Birchstep murmurs, "Hollyfoot and I split dawn patrols this moon."',
            'Birchstep says, "I will bring fresh moss for the nests at sunset."',
            'Birchstep yawns. "Even warriors deserve a nap now and then."',
            'Birchstep dips his head. "Honor the warrior code."'
        ],
        Hollyfoot: [
            'Hollyfoot grooms her dark pelt. "A clean coat is a quiet hunter."',
            'Hollyfoot nods. "I prefer fighting at dusk. The shadows do half the work."',
            'Hollyfoot watches the entrance with one half-open eye.',
            'Hollyfoot says, "Birchstep is steady. The borders feel safer with him."',
            'Hollyfoot murmurs, "I dreamed of starlight on the river. Strange dream."',
            'Hollyfoot says, "If trouble comes from Sunclan, I will know first."',
            'Hollyfoot stretches. "I almost caught a hare today. Almost."',
            'Hollyfoot purrs softly. "Sit with me a while if you like."'
        ]
    };
    return pools[name] || [`${name} flicks their tail in greeting.`];
}

function pityLineFor(name) {
    if (!game.matePatrolDeath) return null;
    const lines = {
        Whiskerstar: `Whiskerstar lays a paw on yours. "I am so sorry about ${game.matePatrolDeath.name}. The forest takes good cats too soon."`,
        Ashfall: `Ashfall lowers his voice. "I cannot imagine losing Pinefoot the way you lost ${game.matePatrolDeath.name}. Stay close to those who remain."`,
        Ashstar: `Ashstar dips her head. "The clan grieves with you, ${warriorName()}. ${game.matePatrolDeath.name}'s name will be honored at every Gathering."`,
        Mistclaw: `Mistclaw bumps your shoulder. "I will help patrol the border this moon. Do not push yourself."`,
        Brindleleaf: `Brindleleaf says quietly, "If you need company, I am here."`,
        Cloudspark: `Cloudspark touches her nose to yours. "${game.matePatrolDeath.name} was kind. I miss them too."`,
        Sorreltail: `Sorreltail nudges a thrush toward you. "Eat. ${game.matePatrolDeath.name} would want that."`,
        Pinefoot: `Pinefoot says softly, "Tell me what ${game.matePatrolDeath.name} liked best. I want to remember."`,
        Ravenstripe: `Ravenstripe huffs, eyes lowered. "Loss is a quiet thing. Take time."`
    };
    return lines[name];
}

function resolvePatrol() {
    const cats = game.patrolPending.cats;
    game.patrolPending = null;
    const hasMedic = cats.includes('Mosspaw') || cats.includes('Mossleaf');
    const deathCap = (game.patrolDeaths || []).length >= 4;
    if (cats.length === 1 && !deathCap) {
        let chance = isRaining() ? 0.40 : 0.23;
        if (hasMedic) {
            chance = 0.10;
        }
        if (Math.random() < chance) {
            handlePatrolDeath(cats[0]);
            return;
        }
    }
    if (hasMedic) {
        const herbs = ['marigold leaves', 'fresh catmint', 'yarrow stalks', 'cobweb bundles', 'tansy sprigs'];
        const haul = herbs[Math.floor(Math.random() * herbs.length)];
        addNote(`${cats.join(', ')} returned with ${haul} from the woods.`);
        setMessage('Patrol Report', `${cats.join(', ')} brought back ${haul}. Rosesong and Mossleaf will sort them in the medicine den.`);
        renderCats();
        renderDeputyActions();
        return;
    }
    const outcomes = ['sunclan-scent', 'fresh-prey', 'fox-track', 'quiet-border', 'abandoned-kit'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    if (!game.abandonedKitFound && outcome === 'abandoned-kit') {
        game.abandonedKitFound = true;
        game.abandonedKit = { stage: 'kit', foundDay: game.day, gender: Math.random() < 0.5 ? 'Tom' : 'She-cat' };
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
    const preyCaught = rollPatrolPrey(cats.length);
    let preyText = '';
    if (preyCaught > 0) {
        const before = game.preyPile;
        game.preyPile = Math.min(PREY_PILE_MAX, game.preyPile + preyCaught);
        const added = game.preyPile - before;
        preyText = added > 0
            ? ` They added ${added} prey to the pile (${game.preyPile}/${PREY_PILE_MAX}).`
            : ' The prey-pile is overflowing, so the catch went to share around.';
    } else {
        preyText = ' They came back empty-pawed.';
    }
    addNote(`${cats.join(', ')} returned from patrol with news: ${reports[outcome]}.${preyText}`);
    setMessage('Patrol Report', `${cats.join(', ')} report ${reports[outcome]}.${preyText}`);
    updatePreyPileLabel();
    renderCats();
    renderDeputyActions();
}

function updatePatrolAndApprenticeTimeline() {
    if (!game.abandonedKit) {
        return false;
    }
    if (game.day >= game.abandonedKit.foundDay + 12 && game.abandonedKit.stage !== 'warrior') {
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
    if (!game.firstGatheringDone) {
        setMessage('Ashstar', `Night falls beneath the great tree. Ashstar steps to the front of the branch and lifts her voice. "Cats of all clans, hear me. Whiskerstar walked into Starclan not long ago — killed by the same exiled rogue who took Willowfur from us. I lead Moonclan now, and I have received my nine lives at the Moonpool. Tonight I name our new deputy: ${warriorName()}, the warrior who hunted that murderer down when no other cat could. They will speak for Moonclan when I cannot. Honor them as you honor me."`);
    } else {
        setMessage('Gathering', 'Night falls. Moonclan, Sunclan, and Dawnclan meet beneath the great tree.');
    }
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
        setMessage('Ashstar', 'The Gathering ends. Ashstar announces they will leave to speak privately with Hawkstar and return tomorrow.');
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
    setMessage(game.mate, `Ten sunrises have passed since you became mates. Do you want to have kits with ${game.mate}?`);
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
                mark: furPatterns[index].mark,
                gender: Math.random() < 0.5 ? 'Tom' : 'She-cat'
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
            if (kit.base === 'Moss') {
                addNote('Mosskit became Mosspaw, Rosesong\'s medicine cat apprentice.');
                apprenticeNames.push('Mosskit is now Mosspaw, apprenticed to Rosesong as a medicine cat');
            } else {
                addNote(`${kit.base}kit became ${kit.base}paw.`);
                apprenticeNames.push(`${kit.base}kit is now ${kit.base}paw`);
            }
        }
        if (stage === 'warrior' && !kit.warriorAnnounced) {
            kit.warriorAnnounced = true;
            if (kit.base === 'Moss') {
                addNote('Mosspaw earned her full medicine-cat name: Mossleaf.');
                warriorNames.push('Mosspaw is now Mossleaf, a full medicine cat alongside Rosesong');
                return;
            }
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
        const jumping = game.currentArea === 'hunting' && playerState.y > 0;
        if (!jumping) {
            playerState.x = previousX + (playerState.x > previousX ? -42 : 42);
            setMessage(warriorName(), 'I can’t swim! The river pushes you back.');
        }
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
    if (game?.started
        && !game.ghostMode
        && game.currentArea === 'borders'
        && !game.rogueDefeated
        && (!game.battle || game.battle.ended)
        && playerState.x > 1340
        && playerState.x < 1480) {
        startBattle('Rogue');
    }
    requestAnimationFrame(movePlayer);
}

function touchesRiver(x) {
    const rivers = {
        borders: [1485, 1660],
        hunting: [2390, 2580],
        sunclan: [1760, 1940]
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

const inventoryBtnEl = document.getElementById('inventoryBtn');
if (inventoryBtnEl) {
    inventoryBtnEl.addEventListener('click', openInventory);
}

function openInventory() {
    if (!game?.started || !game.firstSolved) return;
    const items = [];
    if (game.rose) items.push('rose');
    if (game.preyInMouth) items.push('prey');
    if (items.length === 0) {
        setMessage('Inventory', 'Your inventory is empty.');
        return;
    }
    accusePanel.innerHTML = items.map((it) => {
        const label = it === 'rose'
            ? (game.roseInMouth ? 'Special Rose (in mouth)' : 'Special Rose')
            : 'Mouse (in mouth)';
        return `<button class="invItemBtn" data-item="${it}" type="button">${label}</button>`;
    }).join('') + '<button id="invCloseBtn" type="button">Close</button>';
    accusePanel.querySelectorAll('.invItemBtn').forEach((btn) => {
        btn.addEventListener('click', () => offerItemAction(btn.dataset.item));
    });
    document.getElementById('invCloseBtn').addEventListener('click', () => {
        accusePanel.innerHTML = '';
        setMessage('Inventory', 'You close your inventory.');
    });
    setMessage('Inventory', 'Click an item to use it.');
}

function offerItemAction(item) {
    if (item !== 'rose') {
        setMessage('Inventory', 'You keep the mouse for now.');
        return;
    }
    if (game.roseInMouth) {
        accusePanel.innerHTML = '<button id="stopHoldRoseBtn" type="button">Stop holding the rose</button>';
        document.getElementById('stopHoldRoseBtn').addEventListener('click', () => {
            game.roseInMouth = false;
            updateRoseVisual();
            updateHud();
            accusePanel.innerHTML = '';
            setMessage('Inventory', 'You set the rose back in your inventory. It is safe.');
        });
        setMessage('Special Rose', 'You are carrying the rose in your mouth. Stop holding it?');
        return;
    }
    accusePanel.innerHTML = '<button id="holdRoseYes" type="button">Yes, hold the rose</button><button id="holdRoseNo" type="button">No</button>';
    document.getElementById('holdRoseYes').addEventListener('click', () => {
        game.roseInMouth = true;
        updateRoseVisual();
        updateHud();
        accusePanel.innerHTML = '';
        setMessage('Special Rose', 'You take the rose gently in your mouth, stem between your teeth. Click a cat at 3/3 trust to ask them to be your mate.');
    });
    document.getElementById('holdRoseNo').addEventListener('click', () => {
        accusePanel.innerHTML = '';
    });
    setMessage('Special Rose', 'Hold the rose?');
}

function updateRoseVisual() {
    if (!player) return;
    player.classList.toggle('holding-rose', !!game?.roseInMouth);
}

player.addEventListener('click', () => {
    if (!game?.started) {
        return;
    }
    const stats = game.battleStats || {};
    const genderLabel = game.gender === 'tom' ? 'Tom'
        : game.gender === 'she-cat' ? 'She-cat'
        : game.gender === 'non-binary' ? 'Non-binary' : 'Cat';
    const name = playerName();
    const hpLine = stats.playerMaxHp ? `Health ${stats.playerMaxHp} HP, claw damage ${stats.playerDmg}, heal ${stats.playerHeal}.` : '';
    const mateLine = game.mate ? ` Mate: ${game.mate}.` : '';
    const dayLine = ` Day ${game.day}.`;
    setMessage(`${name} (${genderLabel}, you)`, `${hpLine}${mateLine}${dayLine}`.trim());
});
if (furTuft) {
    furTuft.addEventListener('click', inspectFurTuft);
}
if (preyPile) {
    preyPile.addEventListener('click', preyPileClick);
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
const undoTitleBtn = document.getElementById('undoTitleBtn');
if (undoTitleBtn) {
    undoTitleBtn.addEventListener('click', undoTitleChange);
}
const randomTitleBtn = document.getElementById('randomTitleBtn');
if (randomTitleBtn) {
    randomTitleBtn.addEventListener('click', randomizeTitleChoices);
}
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
            downActionPressed();
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
        downActionPressed();
    }
});

window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
});

notebookBtn.addEventListener('click', () => {
    if (game?.firstSolved) {
        return;
    }
    if (foundClues.size === 0) {
        notes.innerHTML = '<li>No clues yet.</li>';
    }
    buildSuspectBoard();
    notebook.showModal();
});

resetGame(true);
requestAnimationFrame(movePlayer);
