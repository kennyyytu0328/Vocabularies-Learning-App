import { db } from './db.js';
import { store } from './store.js';

export class Game {
    constructor() {
        this.currentLevel = 1;
        this.levelWords = [];
        this.currentWord = null;
        this.mode = 'cloze'; // 'cloze' or 'quiz'
    }

    async setLevel(level) {
        this.currentLevel = level;
        this.levelWords = db.getWordsByLevel(level);
        store.setLastActiveLevel(level);
    }

    nextQuestion() {
        // Simple random selection for now. 
        // Future improvement: Weighted random based on word_stats (spaced repetition)
        if (this.levelWords.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * this.levelWords.length);
        this.currentWord = this.levelWords[randomIndex];

        if (this.mode === 'cloze') {
            return this.generateClozeQuestion();
        } else {
            return this.generateQuizQuestion();
        }
    }

    generateClozeQuestion() {
        const word = this.currentWord.word;
        const masked = this.applyMasking(word);

        return {
            type: 'cloze',
            wordId: this.currentWord.id,
            maskedWord: masked,
            definition: this.currentWord.definition,
            pos: this.currentWord.pos,
            example: this.currentWord.example
        };
    }

    generateQuizQuestion() {
        const distractors = db.getDistractors(this.currentWord, 2);
        const options = [
            { text: this.currentWord.definition, isCorrect: true },
            ...distractors.map(d => ({ text: d.definition, isCorrect: false }))
        ];

        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            type: 'quiz',
            wordId: this.currentWord.id,
            word: this.currentWord.word,
            pos: this.currentWord.pos,
            options: options,
            example: this.currentWord.example
        };
    }

    applyMasking(word) {
        // Vowel Prioritization: a, e, i, o, u -> _
        const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
        let masked = '';
        let hiddenCount = 0;

        // First pass: try to hide all vowels
        for (let char of word) {
            if (vowels.includes(char)) {
                masked += '_';
                hiddenCount++;
            } else {
                masked += char;
            }
        }

        // Guardrail: If word length <= 3 or remaining letters < 2 (meaning too many blanks)
        // Actually spec says: "If word length <= 3 or masked result has < 2 visible letters?"
        // Spec: "若單字長度 <= 3 或挖空後剩餘字母 < 2" -> "If word length <= 3 OR remaining visible letters < 2"

        const visibleCount = word.length - hiddenCount;

        if (word.length <= 3 || visibleCount < 2) {
            // Fallback: Mask only 1 random character
            const indices = Array.from({ length: word.length }, (_, i) => i);
            const randomIdx = indices[Math.floor(Math.random() * indices.length)];
            masked = word.split('').map((char, i) => i === randomIdx ? '_' : char).join('');
        }

        return masked;
    }

    checkAnswer(input) {
        let isCorrect = false;

        if (this.mode === 'cloze') {
            // Normalize input: trim, lowercase
            const cleanInput = input.trim().toLowerCase();
            const target = this.currentWord.word.toLowerCase();

            // Allow full word input OR just the missing letters?
            // Spec says: "Input full word or just missing letters (suggest full word)"
            // For simplicity and better learning, let's enforce full word or check if input matches the pattern
            // But usually "cloze" implies typing the whole thing in this context or filling the blank.
            // Let's assume the user types the FULL word into the input box.
            isCorrect = cleanInput === target;
        } else {
            // Quiz mode: input is the selected option index or text? 
            // Let's assume input is a boolean (passed from UI) or the selected definition text.
            // Actually UI handles the click, so UI knows if it's correct.
            // But for consistency, let's say we pass the correctness directly or the selected text.
            // Let's make this method receive a boolean for quiz mode for simplicity, 
            // OR the UI calls checkAnswer with the selected value.
            // Let's stick to: UI determines correctness for Quiz (since it has the options), 
            // but we need to record stats.
            // Wait, better design: Game knows the correct answer.
            // For Quiz, input could be the selected definition string.
            isCorrect = input === this.currentWord.definition;
        }

        store.updateWordStats(this.currentWord.id, isCorrect);
        return isCorrect;
    }
}

export const game = new Game();
