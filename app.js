/**
 * Main application — ties UI, API, and activity matching together.
 */

const app = {
    api: null,
    profile: null,
    membershipType: null,
    membershipId: null,

    init() {
        // Restore saved values from localStorage
        const savedKey = localStorage.getItem('bungieApiKey');
        const savedName = localStorage.getItem('bungieName');
        if (savedKey) document.getElementById('apiKey').value = savedKey;
        if (savedName) document.getElementById('bungieName').value = savedName;

        // Enter key triggers search
        document.getElementById('bungieName').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.search();
        });
    },

    show(id) {
        document.getElementById(id).classList.remove('hidden');
    },

    hide(id) {
        document.getElementById(id).classList.add('hidden');
    },

    showError(msg) {
        document.getElementById('errorMessage').textContent = msg;
        this.show('error');
    },

    hideError() {
        this.hide('error');
    },

    async search() {
        this.hideError();
        this.hide('platform-select');
        this.hide('character-select');
        this.hide('results');

        const apiKey = document.getElementById('apiKey').value.trim();
        const bungieName = document.getElementById('bungieName').value.trim();

        if (!apiKey || !bungieName) {
            this.showError('Bitte API Key und Bungie Name eingeben.');
            return;
        }

        // Persist for next visit
        localStorage.setItem('bungieApiKey', apiKey);
        localStorage.setItem('bungieName', bungieName);

        this.api = new BungieApi(apiKey);

        const btn = document.getElementById('searchBtn');
        btn.disabled = true;
        btn.textContent = 'Suche...';

        try {
            const players = await this.api.searchPlayer(bungieName);

            if (!players || players.length === 0) {
                this.showError(`Kein Spieler gefunden für "${bungieName}".`);
                return;
            }

            if (players.length === 1) {
                // Single result — skip platform selection
                await this.selectPlatform(players[0].membershipType, players[0].membershipId);
            } else {
                this.showPlatformSelect(players);
            }
        } catch (err) {
            this.showError(err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Suchen';
        }
    },

    showPlatformSelect(players) {
        const list = document.getElementById('platformList');
        list.innerHTML = '';

        for (const p of players) {
            const btn = document.createElement('button');
            btn.className = 'platform-btn';
            btn.textContent = `${BungieApi.platformName(p.membershipType)} — ${p.displayName}`;
            btn.onclick = () => this.selectPlatform(p.membershipType, p.membershipId);
            list.appendChild(btn);
        }

        this.show('platform-select');
    },

    async selectPlatform(membershipType, membershipId) {
        this.membershipType = membershipType;
        this.membershipId = membershipId;
        this.hide('platform-select');

        try {
            this.profile = await this.api.getProfile(membershipType, membershipId);
            const characters = this.api.getCharacterInfo(this.profile);

            if (characters.length === 0) {
                this.showError('Keine Charaktere gefunden.');
                return;
            }

            this.showCharacterSelect(characters);
        } catch (err) {
            this.showError(err.message);
        }
    },

    showCharacterSelect(characters) {
        const list = document.getElementById('characterList');
        list.innerHTML = '';

        for (const char of characters) {
            const btn = document.createElement('button');
            btn.className = 'character-btn';
            btn.innerHTML = `
                <span class="class-name">${char.className}</span>
                <span class="light-level">${char.light}</span>
            `;
            btn.onclick = () => this.showResults([char]);
            list.appendChild(btn);
        }

        this.show('character-select');
    },

    checkAll() {
        const characters = this.api.getCharacterInfo(this.profile);
        this.showResults(characters);
    },

    showResults(characters) {
        this.hide('character-select');

        const container = document.getElementById('activityList');
        container.innerHTML = '';

        // Show reset timer
        const resetInfo = document.getElementById('resetInfo');
        resetInfo.textContent = `Nächster Weekly Reset: ${this.nextReset()}`;

        for (const char of characters) {
            if (characters.length > 1) {
                const header = document.createElement('div');
                header.className = 'character-header';
                header.textContent = `${char.className} (${char.light})`;
                container.appendChild(header);
            }

            const milestones = this.api.getCharacterMilestones(this.profile, char.id);
            const activities = matchPinnacles(milestones);

            if (activities.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'reset-info';
                empty.textContent = 'Keine bekannten Pinnacle-Milestones gefunden. Die Milestone-Hashes müssen evtl. aktualisiert werden.';
                container.appendChild(empty);
                continue;
            }

            const grouped = groupByCategory(activities);

            for (const [category, acts] of Object.entries(grouped)) {
                const group = document.createElement('div');
                group.className = 'activity-group';

                const title = document.createElement('h3');
                title.textContent = category;
                group.appendChild(title);

                for (const act of acts) {
                    const item = document.createElement('div');
                    item.className = 'activity-item';
                    item.innerHTML = `
                        <div class="activity-status ${act.completed ? 'done' : 'todo'}">
                            ${act.completed ? '&#10003;' : ''}
                        </div>
                        <div class="activity-name">
                            <div class="name">${act.name}</div>
                            <div class="detail">${act.detail}</div>
                        </div>
                    `;
                    group.appendChild(item);
                }

                container.appendChild(group);
            }
        }

        this.show('results');
    },

    /**
     * Calculate next Tuesday 17:00 UTC (19:00 MESZ) reset.
     */
    nextReset() {
        const now = new Date();
        const day = now.getUTCDay();
        const hour = now.getUTCHours();

        let daysUntilTuesday = (2 - day + 7) % 7;
        if (daysUntilTuesday === 0 && hour >= 17) {
            daysUntilTuesday = 7;
        }

        const reset = new Date(now);
        reset.setUTCDate(now.getUTCDate() + daysUntilTuesday);
        reset.setUTCHours(17, 0, 0, 0);

        const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        return reset.toLocaleDateString('de-DE', options) + ' Uhr';
    },
};

// Boot
document.addEventListener('DOMContentLoaded', () => app.init());
