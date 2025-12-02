class Database {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        try {
            const SQL = await initSqlJs({
                locateFile: file => `lib/${file}`
            });
            
            const response = await fetch('vocab.db');
            const buffer = await response.arrayBuffer();
            this.db = new SQL.Database(new Uint8Array(buffer));
            this.isReady = true;
            console.log('Database loaded successfully');
        } catch (error) {
            console.error('Failed to load database:', error);
            throw error;
        }
    }

    getWordsByLevel(level) {
        if (!this.isReady) return [];
        // Prepare statement to prevent SQL injection (though level is internal)
        const stmt = this.db.prepare("SELECT * FROM words WHERE level = :level");
        stmt.bind({':level': level});
        
        const results = [];
        while(stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }

    getDistractors(targetWord, count = 2) {
        if (!this.isReady) return [];
        
        // Strategy: Same POS, Level +/- 1, not the target word
        const minLevel = Math.max(1, targetWord.level - 1);
        const maxLevel = Math.min(6, targetWord.level + 1);
        
        const sql = `
            SELECT * FROM words 
            WHERE pos = :pos 
            AND level BETWEEN :minLevel AND :maxLevel 
            AND id != :id 
            ORDER BY RANDOM() 
            LIMIT :count
        `;
        
        const stmt = this.db.prepare(sql);
        stmt.bind({
            ':pos': targetWord.pos,
            ':minLevel': minLevel,
            ':maxLevel': maxLevel,
            ':id': targetWord.id,
            ':count': count
        });
        
        const results = [];
        while(stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        
        // Fallback if not enough distractors found (e.g. rare POS)
        if (results.length < count) {
            const fallbackSql = `SELECT * FROM words WHERE id != :id ORDER BY RANDOM() LIMIT :count`;
            const fallbackStmt = this.db.prepare(fallbackSql);
            fallbackStmt.bind({
                ':id': targetWord.id,
                ':count': count - results.length
            });
            while(fallbackStmt.step()) {
                results.push(fallbackStmt.getAsObject());
            }
            fallbackStmt.free();
        }
        
        return results;
    }

    getWordCountByLevel() {
        if (!this.isReady) return {};
        const result = this.db.exec("SELECT level, COUNT(*) as count FROM words GROUP BY level");
        if (result.length > 0) {
            const counts = {};
            result[0].values.forEach(row => {
                counts[row[0]] = row[1];
            });
            return counts;
        }
        return {};
    }
}

export const db = new Database();
