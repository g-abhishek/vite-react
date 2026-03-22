class FixedWindow {
  /**
   * @param {number} limit    - Max requests allowed per window
   * @param {number} windowMs - Window size in milliseconds
   */
  constructor(limit = 5, windowMs = 5000) {
    this.limit = limit;
    this.windowMs = windowMs;

    // key → { count, windowStart }
    // In production, this is Redis. Here, in-memory Map for learning.
    this.store = new Map();
  }

  check(key) {
    let time = Date.now();
    

    let windowIndex = Math.floor(time / this.windowMs);
    let storeKey = `${key}:${windowIndex}`;

    let windowStart = windowIndex * this.windowMs;
    let windowEnd = windowStart + this.windowMs;
    let windowResetAt = new Date(windowEnd);

    const entry = this.store.get(storeKey);

    if (!entry) {
      console.log("New Entry >>>");
      // make entry
      this.store.set(storeKey, { count: 1 });

      return {
        allowed: true,
        count: 1,
        remaining: this.limit - 1,
        limit: this.limit,
        reset_at: windowResetAt,
      }
    }

    if (entry.count >= this.limit) {
      console.log("Not allowed >>>");
      return {
        allowed: false,
        count: entry.count,
        remaining: 0,
        limit: this.limit,
        reset_at: windowResetAt,
      }
    }

    console.log("Increasing count >>>");
    entry.count++;
    return {
      allowed: true,
      count: entry.count,
      remaining: this.limit - entry.count,
      limit: this.limit,
      reset_at: windowResetAt,
    }
  }
}

module.exports = {
  FixedWindow
}
