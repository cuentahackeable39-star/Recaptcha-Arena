// Game configuration constants
const GAME_CONFIG = {
    // Timing
    LEVEL_TIME: 30, // seconds
    
    // Scoring
    BASE_SCORE_PER_CLICK: 100,
    STREAK_BONUS: 10,
    INCORRECT_PENALTY: 50,
    SKIP_PENALTY: 200,
    TIME_BONUS_MULTIPLIER: 10,
    
    // Power-ups
    INITIAL_HINTS: 3,
    INITIAL_POWER_UPS: 1,
    
    // Grid sizes
    MIN_GRID_SIZE: 3,
    MAX_GRID_SIZE: 6,
    
    // Tile types and their corresponding emojis
    TILE_EMOJIS: {
        'traffic-light': '🚦',
        'traffic light': '🚦',
        'fire-hydrant': '🧯',
        'fire hydrant': '🧯',
        'stop-sign': '🛑',
        'stop sign': '🛑',
        'car': '🚗',
        'bus': '🚌',
        'bicycle': '🚲',
        'motorcycle': '🏍️',
        'train': '🚂',
        'red': '🔴',
        'blue': '🔵',
        'green': '🟢',
        'yellow': '🟡',
        'purple': '🟣',
        'orange': '🟠',
        'circle': '⭕',
        'triangle': '🔺',
        'square': '⬜',
        'star': '⭐',
        'hexagon': '🔯',
        'diamond': '💎',
        'clock': '🕐',
        'arrow': '➡️',
        'target': '🎯',
        'eye': '👁️',
        'brain': '🧠',
        'lightning': '⚡'
    },
    
    // New power-ups and abilities
    POWER_UPS: {
        BOMB: { name: '💣 Bomb', description: 'Clears 3x3 area', cooldown: 3 },
        TIME_FREEZE: { name: '⏰ Freeze', description: 'Stops timer for 5s', cooldown: 2 },
        X_RAY: { name: '👁️ X-Ray', description: 'Reveal all targets', cooldown: 1 },
        MULTI_CLICK: { name: '⚡ Multi', description: 'Clicks all visible targets', cooldown: 5 }
    },
    
    // Enhanced challenge types with better descriptions
    CHALLENGE_TYPES: [
        {
            type: 'traffic_mayhem',
            name: 'Traffic Mayhem',
            descriptionFunc: (level) => `Find all ${level > 5 ? 'hidden' : 'visible'} vehicles!`,
            targetTypes: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛵', '🚂', '✈️', '🚁', '🚤', '⛵', '🚢', '🚀']
        },
        {
            type: 'emoji_party',
            name: 'Emoji Party',
            descriptionFunc: (level) => `Spot the ${level > 3 ? 'special' : 'matching'} emojis!`,
            targetTypes: ['🌟', '✨', '💫', '🎯', '🎪', '🎭', '🎨', '🎸', '🎺', '🎮', '🎲', '🎰', '🎪', '🎨', '🔮', '⚡', '🔥', '💎', '🌈', '☀️', '🌙', '⭐', '💥', '🎊', '🎉']
        },
        {
            type: 'food_frenzy',
            name: 'Food Frenzy',
            descriptionFunc: (level) => `Find all ${level > 4 ? 'rare' : 'delicious'} foods!`,
            targetTypes: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🍳', '🥞', '🥐', '🥨', '🥯', '🧀', '🍖', '🍗', '🥩', '🥪', '🌮', '🌯', '🧆', '🥙', '🍱', '🍜', '🍲', '🍣', '🍤', '🍙', '🍚', '🍛', '🍝', '🥪', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍡', '🍦', '🍧', '🍨', '🥮', '🍯', '🥛', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍾', '🍹', '🍸', '🥃', '🍷']
        },
        {
            type: 'animal_adventure',
            name: 'Animal Adventure',
            descriptionFunc: (level) => `Track down the ${level > 6 ? 'elusive' : 'cute'} animals!`,
            targetTypes: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
        }
    ]
};