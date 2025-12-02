import { game } from './game.js';
import { store } from './store.js';
import { db } from './db.js';

class UI {
    constructor() {
        this.elements = {
            landingView: document.getElementById('landing-view'),
            learningView: document.getElementById('learning-view'),
            levelGrid: document.getElementById('level-grid'),
            card: document.getElementById('card'),
            btnHome: document.getElementById('btn-home'),
            btnSettings: document.getElementById('btn-settings'), // currently unused
            modeBtns: document.querySelectorAll('.mode-btn'),
            statLevel: document.getElementById('stat-level'),
            statProgress: document.getElementById('stat-progress'),
            feedbackOverlay: document.getElementById('feedback-overlay'),
            btnBackup: document.getElementById('btn-backup'),
            btnRestore: document.getElementById('btn-restore'),
            fileRestore: document.getElementById('file-restore')
        };

        this.initEventListeners();
    }

    initEventListeners() {
        // Mode switching
        this.elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                game.mode = btn.dataset.mode;
                this.loadQuestion();
            });
        });

        // Home button
        this.elements.btnHome.addEventListener('click', () => {
            this.showLanding();
        });

        // Backup/Restore
        this.elements.btnBackup.addEventListener('click', () => store.exportData());
        this.elements.btnRestore.addEventListener('click', () => this.elements.fileRestore.click());
        this.elements.fileRestore.addEventListener('change', (e) => this.handleFileImport(e));
    }

    async init() {
        // Render Level Buttons
        const counts = db.getWordCountByLevel();
        this.elements.levelGrid.innerHTML = '';

        for (let i = 1; i <= 6; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerHTML = `
                <h2>Level ${i}</h2>
                <p>${counts[i] || 0} Words</p>
            `;
            btn.addEventListener('click', () => this.startLevel(i));
            this.elements.levelGrid.appendChild(btn);
        }
    }

    async startLevel(level) {
        await game.setLevel(level);
        this.elements.statLevel.textContent = `Level ${level}`;
        this.updateProgress();
        this.showLearning();
        this.loadQuestion();
    }

    updateProgress() {
        const progress = store.getLevelProgress(game.levelWords);
        this.elements.statProgress.textContent = `${progress.learned} / ${progress.total}`;
    }

    showLanding() {
        this.elements.learningView.classList.add('hidden');
        this.elements.learningView.classList.remove('active');
        this.elements.landingView.classList.remove('hidden');
        this.elements.landingView.classList.add('active');
    }

    showLearning() {
        this.elements.landingView.classList.add('hidden');
        this.elements.landingView.classList.remove('active');
        this.elements.learningView.classList.remove('hidden');
        this.elements.learningView.classList.add('active');
    }

    loadQuestion() {
        const q = game.nextQuestion();
        if (!q) return; // Should handle empty level

        this.elements.card.innerHTML = '';

        // Common elements
        const posTag = document.createElement('span');
        posTag.className = 'pos-tag';
        posTag.textContent = q.pos;
        this.elements.card.appendChild(posTag);

        if (q.type === 'cloze') {
            this.renderCloze(q);
        } else {
            this.renderQuiz(q);
        }
    }

    renderCloze(q) {
        const def = document.createElement('div');
        def.className = 'definition';
        def.textContent = q.definition;
        this.elements.card.appendChild(def);

        const wordDisplay = document.createElement('div');
        wordDisplay.className = 'word-display';
        wordDisplay.textContent = q.maskedWord;
        this.elements.card.appendChild(wordDisplay);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cloze-input';
        input.placeholder = 'Type the full word';
        input.autocomplete = 'off';
        input.focus();

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleAnswer(input.value, q);
            }
        });

        this.elements.card.appendChild(input);
    }

    renderQuiz(q) {
        const wordDisplay = document.createElement('div');
        wordDisplay.className = 'word-display';
        wordDisplay.textContent = q.word;
        this.elements.card.appendChild(wordDisplay);

        // Add instruction text
        const instruction = document.createElement('div');
        instruction.className = 'quiz-instruction';
        instruction.textContent = '🐏Choose the correct one:';
        this.elements.card.appendChild(instruction);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'quiz-options';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => this.handleAnswer(opt.text, q, btn));
            optionsContainer.appendChild(btn);
        });

        this.elements.card.appendChild(optionsContainer);
    }

    handleAnswer(input, question, sourceElement = null) {
        const isCorrect = game.checkAnswer(input);

        if (isCorrect) {
            this.showFeedback(true, question);
        } else {
            this.showFeedback(false, question);
            if (sourceElement) {
                sourceElement.classList.add('wrong');
                // Highlight correct one
                const correctBtn = Array.from(this.elements.card.querySelectorAll('.quiz-btn'))
                    .find(b => b.textContent === question.options.find(o => o.isCorrect).text);
                if (correctBtn) correctBtn.classList.add('correct');
            } else {
                // Shake input
                const inputEl = this.elements.card.querySelector('input');
                if (inputEl) inputEl.classList.add('shake');
            }
        }
    }

    showFeedback(isCorrect, question) {
        const overlay = this.elements.feedbackOverlay;
        const content = overlay.querySelector('.feedback-content');
        const icon = content.querySelector('.icon');
        const msg = content.querySelector('.message');
        const detail = content.querySelector('.detail');

        overlay.classList.remove('hidden');

        if (isCorrect) {
            icon.textContent = '🎉';
            const praises = ['Excellent!', 'Great Job!', 'Awesome!', 'Perfect!', 'Superb!', 'Well Done!', 'Fantastic!', 'You Rock!', 'Brilliant!', 'Keep it up!'];
            msg.textContent = '😸' + praises[Math.floor(Math.random() * praises.length)];
            msg.style.color = 'var(--success-color)';
            detail.textContent = question.example || '';
        } else {
            icon.textContent = '❌';
            msg.textContent = 'Oops!';
            msg.style.color = 'var(--error-color)';
            // Show correct answer
            const correctWord = game.currentWord.word;
            detail.textContent = `The answer is: ${correctWord}`;
        }

        setTimeout(() => {
            overlay.classList.add('hidden');
            if (isCorrect) {
                this.updateProgress();
                this.loadQuestion();
            } else {
                // If wrong, maybe let them try again or move on?
                // Spec says: "Incorrect -> Show animation, show correct answer. Settlement -> Update stats, delay 1.5s -> Next question"
                // So we should move to next question regardless of correct/incorrect after delay.
                this.updateProgress(); // Stats updated in game.checkAnswer
                this.loadQuestion();
            }
        }, 4200);
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = store.importData(e.target.result);
            if (success) {
                alert('Progress restored successfully!');
                location.reload();
            } else {
                alert('Invalid file format.');
            }
        };
        reader.readAsText(file);
    }
}

export const ui = new UI();
