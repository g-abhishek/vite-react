# JavaScript Date & Time - Complete Guide (Basics to Advanced)

## Table of Contents
1. [Date Fundamentals](#1-date-fundamentals) + 📝 Exercises
2. [Creating Dates](#2-creating-dates) + 📝 Exercises
3. [Date Methods & Properties](#3-date-methods--properties) + 📝 Exercises
4. [Timestamps & Unix Time](#4-timestamps--unix-time) + 📝 Exercises
5. [Timezones Deep Dive](#5-timezones-deep-dive) + 📝 Exercises
6. [Internationalization (Intl API)](#6-internationalization-intl-api) + 📝 Exercises
7. [Date Formatting](#7-date-formatting) + 📝 Exercises
8. [Date Arithmetic](#8-date-arithmetic) + 📝 Exercises
9. [Handling Server vs Client Time](#9-handling-server-vs-client-time) + 📝 Exercises
10. [Common Pitfalls & Best Practices](#10-common-pitfalls--best-practices) + 📝 Exercises
11. [Libraries Overview](#11-libraries-overview) + 📝 Exercises
12. [Real-World Patterns](#12-real-world-patterns) + 📝 Exercises
13. [🎯 Final Challenge Exercises](#-final-challenge-exercises)

---

## 1. Date Fundamentals

### What is a Date in JavaScript?

JavaScript's `Date` object represents a single moment in time. Internally, it stores the number of **milliseconds** since **January 1, 1970, 00:00:00 UTC** (known as the Unix Epoch).

```javascript
// The Date object stores milliseconds since Unix Epoch
const now = new Date();
console.log(now.getTime()); // e.g., 1703073600000 (milliseconds)
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **UTC** | Coordinated Universal Time - the primary time standard |
| **GMT** | Greenwich Mean Time - often used interchangeably with UTC |
| **Epoch** | January 1, 1970, 00:00:00 UTC - the reference point |
| **Timestamp** | Number of milliseconds (or seconds) since Epoch |
| **Timezone Offset** | Difference from UTC in minutes |
| **ISO 8601** | International standard for date/time representation |

### Types of Time Representations

```javascript
// 1. Local Time - Based on user's system timezone
const localDate = new Date();
console.log(localDate.toString()); 
// "Sat Dec 20 2025 10:30:00 GMT+0530 (India Standard Time)"

// 2. UTC Time - Universal, timezone-neutral
console.log(localDate.toUTCString());
// "Sat, 20 Dec 2025 05:00:00 GMT"

// 3. ISO String - Standardized format
console.log(localDate.toISOString());
// "2025-12-20T05:00:00.000Z"

// 4. Timestamp - Milliseconds since epoch
console.log(localDate.getTime());
// 1703055000000
```

### 📝 Exercises - Date Fundamentals

**Exercise 1.1 (Easy):** What is the Unix Epoch? Write code to create a Date object representing the exact moment of the Unix Epoch.

<details>
<summary>Solution</summary>

```javascript
// Unix Epoch is January 1, 1970, 00:00:00 UTC
const epoch = new Date(0);
console.log(epoch.toISOString()); // "1970-01-01T00:00:00.000Z"

// Alternative
const epoch2 = new Date('1970-01-01T00:00:00Z');
```
</details>

**Exercise 1.2 (Easy):** Convert the current date to all four time representations (Local, UTC, ISO, Timestamp).

<details>
<summary>Solution</summary>

```javascript
const now = new Date();

// Local Time
console.log('Local:', now.toString());

// UTC Time
console.log('UTC:', now.toUTCString());

// ISO String
console.log('ISO:', now.toISOString());

// Timestamp
console.log('Timestamp:', now.getTime());
```
</details>

**Exercise 1.3 (Medium):** Write a function that takes a timestamp and returns an object with the date in all four formats.

<details>
<summary>Solution</summary>

```javascript
function getAllFormats(timestamp) {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid timestamp');
  }
  
  return {
    local: date.toString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
    timestamp: date.getTime()
  };
}

// Test
console.log(getAllFormats(1703073600000));
```
</details>

**Exercise 1.4 (Medium):** Explain why `getTimezoneOffset()` returns a negative number for timezones ahead of UTC (like IST). Write code to display the current timezone as "UTC+X" or "UTC-X" format.

<details>
<summary>Solution</summary>

```javascript
// getTimezoneOffset() returns the difference in MINUTES from UTC to LOCAL
// If local is ahead of UTC, the offset is negative
// IST is UTC+5:30, so offset is -330 (you need to go back 330 minutes to get to UTC)

function getTimezoneString() {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.abs(Math.floor(offset / 60));
  const minutes = Math.abs(offset % 60);
  const sign = offset <= 0 ? '+' : '-';
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

console.log(getTimezoneString()); // e.g., "UTC+5:30" for IST
```
</details>

---

## 2. Creating Dates

### Method 1: No Arguments (Current Date/Time)

```javascript
const now = new Date();
console.log(now); // Current date and time in local timezone
```

### Method 2: Timestamp (Milliseconds)

```javascript
// From milliseconds since Unix Epoch
const fromTimestamp = new Date(1703073600000);
console.log(fromTimestamp);

// From seconds (multiply by 1000)
const fromSeconds = new Date(1703073600 * 1000);
```

### Method 3: Date String

```javascript
// ISO 8601 format (RECOMMENDED - unambiguous)
const isoDate = new Date("2025-12-20T10:30:00.000Z");

// ISO format without time (parsed as UTC midnight)
const dateOnly = new Date("2025-12-20");
console.log(dateOnly.toISOString()); // "2025-12-20T00:00:00.000Z"

// Date string formats (browser-dependent - AVOID)
const dateStr1 = new Date("December 20, 2025");
const dateStr2 = new Date("12/20/2025"); // MM/DD/YYYY (US format)
const dateStr3 = new Date("2025/12/20"); // YYYY/MM/DD

// ⚠️ DANGER: Ambiguous formats
const ambiguous = new Date("01/02/2025"); 
// Is this Jan 2 or Feb 1? Depends on locale!
```

### Method 4: Individual Components

```javascript
// new Date(year, monthIndex, day, hours, minutes, seconds, milliseconds)
// ⚠️ Note: monthIndex is 0-based (0 = January, 11 = December)

const specific = new Date(2025, 11, 20, 10, 30, 0, 0);
// December 20, 2025, 10:30:00.000 (LOCAL TIME)

// Month is 0-indexed!
const january = new Date(2025, 0, 1);  // January 1, 2025
const december = new Date(2025, 11, 1); // December 1, 2025

// Overflow handling (auto-correction)
const overflow = new Date(2025, 11, 32); // Dec 32 → Jan 1, 2026
const underflow = new Date(2025, 0, 0);  // Jan 0 → Dec 31, 2024
```

### Method 5: Date.UTC() - Create UTC Timestamp

```javascript
// Returns timestamp, not Date object
const utcTimestamp = Date.UTC(2025, 11, 20, 10, 30, 0);
const utcDate = new Date(utcTimestamp);

console.log(utcDate.toISOString()); // "2025-12-20T10:30:00.000Z"
```

### Method 6: Date.now() - Current Timestamp

```javascript
const currentTimestamp = Date.now();
console.log(currentTimestamp); // 1703073600000

// Equivalent to:
console.log(new Date().getTime());
```

### Method 7: Date.parse() - Parse String to Timestamp

```javascript
const timestamp = Date.parse("2025-12-20T10:30:00.000Z");
console.log(timestamp); // 1703068200000

// Returns NaN for invalid dates
const invalid = Date.parse("not a date");
console.log(invalid); // NaN
```

### 📝 Exercises - Creating Dates

**Exercise 2.1 (Easy):** Create a Date for your birthday using at least 3 different methods.

<details>
<summary>Solution</summary>

```javascript
// Example: May 15, 1995

// Method 1: ISO String
const birthday1 = new Date('1995-05-15');

// Method 2: Components (month is 0-indexed!)
const birthday2 = new Date(1995, 4, 15); // 4 = May

// Method 3: Date.UTC
const birthday3 = new Date(Date.UTC(1995, 4, 15));

// Method 4: Full ISO string
const birthday4 = new Date('1995-05-15T00:00:00Z');

console.log(birthday1.toDateString());
console.log(birthday2.toDateString());
console.log(birthday3.toDateString());
```
</details>

**Exercise 2.2 (Easy):** What's wrong with this code? Fix it.
```javascript
const christmas = new Date(2025, 12, 25);
console.log(christmas.toDateString());
```

<details>
<summary>Solution</summary>

```javascript
// Problem: Month 12 doesn't exist! Months are 0-indexed (0-11)
// Month 12 = January of next year

// WRONG
const christmasWrong = new Date(2025, 12, 25); // Jan 25, 2026!

// CORRECT
const christmasCorrect = new Date(2025, 11, 25); // December 25, 2025
console.log(christmasCorrect.toDateString()); // "Thu Dec 25 2025"
```
</details>

**Exercise 2.3 (Medium):** Write a function `createSafeDate(dateString)` that safely parses a date string and returns null for invalid dates instead of throwing an error.

<details>
<summary>Solution</summary>

```javascript
function createSafeDate(dateString) {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

// Tests
console.log(createSafeDate('2025-12-20'));      // Valid Date
console.log(createSafeDate('invalid'));          // null
console.log(createSafeDate(''));                 // null
console.log(createSafeDate('2025-13-45'));      // null (invalid month/day)
```
</details>

**Exercise 2.4 (Medium):** The date "01/02/2025" is ambiguous. Write a function that parses dates in DD/MM/YYYY format explicitly.

<details>
<summary>Solution</summary>

```javascript
function parseDDMMYYYY(dateString) {
  const parts = dateString.split('/');
  
  if (parts.length !== 3) {
    return null;
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Convert to 0-indexed
  const year = parseInt(parts[2], 10);
  
  // Validate
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return null;
  }
  
  const date = new Date(year, month, day);
  
  // Verify the date wasn't auto-corrected (e.g., Feb 30 → Mar 2)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

// Tests
console.log(parseDDMMYYYY('25/12/2025')); // December 25, 2025
console.log(parseDDMMYYYY('01/02/2025')); // February 1, 2025 (not Jan 2!)
console.log(parseDDMMYYYY('31/02/2025')); // null (Feb 31 doesn't exist)
```
</details>

**Exercise 2.5 (Hard):** JavaScript's date overflow feature auto-corrects invalid dates (e.g., Dec 32 → Jan 1). Write a function `isValidDateComponents(year, month, day)` that returns true only if the components represent a valid date WITHOUT relying on overflow.

<details>
<summary>Solution</summary>

```javascript
function isValidDateComponents(year, month, day) {
  // Month should be 1-12 for this function (human-readable)
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  
  // Days in each month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Check leap year for February
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  let maxDays = daysInMonth[month - 1];
  if (month === 2 && isLeapYear) {
    maxDays = 29;
  }
  
  return day <= maxDays;
}

// Tests
console.log(isValidDateComponents(2025, 12, 25)); // true
console.log(isValidDateComponents(2025, 2, 29));  // false (2025 not leap year)
console.log(isValidDateComponents(2024, 2, 29));  // true (2024 is leap year)
console.log(isValidDateComponents(2025, 12, 32)); // false
console.log(isValidDateComponents(2025, 13, 1));  // false
```
</details>

---

## 3. Date Methods & Properties

### Getter Methods (Local Time)

```javascript
const date = new Date("2025-12-20T10:30:45.123Z");

// Year
date.getFullYear();     // 2025

// Month (0-indexed: 0-11)
date.getMonth();        // 11 (December)

// Day of month (1-31)
date.getDate();         // 20

// Day of week (0-6, Sunday = 0)
date.getDay();          // 6 (Saturday)

// Hours (0-23)
date.getHours();        // Depends on local timezone

// Minutes (0-59)
date.getMinutes();      // 30 (or adjusted for timezone)

// Seconds (0-59)
date.getSeconds();      // 45

// Milliseconds (0-999)
date.getMilliseconds(); // 123

// Timestamp
date.getTime();         // 1703068245123

// Timezone offset (in minutes, from UTC)
date.getTimezoneOffset(); // e.g., -330 for IST (UTC+5:30)
// Negative means ahead of UTC
```

### Getter Methods (UTC)

```javascript
const date = new Date("2025-12-20T10:30:45.123Z");

date.getUTCFullYear();     // 2025
date.getUTCMonth();        // 11
date.getUTCDate();         // 20
date.getUTCDay();          // 6
date.getUTCHours();        // 10 (always UTC)
date.getUTCMinutes();      // 30
date.getUTCSeconds();      // 45
date.getUTCMilliseconds(); // 123
```

### Setter Methods (Local Time)

```javascript
const date = new Date();

date.setFullYear(2025);
date.setMonth(11);          // December
date.setDate(25);           // 25th
date.setHours(10);
date.setMinutes(30);
date.setSeconds(0);
date.setMilliseconds(0);
date.setTime(1703073600000); // Set from timestamp

// Chaining (setters return timestamp)
const newDate = new Date();
newDate.setFullYear(2025);
newDate.setMonth(0);
newDate.setDate(1);
```

### Setter Methods (UTC)

```javascript
const date = new Date();

date.setUTCFullYear(2025);
date.setUTCMonth(11);
date.setUTCDate(20);
date.setUTCHours(10);
date.setUTCMinutes(30);
date.setUTCSeconds(0);
date.setUTCMilliseconds(0);
```

### Conversion Methods

```javascript
const date = new Date("2025-12-20T10:30:00.000Z");

// String representations
date.toString();
// "Sat Dec 20 2025 16:00:00 GMT+0530 (India Standard Time)"

date.toDateString();
// "Sat Dec 20 2025"

date.toTimeString();
// "16:00:00 GMT+0530 (India Standard Time)"

date.toISOString();
// "2025-12-20T10:30:00.000Z" (always UTC, ISO 8601)

date.toUTCString();
// "Sat, 20 Dec 2025 10:30:00 GMT"

date.toJSON();
// "2025-12-20T10:30:00.000Z" (same as toISOString)

date.toLocaleDateString();
// "20/12/2025" or "12/20/2025" depending on locale

date.toLocaleTimeString();
// "4:00:00 PM" or "16:00:00" depending on locale

date.toLocaleString();
// Full date and time in locale format

// Primitive values
date.valueOf();   // 1703068200000 (same as getTime)
date.getTime();   // 1703068200000
```

### 📝 Exercises - Date Methods & Properties

**Exercise 3.1 (Easy):** Given a date, extract and display all components (year, month, day, hours, minutes, seconds) in a formatted string like "2025-12-20 14:30:45".

<details>
<summary>Solution</summary>

```javascript
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // +1 because 0-indexed
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const now = new Date();
console.log(formatDateTime(now));
```
</details>

**Exercise 3.2 (Easy):** Write a function that returns the day name (Monday, Tuesday, etc.) for any given date.

<details>
<summary>Solution</summary>

```javascript
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Test
console.log(getDayName(new Date('2025-12-25'))); // "Thursday"
console.log(getDayName(new Date()));             // Today's day name
```
</details>

**Exercise 3.3 (Medium):** Create a function that takes a date and returns the same time but in UTC components (year, month, day, hours, minutes, seconds).

<details>
<summary>Solution</summary>

```javascript
function getUTCComponents(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // Make it 1-indexed for readability
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds(),
    dayOfWeek: date.getUTCDay()
  };
}

const now = new Date();
console.log('Local:', {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  day: now.getDate(),
  hours: now.getHours()
});
console.log('UTC:', getUTCComponents(now));
```
</details>

**Exercise 3.4 (Medium):** Write a function `setToMidnight(date)` that sets a date to midnight (00:00:00.000) without mutating the original date.

<details>
<summary>Solution</summary>

```javascript
function setToMidnight(date) {
  const result = new Date(date); // Clone to avoid mutation
  result.setHours(0, 0, 0, 0);
  return result;
}

// Test
const original = new Date('2025-12-20T14:30:45.123Z');
const midnight = setToMidnight(original);

console.log('Original:', original.toISOString()); // Unchanged
console.log('Midnight:', midnight.toISOString());
console.log('Are they same?', original === midnight); // false
```
</details>

**Exercise 3.5 (Hard):** Write a function that takes a date and modifies it to be the last moment of that day (23:59:59.999) in UTC, returning a new date without mutating the original.

<details>
<summary>Solution</summary>

```javascript
function endOfDayUTC(date) {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

// Alternative: More explicit approach
function endOfDayUTCExplicit(date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ));
}

// Test
const date = new Date('2025-12-20T14:30:00Z');
console.log(endOfDayUTC(date).toISOString()); // "2025-12-20T23:59:59.999Z"
console.log(date.toISOString()); // Original unchanged
```
</details>

---

## 4. Timestamps & Unix Time

### Understanding Timestamps

```javascript
// JavaScript uses MILLISECONDS since Unix Epoch
const jsTimestamp = Date.now();
console.log(jsTimestamp); // 1703073600000 (13 digits)

// Unix timestamp is in SECONDS
const unixTimestamp = Math.floor(Date.now() / 1000);
console.log(unixTimestamp); // 1703073600 (10 digits)

// Converting between them
const fromUnix = unixTimestamp * 1000; // Unix → JS
const toUnix = Math.floor(jsTimestamp / 1000); // JS → Unix
```

### Timestamp Use Cases

```javascript
// 1. Measuring execution time
const start = performance.now(); // More precise than Date.now()
// ... some operation ...
const end = performance.now();
console.log(`Execution time: ${end - start}ms`);

// Using Date.now() for simple timing
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

// 2. Cache busting
const url = `/api/data?t=${Date.now()}`;

// 3. Unique IDs (not recommended for distributed systems)
const simpleId = `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 4. Sorting by time
const items = [
  { name: 'Item 1', timestamp: 1703073600000 },
  { name: 'Item 2', timestamp: 1703070000000 },
];
items.sort((a, b) => b.timestamp - a.timestamp); // Newest first

// 5. Storing in database (always store as UTC timestamp or ISO string)
const record = {
  createdAt: Date.now(),           // Timestamp
  updatedAt: new Date().toISOString() // ISO string
};
```

### High-Resolution Time

```javascript
// performance.now() - Microsecond precision
const preciseStart = performance.now();
// ... operation ...
const preciseEnd = performance.now();
console.log(`Precise time: ${preciseEnd - preciseStart}ms`);

// Note: performance.now() starts from page load, not Unix Epoch
// It's relative, not absolute
```

### 📝 Exercises - Timestamps & Unix Time

**Exercise 4.1 (Easy):** Convert a Unix timestamp (seconds) to a JavaScript Date and vice versa.

<details>
<summary>Solution</summary>

```javascript
// Unix timestamp (seconds) to JavaScript Date
function unixToDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000);
}

// JavaScript Date to Unix timestamp (seconds)
function dateToUnix(date) {
  return Math.floor(date.getTime() / 1000);
}

// Test
const unixTs = 1703073600; // Some Unix timestamp
const date = unixToDate(unixTs);
console.log(date.toISOString());

const backToUnix = dateToUnix(date);
console.log(backToUnix); // Should be same as unixTs
console.log(unixTs === backToUnix); // true
```
</details>

**Exercise 4.2 (Easy):** Write a simple function to measure how long a piece of code takes to execute.

<details>
<summary>Solution</summary>

```javascript
function measureTime(fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  return {
    result,
    duration: end - start,
    durationFormatted: `${(end - start).toFixed(2)}ms`
  };
}

// Test with a slow operation
const { result, durationFormatted } = measureTime(() => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  return sum;
});

console.log('Result:', result);
console.log('Time:', durationFormatted);
```
</details>

**Exercise 4.3 (Medium):** Given an array of objects with timestamps, write a function to sort them by date (newest first) and another to filter by date range.

<details>
<summary>Solution</summary>

```javascript
const events = [
  { id: 1, name: 'Event A', timestamp: 1703073600000 },
  { id: 2, name: 'Event B', timestamp: 1703000000000 },
  { id: 3, name: 'Event C', timestamp: 1703150000000 },
  { id: 4, name: 'Event D', timestamp: 1702900000000 },
];

// Sort newest first
function sortByDateDesc(items) {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

// Sort oldest first
function sortByDateAsc(items) {
  return [...items].sort((a, b) => a.timestamp - b.timestamp);
}

// Filter by date range
function filterByDateRange(items, startTimestamp, endTimestamp) {
  return items.filter(item => 
    item.timestamp >= startTimestamp && item.timestamp <= endTimestamp
  );
}

// Tests
console.log('Newest first:', sortByDateDesc(events));
console.log('Oldest first:', sortByDateAsc(events));

const filtered = filterByDateRange(events, 1703000000000, 1703100000000);
console.log('Filtered:', filtered);
```
</details>

**Exercise 4.4 (Medium):** Create a unique ID generator that uses timestamp but ensures uniqueness even when called multiple times in the same millisecond.

<details>
<summary>Solution</summary>

```javascript
const createIdGenerator = () => {
  let lastTimestamp = 0;
  let counter = 0;
  
  return function generateId(prefix = 'id') {
    const timestamp = Date.now();
    
    if (timestamp === lastTimestamp) {
      counter++;
    } else {
      lastTimestamp = timestamp;
      counter = 0;
    }
    
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${counter}_${random}`;
  };
};

const generateId = createIdGenerator();

// Test - generate multiple IDs quickly
const ids = [];
for (let i = 0; i < 5; i++) {
  ids.push(generateId());
}
console.log(ids);
// All IDs are unique even if generated in same millisecond
```
</details>

**Exercise 4.5 (Hard):** Implement a throttle function that uses timestamps to limit how often a function can be called.

<details>
<summary>Solution</summary>

```javascript
function throttle(fn, limitMs) {
  let lastCallTime = 0;
  
  return function throttled(...args) {
    const now = Date.now();
    
    if (now - lastCallTime >= limitMs) {
      lastCallTime = now;
      return fn.apply(this, args);
    }
    // Optionally return undefined or last result
  };
}

// Test
const expensiveOperation = (x) => {
  console.log('Called at:', new Date().toISOString(), 'with:', x);
  return x * 2;
};

const throttledOp = throttle(expensiveOperation, 1000); // Max once per second

// Simulate rapid calls
throttledOp(1); // Executes
throttledOp(2); // Ignored
throttledOp(3); // Ignored

setTimeout(() => throttledOp(4), 500);  // Ignored (only 500ms passed)
setTimeout(() => throttledOp(5), 1100); // Executes (over 1000ms passed)
```
</details>

---

## 5. Timezones Deep Dive

### Understanding Timezone Offset

```javascript
const date = new Date();

// getTimezoneOffset() returns minutes difference FROM UTC
const offsetMinutes = date.getTimezoneOffset();

// For IST (UTC+5:30), offset is -330
// For EST (UTC-5:00), offset is 300
// NEGATIVE = ahead of UTC, POSITIVE = behind UTC

// Convert to hours
const offsetHours = -offsetMinutes / 60;
console.log(`UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`);
```

### The Timezone Problem

```javascript
// PROBLEM: Same Date object shows different times in different zones

// User in New York creates a date
const meeting = new Date("2025-12-20T14:00:00"); // Local time!

// This creates different actual times depending on where the code runs!
// In New York: 2025-12-20T14:00:00 EST (19:00 UTC)
// In London:   2025-12-20T14:00:00 GMT (14:00 UTC)
// In Tokyo:    2025-12-20T14:00:00 JST (05:00 UTC)

// SOLUTION: Always use UTC or explicit timezone
const meetingUTC = new Date("2025-12-20T14:00:00Z"); // Explicit UTC
const meetingISO = new Date("2025-12-20T14:00:00-05:00"); // Explicit offset
```

### Working with Different Timezones

```javascript
// Method 1: Using Intl.DateTimeFormat with timeZone option
function formatInTimezone(date, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

const now = new Date();
console.log('New York:', formatInTimezone(now, 'America/New_York'));
console.log('London:', formatInTimezone(now, 'Europe/London'));
console.log('Tokyo:', formatInTimezone(now, 'Asia/Tokyo'));
console.log('India:', formatInTimezone(now, 'Asia/Kolkata'));
console.log('Sydney:', formatInTimezone(now, 'Australia/Sydney'));

// Method 2: Getting timezone-specific components
function getDatePartsInTimezone(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const result = {};
  parts.forEach(({ type, value }) => {
    result[type] = value;
  });
  return result;
}

console.log(getDatePartsInTimezone(new Date(), 'Asia/Tokyo'));
// { year: '2025', month: '12', day: '20', hour: '19', minute: '30', second: '00' }
```

### IANA Timezone Database

```javascript
// List of common IANA timezone identifiers
const timezones = {
  // Americas
  'America/New_York': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Los_Angeles': 'Pacific Time',
  'America/Toronto': 'Eastern Time (Canada)',
  'America/Sao_Paulo': 'Brazil Time',
  
  // Europe
  'Europe/London': 'British Time',
  'Europe/Paris': 'Central European Time',
  'Europe/Berlin': 'Central European Time',
  'Europe/Moscow': 'Moscow Time',
  
  // Asia
  'Asia/Kolkata': 'India Standard Time',
  'Asia/Dubai': 'Gulf Standard Time',
  'Asia/Singapore': 'Singapore Time',
  'Asia/Tokyo': 'Japan Standard Time',
  'Asia/Shanghai': 'China Standard Time',
  'Asia/Seoul': 'Korea Standard Time',
  
  // Oceania
  'Australia/Sydney': 'Australian Eastern Time',
  'Pacific/Auckland': 'New Zealand Time',
  
  // Special
  'UTC': 'Coordinated Universal Time'
};

// Check if timezone is valid
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}
```

### Daylight Saving Time (DST)

```javascript
// DST causes timezone offsets to change throughout the year

function checkDST(date, timezone) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffset(jan, timezone);
  const julOffset = getTimezoneOffset(jul, timezone);
  
  const currentOffset = getTimezoneOffset(date, timezone);
  const standardOffset = Math.max(janOffset, julOffset);
  
  return currentOffset !== standardOffset;
}

function getTimezoneOffset(date, timezone) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate - tzDate) / (1000 * 60);
}

// Example: New York DST
const winter = new Date('2025-01-15');
const summer = new Date('2025-07-15');

console.log('Winter offset:', getTimezoneOffset(winter, 'America/New_York')); // -300 (UTC-5)
console.log('Summer offset:', getTimezoneOffset(summer, 'America/New_York')); // -240 (UTC-4)
```

### Converting Between Timezones

```javascript
// Convert a date from one timezone to another
function convertTimezone(date, fromTz, toTz) {
  // Get the date string in the source timezone
  const dateStr = date.toLocaleString('en-US', { 
    timeZone: fromTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Create a new date in the target timezone
  return new Intl.DateTimeFormat('en-US', {
    timeZone: toTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(dateStr));
}

// Create a date at a specific timezone
function createDateInTimezone(dateString, timezone) {
  // Parse the date string as if it were in the target timezone
  const date = new Date(dateString);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate - tzDate;
  return new Date(date.getTime() + offset);
}
```

### 📝 Exercises - Timezones

**Exercise 5.1 (Easy):** Write a function that displays the current time in New York, London, and Tokyo.

<details>
<summary>Solution</summary>

```javascript
function showWorldClocks() {
  const now = new Date();
  const cities = [
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Mumbai', timezone: 'Asia/Kolkata' }
  ];
  
  cities.forEach(city => {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: city.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'short'
    }).format(now);
    
    console.log(`${city.name}: ${time}`);
  });
}

showWorldClocks();
```
</details>

**Exercise 5.2 (Easy):** Detect the user's timezone and display it along with the current UTC offset.

<details>
<summary>Solution</summary>

```javascript
function getUserTimezoneInfo() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  
  const sign = offsetHours >= 0 ? '+' : '';
  const offsetStr = `UTC${sign}${offsetHours}`;
  
  return {
    timezone,
    offsetMinutes,
    offsetHours,
    offsetString: offsetStr
  };
}

console.log(getUserTimezoneInfo());
// Example: { timezone: 'Asia/Kolkata', offsetMinutes: -330, offsetHours: 5.5, offsetString: 'UTC+5.5' }
```
</details>

**Exercise 5.3 (Medium):** Create a meeting scheduler that takes a time in one timezone and shows what time it will be in other timezones.

<details>
<summary>Solution</summary>

```javascript
function scheduleMeeting(dateTimeStr, sourceTimezone, targetTimezones) {
  // Parse the date as a local date string
  const meeting = new Date(dateTimeStr);
  
  console.log(`Meeting scheduled for ${dateTimeStr} in ${sourceTimezone}`);
  console.log('---');
  
  const allTimezones = [sourceTimezone, ...targetTimezones];
  
  allTimezones.forEach(tz => {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(meeting);
    
    console.log(`${tz}: ${formatted}`);
  });
}

// Schedule a meeting at 2 PM EST, see times in other zones
scheduleMeeting(
  '2025-12-20T14:00:00',
  'America/New_York',
  ['Europe/London', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney']
);
```
</details>

**Exercise 5.4 (Medium):** Write a function that checks if a given timezone is currently observing Daylight Saving Time.

<details>
<summary>Solution</summary>

```javascript
function isDSTObserved(timezone, date = new Date()) {
  // Get offset in January (winter in Northern Hemisphere)
  const jan = new Date(date.getFullYear(), 0, 1);
  // Get offset in July (summer in Northern Hemisphere)
  const jul = new Date(date.getFullYear(), 6, 1);
  
  function getOffset(d, tz) {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(d.toLocaleString('en-US', { timeZone: tz }));
    return (local - utc) / (1000 * 60); // offset in minutes
  }
  
  const janOffset = getOffset(jan, timezone);
  const julOffset = getOffset(jul, timezone);
  const currentOffset = getOffset(date, timezone);
  
  // If offsets are different, DST is observed in this timezone
  const hasDST = janOffset !== julOffset;
  
  // Standard time has the smaller offset (more negative or less positive)
  const standardOffset = Math.min(janOffset, julOffset);
  const isDSTNow = currentOffset !== standardOffset;
  
  return {
    hasDST,
    isDSTNow,
    currentOffset,
    standardOffset,
    dstOffset: Math.max(janOffset, julOffset)
  };
}

// Test
console.log('New York:', isDSTObserved('America/New_York'));
console.log('London:', isDSTObserved('Europe/London'));
console.log('Tokyo:', isDSTObserved('Asia/Tokyo')); // No DST in Japan
console.log('India:', isDSTObserved('Asia/Kolkata')); // No DST in India
```
</details>

**Exercise 5.5 (Hard):** Build a timezone converter that converts a datetime from any timezone to any other timezone.

<details>
<summary>Solution</summary>

```javascript
function convertTimezone(dateTimeStr, fromTimezone, toTimezone) {
  // Step 1: Parse the input as if it's in the source timezone
  // We need to figure out the UTC time first
  
  const inputDate = new Date(dateTimeStr);
  
  // Get the formatted string in source timezone to verify input
  const sourceFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(inputDate);
  
  // Get the formatted string in target timezone
  const targetFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  }).format(inputDate);
  
  return {
    input: dateTimeStr,
    fromTimezone,
    toTimezone,
    sourceTime: sourceFormatted,
    targetTime: targetFormatted,
    utcTime: inputDate.toISOString()
  };
}

// Test: Convert 2 PM New York time to Tokyo time
console.log(convertTimezone(
  '2025-12-20T14:00:00',
  'America/New_York',
  'Asia/Tokyo'
));

// Test: Convert 9 AM London to Mumbai
console.log(convertTimezone(
  '2025-12-20T09:00:00',
  'Europe/London',
  'Asia/Kolkata'
));
```
</details>

**Exercise 5.6 (Hard):** Create a function that finds the best meeting time for participants in different timezones, given their working hours (9 AM - 5 PM local time).

<details>
<summary>Solution</summary>

```javascript
function findBestMeetingTime(participants, meetingDurationHours = 1) {
  // participants: [{ name: 'Alice', timezone: 'America/New_York', workStart: 9, workEnd: 17 }]
  
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  
  const overlappingHours = [];
  
  // Check each hour of the day
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const testTime = new Date(baseDate);
    testTime.setUTCHours(utcHour, 0, 0, 0);
    
    let allAvailable = true;
    const localTimes = [];
    
    for (const participant of participants) {
      // Get local hour for this participant
      const localTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: participant.timezone,
        hour: 'numeric',
        hour12: false
      }).format(testTime);
      
      const localHour = parseInt(localTimeStr, 10);
      const workStart = participant.workStart || 9;
      const workEnd = participant.workEnd || 17;
      
      // Check if the meeting (including duration) fits in work hours
      if (localHour < workStart || localHour + meetingDurationHours > workEnd) {
        allAvailable = false;
      }
      
      localTimes.push({
        name: participant.name,
        timezone: participant.timezone,
        localHour,
        isAvailable: localHour >= workStart && localHour + meetingDurationHours <= workEnd
      });
    }
    
    if (allAvailable) {
      overlappingHours.push({
        utcHour,
        utcTime: `${String(utcHour).padStart(2, '0')}:00 UTC`,
        participants: localTimes
      });
    }
  }
  
  return {
    availableSlots: overlappingHours,
    totalSlots: overlappingHours.length,
    recommendation: overlappingHours.length > 0 
      ? overlappingHours[Math.floor(overlappingHours.length / 2)] 
      : null
  };
}

// Test
const participants = [
  { name: 'Alice', timezone: 'America/New_York', workStart: 9, workEnd: 17 },
  { name: 'Bob', timezone: 'Europe/London', workStart: 9, workEnd: 17 },
  { name: 'Charlie', timezone: 'Asia/Kolkata', workStart: 9, workEnd: 18 }
];

console.log(findBestMeetingTime(participants, 1));
```
</details>

---

## 6. Internationalization (Intl API)

### Intl.DateTimeFormat

```javascript
// Basic usage
const date = new Date('2025-12-20T10:30:00Z');

// Different locales
console.log(new Intl.DateTimeFormat('en-US').format(date)); // 12/20/2025
console.log(new Intl.DateTimeFormat('en-GB').format(date)); // 20/12/2025
console.log(new Intl.DateTimeFormat('de-DE').format(date)); // 20.12.2025
console.log(new Intl.DateTimeFormat('ja-JP').format(date)); // 2025/12/20
console.log(new Intl.DateTimeFormat('hi-IN').format(date)); // २०/१२/२०२५
console.log(new Intl.DateTimeFormat('ar-SA').format(date)); // ٢٠‏/١٢‏/٢٠٢٥
```

### Format Options

```javascript
const date = new Date('2025-12-20T10:30:45Z');

// Date options
const dateOptions = {
  weekday: 'long',    // 'narrow', 'short', 'long'
  year: 'numeric',    // 'numeric', '2-digit'
  month: 'long',      // 'numeric', '2-digit', 'narrow', 'short', 'long'
  day: 'numeric',     // 'numeric', '2-digit'
};

console.log(new Intl.DateTimeFormat('en-US', dateOptions).format(date));
// "Saturday, December 20, 2025"

// Time options
const timeOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,       // true for 12-hour, false for 24-hour
  timeZoneName: 'short' // 'short', 'long'
};

console.log(new Intl.DateTimeFormat('en-US', timeOptions).format(date));
// "4:00:45 PM IST"

// Combined
const fullOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/New_York',
  timeZoneName: 'long'
};

console.log(new Intl.DateTimeFormat('en-US', fullOptions).format(date));
// "Saturday, December 20, 2025 at 05:30 AM Eastern Standard Time"
```

### formatToParts()

```javascript
const date = new Date('2025-12-20T10:30:00Z');
const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
});

const parts = formatter.formatToParts(date);
console.log(parts);
/*
[
  { type: 'weekday', value: 'Saturday' },
  { type: 'literal', value: ', ' },
  { type: 'month', value: 'December' },
  { type: 'literal', value: ' ' },
  { type: 'day', value: '20' },
  { type: 'literal', value: ', ' },
  { type: 'year', value: '2025' },
  { type: 'literal', value: ' at ' },
  { type: 'hour', value: '4' },
  { type: 'literal', value: ':' },
  { type: 'minute', value: '00' },
  { type: 'literal', value: ' ' },
  { type: 'dayPeriod', value: 'PM' }
]
*/

// Custom formatting using parts
function customFormat(date, locale, options) {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);
  const partValues = {};
  parts.forEach(({ type, value }) => {
    partValues[type] = value;
  });
  return partValues;
}
```

### formatRange()

```javascript
const start = new Date('2025-12-20');
const end = new Date('2025-12-25');

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

console.log(formatter.formatRange(start, end));
// "December 20 – 25, 2025"

// Different months
const start2 = new Date('2025-11-28');
const end2 = new Date('2025-12-05');
console.log(formatter.formatRange(start2, end2));
// "November 28 – December 5, 2025"
```

### Intl.RelativeTimeFormat

```javascript
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

console.log(rtf.format(-1, 'day'));    // "yesterday"
console.log(rtf.format(0, 'day'));     // "today"
console.log(rtf.format(1, 'day'));     // "tomorrow"
console.log(rtf.format(-2, 'day'));    // "2 days ago"
console.log(rtf.format(2, 'week'));    // "in 2 weeks"
console.log(rtf.format(-1, 'month'));  // "last month"
console.log(rtf.format(1, 'year'));    // "next year"

// With numeric: 'always'
const rtfNumeric = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
console.log(rtfNumeric.format(-1, 'day')); // "1 day ago"
console.log(rtfNumeric.format(1, 'day'));  // "in 1 day"

// Different locales
const rtfDE = new Intl.RelativeTimeFormat('de');
console.log(rtfDE.format(-2, 'day')); // "vor 2 Tagen"

const rtfJA = new Intl.RelativeTimeFormat('ja');
console.log(rtfJA.format(3, 'month')); // "3 か月後"
```

### Smart Relative Time

```javascript
function getRelativeTime(date, baseDate = new Date()) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffMs = date - baseDate;
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, 'week');
  } else if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  } else {
    return rtf.format(diffYears, 'year');
  }
}

// Usage
console.log(getRelativeTime(new Date(Date.now() - 30000)));   // "30 seconds ago"
console.log(getRelativeTime(new Date(Date.now() - 3600000))); // "1 hour ago"
console.log(getRelativeTime(new Date(Date.now() + 86400000))); // "tomorrow"
```

### 📝 Exercises - Internationalization

**Exercise 6.1 (Easy):** Format a date in 5 different locales (US, UK, Germany, Japan, India).

<details>
<summary>Solution</summary>

```javascript
function formatInLocales(date) {
  const locales = [
    { code: 'en-US', name: 'US English' },
    { code: 'en-GB', name: 'UK English' },
    { code: 'de-DE', name: 'German' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'hi-IN', name: 'Hindi (India)' }
  ];
  
  const results = {};
  
  locales.forEach(locale => {
    results[locale.name] = new Intl.DateTimeFormat(locale.code, {
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(date);
  });
  
  return results;
}

console.log(formatInLocales(new Date()));
```
</details>

**Exercise 6.2 (Easy):** Create a function that displays relative time like "2 hours ago", "in 3 days", "yesterday".

<details>
<summary>Solution</summary>

```javascript
function getRelativeTime(date, locale = 'en') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const diffMs = date - now;
  
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);
  
  if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  if (Math.abs(weeks) < 4) return rtf.format(weeks, 'week');
  if (Math.abs(months) < 12) return rtf.format(months, 'month');
  return rtf.format(years, 'year');
}

// Tests
console.log(getRelativeTime(new Date(Date.now() - 1000 * 60 * 60))); // "1 hour ago"
console.log(getRelativeTime(new Date(Date.now() + 1000 * 60 * 60 * 24))); // "tomorrow"
console.log(getRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 24))); // "yesterday"
```
</details>

**Exercise 6.3 (Medium):** Use `formatToParts()` to create a custom date format where day and month are colored differently (return HTML string).

<details>
<summary>Solution</summary>

```javascript
function formatWithColors(date, locale = 'en-US') {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const parts = formatter.formatToParts(date);
  
  const colorMap = {
    weekday: 'blue',
    day: 'red',
    month: 'green',
    year: 'purple',
    literal: 'gray'
  };
  
  const html = parts.map(({ type, value }) => {
    const color = colorMap[type] || 'black';
    return `<span style="color: ${color}">${value}</span>`;
  }).join('');
  
  return html;
}

console.log(formatWithColors(new Date()));
// <span style="color: blue">Saturday</span><span style="color: gray">, </span>...
```
</details>

**Exercise 6.4 (Medium):** Create a date range formatter that intelligently formats ranges like "Dec 20-25, 2025" or "Nov 28 - Dec 5, 2025".

<details>
<summary>Solution</summary>

```javascript
function formatDateRange(startDate, endDate, locale = 'en-US') {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Use built-in formatRange if available
  if (formatter.formatRange) {
    return formatter.formatRange(startDate, endDate);
  }
  
  // Fallback for older browsers
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  
  // Check if same month and year
  if (startDate.getMonth() === endDate.getMonth() && 
      startDate.getFullYear() === endDate.getFullYear()) {
    // Same month: "Dec 20-25, 2025"
    return `${formatter.formatToParts(startDate).find(p => p.type === 'month').value} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
  }
  
  return `${start} - ${end}`;
}

// Tests
console.log(formatDateRange(new Date('2025-12-20'), new Date('2025-12-25')));
// "Dec 20 – 25, 2025"

console.log(formatDateRange(new Date('2025-11-28'), new Date('2025-12-05')));
// "Nov 28 – Dec 5, 2025"
```
</details>

**Exercise 6.5 (Hard):** Build a "time ago" component that updates in real-time and shows appropriate granularity (seconds for recent, then minutes, hours, days).

<details>
<summary>Solution</summary>

```javascript
class LiveTimeAgo {
  constructor(timestamp, element, locale = 'en') {
    this.timestamp = new Date(timestamp);
    this.element = element;
    this.locale = locale;
    this.intervalId = null;
    this.rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  }
  
  getRelativeTime() {
    const now = new Date();
    const diffMs = this.timestamp - now;
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
    if (Math.abs(diffSecs) < 60) {
      return { text: this.rtf.format(diffSecs, 'second'), updateIn: 1000 };
    }
    if (Math.abs(diffMins) < 60) {
      return { text: this.rtf.format(diffMins, 'minute'), updateIn: 60000 };
    }
    if (Math.abs(diffHours) < 24) {
      return { text: this.rtf.format(diffHours, 'hour'), updateIn: 3600000 };
    }
    return { text: this.rtf.format(diffDays, 'day'), updateIn: 86400000 };
  }
  
  update() {
    const { text, updateIn } = this.getRelativeTime();
    
    if (this.element) {
      this.element.textContent = text;
    }
    
    // Clear existing interval and set new one based on granularity
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
    
    this.intervalId = setTimeout(() => this.update(), updateIn);
    
    return text;
  }
  
  start() {
    this.update();
    return this;
  }
  
  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Usage (in browser with DOM element)
// const element = document.getElementById('time-ago');
// const timeAgo = new LiveTimeAgo(Date.now() - 30000, element);
// timeAgo.start();

// For Node.js testing:
const liveTime = new LiveTimeAgo(Date.now() - 30000, null);
console.log(liveTime.update()); // "30 seconds ago"
liveTime.stop();
```
</details>

---

## 7. Date Formatting

### Common Format Patterns

```javascript
const date = new Date('2025-12-20T14:30:45.123Z');

// ISO 8601
date.toISOString();
// "2025-12-20T14:30:45.123Z"

// Custom formats using Intl
function formatDate(date, pattern, locale = 'en-US') {
  const options = {};
  
  switch (pattern) {
    case 'YYYY-MM-DD':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'DD/MM/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'MMMM D, YYYY':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'ddd, MMM D':
      options.weekday = 'short';
      options.month = 'short';
      options.day = 'numeric';
      break;
    default:
      break;
  }
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}
```

### Manual Formatting (without libraries)

```javascript
function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}

function formatCustom(date, format) {
  const tokens = {
    'YYYY': date.getFullYear(),
    'YY': String(date.getFullYear()).slice(-2),
    'MM': pad(date.getMonth() + 1),
    'M': date.getMonth() + 1,
    'DD': pad(date.getDate()),
    'D': date.getDate(),
    'HH': pad(date.getHours()),
    'H': date.getHours(),
    'hh': pad(date.getHours() % 12 || 12),
    'h': date.getHours() % 12 || 12,
    'mm': pad(date.getMinutes()),
    'm': date.getMinutes(),
    'ss': pad(date.getSeconds()),
    's': date.getSeconds(),
    'SSS': pad(date.getMilliseconds(), 3),
    'A': date.getHours() >= 12 ? 'PM' : 'AM',
    'a': date.getHours() >= 12 ? 'pm' : 'am',
  };
  
  let result = format;
  // Sort by length (longest first) to avoid partial replacements
  Object.keys(tokens)
    .sort((a, b) => b.length - a.length)
    .forEach(token => {
      result = result.replace(new RegExp(token, 'g'), tokens[token]);
    });
  
  return result;
}

// Usage
const date = new Date('2025-12-20T14:30:45.123');
console.log(formatCustom(date, 'YYYY-MM-DD'));           // "2025-12-20"
console.log(formatCustom(date, 'DD/MM/YYYY'));           // "20/12/2025"
console.log(formatCustom(date, 'YYYY-MM-DD HH:mm:ss'));  // "2025-12-20 14:30:45"
console.log(formatCustom(date, 'h:mm A'));               // "2:30 PM"
console.log(formatCustom(date, 'HH:mm:ss.SSS'));         // "14:30:45.123"
```

### Parsing Custom Formats

```javascript
function parseDate(dateString, format) {
  const formatParts = {
    'YYYY': { regex: '(\\d{4})', setter: 'setFullYear' },
    'MM': { regex: '(\\d{2})', setter: 'setMonth', adjust: -1 },
    'DD': { regex: '(\\d{2})', setter: 'setDate' },
    'HH': { regex: '(\\d{2})', setter: 'setHours' },
    'mm': { regex: '(\\d{2})', setter: 'setMinutes' },
    'ss': { regex: '(\\d{2})', setter: 'setSeconds' },
  };
  
  let regexStr = format;
  const partOrder = [];
  
  Object.keys(formatParts)
    .sort((a, b) => format.indexOf(a) - format.indexOf(b))
    .forEach(part => {
      if (format.includes(part)) {
        regexStr = regexStr.replace(part, formatParts[part].regex);
        partOrder.push(part);
      }
    });
  
  const regex = new RegExp(`^${regexStr}$`);
  const match = dateString.match(regex);
  
  if (!match) return null;
  
  const date = new Date(0);
  date.setFullYear(2000);
  date.setMonth(0);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  
  partOrder.forEach((part, index) => {
    let value = parseInt(match[index + 1], 10);
    if (formatParts[part].adjust) {
      value += formatParts[part].adjust;
    }
    date[formatParts[part].setter](value);
  });
  
  return date;
}

// Usage
console.log(parseDate('2025-12-20', 'YYYY-MM-DD'));
console.log(parseDate('20/12/2025', 'DD/MM/YYYY'));
console.log(parseDate('2025-12-20 14:30:00', 'YYYY-MM-DD HH:mm:ss'));
```

### 📝 Exercises - Date Formatting

**Exercise 7.1 (Easy):** Format a date as "Saturday, December 20, 2025" using Intl.DateTimeFormat.

<details>
<summary>Solution</summary>

```javascript
function formatLongDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

console.log(formatLongDate(new Date('2025-12-20')));
// "Saturday, December 20, 2025"
```
</details>

**Exercise 7.2 (Easy):** Create a function that formats time as "2:30 PM" or "14:30" based on a parameter.

<details>
<summary>Solution</summary>

```javascript
function formatTime(date, use24Hour = false) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  }).format(date);
}

const now = new Date('2025-12-20T14:30:00');
console.log(formatTime(now, false)); // "2:30 PM"
console.log(formatTime(now, true));  // "14:30"
```
</details>

**Exercise 7.3 (Medium):** Build a custom date formatter that supports tokens like YYYY, MM, DD, HH, mm, ss (similar to moment.js).

<details>
<summary>Solution</summary>

```javascript
function customFormat(date, formatString) {
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  
  const tokens = {
    'YYYY': () => date.getFullYear(),
    'YY': () => String(date.getFullYear()).slice(-2),
    'MMMM': () => date.toLocaleString('en-US', { month: 'long' }),
    'MMM': () => date.toLocaleString('en-US', { month: 'short' }),
    'MM': () => pad(date.getMonth() + 1),
    'M': () => date.getMonth() + 1,
    'DDDD': () => date.toLocaleString('en-US', { weekday: 'long' }),
    'DDD': () => date.toLocaleString('en-US', { weekday: 'short' }),
    'DD': () => pad(date.getDate()),
    'D': () => date.getDate(),
    'HH': () => pad(date.getHours()),
    'H': () => date.getHours(),
    'hh': () => pad(date.getHours() % 12 || 12),
    'h': () => date.getHours() % 12 || 12,
    'mm': () => pad(date.getMinutes()),
    'm': () => date.getMinutes(),
    'ss': () => pad(date.getSeconds()),
    's': () => date.getSeconds(),
    'A': () => date.getHours() >= 12 ? 'PM' : 'AM',
    'a': () => date.getHours() >= 12 ? 'pm' : 'am'
  };
  
  let result = formatString;
  
  // Sort tokens by length (longest first) to avoid partial replacements
  const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length);
  
  for (const token of sortedTokens) {
    result = result.replace(new RegExp(token, 'g'), tokens[token]());
  }
  
  return result;
}

// Tests
const date = new Date('2025-12-20T14:30:45');
console.log(customFormat(date, 'YYYY-MM-DD'));           // "2025-12-20"
console.log(customFormat(date, 'DDDD, MMMM D, YYYY'));   // "Saturday, December 20, 2025"
console.log(customFormat(date, 'h:mm A'));               // "2:30 PM"
console.log(customFormat(date, 'HH:mm:ss'));             // "14:30:45"
console.log(customFormat(date, 'MMM D, YYYY'));          // "Dec 20, 2025"
```
</details>

**Exercise 7.4 (Medium):** Write a date parser that can handle multiple formats: "2025-12-20", "20/12/2025", "Dec 20, 2025".

<details>
<summary>Solution</summary>

```javascript
function smartParse(dateString) {
  const patterns = [
    // ISO format: YYYY-MM-DD
    {
      regex: /^(\d{4})-(\d{2})-(\d{2})$/,
      parse: (m) => ({ year: m[1], month: m[2], day: m[3] })
    },
    // DD/MM/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parse: (m) => ({ day: m[1], month: m[2], year: m[3] })
    },
    // MM/DD/YYYY (US format)
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      parse: (m) => ({ month: m[1], day: m[2], year: m[3] })
    },
    // Mon DD, YYYY
    {
      regex: /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
      parse: (m) => {
        const months = {
          jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
          apr: 4, april: 4, may: 5, jun: 6, june: 6,
          jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
          oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
        };
        return {
          month: months[m[1].toLowerCase()],
          day: m[2],
          year: m[3]
        };
      }
    }
  ];
  
  for (const pattern of patterns) {
    const match = dateString.match(pattern.regex);
    if (match) {
      const { year, month, day } = pattern.parse(match);
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  // Fallback to native parsing
  const fallback = new Date(dateString);
  return isNaN(fallback) ? null : fallback;
}

// Tests
console.log(smartParse('2025-12-20'));      // Dec 20, 2025
console.log(smartParse('20/12/2025'));      // Dec 20, 2025
console.log(smartParse('Dec 20, 2025'));    // Dec 20, 2025
console.log(smartParse('December 20 2025')); // Dec 20, 2025
```
</details>

**Exercise 7.5 (Hard):** Create a "humanize" function that formats dates intelligently: "Just now", "5 minutes ago", "Yesterday at 2:30 PM", "Dec 15 at 3:00 PM", "Dec 15, 2024".

<details>
<summary>Solution</summary>

```javascript
function humanizeDate(date, now = new Date()) {
  const inputDate = new Date(date);
  const diffMs = now - inputDate;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  const fullFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Just now (< 1 minute)
  if (diffSecs < 60) {
    return 'Just now';
  }
  
  // X minutes ago (< 1 hour)
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  }
  
  // X hours ago (< 24 hours but same day)
  if (diffHours < 24 && inputDate.getDate() === now.getDate()) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (inputDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeFormat.format(inputDate)}`;
  }
  
  // This week (within 7 days)
  if (diffDays < 7) {
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(inputDate);
    return `${dayName} at ${timeFormat.format(inputDate)}`;
  }
  
  // This year
  if (inputDate.getFullYear() === now.getFullYear()) {
    return `${dateFormat.format(inputDate)} at ${timeFormat.format(inputDate)}`;
  }
  
  // Different year
  return fullFormat.format(inputDate);
}

// Tests
const now = new Date('2025-12-20T14:30:00');

console.log(humanizeDate(new Date('2025-12-20T14:29:30'), now)); // "Just now"
console.log(humanizeDate(new Date('2025-12-20T14:00:00'), now)); // "30 minutes ago"
console.log(humanizeDate(new Date('2025-12-20T10:00:00'), now)); // "4 hours ago"
console.log(humanizeDate(new Date('2025-12-19T14:30:00'), now)); // "Yesterday at 2:30 PM"
console.log(humanizeDate(new Date('2025-12-15T15:00:00'), now)); // "Monday at 3:00 PM"
console.log(humanizeDate(new Date('2025-11-20T15:00:00'), now)); // "Nov 20 at 3:00 PM"
console.log(humanizeDate(new Date('2024-12-20T15:00:00'), now)); // "Dec 20, 2024"
```
</details>

---

## 8. Date Arithmetic

### Adding/Subtracting Time

```javascript
// Using milliseconds
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

function addMilliseconds(date, ms) {
  return new Date(date.getTime() + ms);
}

function addSeconds(date, seconds) {
  return addMilliseconds(date, seconds * MS_PER_SECOND);
}

function addMinutes(date, minutes) {
  return addMilliseconds(date, minutes * MS_PER_MINUTE);
}

function addHours(date, hours) {
  return addMilliseconds(date, hours * MS_PER_HOUR);
}

function addDays(date, days) {
  return addMilliseconds(date, days * MS_PER_DAY);
}

function addWeeks(date, weeks) {
  return addMilliseconds(date, weeks * MS_PER_WEEK);
}

// Month/Year arithmetic (handles overflow correctly)
function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  
  // Handle month overflow (e.g., Jan 31 + 1 month = Mar 3, should be Feb 28)
  if (result.getDate() !== day) {
    result.setDate(0); // Go to last day of previous month
  }
  return result;
}

function addYears(date, years) {
  return addMonths(date, years * 12);
}

// Usage
const now = new Date();
console.log(addDays(now, 7));      // 1 week from now
console.log(addMonths(now, 1));    // 1 month from now
console.log(addHours(now, -2));    // 2 hours ago
```

### Calculating Differences

```javascript
function dateDiff(date1, date2) {
  const diffMs = Math.abs(date2 - date1);
  
  return {
    milliseconds: diffMs,
    seconds: Math.floor(diffMs / 1000),
    minutes: Math.floor(diffMs / (1000 * 60)),
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
    days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    weeks: Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)),
  };
}

// Precise difference with all units
function preciseDiff(startDate, endDate) {
  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();
  let hours = endDate.getHours() - startDate.getHours();
  let minutes = endDate.getMinutes() - startDate.getMinutes();
  let seconds = endDate.getSeconds() - startDate.getSeconds();
  
  // Normalize negative values
  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }
  
  return { years, months, days, hours, minutes, seconds };
}

// Usage
const start = new Date('2024-06-15');
const end = new Date('2025-12-20');
console.log(preciseDiff(start, end));
// { years: 1, months: 6, days: 5, hours: 0, minutes: 0, seconds: 0 }
```

### Working with Business Days

```javascript
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let addedDays = 0;
  const increment = days > 0 ? 1 : -1;
  
  while (addedDays < Math.abs(days)) {
    result.setDate(result.getDate() + increment);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }
  
  return result;
}

function getBusinessDaysBetween(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// With holidays
function addBusinessDaysWithHolidays(date, days, holidays = []) {
  const holidaySet = new Set(
    holidays.map(h => new Date(h).toDateString())
  );
  
  const result = new Date(date);
  let addedDays = 0;
  const increment = days > 0 ? 1 : -1;
  
  while (addedDays < Math.abs(days)) {
    result.setDate(result.getDate() + increment);
    if (!isWeekend(result) && !holidaySet.has(result.toDateString())) {
      addedDays++;
    }
  }
  
  return result;
}
```

### Start/End of Period

```javascript
function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfWeek(date, weekStartsOn = 0) { // 0 = Sunday
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date, weekStartsOn = 0) {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfMonth(date) {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfMonth(date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfYear(date) {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfYear(date) {
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Usage
const now = new Date();
console.log(startOfDay(now));
console.log(endOfMonth(now));
console.log(startOfWeek(now, 1)); // Week starts on Monday
```

### 📝 Exercises - Date Arithmetic

**Exercise 8.1 (Easy):** Write functions to add and subtract days from a date.

<details>
<summary>Solution</summary>

```javascript
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function subtractDays(date, days) {
  return addDays(date, -days);
}

// Tests
const today = new Date('2025-12-20');
console.log(addDays(today, 7).toDateString());      // "Sat Dec 27 2025"
console.log(subtractDays(today, 7).toDateString()); // "Sat Dec 13 2025"
console.log(addDays(today, 15).toDateString());     // "Sat Jan 04 2026" (crosses month/year)
```
</details>

**Exercise 8.2 (Easy):** Calculate the number of days between two dates.

<details>
<summary>Solution</summary>

```javascript
function daysBetween(date1, date2) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  // Remove time component for accurate day counting
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffMs = Math.abs(d2 - d1);
  return Math.round(diffMs / MS_PER_DAY);
}

// Tests
console.log(daysBetween('2025-12-20', '2025-12-25')); // 5
console.log(daysBetween('2025-01-01', '2025-12-31')); // 364
console.log(daysBetween('2025-12-25', '2025-12-20')); // 5 (absolute value)
```
</details>

**Exercise 8.3 (Medium):** Create a function to get the first and last day of any given month.

<details>
<summary>Solution</summary>

```javascript
function getMonthBounds(year, month) {
  // month is 1-indexed for user convenience (1 = January)
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // Day 0 of next month = last day of this month
  
  return {
    firstDay,
    lastDay,
    firstDayStr: firstDay.toDateString(),
    lastDayStr: lastDay.toDateString(),
    daysInMonth: lastDay.getDate()
  };
}

// Tests
console.log(getMonthBounds(2025, 12)); // December 2025
// { firstDay: Mon Dec 01, lastDay: Wed Dec 31, daysInMonth: 31 }

console.log(getMonthBounds(2025, 2));  // February 2025 (not leap year)
// { firstDay: Sat Feb 01, lastDay: Fri Feb 28, daysInMonth: 28 }

console.log(getMonthBounds(2024, 2));  // February 2024 (leap year)
// { firstDay: Thu Feb 01, lastDay: Thu Feb 29, daysInMonth: 29 }
```
</details>

**Exercise 8.4 (Medium):** Build a function to add months that handles edge cases (e.g., Jan 31 + 1 month should be Feb 28, not March 3).

<details>
<summary>Solution</summary>

```javascript
function addMonthsSafe(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();
  
  // Set to first of month to avoid overflow during month addition
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  
  // Get the last day of the target month
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  
  // Set day to original day or last day of month (whichever is smaller)
  result.setDate(Math.min(originalDay, lastDayOfMonth));
  
  return result;
}

// Tests
const jan31 = new Date('2025-01-31');
console.log(addMonthsSafe(jan31, 1).toDateString()); // "Fri Feb 28 2025"
console.log(addMonthsSafe(jan31, 2).toDateString()); // "Mon Mar 31 2025"

const jan30 = new Date('2025-01-30');
console.log(addMonthsSafe(jan30, 1).toDateString()); // "Fri Feb 28 2025"

// Leap year test
const jan29_2024 = new Date('2024-01-29');
console.log(addMonthsSafe(jan29_2024, 1).toDateString()); // "Thu Feb 29 2024" (leap year!)
```
</details>

**Exercise 8.5 (Medium):** Create a function to calculate a person's age in years, months, and days.

<details>
<summary>Solution</summary>

```javascript
function calculateAge(birthDate, referenceDate = new Date()) {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);
  
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();
  
  // Adjust for negative days
  if (days < 0) {
    months--;
    // Get days in previous month
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years,
    months,
    days,
    formatted: `${years} years, ${months} months, ${days} days`
  };
}

// Tests
console.log(calculateAge('1990-05-15', '2025-12-20'));
// { years: 35, months: 7, days: 5 }

console.log(calculateAge('2000-01-01', '2025-12-20'));
// { years: 25, months: 11, days: 19 }
```
</details>

**Exercise 8.6 (Hard):** Implement a function that calculates business days between two dates, excluding weekends and an optional list of holidays.

<details>
<summary>Solution</summary>

```javascript
function getBusinessDays(startDate, endDate, holidays = []) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Create a Set of holiday date strings for O(1) lookup
  const holidaySet = new Set(
    holidays.map(h => new Date(h).toDateString())
  );
  
  let businessDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(current.toDateString());
    
    if (!isWeekend && !isHoliday) {
      businessDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

// Test
const holidays2025 = [
  '2025-01-01', // New Year
  '2025-12-25', // Christmas
  '2025-12-26', // Boxing Day
];

console.log(getBusinessDays('2025-12-20', '2025-12-31', holidays2025));
// Excludes weekends (21, 27, 28) and holidays (25, 26)

console.log(getBusinessDays('2025-01-01', '2025-01-31', holidays2025));
// January has 23 weekdays, minus 1 holiday = 22 business days
```
</details>

**Exercise 8.7 (Hard):** Create a "deadline calculator" that adds X business days to a date, skipping weekends and holidays.

<details>
<summary>Solution</summary>

```javascript
function addBusinessDays(startDate, daysToAdd, holidays = []) {
  const result = new Date(startDate);
  result.setHours(0, 0, 0, 0);
  
  const holidaySet = new Set(
    holidays.map(h => new Date(h).toDateString())
  );
  
  let addedDays = 0;
  const direction = daysToAdd >= 0 ? 1 : -1;
  const targetDays = Math.abs(daysToAdd);
  
  while (addedDays < targetDays) {
    result.setDate(result.getDate() + direction);
    
    const dayOfWeek = result.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(result.toDateString());
    
    if (!isWeekend && !isHoliday) {
      addedDays++;
    }
  }
  
  return result;
}

// Tests
const holidays = ['2025-12-25', '2025-12-26', '2026-01-01'];

// Start: Friday Dec 19, add 5 business days
// Should skip: Sat 20, Sun 21, Thu 25, Fri 26
// Result should be around Dec 29 or 30
console.log(addBusinessDays('2025-12-19', 5, holidays).toDateString());

// Start: Monday Dec 22, add 10 business days
console.log(addBusinessDays('2025-12-22', 10, holidays).toDateString());

// Negative: Go back 5 business days
console.log(addBusinessDays('2025-12-31', -5, holidays).toDateString());
```
</details>

---

## 9. Handling Server vs Client Time

### The Problem

```javascript
// User in New York (UTC-5) saves a date at 3 PM local time
// Server stores: "2025-12-20T15:00:00" (no timezone info!)

// When user in Tokyo (UTC+9) loads this:
// They see 3 PM Tokyo time, which is WRONG
// Should show 5 AM Tokyo time (3 PM EST = 8 PM UTC = 5 AM next day JST)
```

### Solution: Always Use UTC

```javascript
// 1. CLIENT: Convert local input to UTC before sending to server
function localToUTC(localDateString) {
  const localDate = new Date(localDateString);
  return localDate.toISOString(); // Always UTC
}

// User enters: "2025-12-20 15:00" (their local time)
// Send to server: "2025-12-20T20:00:00.000Z" (UTC, if user is in EST)

// 2. SERVER: Store dates in UTC (ISO 8601 or timestamp)
const dbRecord = {
  createdAt: new Date().toISOString(),
  // OR
  createdAt: Date.now()
};

// 3. CLIENT: Convert UTC to user's local time for display
function utcToLocal(utcDateString, locale = 'en-US', timezone) {
  const date = new Date(utcDateString);
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone || undefined, // undefined = user's local
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

// Server sends: "2025-12-20T20:00:00.000Z"
// User in Tokyo sees: "Dec 21, 2025, 5:00 AM"
// User in New York sees: "Dec 20, 2025, 3:00 PM"
```

### Complete Server-Client Pattern

```javascript
// === API Layer ===

// Sending data to server
async function createEvent(eventData) {
  const payload = {
    ...eventData,
    // Convert local datetime-local input to UTC
    startTime: new Date(eventData.startTime).toISOString(),
    endTime: new Date(eventData.endTime).toISOString(),
  };
  
  return fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Receiving data from server
async function getEvents() {
  const response = await fetch('/api/events');
  const events = await response.json();
  
  // Convert UTC to local for display
  return events.map(event => ({
    ...event,
    startTimeLocal: new Date(event.startTime), // JS Date handles UTC automatically
    endTimeLocal: new Date(event.endTime),
    startTimeFormatted: formatForUser(event.startTime),
    endTimeFormatted: formatForUser(event.endTime),
  }));
}

function formatForUser(utcDateString) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcDateString));
}

// === Form Input Handling ===

// For datetime-local inputs, convert properly
function handleDateTimeInput(inputValue, userTimezone) {
  // datetime-local gives us: "2025-12-20T15:00"
  // This is a "naive" datetime without timezone
  
  // Option 1: Treat as local time (browser's timezone)
  const asLocal = new Date(inputValue);
  
  // Option 2: Treat as specific timezone
  const asTimezone = createDateInTimezone(inputValue, userTimezone);
  
  return asLocal.toISOString();
}
```

### Storing User's Timezone Preference

```javascript
// Store user's preferred timezone in their profile
const userProfile = {
  id: 123,
  timezone: 'America/New_York', // IANA timezone
  locale: 'en-US'
};

// Display dates in user's preferred timezone
function formatForUser(utcDate, userProfile) {
  return new Intl.DateTimeFormat(userProfile.locale, {
    timeZone: userProfile.timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(new Date(utcDate));
}

// Detect user's timezone
function detectUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

### Handling Date-Only Values

```javascript
// For "date-only" data (birthdays, holidays), timezone is tricky

// APPROACH 1: Store as YYYY-MM-DD string (recommended for true date-only data)
const birthday = "1990-05-15"; // No time component

// APPROACH 2: Store as UTC midnight, display date only
const holiday = new Date(Date.UTC(2025, 11, 25)); // Christmas

// When displaying date-only values:
function formatDateOnly(dateString) {
  // Parse as UTC to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Important!
  }).format(date);
}

// DANGER: Don't do this
const birthday = new Date("1990-05-15");
// In UTC-8 timezone, this becomes "1990-05-14" when formatted locally!
```

### 📝 Exercises - Server vs Client Time

**Exercise 9.1 (Easy):** Write a function that converts a local datetime input value to UTC ISO string for sending to a server.

<details>
<summary>Solution</summary>

```javascript
function localToUTCString(localDateTimeString) {
  const localDate = new Date(localDateTimeString);
  
  if (isNaN(localDate.getTime())) {
    throw new Error('Invalid date string');
  }
  
  return localDate.toISOString();
}

// Test: User enters local time
console.log(localToUTCString('2025-12-20T14:30:00'));
// Output depends on your timezone, e.g., "2025-12-20T09:00:00.000Z" for IST
```
</details>

**Exercise 9.2 (Easy):** Write a function that takes a UTC ISO string from a server and formats it in the user's local timezone.

<details>
<summary>Solution</summary>

```javascript
function formatServerDate(utcDateString, options = {}) {
  const date = new Date(utcDateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options
  };
  
  return new Intl.DateTimeFormat(navigator?.language || 'en-US', defaultOptions).format(date);
}

// Server sends UTC time
const serverDate = '2025-12-20T14:30:00.000Z';

// User sees it in their local time
console.log(formatServerDate(serverDate));
// In IST: "Dec 20, 2025, 8:00 PM"
// In EST: "Dec 20, 2025, 9:30 AM"
```
</details>

**Exercise 9.3 (Medium):** Create a complete API layer that handles date conversion for both sending and receiving data.

<details>
<summary>Solution</summary>

```javascript
const DateAPI = {
  // Prepare dates for sending to server (convert to UTC)
  prepareForServer(data) {
    const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'scheduledAt'];
    const prepared = { ...data };
    
    for (const field of dateFields) {
      if (prepared[field]) {
        if (prepared[field] instanceof Date) {
          prepared[field] = prepared[field].toISOString();
        } else if (typeof prepared[field] === 'string') {
          prepared[field] = new Date(prepared[field]).toISOString();
        }
      }
    }
    
    return prepared;
  },
  
  // Process dates received from server (keep as Date objects)
  processFromServer(data) {
    const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'scheduledAt'];
    const processed = { ...data };
    
    for (const field of dateFields) {
      if (processed[field] && typeof processed[field] === 'string') {
        processed[field] = new Date(processed[field]);
      }
    }
    
    return processed;
  },
  
  // Format for display
  formatForDisplay(date, locale = 'en-US') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    
    return {
      date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d),
      time: new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(d),
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d),
      relative: this.getRelativeTime(d)
    };
  },
  
  getRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = date - new Date();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    
    if (Math.abs(days) < 1) {
      const hours = Math.round(diff / (1000 * 60 * 60));
      return rtf.format(hours, 'hour');
    }
    return rtf.format(days, 'day');
  }
};

// Usage Example
const userInput = {
  title: 'Team Meeting',
  startDate: '2025-12-20T14:00:00', // Local time from form
  endDate: '2025-12-20T15:00:00'
};

// Before sending to server
const toSend = DateAPI.prepareForServer(userInput);
console.log('To Server:', toSend);

// After receiving from server
const fromServer = {
  id: 1,
  title: 'Team Meeting',
  startDate: '2025-12-20T08:30:00.000Z',
  createdAt: '2025-12-19T10:00:00.000Z'
};

const processed = DateAPI.processFromServer(fromServer);
console.log('Processed:', processed);
console.log('Display:', DateAPI.formatForDisplay(processed.startDate));
```
</details>

**Exercise 9.4 (Medium):** Handle "date-only" values properly (like birthdays) that shouldn't shift with timezones.

<details>
<summary>Solution</summary>

```javascript
const DateOnlyHelper = {
  // Store date-only as YYYY-MM-DD string (no timezone conversion)
  toDateString(date) {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date; // Already in correct format
    }
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },
  
  // Parse date-only string to Date (at midnight UTC)
  fromDateString(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  },
  
  // Format for display without timezone shifting
  formatDisplay(dateString, locale = 'en-US') {
    const date = this.fromDateString(dateString);
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Important! Display in UTC to prevent shifting
    }).format(date);
  },
  
  // Calculate age from birthday
  calculateAge(birthdayString) {
    const [year, month, day] = birthdayString.split('-').map(Number);
    const today = new Date();
    
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() + 1 - month;
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }
    
    return age;
  }
};

// Usage
const birthday = '1990-05-15';

console.log('Stored:', birthday);
console.log('Display:', DateOnlyHelper.formatDisplay(birthday));
console.log('Age:', DateOnlyHelper.calculateAge(birthday));

// This will display "May 15, 1990" regardless of user's timezone
```
</details>

**Exercise 9.5 (Hard):** Build a timezone-aware event system where users can create events in their timezone and view them in any timezone.

<details>
<summary>Solution</summary>

```javascript
class TimezoneAwareEvent {
  constructor(eventData) {
    this.id = eventData.id || crypto.randomUUID();
    this.title = eventData.title;
    this.description = eventData.description || '';
    
    // Always store in UTC
    this.startTimeUTC = this.normalizeToUTC(eventData.startTime, eventData.timezone);
    this.endTimeUTC = this.normalizeToUTC(eventData.endTime, eventData.timezone);
    
    // Store original timezone for reference
    this.originalTimezone = eventData.timezone;
    this.createdAt = new Date().toISOString();
  }
  
  normalizeToUTC(dateTimeStr, timezone) {
    // If already UTC (ends with Z), use directly
    if (dateTimeStr.endsWith('Z')) {
      return dateTimeStr;
    }
    
    // Parse the local datetime
    const localDate = new Date(dateTimeStr);
    return localDate.toISOString();
  }
  
  getInTimezone(timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    return {
      ...this.toJSON(),
      displayTimezone: timezone,
      startTimeDisplay: formatter.format(new Date(this.startTimeUTC)),
      endTimeDisplay: formatter.format(new Date(this.endTimeUTC))
    };
  }
  
  isHappeningNow() {
    const now = new Date();
    const start = new Date(this.startTimeUTC);
    const end = new Date(this.endTimeUTC);
    return now >= start && now <= end;
  }
  
  getTimeUntilStart() {
    const now = new Date();
    const start = new Date(this.startTimeUTC);
    const diff = start - now;
    
    if (diff < 0) return 'Already started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `In ${days} day${days > 1 ? 's' : ''}`;
    }
    
    return `In ${hours}h ${minutes}m`;
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startTimeUTC: this.startTimeUTC,
      endTimeUTC: this.endTimeUTC,
      originalTimezone: this.originalTimezone,
      createdAt: this.createdAt
    };
  }
}

// Usage
const event = new TimezoneAwareEvent({
  title: 'Global Team Standup',
  startTime: '2025-12-20T09:00:00',
  endTime: '2025-12-20T09:30:00',
  timezone: 'America/New_York'
});

console.log('Stored (UTC):', event.toJSON());
console.log('');
console.log('View in New York:', event.getInTimezone('America/New_York'));
console.log('');
console.log('View in London:', event.getInTimezone('Europe/London'));
console.log('');
console.log('View in Tokyo:', event.getInTimezone('Asia/Tokyo'));
console.log('');
console.log('Time until start:', event.getTimeUntilStart());
```
</details>

---

## 10. Common Pitfalls & Best Practices

### Pitfall 1: Month is 0-Indexed

```javascript
// WRONG
const december = new Date(2025, 12, 25); // Actually January 25, 2026!

// CORRECT
const december = new Date(2025, 11, 25); // December 25, 2025

// Tip: Use named constants
const MONTHS = {
  JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3,
  MAY: 4, JUNE: 5, JULY: 6, AUGUST: 7,
  SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11
};

const christmas = new Date(2025, MONTHS.DECEMBER, 25);
```

### Pitfall 2: Date String Parsing Ambiguity

```javascript
// DANGEROUS - behavior varies by browser and locale
new Date("01/02/2025"); // Jan 2 or Feb 1?
new Date("2025/01/02"); // Inconsistent parsing

// SAFE - ISO 8601 format
new Date("2025-01-02");           // January 2, 2025, UTC midnight
new Date("2025-01-02T00:00:00");  // Local midnight
new Date("2025-01-02T00:00:00Z"); // UTC midnight
```

### Pitfall 3: Date Mutation

```javascript
// Dates are mutable objects!

// WRONG
function addDaysBad(date, days) {
  date.setDate(date.getDate() + days);
  return date; // Mutated original!
}

const original = new Date();
const future = addDaysBad(original, 7);
console.log(original === future); // true - same object!

// CORRECT
function addDaysGood(date, days) {
  const result = new Date(date); // Clone first
  result.setDate(result.getDate() + days);
  return result;
}
```

### Pitfall 4: Timezone Confusion

```javascript
// new Date() with components uses LOCAL timezone
const local = new Date(2025, 11, 20, 12, 0, 0);
console.log(local.toISOString()); // Different UTC time depending on where you run this

// Use Date.UTC() for explicit UTC
const utc = new Date(Date.UTC(2025, 11, 20, 12, 0, 0));
console.log(utc.toISOString()); // "2025-12-20T12:00:00.000Z" - always
```

### Pitfall 5: Invalid Date Handling

```javascript
// Date constructor returns "Invalid Date" for bad input
const invalid = new Date("not a date");
console.log(invalid); // Invalid Date
console.log(invalid.getTime()); // NaN

// Always validate dates
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

function parseAndValidate(dateString) {
  const date = new Date(dateString);
  if (!isValidDate(date)) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  return date;
}
```

### Pitfall 6: Comparing Dates

```javascript
// WRONG - compares references, not values
const date1 = new Date("2025-12-20");
const date2 = new Date("2025-12-20");
console.log(date1 === date2); // false!
console.log(date1 == date2);  // false!

// CORRECT - compare timestamps
console.log(date1.getTime() === date2.getTime()); // true

// Or for relative comparison
console.log(date1 < date2);  // false (same time)
console.log(date1 <= date2); // true

// Helper functions
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function isBefore(date1, date2) {
  return date1.getTime() < date2.getTime();
}

function isAfter(date1, date2) {
  return date1.getTime() > date2.getTime();
}
```

### Best Practices Summary

```javascript
// 1. Always store dates in UTC
const stored = new Date().toISOString();

// 2. Use ISO 8601 format for serialization
const serialized = date.toISOString();

// 3. Parse with explicit format when possible
const parsed = new Date("2025-12-20T10:30:00Z");

// 4. Clone before modifying
const clone = new Date(original);

// 5. Validate dates
if (!isValidDate(date)) throw new Error("Invalid date");

// 6. Use Intl for formatting
const formatted = new Intl.DateTimeFormat('en-US').format(date);

// 7. Be explicit about timezones
const inNewYork = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York'
}).format(date);

// 8. Use constants for magic numbers
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 9. Document timezone expectations
/**
 * @param {string} dateStr - ISO 8601 UTC timestamp
 * @returns {Date} Date object in UTC
 */
function parseUTC(dateStr) {
  return new Date(dateStr);
}
```

### 📝 Exercises - Pitfalls & Best Practices

**Exercise 10.1 (Easy):** Fix all the bugs in this code:
```javascript
const date1 = new Date(2025, 12, 25); // Christmas
const date2 = new Date("01/02/2025"); // January 2nd
if (date1 == date2) console.log("Same!");
```

<details>
<summary>Solution</summary>

```javascript
// Bug 1: Month is 0-indexed, so 12 is actually January next year
// Bug 2: "01/02/2025" is ambiguous (could be Jan 2 or Feb 1)
// Bug 3: == compares references, not values

// FIXED:
const date1 = new Date(2025, 11, 25); // December (month 11)
const date2 = new Date("2025-01-02"); // ISO format is unambiguous

// Compare using timestamps
if (date1.getTime() === date2.getTime()) {
  console.log("Same!");
} else {
  console.log("Different!");
}
```
</details>

**Exercise 10.2 (Easy):** This function has a mutation bug. Fix it.
```javascript
function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}
```

<details>
<summary>Solution</summary>

```javascript
// The problem: This mutates the original date object!

function addDays(date, days) {
  const result = new Date(date); // Clone first!
  result.setDate(result.getDate() + days);
  return result;
}

// Test to verify no mutation
const original = new Date('2025-12-20');
const modified = addDays(original, 7);

console.log('Original:', original.toDateString()); // "Sat Dec 20 2025" - unchanged
console.log('Modified:', modified.toDateString()); // "Sat Dec 27 2025"
console.log('Same object?', original === modified); // false
```
</details>

**Exercise 10.3 (Medium):** Create a robust date validation function that checks for all edge cases.

<details>
<summary>Solution</summary>

```javascript
function validateDate(input) {
  const errors = [];
  
  // Check if input exists
  if (input === null || input === undefined) {
    return { valid: false, errors: ['Date is required'] };
  }
  
  // Try to create a date
  let date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    date = new Date(input);
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else {
    return { valid: false, errors: ['Invalid input type'] };
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return { valid: false, errors: ['Invalid date format'] };
  }
  
  // Check for reasonable date range (e.g., year 1900-2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    errors.push(`Year ${year} is outside reasonable range (1900-2100)`);
  }
  
  // Additional business rules can be added here
  // e.g., no future dates for birthdays
  
  return {
    valid: errors.length === 0,
    date: errors.length === 0 ? date : null,
    errors
  };
}

// Tests
console.log(validateDate('2025-12-20'));        // Valid
console.log(validateDate('invalid'));            // Invalid format
console.log(validateDate(null));                 // Required
console.log(validateDate('0001-01-01'));        // Outside range
console.log(validateDate(new Date('invalid'))); // Invalid Date object
```
</details>

**Exercise 10.4 (Medium):** Write a function that safely compares two dates with various comparison operations.

<details>
<summary>Solution</summary>

```javascript
const DateCompare = {
  isEqual(date1, date2) {
    return this._toTimestamp(date1) === this._toTimestamp(date2);
  },
  
  isBefore(date1, date2) {
    return this._toTimestamp(date1) < this._toTimestamp(date2);
  },
  
  isAfter(date1, date2) {
    return this._toTimestamp(date1) > this._toTimestamp(date2);
  },
  
  isSameDay(date1, date2) {
    const d1 = this._toDate(date1);
    const d2 = this._toDate(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },
  
  isSameMonth(date1, date2) {
    const d1 = this._toDate(date1);
    const d2 = this._toDate(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth();
  },
  
  isBetween(date, start, end, inclusive = true) {
    const d = this._toTimestamp(date);
    const s = this._toTimestamp(start);
    const e = this._toTimestamp(end);
    
    if (inclusive) {
      return d >= s && d <= e;
    }
    return d > s && d < e;
  },
  
  min(...dates) {
    const timestamps = dates.map(d => this._toTimestamp(d));
    return new Date(Math.min(...timestamps));
  },
  
  max(...dates) {
    const timestamps = dates.map(d => this._toTimestamp(d));
    return new Date(Math.max(...timestamps));
  },
  
  _toDate(input) {
    if (input instanceof Date) return input;
    return new Date(input);
  },
  
  _toTimestamp(input) {
    return this._toDate(input).getTime();
  }
};

// Tests
const date1 = new Date('2025-12-20T10:00:00Z');
const date2 = new Date('2025-12-20T15:00:00Z');
const date3 = new Date('2025-12-21T10:00:00Z');

console.log('Equal:', DateCompare.isEqual(date1, date1)); // true
console.log('Before:', DateCompare.isBefore(date1, date2)); // true
console.log('Same day:', DateCompare.isSameDay(date1, date2)); // true
console.log('Same day:', DateCompare.isSameDay(date1, date3)); // false
console.log('Between:', DateCompare.isBetween(date2, date1, date3)); // true
console.log('Min:', DateCompare.min(date1, date2, date3)); // date1
console.log('Max:', DateCompare.max(date1, date2, date3)); // date3
```
</details>

**Exercise 10.5 (Hard):** Create a "DateSafe" wrapper class that prevents common date mistakes.

<details>
<summary>Solution</summary>

```javascript
class DateSafe {
  #date; // Private field
  
  constructor(input) {
    if (input instanceof DateSafe) {
      this.#date = new Date(input.toDate());
    } else if (input instanceof Date) {
      this.#date = new Date(input);
    } else if (typeof input === 'string') {
      // Only accept ISO format to avoid ambiguity
      if (!/^\d{4}-\d{2}-\d{2}/.test(input)) {
        throw new Error('Use ISO format (YYYY-MM-DD) for date strings');
      }
      this.#date = new Date(input);
    } else if (typeof input === 'number') {
      this.#date = new Date(input);
    } else if (input === undefined) {
      this.#date = new Date();
    } else {
      throw new Error('Invalid date input');
    }
    
    if (isNaN(this.#date.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Freeze to prevent modification
    Object.freeze(this);
  }
  
  // Immutable operations - always return new DateSafe
  addDays(days) {
    const result = new Date(this.#date);
    result.setDate(result.getDate() + days);
    return new DateSafe(result);
  }
  
  addMonths(months) {
    const result = new Date(this.#date);
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return new DateSafe(result);
  }
  
  addYears(years) {
    return this.addMonths(years * 12);
  }
  
  startOfDay() {
    const result = new Date(this.#date);
    result.setHours(0, 0, 0, 0);
    return new DateSafe(result);
  }
  
  endOfDay() {
    const result = new Date(this.#date);
    result.setHours(23, 59, 59, 999);
    return new DateSafe(result);
  }
  
  // Getters (1-indexed month for safety!)
  get year() { return this.#date.getFullYear(); }
  get month() { return this.#date.getMonth() + 1; } // 1-indexed!
  get day() { return this.#date.getDate(); }
  get dayOfWeek() { return this.#date.getDay(); }
  get hours() { return this.#date.getHours(); }
  get minutes() { return this.#date.getMinutes(); }
  get seconds() { return this.#date.getSeconds(); }
  get timestamp() { return this.#date.getTime(); }
  
  // Comparison
  equals(other) {
    const otherDate = other instanceof DateSafe ? other.timestamp : new Date(other).getTime();
    return this.timestamp === otherDate;
  }
  
  isBefore(other) {
    const otherDate = other instanceof DateSafe ? other.timestamp : new Date(other).getTime();
    return this.timestamp < otherDate;
  }
  
  isAfter(other) {
    const otherDate = other instanceof DateSafe ? other.timestamp : new Date(other).getTime();
    return this.timestamp > otherDate;
  }
  
  // Formatting
  format(locale = 'en-US', options = {}) {
    return new Intl.DateTimeFormat(locale, options).format(this.#date);
  }
  
  toISOString() {
    return this.#date.toISOString();
  }
  
  toDate() {
    return new Date(this.#date); // Return a clone
  }
  
  toString() {
    return this.#date.toString();
  }
  
  // Static factory methods
  static now() {
    return new DateSafe();
  }
  
  static fromComponents(year, month, day, hours = 0, minutes = 0, seconds = 0) {
    // Month is 1-indexed in this API!
    return new DateSafe(new Date(year, month - 1, day, hours, minutes, seconds));
  }
  
  static parse(dateString) {
    return new DateSafe(dateString);
  }
}

// Usage - Safe and immutable!
const today = DateSafe.now();
const nextWeek = today.addDays(7);
const nextMonth = today.addMonths(1);

console.log('Today:', today.toISOString());
console.log('Next week:', nextWeek.toISOString());
console.log('Next month:', nextMonth.toISOString());
console.log('Month (1-indexed):', today.month); // Returns 1-12, not 0-11!

// This would throw an error:
// const bad = new DateSafe("12/25/2025"); // Error: Use ISO format

// This is safe:
const christmas = DateSafe.fromComponents(2025, 12, 25); // December 25
console.log('Christmas:', christmas.format('en-US', { dateStyle: 'full' }));
```
</details>

---

## 11. Libraries Overview

### When to Use Libraries

Use native Date when:
- Simple date display/formatting
- Basic date arithmetic
- Working with timestamps
- Small bundle size is critical

Use libraries when:
- Complex timezone conversions
- Recurring dates/schedules
- Date parsing from various formats
- Heavy date manipulation
- Need immutability guarantees

### Popular Libraries Comparison

| Library | Size | Immutable | Timezone Support | Best For |
|---------|------|-----------|------------------|----------|
| date-fns | 13KB | Yes | With add-on | Modern, tree-shakable |
| Day.js | 2KB | Yes | Plugin | Moment.js replacement |
| Luxon | 23KB | Yes | Excellent | Full timezone support |
| Temporal (Stage 3) | Native | Yes | Excellent | Future standard |

### date-fns Examples

```javascript
import { 
  format, 
  addDays, 
  differenceInDays,
  isAfter,
  parseISO 
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Formatting
format(new Date(), 'yyyy-MM-dd HH:mm:ss');
// "2025-12-20 14:30:45"

format(new Date(), 'EEEE, MMMM do, yyyy');
// "Saturday, December 20th, 2025"

// Arithmetic
addDays(new Date(), 7);
differenceInDays(new Date(), new Date('2025-01-01'));

// Comparison
isAfter(new Date(), new Date('2025-01-01'));

// Timezone
formatInTimeZone(
  new Date(),
  'America/New_York',
  'yyyy-MM-dd HH:mm:ss zzz'
);
```

### Day.js Examples

```javascript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Basic
dayjs().format('YYYY-MM-DD HH:mm:ss');

// Arithmetic
dayjs().add(7, 'day');
dayjs().subtract(1, 'month');

// Timezone
dayjs().tz('America/New_York').format();

// Relative time
dayjs('2025-01-01').fromNow(); // "11 months ago"
```

### Luxon Examples

```javascript
import { DateTime, Duration, Interval } from 'luxon';

// Creation
const now = DateTime.now();
const utc = DateTime.utc();
const fromISO = DateTime.fromISO('2025-12-20T10:30:00');
const inZone = DateTime.fromISO('2025-12-20T10:30:00', { zone: 'America/New_York' });

// Formatting
now.toFormat('yyyy-MM-dd HH:mm:ss');
now.toLocaleString(DateTime.DATETIME_FULL);

// Timezone conversion
now.setZone('Asia/Tokyo').toFormat('HH:mm');

// Arithmetic
now.plus({ days: 7, hours: 3 });
now.minus({ months: 1 });

// Comparison
const start = DateTime.fromISO('2025-01-01');
const end = DateTime.fromISO('2025-12-31');
const interval = Interval.fromDateTimes(start, end);
interval.length('days'); // 364
```

### Temporal API (Upcoming Standard)

```javascript
// Note: Temporal is Stage 3 proposal, not yet available in all environments
// Requires polyfill: npm install @js-temporal/polyfill

import { Temporal } from '@js-temporal/polyfill';

// PlainDate - Date without time or timezone
const date = Temporal.PlainDate.from('2025-12-20');
date.add({ days: 7 });

// PlainTime - Time without date or timezone
const time = Temporal.PlainTime.from('14:30:00');

// PlainDateTime - Date and time, no timezone
const dateTime = Temporal.PlainDateTime.from('2025-12-20T14:30:00');

// ZonedDateTime - Full date/time with timezone
const zoned = Temporal.ZonedDateTime.from('2025-12-20T14:30:00[America/New_York]');
zoned.withTimeZone('Asia/Tokyo');

// Instant - Exact moment in time (like timestamp)
const instant = Temporal.Instant.from('2025-12-20T14:30:00Z');

// Duration
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });

// Advantages over Date:
// - Immutable
// - Explicit timezone handling
// - Separate types for different use cases
// - No month 0-indexing
// - Better arithmetic
```

### 📝 Exercises - Libraries

**Exercise 11.1 (Easy):** Using only native JavaScript, implement equivalents for these common date-fns functions:
- `isToday(date)`
- `isTomorrow(date)`
- `isYesterday(date)`

<details>
<summary>Solution</summary>

```javascript
function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(date);
  
  return d.getDate() === tomorrow.getDate() &&
         d.getMonth() === tomorrow.getMonth() &&
         d.getFullYear() === tomorrow.getFullYear();
}

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
}

// Tests
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

console.log('isToday:', isToday(today));           // true
console.log('isTomorrow:', isTomorrow(tomorrow));  // true
console.log('isYesterday:', isYesterday(yesterday)); // true
```
</details>

**Exercise 11.2 (Medium):** Create a mini date utility library with chainable methods (similar to Day.js API).

<details>
<summary>Solution</summary>

```javascript
function miniDate(input) {
  const date = input ? new Date(input) : new Date();
  
  return {
    _date: date,
    
    // Getters
    year() { return this._date.getFullYear(); },
    month() { return this._date.getMonth(); },
    date() { return this._date.getDate(); },
    day() { return this._date.getDay(); },
    hour() { return this._date.getHours(); },
    minute() { return this._date.getMinutes(); },
    second() { return this._date.getSeconds(); },
    
    // Manipulation (chainable)
    add(value, unit) {
      const result = new Date(this._date);
      
      switch (unit) {
        case 'day':
        case 'days':
          result.setDate(result.getDate() + value);
          break;
        case 'month':
        case 'months':
          result.setMonth(result.getMonth() + value);
          break;
        case 'year':
        case 'years':
          result.setFullYear(result.getFullYear() + value);
          break;
        case 'hour':
        case 'hours':
          result.setHours(result.getHours() + value);
          break;
        case 'minute':
        case 'minutes':
          result.setMinutes(result.getMinutes() + value);
          break;
      }
      
      return miniDate(result);
    },
    
    subtract(value, unit) {
      return this.add(-value, unit);
    },
    
    startOf(unit) {
      const result = new Date(this._date);
      
      switch (unit) {
        case 'day':
          result.setHours(0, 0, 0, 0);
          break;
        case 'month':
          result.setDate(1);
          result.setHours(0, 0, 0, 0);
          break;
        case 'year':
          result.setMonth(0, 1);
          result.setHours(0, 0, 0, 0);
          break;
      }
      
      return miniDate(result);
    },
    
    endOf(unit) {
      const result = new Date(this._date);
      
      switch (unit) {
        case 'day':
          result.setHours(23, 59, 59, 999);
          break;
        case 'month':
          result.setMonth(result.getMonth() + 1, 0);
          result.setHours(23, 59, 59, 999);
          break;
        case 'year':
          result.setMonth(11, 31);
          result.setHours(23, 59, 59, 999);
          break;
      }
      
      return miniDate(result);
    },
    
    // Comparison
    isBefore(other) {
      return this._date < new Date(other);
    },
    
    isAfter(other) {
      return this._date > new Date(other);
    },
    
    isSame(other, unit = 'millisecond') {
      const d1 = this._date;
      const d2 = new Date(other);
      
      switch (unit) {
        case 'year':
          return d1.getFullYear() === d2.getFullYear();
        case 'month':
          return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
        case 'day':
          return d1.toDateString() === d2.toDateString();
        default:
          return d1.getTime() === d2.getTime();
      }
    },
    
    // Output
    format(formatStr) {
      const pad = (n) => String(n).padStart(2, '0');
      
      return formatStr
        .replace('YYYY', this._date.getFullYear())
        .replace('MM', pad(this._date.getMonth() + 1))
        .replace('DD', pad(this._date.getDate()))
        .replace('HH', pad(this._date.getHours()))
        .replace('mm', pad(this._date.getMinutes()))
        .replace('ss', pad(this._date.getSeconds()));
    },
    
    toDate() {
      return new Date(this._date);
    },
    
    toISOString() {
      return this._date.toISOString();
    },
    
    valueOf() {
      return this._date.getTime();
    }
  };
}

// Usage (like Day.js!)
console.log(miniDate().format('YYYY-MM-DD'));
console.log(miniDate().add(7, 'days').format('YYYY-MM-DD'));
console.log(miniDate().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
console.log(miniDate().isBefore(miniDate().add(1, 'day')));
```
</details>

**Exercise 11.3 (Hard):** Implement a subset of the Temporal API proposal using native JavaScript.

<details>
<summary>Solution</summary>

```javascript
// Simplified Temporal-like API

const Temporal = {
  // PlainDate - date without time or timezone
  PlainDate: class {
    constructor(year, month, day) {
      this.year = year;
      this.month = month; // 1-indexed like Temporal!
      this.day = day;
      Object.freeze(this);
    }
    
    static from(input) {
      if (typeof input === 'string') {
        const [year, month, day] = input.split('-').map(Number);
        return new Temporal.PlainDate(year, month, day);
      }
      return new Temporal.PlainDate(input.year, input.month, input.day);
    }
    
    add(duration) {
      const date = new Date(this.year, this.month - 1, this.day);
      if (duration.days) date.setDate(date.getDate() + duration.days);
      if (duration.months) date.setMonth(date.getMonth() + duration.months);
      if (duration.years) date.setFullYear(date.getFullYear() + duration.years);
      
      return new Temporal.PlainDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
    }
    
    subtract(duration) {
      const negated = {};
      for (const key in duration) {
        negated[key] = -duration[key];
      }
      return this.add(negated);
    }
    
    equals(other) {
      return this.year === other.year &&
             this.month === other.month &&
             this.day === other.day;
    }
    
    toString() {
      const pad = (n) => String(n).padStart(2, '0');
      return `${this.year}-${pad(this.month)}-${pad(this.day)}`;
    }
    
    toJSON() {
      return this.toString();
    }
    
    get dayOfWeek() {
      const date = new Date(this.year, this.month - 1, this.day);
      return date.getDay() || 7; // 1-7 (Monday = 1)
    }
  },
  
  // PlainTime - time without date or timezone
  PlainTime: class {
    constructor(hour = 0, minute = 0, second = 0, millisecond = 0) {
      this.hour = hour;
      this.minute = minute;
      this.second = second;
      this.millisecond = millisecond;
      Object.freeze(this);
    }
    
    static from(input) {
      if (typeof input === 'string') {
        const parts = input.split(':');
        return new Temporal.PlainTime(
          parseInt(parts[0]) || 0,
          parseInt(parts[1]) || 0,
          parseInt(parts[2]) || 0
        );
      }
      return new Temporal.PlainTime(input.hour, input.minute, input.second, input.millisecond);
    }
    
    toString() {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(this.hour)}:${pad(this.minute)}:${pad(this.second)}`;
    }
  },
  
  // PlainDateTime - date and time without timezone
  PlainDateTime: class {
    constructor(year, month, day, hour = 0, minute = 0, second = 0) {
      this.year = year;
      this.month = month;
      this.day = day;
      this.hour = hour;
      this.minute = minute;
      this.second = second;
      Object.freeze(this);
    }
    
    static from(input) {
      if (typeof input === 'string') {
        const [datePart, timePart] = input.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = (timePart || '00:00:00').split(':').map(n => parseInt(n) || 0);
        return new Temporal.PlainDateTime(year, month, day, hour, minute, second);
      }
      return new Temporal.PlainDateTime(
        input.year, input.month, input.day,
        input.hour, input.minute, input.second
      );
    }
    
    toPlainDate() {
      return new Temporal.PlainDate(this.year, this.month, this.day);
    }
    
    toPlainTime() {
      return new Temporal.PlainTime(this.hour, this.minute, this.second);
    }
    
    toString() {
      const pad = (n) => String(n).padStart(2, '0');
      return `${this.year}-${pad(this.month)}-${pad(this.day)}T${pad(this.hour)}:${pad(this.minute)}:${pad(this.second)}`;
    }
  },
  
  // Now - get current date/time
  Now: {
    plainDateISO() {
      const now = new Date();
      return new Temporal.PlainDate(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      );
    },
    
    plainTimeISO() {
      const now = new Date();
      return new Temporal.PlainTime(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );
    },
    
    plainDateTimeISO() {
      const now = new Date();
      return new Temporal.PlainDateTime(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
    }
  }
};

// Usage - like the real Temporal API!
const today = Temporal.Now.plainDateISO();
console.log('Today:', today.toString());

const christmas = Temporal.PlainDate.from('2025-12-25');
console.log('Christmas:', christmas.toString());
console.log('Day of week:', christmas.dayOfWeek); // 4 = Thursday

const nextWeek = today.add({ days: 7 });
console.log('Next week:', nextWeek.toString());

const meeting = Temporal.PlainDateTime.from('2025-12-20T14:30:00');
console.log('Meeting:', meeting.toString());
console.log('Meeting date:', meeting.toPlainDate().toString());
console.log('Meeting time:', meeting.toPlainTime().toString());
```
</details>

---

## 12. Real-World Patterns

### Pattern 1: Event Scheduling System

```javascript
class EventScheduler {
  constructor(userTimezone) {
    this.userTimezone = userTimezone;
  }

  // Create event in user's timezone
  createEvent(title, localDateTime) {
    // Store as UTC
    const utc = this.localToUTC(localDateTime);
    
    return {
      id: crypto.randomUUID(),
      title,
      startTimeUTC: utc.toISOString(),
      createdAt: new Date().toISOString(),
      timezone: this.userTimezone
    };
  }

  localToUTC(localDateTimeString) {
    // Parse as local time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // For simplicity, parse the input and adjust
    const localDate = new Date(localDateTimeString);
    return localDate;
  }

  // Display event in any timezone
  displayEvent(event, displayTimezone) {
    const date = new Date(event.startTimeUTC);
    
    return {
      ...event,
      displayTime: new Intl.DateTimeFormat('en-US', {
        timeZone: displayTimezone,
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(date),
      displayTimezone
    };
  }

  // Check if event is happening now
  isHappening(event, durationMinutes = 60) {
    const start = new Date(event.startTimeUTC);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    
    return now >= start && now <= end;
  }
}

// Usage
const scheduler = new EventScheduler('America/New_York');
const event = scheduler.createEvent('Team Meeting', '2025-12-20T14:00:00');

console.log(scheduler.displayEvent(event, 'America/New_York'));
console.log(scheduler.displayEvent(event, 'Asia/Tokyo'));
```

### Pattern 2: Countdown Timer

```javascript
class CountdownTimer {
  constructor(targetDate) {
    this.targetDate = new Date(targetDate);
    this.callbacks = [];
    this.intervalId = null;
  }

  getTimeRemaining() {
    const now = new Date();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      expired: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalMilliseconds: diff
    };
  }

  onTick(callback) {
    this.callbacks.push(callback);
  }

  start() {
    this.intervalId = setInterval(() => {
      const remaining = this.getTimeRemaining();
      this.callbacks.forEach(cb => cb(remaining));
      
      if (remaining.expired) {
        this.stop();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  format(remaining) {
    if (remaining.expired) return 'Expired!';
    
    const pad = n => String(n).padStart(2, '0');
    return `${remaining.days}d ${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`;
  }
}

// Usage
const newYear = new CountdownTimer('2026-01-01T00:00:00');
newYear.onTick(remaining => {
  console.log(newYear.format(remaining));
});
newYear.start();
```

### Pattern 3: Date Range Picker Logic

```javascript
class DateRangePicker {
  constructor(options = {}) {
    this.minDate = options.minDate ? new Date(options.minDate) : null;
    this.maxDate = options.maxDate ? new Date(options.maxDate) : null;
    this.disabledDates = new Set(
      (options.disabledDates || []).map(d => new Date(d).toDateString())
    );
    this.startDate = null;
    this.endDate = null;
  }

  isDateDisabled(date) {
    const d = new Date(date);
    
    if (this.minDate && d < this.minDate) return true;
    if (this.maxDate && d > this.maxDate) return true;
    if (this.disabledDates.has(d.toDateString())) return true;
    
    return false;
  }

  selectDate(date) {
    const d = new Date(date);
    
    if (this.isDateDisabled(d)) {
      throw new Error('Date is disabled');
    }

    if (!this.startDate || (this.startDate && this.endDate)) {
      // Start new selection
      this.startDate = d;
      this.endDate = null;
    } else {
      // Complete selection
      if (d < this.startDate) {
        this.endDate = this.startDate;
        this.startDate = d;
      } else {
        this.endDate = d;
      }
    }

    return this.getSelection();
  }

  getSelection() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      isComplete: !!(this.startDate && this.endDate),
      days: this.endDate 
        ? Math.round((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1
        : 0
    };
  }

  getDatesInRange() {
    if (!this.startDate || !this.endDate) return [];
    
    const dates = [];
    const current = new Date(this.startDate);
    
    while (current <= this.endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  generateCalendarMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const weeks = [];
    let currentWeek = new Array(startPadding).fill(null);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      currentWeek.push({
        date,
        day,
        isDisabled: this.isDateDisabled(date),
        isSelected: this.isDateSelected(date),
        isInRange: this.isInRange(date),
        isToday: this.isToday(date)
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }

  isDateSelected(date) {
    const d = date.toDateString();
    return (this.startDate && d === this.startDate.toDateString()) ||
           (this.endDate && d === this.endDate.toDateString());
  }

  isInRange(date) {
    if (!this.startDate || !this.endDate) return false;
    return date >= this.startDate && date <= this.endDate;
  }

  isToday(date) {
    return date.toDateString() === new Date().toDateString();
  }
}
```

### Pattern 4: Recurring Events

```javascript
class RecurringEvent {
  constructor(options) {
    this.startDate = new Date(options.startDate);
    this.endDate = options.endDate ? new Date(options.endDate) : null;
    this.frequency = options.frequency; // 'daily', 'weekly', 'monthly', 'yearly'
    this.interval = options.interval || 1;
    this.daysOfWeek = options.daysOfWeek || []; // [0-6] for weekly
    this.dayOfMonth = options.dayOfMonth; // 1-31 for monthly
    this.count = options.count; // Max occurrences
  }

  getNextOccurrence(afterDate = new Date()) {
    let current = new Date(Math.max(this.startDate, afterDate));
    current.setHours(
      this.startDate.getHours(),
      this.startDate.getMinutes(),
      this.startDate.getSeconds(),
      0
    );

    const maxIterations = 1000; // Safety limit
    let iterations = 0;

    while (iterations < maxIterations) {
      if (this.isOccurrence(current) && current > afterDate) {
        if (this.endDate && current > this.endDate) return null;
        return current;
      }
      
      current = this.incrementDate(current);
      iterations++;
    }

    return null;
  }

  getOccurrences(fromDate, toDate, maxResults = 100) {
    const occurrences = [];
    let current = new Date(fromDate);

    while (current <= toDate && occurrences.length < maxResults) {
      if (this.isOccurrence(current)) {
        occurrences.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return occurrences;
  }

  isOccurrence(date) {
    if (date < this.startDate) return false;
    if (this.endDate && date > this.endDate) return false;

    switch (this.frequency) {
      case 'daily':
        return this.isDailyOccurrence(date);
      case 'weekly':
        return this.isWeeklyOccurrence(date);
      case 'monthly':
        return this.isMonthlyOccurrence(date);
      case 'yearly':
        return this.isYearlyOccurrence(date);
      default:
        return false;
    }
  }

  isDailyOccurrence(date) {
    const daysDiff = Math.floor((date - this.startDate) / (1000 * 60 * 60 * 24));
    return daysDiff % this.interval === 0;
  }

  isWeeklyOccurrence(date) {
    if (this.daysOfWeek.length > 0 && !this.daysOfWeek.includes(date.getDay())) {
      return false;
    }
    
    const weeksDiff = Math.floor((date - this.startDate) / (1000 * 60 * 60 * 24 * 7));
    return weeksDiff % this.interval === 0;
  }

  isMonthlyOccurrence(date) {
    const targetDay = this.dayOfMonth || this.startDate.getDate();
    if (date.getDate() !== targetDay) return false;
    
    const monthsDiff = 
      (date.getFullYear() - this.startDate.getFullYear()) * 12 +
      (date.getMonth() - this.startDate.getMonth());
    
    return monthsDiff >= 0 && monthsDiff % this.interval === 0;
  }

  isYearlyOccurrence(date) {
    if (date.getMonth() !== this.startDate.getMonth()) return false;
    if (date.getDate() !== this.startDate.getDate()) return false;
    
    const yearsDiff = date.getFullYear() - this.startDate.getFullYear();
    return yearsDiff >= 0 && yearsDiff % this.interval === 0;
  }

  incrementDate(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    return result;
  }
}

// Usage
const weeklyMeeting = new RecurringEvent({
  startDate: '2025-01-06',
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  endDate: '2025-12-31'
});

console.log(weeklyMeeting.getOccurrences(
  new Date('2025-01-01'),
  new Date('2025-01-31')
));
```

### Pattern 5: Activity/Log Timestamps

```javascript
class ActivityLogger {
  constructor() {
    this.activities = [];
  }

  log(action, metadata = {}) {
    this.activities.push({
      id: crypto.randomUUID(),
      action,
      metadata,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now()
    });
  }

  getActivities(options = {}) {
    let filtered = [...this.activities];

    // Filter by date range
    if (options.from) {
      const from = new Date(options.from).getTime();
      filtered = filtered.filter(a => a.timestampMs >= from);
    }
    if (options.to) {
      const to = new Date(options.to).getTime();
      filtered = filtered.filter(a => a.timestampMs <= to);
    }

    // Filter by action
    if (options.action) {
      filtered = filtered.filter(a => a.action === options.action);
    }

    // Group by time period
    if (options.groupBy) {
      return this.groupByPeriod(filtered, options.groupBy);
    }

    return filtered;
  }

  groupByPeriod(activities, period) {
    const groups = {};

    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      let key;

      switch (period) {
        case 'hour':
          key = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = activity.timestamp;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });

    return groups;
  }

  formatActivityTime(activity, style = 'relative') {
    const date = new Date(activity.timestamp);

    switch (style) {
      case 'relative':
        return this.getRelativeTime(date);
      case 'absolute':
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(date);
      case 'time-only':
        return new Intl.DateTimeFormat('en-US', {
          timeStyle: 'short'
        }).format(date);
      default:
        return date.toISOString();
    }
  }

  getRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = date - new Date();
    const diffSecs = Math.round(diff / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second');
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(diffDays, 'day');
  }
}

// Usage
const logger = new ActivityLogger();

logger.log('login', { userId: 123 });
logger.log('page_view', { page: '/dashboard' });
logger.log('button_click', { button: 'submit' });

console.log(logger.getActivities({ groupBy: 'hour' }));
```

---

## Quick Reference

### Creating Dates
```javascript
new Date()                          // Now
new Date(timestamp)                 // From milliseconds
new Date("2025-12-20T10:30:00Z")   // From ISO string
new Date(2025, 11, 20)             // From components (month 0-indexed!)
Date.now()                         // Current timestamp
Date.UTC(2025, 11, 20)             // UTC timestamp
```

### Common Operations
```javascript
date.getTime()                     // Get timestamp
date.toISOString()                 // Get ISO string (UTC)
date.getTimezoneOffset()           // Get timezone offset in minutes
new Date(date)                     // Clone a date
```

### Formatting
```javascript
new Intl.DateTimeFormat('en-US', options).format(date)
new Intl.RelativeTimeFormat('en').format(-1, 'day')
```

### Timezone
```javascript
new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' }).format(date)
Intl.DateTimeFormat().resolvedOptions().timeZone  // Get user's timezone
```

### Comparison
```javascript
date1.getTime() === date2.getTime()  // Equality
date1 < date2                         // Before
date1 > date2                         // After
```

### 📝 Exercises - Real-World Patterns

**Exercise 12.1 (Medium):** Build a simple booking system that prevents double-booking.

<details>
<summary>Solution</summary>

```javascript
class BookingSystem {
  constructor() {
    this.bookings = [];
  }
  
  isOverlapping(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }
  
  canBook(startTime, endTime, resourceId) {
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);
    
    // Validate times
    if (newEnd <= newStart) {
      return { canBook: false, reason: 'End time must be after start time' };
    }
    
    // Check for conflicts
    const conflict = this.bookings.find(booking => {
      if (booking.resourceId !== resourceId) return false;
      
      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(booking.endTime);
      
      return this.isOverlapping(newStart, newEnd, existingStart, existingEnd);
    });
    
    if (conflict) {
      return {
        canBook: false,
        reason: 'Time slot conflicts with existing booking',
        conflictWith: conflict
      };
    }
    
    return { canBook: true };
  }
  
  createBooking(startTime, endTime, resourceId, userId) {
    const check = this.canBook(startTime, endTime, resourceId);
    
    if (!check.canBook) {
      throw new Error(check.reason);
    }
    
    const booking = {
      id: crypto.randomUUID(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      resourceId,
      userId,
      createdAt: new Date().toISOString()
    };
    
    this.bookings.push(booking);
    return booking;
  }
  
  getBookingsForDate(date, resourceId) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return this.bookings.filter(booking => {
      if (resourceId && booking.resourceId !== resourceId) return false;
      
      const bookingStart = new Date(booking.startTime);
      return bookingStart >= targetDate && bookingStart < nextDate;
    });
  }
  
  getAvailableSlots(date, resourceId, slotDurationMinutes = 60) {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Business hours: 9 AM
    
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0); // Business hours: 5 PM
    
    const existingBookings = this.getBookingsForDate(date, resourceId);
    const slots = [];
    
    let current = new Date(dayStart);
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);
      
      if (slotEnd <= dayEnd) {
        const isAvailable = !existingBookings.some(booking => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return this.isOverlapping(current, slotEnd, bookingStart, bookingEnd);
        });
        
        if (isAvailable) {
          slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            formatted: `${current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
          });
        }
      }
      
      current = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);
    }
    
    return slots;
  }
}

// Usage
const system = new BookingSystem();

// Create some bookings
system.createBooking('2025-12-20T10:00:00', '2025-12-20T11:00:00', 'room-1', 'user-1');
system.createBooking('2025-12-20T14:00:00', '2025-12-20T15:30:00', 'room-1', 'user-2');

// Check availability
console.log(system.canBook('2025-12-20T10:30:00', '2025-12-20T11:30:00', 'room-1'));
// { canBook: false, reason: 'Time slot conflicts...' }

console.log(system.canBook('2025-12-20T11:00:00', '2025-12-20T12:00:00', 'room-1'));
// { canBook: true }

// Get available slots
console.log(system.getAvailableSlots('2025-12-20', 'room-1', 60));
```
</details>

**Exercise 12.2 (Medium):** Create a reminder system that can schedule notifications for specific dates/times.

<details>
<summary>Solution</summary>

```javascript
class ReminderSystem {
  constructor() {
    this.reminders = [];
    this.timeouts = new Map();
  }
  
  addReminder(message, triggerTime, callback) {
    const id = crypto.randomUUID();
    const trigger = new Date(triggerTime);
    
    if (trigger <= new Date()) {
      throw new Error('Reminder time must be in the future');
    }
    
    const reminder = {
      id,
      message,
      triggerTime: trigger.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    this.reminders.push(reminder);
    this.scheduleReminder(reminder, callback);
    
    return reminder;
  }
  
  scheduleReminder(reminder, callback) {
    const delay = new Date(reminder.triggerTime) - new Date();
    
    if (delay <= 0) return;
    
    const timeoutId = setTimeout(() => {
      reminder.status = 'triggered';
      callback(reminder);
      this.timeouts.delete(reminder.id);
    }, delay);
    
    this.timeouts.set(reminder.id, timeoutId);
  }
  
  cancelReminder(id) {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) return false;
    
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
    
    reminder.status = 'cancelled';
    return true;
  }
  
  getUpcomingReminders() {
    const now = new Date();
    return this.reminders
      .filter(r => r.status === 'pending' && new Date(r.triggerTime) > now)
      .sort((a, b) => new Date(a.triggerTime) - new Date(b.triggerTime));
  }
  
  getRemindersForDay(date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    return this.reminders.filter(r => {
      const trigger = new Date(r.triggerTime);
      return trigger >= dayStart && trigger < dayEnd;
    });
  }
  
  // Snooze a reminder
  snoozeReminder(id, snoozeMinutes = 10) {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) return null;
    
    // Cancel existing timeout
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) clearTimeout(timeoutId);
    
    // Set new trigger time
    const newTrigger = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    reminder.triggerTime = newTrigger.toISOString();
    reminder.status = 'pending';
    reminder.snoozedAt = new Date().toISOString();
    
    return reminder;
  }
}

// Usage
const reminders = new ReminderSystem();

// Add reminder for 5 seconds from now (for testing)
const soon = new Date(Date.now() + 5000);
const reminder = reminders.addReminder(
  'Time for standup!',
  soon,
  (r) => console.log(`🔔 REMINDER: ${r.message}`)
);

console.log('Reminder scheduled:', reminder);
console.log('Upcoming:', reminders.getUpcomingReminders());
```
</details>

**Exercise 12.3 (Hard):** Build a complete calendar month view generator with events.

<details>
<summary>Solution</summary>

```javascript
class CalendarMonth {
  constructor(year, month, events = []) {
    this.year = year;
    this.month = month; // 1-indexed
    this.events = events;
  }
  
  getMonthData() {
    const firstDay = new Date(this.year, this.month - 1, 1);
    const lastDay = new Date(this.year, this.month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Get days from previous month to fill first week
    const prevMonthLastDay = new Date(this.year, this.month - 1, 0).getDate();
    
    const weeks = [];
    let currentWeek = [];
    
    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      currentWeek.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isPrevMonth: true,
        date: new Date(this.year, this.month - 2, prevMonthLastDay - i)
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.year, this.month - 1, day);
      
      currentWeek.push({
        day,
        isCurrentMonth: true,
        date,
        isToday: this.isToday(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        events: this.getEventsForDate(date)
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add days from next month
    let nextMonthDay = 1;
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push({
        day: nextMonthDay,
        isCurrentMonth: false,
        isNextMonth: true,
        date: new Date(this.year, this.month, nextMonthDay)
      });
      nextMonthDay++;
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return {
      year: this.year,
      month: this.month,
      monthName: firstDay.toLocaleString('en-US', { month: 'long' }),
      daysInMonth,
      weeks,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  }
  
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  getEventsForDate(date) {
    const dateStr = date.toDateString();
    return this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dateStr;
    });
  }
  
  renderToConsole() {
    const data = this.getMonthData();
    
    console.log(`\n  ${data.monthName} ${data.year}`);
    console.log('  ' + data.weekdays.join('  '));
    console.log('  ' + '-'.repeat(27));
    
    for (const week of data.weeks) {
      let line = '  ';
      for (const day of week) {
        let dayStr = String(day.day).padStart(2, ' ');
        
        if (!day.isCurrentMonth) {
          dayStr = `\x1b[90m${dayStr}\x1b[0m`; // Gray
        } else if (day.isToday) {
          dayStr = `\x1b[32m${dayStr}\x1b[0m`; // Green
        } else if (day.isWeekend) {
          dayStr = `\x1b[34m${dayStr}\x1b[0m`; // Blue
        }
        
        if (day.events?.length > 0) {
          dayStr += '*';
        } else {
          dayStr += ' ';
        }
        
        line += dayStr + ' ';
      }
      console.log(line);
    }
  }
  
  // Generate HTML for web display
  renderToHTML() {
    const data = this.getMonthData();
    
    let html = `
      <div class="calendar">
        <h2>${data.monthName} ${data.year}</h2>
        <table>
          <thead>
            <tr>${data.weekdays.map(d => `<th>${d}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;
    
    for (const week of data.weeks) {
      html += '<tr>';
      for (const day of week) {
        const classes = [];
        if (!day.isCurrentMonth) classes.push('other-month');
        if (day.isToday) classes.push('today');
        if (day.isWeekend) classes.push('weekend');
        if (day.events?.length) classes.push('has-events');
        
        html += `<td class="${classes.join(' ')}">
          <span class="day-number">${day.day}</span>
          ${day.events?.map(e => `<div class="event">${e.title}</div>`).join('') || ''}
        </td>`;
      }
      html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    return html;
  }
}

// Usage
const events = [
  { title: 'Team Meeting', startTime: '2025-12-15T10:00:00' },
  { title: 'Project Review', startTime: '2025-12-20T14:00:00' },
  { title: 'Christmas Party', startTime: '2025-12-24T18:00:00' },
  { title: 'Christmas', startTime: '2025-12-25T00:00:00' }
];

const calendar = new CalendarMonth(2025, 12, events);
calendar.renderToConsole();
console.log(calendar.getMonthData());
```
</details>

**Exercise 12.4 (Hard):** Create a time tracking system that calculates hours worked per day/week/month.

<details>
<summary>Solution</summary>

```javascript
class TimeTracker {
  constructor() {
    this.entries = [];
    this.currentEntry = null;
  }
  
  clockIn(projectId, notes = '') {
    if (this.currentEntry) {
      throw new Error('Already clocked in. Clock out first.');
    }
    
    this.currentEntry = {
      id: crypto.randomUUID(),
      projectId,
      notes,
      clockIn: new Date().toISOString(),
      clockOut: null
    };
    
    return this.currentEntry;
  }
  
  clockOut(notes = '') {
    if (!this.currentEntry) {
      throw new Error('Not clocked in.');
    }
    
    this.currentEntry.clockOut = new Date().toISOString();
    if (notes) this.currentEntry.notes += ' | ' + notes;
    
    this.entries.push(this.currentEntry);
    const completed = this.currentEntry;
    this.currentEntry = null;
    
    return completed;
  }
  
  addManualEntry(projectId, clockIn, clockOut, notes = '') {
    const entry = {
      id: crypto.randomUUID(),
      projectId,
      notes,
      clockIn: new Date(clockIn).toISOString(),
      clockOut: new Date(clockOut).toISOString(),
      manual: true
    };
    
    this.entries.push(entry);
    return entry;
  }
  
  calculateDuration(entry) {
    const start = new Date(entry.clockIn);
    const end = new Date(entry.clockOut);
    const durationMs = end - start;
    
    return {
      milliseconds: durationMs,
      seconds: Math.floor(durationMs / 1000),
      minutes: Math.floor(durationMs / (1000 * 60)),
      hours: durationMs / (1000 * 60 * 60),
      formatted: this.formatDuration(durationMs)
    };
  }
  
  formatDuration(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
  
  getEntriesForDateRange(startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return this.entries.filter(entry => {
      const clockIn = new Date(entry.clockIn);
      return clockIn >= start && clockIn <= end;
    });
  }
  
  getDailyReport(date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const entries = this.getEntriesForDateRange(dayStart, dayEnd);
    const byProject = {};
    let totalMs = 0;
    
    entries.forEach(entry => {
      const duration = this.calculateDuration(entry);
      totalMs += duration.milliseconds;
      
      if (!byProject[entry.projectId]) {
        byProject[entry.projectId] = { entries: [], totalMs: 0 };
      }
      byProject[entry.projectId].entries.push(entry);
      byProject[entry.projectId].totalMs += duration.milliseconds;
    });
    
    return {
      date: dayStart.toDateString(),
      totalTime: this.formatDuration(totalMs),
      totalHours: (totalMs / (1000 * 60 * 60)).toFixed(2),
      entryCount: entries.length,
      byProject: Object.entries(byProject).map(([projectId, data]) => ({
        projectId,
        totalTime: this.formatDuration(data.totalMs),
        totalHours: (data.totalMs / (1000 * 60 * 60)).toFixed(2),
        entries: data.entries.length
      }))
    };
  }
  
  getWeeklyReport(weekStartDate) {
    const start = new Date(weekStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    
    const days = [];
    let totalMs = 0;
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);
      const dayReport = this.getDailyReport(dayDate);
      days.push(dayReport);
      totalMs += parseFloat(dayReport.totalHours) * 60 * 60 * 1000;
    }
    
    return {
      weekStart: start.toDateString(),
      weekEnd: new Date(end.getTime() - 1).toDateString(),
      totalTime: this.formatDuration(totalMs),
      totalHours: (totalMs / (1000 * 60 * 60)).toFixed(2),
      days,
      averagePerDay: (totalMs / 7 / (1000 * 60 * 60)).toFixed(2) + 'h'
    };
  }
}

// Usage
const tracker = new TimeTracker();

// Add some manual entries
tracker.addManualEntry('project-a', '2025-12-20T09:00:00', '2025-12-20T12:30:00', 'Morning work');
tracker.addManualEntry('project-a', '2025-12-20T13:30:00', '2025-12-20T17:00:00', 'Afternoon work');
tracker.addManualEntry('project-b', '2025-12-20T17:00:00', '2025-12-20T18:30:00', 'Extra work');

tracker.addManualEntry('project-a', '2025-12-19T09:00:00', '2025-12-19T17:00:00', 'Full day');

console.log('Daily Report:', tracker.getDailyReport('2025-12-20'));
console.log('Weekly Report:', tracker.getWeeklyReport('2025-12-15'));
```
</details>

---

## 🎯 Final Challenge Exercises

These exercises combine multiple concepts for comprehensive practice.

**Challenge 1:** Build a "Working Hours Calculator" that:
- Takes start date, end date, and daily working hours
- Excludes weekends
- Excludes a list of holidays
- Returns total working hours

**Challenge 2:** Create a "Timezone Meeting Planner" that:
- Takes a list of participants with their timezones
- Finds all possible 1-hour meeting slots during business hours (9-5) for all participants
- Displays the meeting time in each participant's local timezone

**Challenge 3:** Implement a "Recurring Event Engine" that:
- Supports daily, weekly, monthly, and yearly recurrence
- Handles "every X days/weeks/months"
- Handles "every Monday and Wednesday"
- Handles "last Friday of the month"
- Can generate occurrences between two dates

**Challenge 4:** Build a "Date Input Validator" that:
- Validates various date input formats
- Checks for reasonable date ranges (not in distant past/future)
- Validates time is within business hours
- Returns detailed error messages

**Challenge 5:** Create a "Time Zone Aware Notification System" that:
- Schedules notifications at specific times in user's timezone
- Handles DST transitions correctly
- Supports recurring notifications
- Can snooze notifications

---

## Conclusion

JavaScript's Date handling can be tricky, but understanding these core concepts will help you:

1. **Always work in UTC** for storage and transmission
2. **Use Intl APIs** for formatting and localization
3. **Be explicit** about timezones
4. **Validate** all date inputs
5. **Clone** before mutating
6. **Consider libraries** for complex operations

The upcoming Temporal API will solve many of these issues, but until then, these patterns will serve you well!

