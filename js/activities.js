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
 */

const PINNACLE_ACTIVITIES = {
    // ── Raids ───────────────────────────────────────────────
    // Raid milestone hashes change each season when the featured raid rotates.
    // The weekly featured raid milestone:
    '2712317338': { name: 'Wöchentlicher Raid', category: 'Raids', detail: 'Featured Raid abschließen' },

    // ── Dungeons ────────────────────────────────────────────
    '2594202463': { name: 'Wöchentlicher Dungeon', category: 'Dungeons', detail: 'Featured Dungeon abschließen' },

    // ── Nightfall ───────────────────────────────────────────
    '2029743966': { name: 'Nightfall', category: 'Vanguard', detail: 'Nightfall: The Ordeal abschließen' },

    // ── Crucible ────────────────────────────────────────────
    '3603098564': { name: 'Crucible Playlist', category: 'Crucible', detail: 'Crucible-Matches abschließen' },

    // ── Gambit ──────────────────────────────────────────────
    '3448738070': { name: 'Gambit', category: 'Gambit', detail: 'Gambit-Matches abschließen' },

    // ── Trials of Osiris ────────────────────────────────────
    '3787826860': { name: 'Trials of Osiris', category: 'Trials', detail: 'Prüfungen von Osiris (Wochenende)' },

    // ── Exotic Mission ──────────────────────────────────────
    '3021030893': { name: 'Exotische Mission', category: 'Missionen', detail: 'Wöchentliche exotische Mission' },

    // ── Iron Banner (when active) ───────────────────────────
    '3427325023': { name: 'Iron Banner', category: 'Events', detail: 'Iron Banner Bounties' },
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
 * @param {Object} milestones - Raw milestones from Bungie API (component 200)
 * @returns {Array<{hash, name, category, detail, completed}>}
 */
function matchPinnacles(milestones) {
    const results = [];

    for (const [hash, definition] of Object.entries(PINNACLE_ACTIVITIES)) {
        const milestone = milestones[hash];
        let completed = false;

        if (milestone && milestone.activities) {
            completed = milestone.activities.some(a =>
                a.phases
                    ? a.phases.every(p => p.complete)
                    : false
            );
        }

        // A milestone not present in the response means either completed
        // or not available this week. We mark it as completed if absent
        // but the milestone was available (some milestones rotate weekly).
        if (!milestone) {
            // Not available this week — skip
            continue;
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
    // Remove empty categories
    for (const cat of Object.keys(grouped)) {
        if (grouped[cat].length === 0) {
            delete grouped[cat];
        }
    }
    return grouped;
}
