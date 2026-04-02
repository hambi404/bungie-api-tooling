/**
 * Bungie API client for Destiny 2.
 * Docs: https://bungie-net.github.io/multi/
 */

const BUNGIE_BASE = 'https://www.bungie.net/Platform';

const MEMBERSHIP_TYPES = {
    1: 'Xbox',
    2: 'PlayStation',
    3: 'Steam',
    5: 'Stadia',
    6: 'Epic Games',
    10: 'Demon',
    254: 'Bungie.net',
};

const CLASS_NAMES = {
    0: 'Titan',
    1: 'Hunter',
    2: 'Warlock',
};

class BungieApi {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async request(path) {
        const res = await fetch(`${BUNGIE_BASE}${path}`, {
            headers: { 'X-API-Key': this.apiKey },
        });

        if (!res.ok) {
            throw new Error(`API Fehler: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (data.ErrorCode !== 1) {
            throw new Error(`Bungie Fehler: ${data.Message} (Code: ${data.ErrorCode})`);
        }

        return data.Response;
    }

    /**
     * Search for a player by BungieName (Name#1234).
     * Returns array of membership entries.
     */
    async searchPlayer(bungieName) {
        const [name, code] = bungieName.split('#');
        if (!name || !code) {
            throw new Error('Format: Name#1234');
        }

        const res = await fetch(`${BUNGIE_BASE}/Destiny2/SearchDestinyPlayerByBungieName/-1/`, {
            method: 'POST',
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                displayName: name,
                displayNameCode: parseInt(code, 10),
            }),
        });

        if (!res.ok) {
            throw new Error(`API Fehler: ${res.status}`);
        }

        const data = await res.json();
        if (data.ErrorCode !== 1) {
            throw new Error(`Bungie Fehler: ${data.Message}`);
        }

        return data.Response;
    }

    /**
     * Get profile with characters and milestones.
     * Components:
     *   100 = Profiles
     *   200 = Characters
     *   202 = CharacterProgressions
     *   204 = CharacterActivities (includes milestones per character)
     */
    async getProfile(membershipType, membershipId) {
        const components = '100,200,202,204';
        return this.request(
            `/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`
        );
    }

    /**
     * Get character-specific milestones.
     */
    getCharacterMilestones(profile, characterId) {
        const progressions = profile.characterProgressions?.data?.[characterId];
        return progressions?.milestones || {};
    }

    /**
     * Extract character info (class, light level).
     */
    getCharacterInfo(profile) {
        const chars = profile.characters?.data || {};
        return Object.entries(chars).map(([id, char]) => ({
            id,
            className: CLASS_NAMES[char.classType] || 'Unbekannt',
            light: char.light,
            emblemPath: char.emblemBackgroundPath,
        }));
    }

    /**
     * Get membership type display name.
     */
    static platformName(membershipType) {
        return MEMBERSHIP_TYPES[membershipType] || `Typ ${membershipType}`;
    }
}
