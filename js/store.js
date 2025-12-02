const STORAGE_KEY = 'vocab_user_progress';

class Store {
    constructor() {
        this.state = this.load();
    }

    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse user progress', e);
            }
        }
        return this.getInitialState();
    }

    getInitialState() {
        return {
            user_profile: {
                last_active_level: null,
                total_correct: 0,
                total_attempts: 0
            },
            word_stats: {} // word_id -> { attempts: 0, correct: 0, last_review: timestamp }
        };
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    updateWordStats(wordId, isCorrect) {
        if (!this.state.word_stats[wordId]) {
            this.state.word_stats[wordId] = { attempts: 0, correct: 0, last_review: 0 };
        }

        const stats = this.state.word_stats[wordId];
        stats.attempts += 1;
        if (isCorrect) stats.correct += 1;
        stats.last_review = Date.now();

        this.state.user_profile.total_attempts += 1;
        if (isCorrect) this.state.user_profile.total_correct += 1;

        this.save();
    }

    setLastActiveLevel(level) {
        this.state.user_profile.last_active_level = level;
        this.save();
    }

    exportData() {
        const dataStr = JSON.stringify(this.state);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `my_vocab_progress_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // Basic schema validation
            if (data.user_profile && data.word_stats) {
                this.state = data;
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    }

    getLevelProgress(levelWords) {
        // Calculate progress for a specific level based on words passed in
        if (!levelWords || levelWords.length === 0) return { learned: 0, total: 0 };

        let learnedCount = 0;
        levelWords.forEach(word => {
            const stats = this.state.word_stats[word.id];
            // Define "learned" as having at least 1 correct answer (can be stricter)
            if (stats && stats.correct > 0) {
                learnedCount++;
            }
        });

        return {
            learned: learnedCount,
            total: levelWords.length
        };
    }
}

export const store = new Store();
