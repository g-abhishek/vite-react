class SlidingWindowLog {
    constructor(limit, windowMs) {
        this.limit = limit;
        this.windowMs = windowMs;

        this.logs = new Map();
    }

    _lowerBound(logs, threshold) {
        let l = 0;
        let h = logs.length;
    
        while (l < h) {
            let mid = Math.floor((l + h) / 2);
    
            if (logs[mid] <= threshold) {
                l = mid + 1;
            } else {
                h = mid;
            }
        }
    
        return l;
    }

    // [10:05, 10:09, 10:12]

    // 10:05 + 00:10 = 10:15 - 10:13 = 00:02
    check(key) {
        let now = Date.now();
        let windowStart = now - this.windowMs;

        // if(!this.logs.has(key)) {}
        const logs = this.logs.get(key) || [];

        // remove all timestamp that are older than our window
        const cutOffIndex = this._lowerBound(logs, windowStart);

        if (cutOffIndex > 0) {
            logs.splice(0, cutOffIndex); 
        }

        if (logs?.length >= this.limit) {
            const oldestTimestamp = logs[0];
            const retryAfterMs = oldestTimestamp + this.windowMs - now;
            const retryAfter = new Date(now + retryAfterMs);


            console.error("Blocked >>>")
            return {
                allowed: false,
                count: logs.length,
                remaining: 0,
                limit: this.limit,
                retry_after: retryAfter,
            }
        }

        console.log("Allowed >>>");
        logs.push(now);
        this.logs.set(key, logs);
        return {
            allowed: true,
            count: logs.length,
            remaining: this.limit - logs.length,
            limit: this.limit,
            retry_after: null,
        }  
    }
}

module.exports = {
    SlidingWindowLog
}