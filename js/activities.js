/**
 * Pinnacle activity definitions for Destiny 2.
 *
 * Each activity maps a milestone hash (from the Bungie API) to a human-readable
 * name and category. Milestone hashes change with seasons — update this file
 * when a new season drops.
 *
 * Sources for hashes:
 *   - https://data.destinysets.com/
 *   - Bungie API Manifest: DestinyMilestoneDefinition
 *
 * rotating: true  → absent from API response means not active this week (skip)
 * rotating: false → absent from API response means completed (mark done)
 */

const PINNACLE_ACTIVITIES = {
    // ── Raids ───────────────────────────────────────────────
    '2712317338': { name: 'Wöchentlicher Raid', category: 'Raids', detail: 'Featured Raid abschließen' },

    // ── Dungeons ────────────────────────────────────────────
    '2594202463': { name: 'Wöchentlicher Dungeon', category: 'Dungeons', detail: 'Featured Dungeon abschließen' },

    // ── Vanguard ────────────────────────────────────────────
    '2029743966': { name: 'Nightfall', category: 'Vanguard', detail: 'Nightfall: The Ordeal abschließen' },
    '3899487793': { name: 'Vanguard Ops', category: 'Vanguard', detail: 'Vanguard Ops Playlist abschließen' },

    // ── Crucible ────────────────────────────────────────────
    '3603098564': { name: 'Crucible Playlist', category: 'Crucible', detail: 'Crucible-Matches abschließen' },

    // ── Gambit ──────────────────────────────────────────────
    '3448738070': { name: 'Gambit', category: 'Gambit', detail: 'Gambit-Matches abschließen' },

    // ── Trials of Osiris (rotating — only active on weekends) ──
    '3787826860': { name: 'Trials of Osiris', category: 'Trials', detail: 'Prüfungen von Osiris (Wochenende)', rotating: true },

    // ── Exotic Mission ──────────────────────────────────────
    '3021030893': { name: 'Exotische Mission', category: 'Missionen', detail: 'Wöchentliche exotische Mission' },

    // ── Iron Banner (rotating — only active during event weeks) ─
    '3427325023': { name: 'Iron Banner', category: 'Events', detail: 'Iron Banner Matches abschließen', rotating: true },
};

/**
 * Categories define display order and grouping.
 */
const ACTIVITY_CATEGORIES = [
    'Raids',
    'Dungeons',
    'Vanguard',
    'Crucible',
    'Gambit',
    'Trials',
    'Missionen',
    'Events',
];

/**
 * Match API milestones against known pinnacle activities.
 *
 * Bungie removes completed permanent milestones from the API response entirely.
 * Rotating milestones are absent when not active this week.
 *
 * @param {Object} milestones - Raw milestones from Bungie API (component 202)
 * @returns {Array<{hash, name, category, detail, completed}>}
 */
function matchPinnacles(milestones) {
    const results = [];

    for (const [hash, definition] of Object.entries(PINNACLE_ACTIVITIES)) {
        const milestone = milestones[hash];

        if (!milestone) {
            if (definition.rotating) {
                // Not active this week — skip entirely
                continue;
            }
            // Permanent activity absent = already completed this week
            results.push({
                hash,
                name: definition.name,
                category: definition.category,
                detail: definition.detail,
                completed: true,
            });
            continue;
        }

        // Milestone is present — determine completion state
        let completed = false;
        if (milestone.activities && milestone.activities.length > 0) {
            completed = milestone.activities.every(a => {
                if (a.phases && a.phases.length > 0) {
                    return a.phases.every(p => p.complete);
                }
                if (a.objectives && a.objectives.length > 0) {
                    return a.objectives.every(o => o.complete);
                }
                return false;
            });
        }

        results.push({
            hash,
            name: definition.name,
            category: definition.category,
            detail: definition.detail,
            completed,
        });
    }

    return results;
}

/**
 * Group activities by category for display.
 */
function groupByCategory(activities) {
    const grouped = {};
    for (const cat of ACTIVITY_CATEGORIES) {
        grouped[cat] = [];
    }
    for (const act of activities) {
        if (!grouped[act.category]) {
            grouped[act.category] = [];
        }
        grouped[act.category].push(act);
    }
    for (const cat of Object.keys(grouped)) {
        if (grouped[cat].length === 0) {
            delete grouped[cat];
        }
    }
    return grouped;
}
