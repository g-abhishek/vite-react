# Instagram Comment Section — Complete Guide (Basics to Advanced)

> A step-by-step, interview-ready guide to building an Instagram-like comment section in React — frontend only — teaching one feature at a time so you understand the *why*, not just the code.

**Companion docs:** For Fiber and reconciliation internals, see [`04-React-Internals.md`](./04-React-Internals.md). For general interview patterns, see [`09-React-Interview-Complete-Guide.md`](./09-React-Interview-Complete-Guide.md). **Practice in:** [`vite-react`](../vite-react/) as you follow each step.

**How to use this guide:** Do not copy the final file at once. Build each step in your project, run it, break it intentionally, then fix it. After each step, answer the **Interview talking points** out loud.

---

## Table of Contents

1. [What is an Instagram Comment Section? — The Real Explanation](#1-what-is-an-instagram-comment-section--the-real-explanation)
2. [Why This Feature Matters — The Problems It Solves](#2-why-this-feature-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Architecture Overview — Components, Data Model, and Props Flow](#4-architecture-overview--components-data-model-and-props-flow)
5. [Step 1 — Static Comment List (Read-Only UI)](#5-step-1--static-comment-list-read-only-ui)
6. [Step 2 — Add a Comment (Controlled Input + Events)](#6-step-2--add-a-comment-controlled-input--events)
7. [Step 3 — Lift State to the Parent (Single Source of Truth)](#7-step-3--lift-state-to-the-parent-single-source-of-truth)
8. [Step 4 — Likes and Unlikes (Immutable Updates)](#8-step-4--likes-and-unlikes-immutable-updates)
9. [Step 5 — Nested Replies (Recursive Rendering)](#9-step-5--nested-replies-recursive-rendering)
10. [Step 6 — Flat vs Nested Data (The Data Model Decision)](#10-step-6--flat-vs-nested-data-the-data-model-decision)
11. [Step 7 — Edit Comments (Conditional UI + Local Edit State)](#11-step-7--edit-comments-conditional-ui--local-edit-state)
12. [Step 8 — Delete Comments (Tree Traversal + Edge Cases)](#12-step-8--delete-comments-tree-traversal--edge-cases)
13. [Step 9 — Form Validation (Client-Side Rules)](#13-step-9--form-validation-client-side-rules)
14. [Step 10 — Loading States, Empty States, and Optimistic UI](#14-step-10--loading-states-empty-states-and-optimistic-ui)
15. [Step 11 — useReducer for Complex Comment State](#15-step-11--usereducer-for-complex-comment-state)
16. [Step 12 — Performance: Memoization and Render Boundaries](#16-step-12--performance-memoization-and-render-boundaries)
17. [Advanced Patterns](#17-advanced-patterns)
18. [When to Use What — Decision Guide](#18-when-to-use-what--decision-guide)
19. [Common Pitfalls & How to Avoid Them](#19-common-pitfalls--how-to-avoid-them)
20. [Final Recap — Full Flow Walkthrough](#20-final-recap--full-flow-walkthrough)
21. [Interview Tips — Explaining the Solution Clearly](#21-interview-tips--explaining-the-solution-clearly)

---

## 1. What is an Instagram Comment Section? — The Real Explanation

### One sentence

An **Instagram-like comment section** is a UI where users can **read**, **write**, **reply to**, **edit**, **delete**, and **like** comments on a post — with nested threads, validation, and responsive feedback — all driven by React state on the frontend.

### Before you build it (the problem)

```
┌─────────────────────────────────────────────────────────────┐
│  A post with no comment system                               │
├─────────────────────────────────────────────────────────────┤
│  User sees content                                           │
│  User has thoughts → nowhere to put them                     │
│  No social proof (likes, replies)                            │
│  No conversation thread                                      │
└─────────────────────────────────────────────────────────────┘
```

### After you build it (the solution)

```
┌─────────────────────────────────────────────────────────────┐
│  Post                                                         │
│  ├── CommentSection (container — owns all comment state)     │
│  │     ├── CommentList                                       │
│  │     │     ├── CommentItem (top-level)                     │
│  │     │     │     ├── LikeButton                            │
│  │     │     │     ├── ReplyForm (toggle)                    │
│  │     │     │     └── CommentList (replies, nested)         │
│  │     │     └── CommentItem ...                             │
│  │     └── CommentForm (add top-level comment)               │
└─────────────────────────────────────────────────────────────┘
```

### What we are NOT building (scope boundary)

| In scope (frontend) | Out of scope (backend — mention in interviews) |
|---------------------|------------------------------------------------|
| Rendering comment threads | REST/GraphQL API design |
| Local/mock state updates | Database schema, pagination cursors |
| Form validation | Auth ("can this user edit?") |
| Loading/empty UI | WebSocket real-time sync |
| Optimistic UI patterns | Rate limiting, spam detection |

Interview tip: Always state scope first. "I'll implement the frontend with mock data and pure update functions. In production, these handlers would call an API and reconcile server responses."

---

## 2. Why This Feature Matters — The Problems It Solves

Building a comment section forces you to solve **six recurring frontend problems** that appear in almost every interview and every production app.

### Problem 1 — Lists that change over time

Comments are a **dynamic list**: add, remove, reorder (by date), filter. React's `map()` + `key` discipline is non-negotiable.

### Problem 2 — Hierarchical data (trees)

Replies are **children of comments**. You must decide: nested JSON vs flat list with `parentId`. Wrong choice = painful updates.

### Problem 3 — Shared mutable state

Likes, edits, and deletes touch the **same array** from multiple child components. You need one source of truth and immutable updates.

### Problem 4 — Conditional UI modes

A comment can be in **view mode** or **edit mode**. A thread can show or hide a reply form. This is classic conditional rendering.

### Problem 5 — Forms with validation

Empty comments, max length, profanity filters (mock), and disabled submit while invalid — all client-side before any API call.

### Problem 6 — Perceived performance

Optimistic updates, loading skeletons, and memoization prevent "every keystroke re-renders the whole tree."

### What breaks without proper architecture

```javascript
// BAD: each CommentItem owns its own copy of replies
function CommentItem({ comment }) {
  const [replies, setReplies] = useState(comment.replies);
  // Parent never knows replies changed → counts, "load more", sync all break
}
```

---

## 3. Core Concepts & Mental Models

Before writing code, lock in these terms. Every step in this guide uses them.

| Term | Definition | Comment section example |
|------|------------|-------------------------|
| **Component** | Reusable UI + logic unit | `CommentItem`, `LikeButton` |
| **Props** | Data passed **down** from parent | `comment`, `onLike`, `depth` |
| **State** | Data owned **inside** a component | `isEditing`, `draftText` |
| **Lifted state** | State moved to common ancestor | `comments[]` in `CommentSection` |
| **Controlled input** | Input value = React state | Reply textarea bound to `text` |
| **Immutable update** | New object/array, never mutate | `[...comments, newComment]` |
| **Derived state** | Computed from other state (don't duplicate) | `isLiked = likedBy.includes(currentUserId)` |
| **Conditional rendering** | UI branches on state | `{isEditing ? <EditForm /> : <View />}` |
| **Composition** | Build big UI from small pieces | `CommentSection` wraps list + form |
| **Recursion** | Component renders itself for children | `CommentItem` renders nested `CommentList` |

### Mental model: the comment section as a state machine

```
                    ┌──────────────┐
                    │   IDLE       │  viewing comments
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ COMPOSING  │  │  EDITING   │  │  LOADING   │
    │ new/reply  │  │  comment   │  │  API/mock  │
    └────────────┘  └────────────┘  └────────────┘
```

Each mode changes which components mount and which handlers are active. Keeping modes explicit prevents "mystery UI bugs."

### Data flow (always remember this arrow diagram)

```
CommentSection (state owner)
      │
      │ props: comments, handlers
      ▼
 CommentList
      │
      │ props: comment, onLike, onReply, ...
      ▼
 CommentItem ──event──► handler in CommentSection ──setState──► re-render
```

**Events flow up. Data flows down.** Instagram's UI feels instant because state updates are local and batched — you'll mimic that with mock delays and optimistic updates.

---

## 4. Architecture Overview — Components, Data Model, and Props Flow

Build the skeleton before features. This is what interviewers ask first: *"How would you structure this?"*

### Suggested component tree

```
CommentSection          ← owns comments state, all mutations
├── CommentForm         ← top-level "Add a comment..."
├── CommentList         ← maps top-level comments only
│   └── CommentItem     ← one comment row (recursive for replies)
│       ├── CommentHeader   (avatar, username, timestamp)
│       ├── CommentBody     (text or edit form)
│       ├── CommentActions  (like, reply, edit, delete)
│       ├── ReplyForm       (conditional — reply to THIS comment)
│       └── CommentList     ← same component, depth + 1
└── EmptyState / LoadingSkeleton (conditional)
```

### Suggested data model (nested — start here)

Nested trees match how humans think about threads. Start nested for learning; Step 6 shows when to flatten.

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} avatarUrl
 */

/**
 * @typedef {Object} Comment
 * @property {string} id          - stable unique id (never array index)
 * @property {string} postId
 * @property {string} authorId
 * @property {User}   author
 * @property {string} text
 * @property {string} createdAt   - ISO string
 * @property {string} updatedAt   - ISO string | null
 * @property {string[]} likedBy   - user ids who liked
 * @property {Comment[]} replies  - nested replies (max depth enforced in UI)
 */
```

### Flat alternative (production-friendly)

```javascript
/**
 * @typedef {Object} FlatComment
 * @property {string} id
 * @property {string} postId
 * @property {string | null} parentId  - null = top-level
 * @property {string} authorId
 * @property {string} text
 * @property {string} createdAt
 * @property {string[]} likedBy
 */
// Build tree at render time OR store Map<id, FlatComment>
```

### Props flow contract (define early)

| Handler | Passed from | Signature | Purpose |
|---------|-------------|-----------|---------|
| `onAddComment` | `CommentSection` | `(text, parentId?) => void` | New top-level or reply |
| `onLike` | `CommentSection` | `(commentId) => void` | Toggle like |
| `onEdit` | `CommentSection` | `(commentId, newText) => void` | Save edit |
| `onDelete` | `CommentSection` | `(commentId) => void` | Remove comment + replies |
| `currentUser` | `CommentSection` | `User` | Authorship checks |

Centralizing handlers in `CommentSection` means **one place** to swap mock → API later.

### Seed mock data (reuse in every step)

```javascript
// ─── mockData.js ───────────────────────────────────────────────
export const CURRENT_USER = {
  id: 'user-1',
  username: 'alex_dev',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
};

export const INITIAL_COMMENTS = [
  {
    id: 'c1',
    postId: 'post-1',
    authorId: 'user-2',
    author: { id: 'user-2', username: 'jordan', avatarUrl: '...' },
    text: 'This shot is incredible!',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: null,
    likedBy: ['user-3'],
    replies: [
      {
        id: 'c2',
        postId: 'post-1',
        authorId: 'user-1',
        author: CURRENT_USER,
        text: 'Thanks! Golden hour helped.',
        createdAt: '2026-06-01T10:05:00.000Z',
        updatedAt: null,
        likedBy: [],
        replies: [],
      },
    ],
  },
];
```

---

## 5. Step 1 — Static Comment List (Read-Only UI)

### 1. What we are building

A read-only list that displays username, text, timestamp, and like count — no interactions yet.

### 2. Why we are doing it this way

Starting read-only isolates **rendering** from **state mutations**. Interviewers watch whether you can compose components before you reach for `useState`. Instagram's comment row is mostly presentation; interactions are layered on top.

### 3. The React concept behind it

- **Functional components** return JSX describing UI
- **Props** pass data down
- **Lists**: `comments.map()` with stable **`key={comment.id}`**
- **Composition**: small presentational components

### 4. The code

```javascript
// ─── CommentSection.jsx (Step 1) ───────────────────────────────
import { INITIAL_COMMENTS } from './mockData';
import CommentList from './CommentList';

export default function CommentSection() {
  // Static for now — no useState yet
  const comments = INITIAL_COMMENTS;

  return (
    <section aria-label="Comments">
      <h2>Comments</h2>
      <CommentList comments={comments} />
    </section>
  );
}
```

```javascript
// ─── CommentList.jsx ───────────────────────────────────────────
import CommentItem from './CommentItem';

/**
 * Renders a list of comments at a given depth (0 = top-level).
 */
export default function CommentList({ comments, depth = 0 }) {
  if (!comments.length) return null;

  return (
    <ul className="comment-list" style={{ marginLeft: depth * 16 }}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} depth={depth} />
      ))}
    </ul>
  );
}
```

```javascript
// ─── CommentItem.jsx (Step 1 — view only) ──────────────────────
function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CommentItem({ comment, depth }) {
  const likeCount = comment.likedBy.length;

  return (
    <li className="comment-item">
      <img src={comment.author.avatarUrl} alt="" width={32} height={32} />
      <div>
        <strong>{comment.author.username}</strong>{' '}
        <span>{comment.text}</span>
        <div className="comment-meta">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          {likeCount > 0 && <span>{likeCount} likes</span>}
        </div>
        {comment.replies?.length > 0 && (
          <CommentList comments={comment.replies} depth={depth + 1} />
        )}
      </div>
    </li>
  );
}

// Note: import CommentList at top — mutual recursion is fine in JS modules
import CommentList from './CommentList';
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| `key={index}` | Reorder/delete causes wrong DOM reuse, lost input focus |
| Mutating `comment.text` in render | Breaks React's purity; unpredictable diffs |
| Skipping `alt=""` on decorative avatars | Accessibility fail in senior interviews |
| Putting fetch logic in `CommentItem` | Each row fetches → N+1 problem |

### 6. Interview talking points

> "I'd start with presentational components and mock data. Each comment row is pure: given `comment`, it renders the same output. Keys are stable IDs, not indices, because comments are insert/delete heavy."

---

## 6. Step 2 — Add a Comment (Controlled Input + Events)

### 1. What we are building

A text field and submit button that adds a new **top-level** comment to the list.

### 2. Why we are doing it this way

A **controlled input** (`value` + `onChange`) is the React default for forms. Instagram's composer clears after submit — that requires state you own, not the DOM.

### 3. The React concept behind it

- **`useState`** for `text` draft and `comments` list
- **Controlled components**: React state is the input's source of truth
- **`onSubmit`** with `preventDefault()` to avoid page reload
- **Immutable append**: `setComments(prev => [...prev, newComment])`

### 4. The code

```javascript
// ─── CommentForm.jsx ───────────────────────────────────────────
import { useState } from 'react';

/**
 * Controlled form for adding a top-level comment.
 */
export default function CommentForm({ onSubmit, placeholder = 'Add a comment...' }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onSubmit(trimmed);
    setText(''); // Why: clear composer after successful add
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="Comment text"
      />
      <button type="submit" disabled={!text.trim()}>
        Post
      </button>
    </form>
  );
}
```

```javascript
// ─── CommentSection.jsx (Step 2) ───────────────────────────────
import { useState } from 'react';
import { CURRENT_USER, INITIAL_COMMENTS } from './mockData';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

function createComment(text) {
  return {
    id: `c-${crypto.randomUUID()}`,
    postId: 'post-1',
    authorId: CURRENT_USER.id,
    author: CURRENT_USER,
    text,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    likedBy: [],
    replies: [],
  };
}

export default function CommentSection() {
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  const handleAddComment = (text) => {
    setComments((prev) => [...prev, createComment(text)]);
  };

  return (
    <section aria-label="Comments">
      <CommentList comments={comments} />
      <CommentForm onSubmit={handleAddComment} />
    </section>
  );
}
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| `setComments([...comments, new])` without functional update | Stale closure if multiple rapid submits |
| Uncontrolled input + `ref` for simple case | Works, but harder to disable button from empty state |
| Forgetting `trim()` | Whitespace-only comments pollute the feed |
| Reusing `id: Date.now()` | Collisions if two comments in same ms |

### 6. Interview talking points

> "The form owns ephemeral draft state; the parent owns the comment list. On submit, I trim, validate non-empty, call `onSubmit`, then clear the draft. I use functional `setState` when the new state depends on the previous list."

---

## 7. Step 3 — Lift State to the Parent (Single Source of Truth)

### 1. What we are building

Refactor so **all** comment data lives in `CommentSection`. Children receive data and callbacks only — no duplicate copies.

### 2. Why we are doing it this way

If `CommentItem` kept its own `useState(comments)`, siblings couldn't see updates and you'd duplicate logic for like/edit/delete. **Lifting state** is the default pattern for shared mutable data.

### 3. The React concept behind it

- **Single source of truth** — one `comments` tree in the ancestor
- **Container/presentational split** — smart parent, dumb(ish) children
- **Callback props** — `onLike(id)` lets children request changes without owning data

### 4. The code

```javascript
// ─── CommentSection.jsx (Step 3 — pattern established) ─────────
export default function CommentSection() {
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  // All mutations will live here through Step 12
  const handlers = {
    onAddComment: (text, parentId = null) => { /* Step 5 implements reply */ },
    onLike: (commentId) => { /* Step 4 */ },
    onEdit: (commentId, newText) => { /* Step 7 */ },
    onDelete: (commentId) => { /* Step 8 */ },
  };

  return (
    <>
      <CommentList
        comments={comments}
        currentUser={CURRENT_USER}
        {...handlers}
      />
      <CommentForm onSubmit={(text) => handlers.onAddComment(text)} />
    </>
  );
}
```

```javascript
// ─── CommentList.jsx — pass handlers through ─────────────────
export default function CommentList({ comments, depth = 0, ...handlers }) {
  return (
    <ul>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={depth}
          {...handlers}
        />
      ))}
    </ul>
  );
}
```

### Trade-off: local vs lifted state

| Approach | Use when | Comment section |
|----------|----------|-----------------|
| **Local state** | UI-only, not shared | `isReplyFormOpen`, `editDraft` |
| **Lifted state** | Shared or persisted data | `comments[]`, like counts |
| **Context** | Deep tree, many consumers | Optional for `currentUser` |
| **External store** | Cross-page, undo, offline | Redux/Zustand at scale |

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Lifting *everything* including hover UI | Unnecessary re-renders of whole tree |
| Prop drilling 6 levels without Context | Messy but OK for 3 levels — know when to stop |
| Child calls `setComments` directly | Breaks encapsulation; parent can't add API/logging |

### 6. Interview talking points

> "I lift shared data to the nearest common ancestor — `CommentSection`. Ephemeral UI like 'reply box open' stays local in `CommentItem` to limit re-render scope."

---

## 8. Step 4 — Likes and Unlikes (Immutable Updates)

### 1. What we are building

Tap **Like** to toggle the current user's id in `likedBy`. Update count and filled-heart style.

### 2. Why we are doing it this way

Likes are **toggle operations** on nested data. You must update one node in a tree **without mutating** the original (React compares by reference).

### 3. The React concept behind it

- **Immutable updates** — copy path to changed node
- **Derived UI** — `isLiked = likedBy.includes(currentUser.id)`
- **Tree traversal** — recursive map helper

### 4. The code

```javascript
// ─── commentUtils.js ───────────────────────────────────────────

/**
 * Recursively update one comment by id in a nested tree.
 * Returns a NEW tree (immutable).
 */
export function updateCommentById(comments, targetId, updater) {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentById(comment.replies, targetId, updater),
      };
    }
    return comment;
  });
}

/**
 * Toggle current user's like on a comment.
 */
export function toggleLike(comment, userId) {
  const liked = comment.likedBy.includes(userId);
  return {
    ...comment,
    likedBy: liked
      ? comment.likedBy.filter((id) => id !== userId)
      : [...comment.likedBy, userId],
  };
}
```

```javascript
// ─── CommentSection.jsx (Step 4) ───────────────────────────────
const handleLike = (commentId) => {
  setComments((prev) =>
    updateCommentById(prev, commentId, (c) =>
      toggleLike(c, CURRENT_USER.id)
    )
  );
};
```

```javascript
// ─── LikeButton.jsx ────────────────────────────────────────────
export default function LikeButton({ comment, currentUser, onLike }) {
  const isLiked = comment.likedBy.includes(currentUser.id);

  return (
    <button
      type="button"
      aria-pressed={isLiked}
      onClick={() => onLike(comment.id)}
    >
      {isLiked ? '♥ Unlike' : '♡ Like'}
      {comment.likedBy.length > 0 && ` (${comment.likedBy.length})`}
    </button>
  );
}
```

### Step-by-step walkthrough (concrete values)

```
Before: c1.likedBy = ['user-3'], currentUser = 'user-1'

Click Like on c1
  → liked = false
  → new likedBy = ['user-3', 'user-1']

Click Unlike
  → liked = true
  → new likedBy = ['user-3']
```

### Flow diagram

```
User clicks Like
      │
      ▼
onLike(commentId) in parent
      │
      ▼
updateCommentById(tree, id, toggleLike)
      │
      ▼
setComments(newTree)
      │
      ▼
React re-renders → LikeButton reads new likedBy
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| `comment.likedBy.push(userId)` | Mutates state; React may skip re-render |
| Storing `isLiked` separately from `likedBy` | Two sources of truth drift |
| Optimistic like without rollback plan | UI lies after API failure |

### 6. Interview talking points

> "I derive `isLiked` from `likedBy.includes(userId)` instead of storing a boolean. For nested trees I use a recursive immutable updater — O(n) over visible comments, acceptable until thousands of nodes, then I'd flatten or paginate."

---

## 9. Step 5 — Nested Replies (Recursive Rendering)

### 1. What we are building

Click **Reply**, show inline composer, append reply under the parent comment.

### 2. Why we are doing it this way

Instagram threads are **trees**. Recursive `CommentList` inside `CommentItem` mirrors the data shape. Alternative: flatten + indent by `depth` — same UI, different update logic (Step 6).

### 3. The React concept behind it

- **Recursion in components** — `CommentItem` → `CommentList` → `CommentItem`
- **Local UI state** — `showReplyForm` stays in `CommentItem`
- **Parent id parameter** — `onAddComment(text, parentId)`

### 4. The code

```javascript
// ─── CommentSection.jsx (Step 5) ─────────────────────────────
const handleAddComment = (text, parentId = null) => {
  const newComment = createComment(text);

  if (!parentId) {
    setComments((prev) => [...prev, newComment]);
    return;
  }

  setComments((prev) =>
    updateCommentById(prev, parentId, (parent) => ({
      ...parent,
      replies: [...parent.replies, newComment],
    }))
  );
};
```

```javascript
// ─── CommentItem.jsx (Step 5) ──────────────────────────────────
import { useState } from 'react';

const MAX_DEPTH = 3; // Why: Instagram caps visual nesting; prevents infinite UI

export default function CommentItem({ comment, depth, currentUser, onAddComment, ...rest }) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <li>
      {/* ... header, body, LikeButton ... */}
      {depth < MAX_DEPTH && (
        <button type="button" onClick={() => setShowReplyForm((s) => !s)}>
          Reply
        </button>
      )}
      {showReplyForm && (
        <CommentForm
          placeholder={`Reply to ${comment.author.username}...`}
          onSubmit={(text) => {
            onAddComment(text, comment.id);
            setShowReplyForm(false);
          }}
        />
      )}
      {comment.replies.length > 0 && (
        <CommentList
          comments={comment.replies}
          depth={depth + 1}
          currentUser={currentUser}
          onAddComment={onAddComment}
          {...rest}
        />
      )}
    </li>
  );
}
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| No max depth | Deep threads break mobile layout; stack overflow in pathological data |
| Reply form state lifted to root | Every keystroke re-renders all comments |
| Forgetting to close form after submit | Confusing UX |

### 6. Interview talking points

> "Reply UI state is local; reply *data* is lifted. I pass `parentId` into the add handler so one function handles top-level and nested inserts via the same tree updater."

---

## 10. Step 6 — Flat vs Nested Data (The Data Model Decision)

### 1. What we are building

Understanding of **two data shapes** and a flat-list implementation you can compare to nested.

### 2. Why we are doing it this way

APIs often return **flat comments** with `parentId`. Normalizing avoids deep cloning on every like. This is a classic senior interview trade-off discussion.

### 3. The React concept behind it

- **Normalization** — store by id, relate by `parentId`
- **Selectors / memoized tree building** — derive nested view from flat store
- **O(1) updates** on flat map vs O(n) tree walk

### Flat model + tree builder

```javascript
// ─── buildCommentTree.js ───────────────────────────────────────

/**
 * Convert flat comment array to nested tree for rendering.
 * Sort: oldest first at each level (Instagram-style).
 */
export function buildCommentTree(flatComments) {
  const byId = new Map(flatComments.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];

  for (const comment of byId.values()) {
    if (comment.parentId) {
      const parent = byId.get(comment.parentId);
      if (parent) parent.replies.push(comment);
      else roots.push(comment); // orphan fallback
    } else {
      roots.push(comment);
    }
  }

  const sortByDate = (list) =>
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const sortRecursive = (nodes) => {
    sortByDate(nodes);
    nodes.forEach((n) => sortRecursive(n.replies));
  };
  sortRecursive(roots);
  return roots;
}
```

```javascript
// Like on flat list — O(n) scan but simple mutation path
export function toggleLikeFlat(comments, commentId, userId) {
  return comments.map((c) => {
    if (c.id !== commentId) return c;
    const liked = c.likedBy.includes(userId);
    return {
      ...c,
      likedBy: liked ? c.likedBy.filter((id) => id !== userId) : [...c.likedBy, userId],
    };
  });
}
```

### Pros & cons

| | Nested JSON | Flat + `parentId` |
|---|-------------|-------------------|
| **Mental model** | Easy for beginners | Easy for APIs/DB |
| **Update like** | Recursive copy | `map` by id |
| **Add reply** | Append to parent's `replies` | Push with `parentId` |
| **Delete subtree** | Recursive delete | Filter ids (need descendant lookup) |
| **Pagination** | Hard | Natural ("load more roots") |
| **Best for** | Prototypes, small threads | Production at scale |

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Rebuilding tree every render without `useMemo` | O(n) work each keystroke elsewhere |
| Circular `parentId` references | Infinite loops in builder — validate data |
| Mixing nested and flat in same app | Double sources of truth |

### 6. Interview talking points

> "I'd store normalized flat comments in state or React Query cache, then `useMemo(() => buildTree(comments), [comments])` for rendering. Updates touch one record; tree is derived."

---

## 11. Step 7 — Edit Comments (Conditional UI + Local Edit State)

### 1. What we are building

Author clicks **Edit**, inline textarea replaces text, **Save** / **Cancel**.

### 2. Why we are doing it this way

Edit mode is **ephemeral UI** — only one comment edits at a time. Keep `isEditing` and `draft` **local** to `CommentItem` so other rows don't re-render on each keystroke.

### 3. The React concept behind it

- **Conditional rendering** — `{isEditing ? <EditForm /> : <Text />}`
- **Authorization** — `comment.authorId === currentUser.id`
- **Optimistic local draft** — discard on cancel, commit on save

### 4. The code

```javascript
// ─── CommentItem.jsx (Step 7) ──────────────────────────────────
export default function CommentItem({ comment, currentUser, onEdit, ...props }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const canEdit = comment.authorId === currentUser.id;

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.text) {
      setIsEditing(false);
      return;
    }
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(comment.text);
    setIsEditing(false);
  };

  return (
    <li>
      {isEditing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      ) : (
        <span>{comment.text}</span>
      )}
      {canEdit && !isEditing && (
        <button onClick={() => setIsEditing(true)}>Edit</button>
      )}
    </li>
  );
}
```

```javascript
// ─── CommentSection — onEdit ───────────────────────────────────
const handleEdit = (commentId, newText) => {
  setComments((prev) =>
    updateCommentById(prev, commentId, (c) => ({
      ...c,
      text: newText,
      updatedAt: new Date().toISOString(),
    }))
  );
};
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Notifiediting state in parent | Parent re-renders entire list per keystroke |
| Not resetting draft when `comment.text` changes from server | Stale edit buffer |
| Allowing edit for non-authors client-side only | Must re-check on server; UI check is UX not security |

### 6. Interview talking points

> "Edit UI is local state; persisted text lives in lifted comments. On save I immutably update text and `updatedAt`. Client authorship check mirrors server rules but doesn't replace them."

---

## 12. Step 8 — Delete Comments (Tree Traversal + Edge Cases)

### 1. What we are building

Delete a comment and **all its replies**. Confirm dialog optional but recommended.

### 2. Why we are doing it this way

Deletion on a tree requires **filtering at every level** or rebuilding from flat list. Instagram removes the whole subtree.

### 3. The React concept behind it

- **Recursive filter** — new array excluding target id anywhere
- **Edge cases** — deleting while editing, deleting root vs reply

### 4. The code

```javascript
/**
 * Remove comment by id from nested tree (and all descendants).
 */
export function deleteCommentById(comments, targetId) {
  return comments
    .filter((c) => c.id !== targetId)
    .map((c) => ({
      ...c,
      replies: deleteCommentById(c.replies, targetId),
    }));
}
```

```javascript
const handleDelete = (commentId) => {
  // Production: await api.delete(commentId)
  setComments((prev) => deleteCommentById(prev, commentId));
};
```

### Edge cases to handle

| Edge case | Handling |
|-----------|----------|
| Delete comment you're editing | Close edit mode in `CommentItem` when `comment` unmounts |
| Delete parent with 50 replies | All removed — confirm "Delete thread?" |
| Delete last top-level comment | Show empty state (Step 10) |
| Concurrent delete | Server wins; refetch or merge by version |
| Soft delete vs hard delete | UI shows "Comment removed" placeholder — product choice |

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Only filtering top level | Nested reply remains orphaned in UI |
| Splice on original array | Mutation |
| No confirm on destructive action | Accidental data loss |

### 6. Interview talking points

> "Delete walks the tree immutably. For scale I'd use flat storage and mark `deletedAt` (soft delete) so moderation can restore. I'd confirm destructive actions affecting subtrees."

---

## 13. Step 9 — Form Validation (Client-Side Rules)

### 1. What we are building

Validation for empty text, max length (e.g. 2,200 chars like Instagram), and inline error messages.

### 2. Why we are doing it this way

Validate **before** state updates and API calls. Disable submit when invalid; show errors on blur or submit — not on every keystroke (UX).

### 3. The React concept behind it

- **Derived validation** — `const error = validate(text)`
- **Dual disable** — button `disabled={!!error}`
- **Single validation function** — reused by add, reply, edit

### 4. The code

```javascript
// ─── validateComment.js ────────────────────────────────────────
export const MAX_COMMENT_LENGTH = 2200;

/**
 * @returns {string | null} error message or null if valid
 */
export function validateComment(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'Comment cannot be empty.';
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return `Max ${MAX_COMMENT_LENGTH} characters (${trimmed.length} used).`;
  }
  return null;
}
```

```javascript
// ─── CommentForm with validation ─────────────────────────────────
export default function CommentForm({ onSubmit, initialText = '' }) {
  const [text, setText] = useState(initialText);
  const [touched, setTouched] = useState(false);

  const error = validateComment(text);
  const showError = touched && error;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    onSubmit(text.trim());
    setText('');
    setTouched(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={!!showError}
        aria-describedby={showError ? 'comment-error' : undefined}
      />
      {showError && <p id="comment-error" role="alert">{error}</p>}
      <button type="submit" disabled={!!validateComment(text)}>
        Post
      </button>
    </form>
  );
}
```

### Validation rules table

| Rule | When to check | UX |
|------|---------------|-----|
| Non-empty | Submit + disable button | Prevent noise |
| Max length | Live counter + submit | Instagram shows count near limit |
| Profanity | Submit (async) | Show server error |
| Rate limit | API 429 | Toast + disable briefly |

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Validating only on submit but never showing error | User confused why nothing happens |
| Trimming only on display, not validation | Leading spaces bypass empty check |
| Duplicate validation in 3 forms | Drift — extract one function |

### 6. Interview talking points

> "I centralize rules in `validateComment`. Forms stay thin. Server always re-validates; client validation is for fast feedback and fewer round trips."

---

## 14. Step 10 — Loading States, Empty States, and Optimistic UI

### 1. What we are building

Skeleton while "fetching", empty illustration when no comments, optimistic add/like before mock API resolves.

### 2. Why we are doing it this way

Perceived speed matters. Instagram shows your comment immediately, then reconciles. **Empty states** guide first action; **loading** prevents layout jump.

### 3. The React concept behind it

- **`useEffect` + async** — load on mount
- **Status enum** — `'idle' | 'loading' | 'success' | 'error'`
- **Optimistic update** — update UI first, rollback on failure

### 4. The code

```javascript
// ─── useComments.js (data fetching hook) ───────────────────────
import { useEffect, useState } from 'react';
import { INITIAL_COMMENTS } from './mockData';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useComments() {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setStatus('loading');
        await delay(800); // mock network
        if (!cancelled) {
          setComments(INITIAL_COMMENTS);
          setStatus('success');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setStatus('error');
        }
      }
    })();

    return () => { cancelled = true; }; // Why: avoid setState after unmount
  }, []);

  return { comments, setComments, status, error };
}
```

```javascript
// ─── EmptyState.jsx ────────────────────────────────────────────
export default function EmptyState() {
  return (
    <div className="empty-state">
      <p>No comments yet.</p>
      <p>Start the conversation.</p>
    </div>
  );
}
```

```javascript
// ─── Optimistic add pattern ────────────────────────────────────
const handleAddCommentOptimistic = async (text, parentId = null) => {
  const tempId = `temp-${crypto.randomUUID()}`;
  const optimistic = { ...createComment(text), id: tempId, pending: true };

  // 1. Optimistic UI
  insertComment(setComments, optimistic, parentId);

  try {
    await mockApi.postComment(text, parentId);
    // 2. Replace temp id with server id
    setComments((prev) =>
      updateCommentById(prev, tempId, (c) => ({
        ...c,
        id: 'server-id-from-api',
        pending: false,
      }))
    );
  } catch {
    // 3. Rollback
    setComments((prev) => deleteCommentById(prev, tempId));
    // show toast: "Failed to post"
  }
};
```

```javascript
// ─── CommentSection render branches ────────────────────────────
if (status === 'loading') return <CommentSkeleton count={3} />;
if (status === 'error') return <ErrorMessage error={error} />;
if (status === 'success' && comments.length === 0) return (
  <>
    <EmptyState />
    <CommentForm onSubmit={handleAddComment} />
  </>
);
```

### UI state flow

```
Mount
  │
  ▼
loading ──► skeleton
  │
  ▼
success ──► comments.length === 0 ? EmptyState : CommentList
  │
 error ──► retry button
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| No cleanup in `useEffect` | setState on unmounted component warning |
| Optimistic without rollback | Ghost comments after failure |
| Loading spinner inside each CommentItem | Layout thrash — one section-level skeleton |

### 6. Interview talking points

> "I model async with explicit status. Optimistic updates need a temp id and rollback path. Empty state is a first-class UI, not an afterthought."

---

## 15. Step 11 — useReducer for Complex Comment State

### 1. What we are building

Refactor scattered `setComments` handlers into a **reducer** with explicit actions.

### 2. Why we are doing it this way

When you have 5+ mutation types (add, reply, like, edit, delete, merge server), `useReducer` centralizes transitions and mirrors Redux — easy to test and discuss in interviews.

### 3. The React concept behind it

- **`useReducer(reducer, initialState)`**
- **Action objects** — `{ type: 'LIKE', payload: { commentId } }`
- **Pure reducer** — `(state, action) => newState`

### useState vs useReducer

| | useState | useReducer |
|---|----------|------------|
| **Best for** | 1–2 simple fields | Many related mutations |
| **Logic location** | Event handlers | Reducer function |
| **Testability** | Handler tests | Pure reducer unit tests |
| **Comment section** | OK for MVP | Better at Step 11+ |

### 4. The code

```javascript
// ─── commentsReducer.js ────────────────────────────────────────
import {
  deleteCommentById,
  toggleLike,
  updateCommentById,
} from './commentUtils';

export function commentsReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return action.payload;

    case 'ADD': {
      const { comment, parentId } = action.payload;
      if (!parentId) return [...state, comment];
      return updateCommentById(state, parentId, (p) => ({
        ...p,
        replies: [...p.replies, comment],
      }));
    }

    case 'LIKE': {
      const { commentId, userId } = action.payload;
      return updateCommentById(state, commentId, (c) => toggleLike(c, userId));
    }

    case 'EDIT': {
      const { commentId, text } = action.payload;
      return updateCommentById(state, commentId, (c) => ({
        ...c,
        text,
        updatedAt: new Date().toISOString(),
      }));
    }

    case 'DELETE':
      return deleteCommentById(state, action.payload.commentId);

    default:
      return state;
  }
}
```

```javascript
// ─── CommentSection with useReducer ────────────────────────────
import { useReducer } from 'react';

export default function CommentSection() {
  const [comments, dispatch] = useReducer(commentsReducer, []);

  const onLike = (commentId) =>
    dispatch({ type: 'LIKE', payload: { commentId, userId: CURRENT_USER.id } });

  // ... other dispatch wrappers
}
```

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| Side effects inside reducer | Reducer must be pure — no fetch |
| `{ ...state, comments: ... }` wrapper when state IS array | Keep state shape consistent |
| Giant switch without extract helpers | Reuse `updateCommentById` inside cases |

### 6. Interview talking points

> "I reach for useReducer when mutation count grows. Each action is auditable; reducer is unit-testable without React. Async stays in handlers that dispatch SET after fetch."

---

## 16. Step 12 — Performance: Memoization and Render Boundaries

### 1. What we are building

Prevent unnecessary re-renders when one comment's reply form toggles or one like changes.

### 2. Why we are doing it this way

Naive implementation re-renders **every** `CommentItem` when any state in `CommentSection` changes. For 100+ comments, typing in one reply field would stutter without boundaries.

### 3. The React concept behind it

- **`React.memo`** — skip re-render if props shallow-equal
- **`useCallback`** — stable handler references for memoized children
- **`useMemo`** — cache expensive `buildCommentTree`
- **Key stability** — already required

### 4. The code

```javascript
// ─── Memoized CommentItem ──────────────────────────────────────
import { memo, useCallback } from 'react';

function CommentItemInner({ comment, onLike, ...props }) {
  // ...
}

export default memo(CommentItemInner);
```

```javascript
// ─── CommentSection — stable callbacks ─────────────────────────
const onLike = useCallback((commentId) => {
  dispatch({ type: 'LIKE', payload: { commentId, userId: CURRENT_USER.id } });
}, []);

const tree = useMemo(
  () => buildCommentTree(flatComments),
  [flatComments]
);
```

### When NOT to memoize (interview gold)

```
Profile first → measure → optimize

100 comments, cheap rows → memo may hurt (comparison cost)
10 comments → no problem without memo
Virtualized list (react-window) → required for 1000+ rows
```

### Pros & cons

| Technique | Pros | Cons |
|-----------|------|------|
| `React.memo` | Cuts child re-renders | Shallow compare fails if inline props |
| `useCallback` | Stable fn refs | Memory + dependency bugs |
| Context split | Avoid global re-render | Boilerplate |
| Virtualization | Handles huge lists | Complexity, a11y focus |

### 5. Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| `memo` + inline `onClick={() => onLike(id)}` | New function every render — memo useless |
| Memoizing everything day one | Premature optimization |
| Putting all state in Context | Any change re-renders all consumers |

### 6. Interview talking points

> "I'd ship without memo, then React DevTools Profiler. Memoize `CommentItem` and stabilize handlers with `useCallback`. For thousands of comments, virtualize the list. Derive tree with `useMemo` from flat data."

---

## 17. Advanced Patterns

### Pattern 1 — Custom hook: `useCommentActions`

**Problem:** `CommentSection` becomes a god component.  
**Solution:** Extract dispatch + API into `useCommentActions(postId)`.

```javascript
/**
 * Encapsulates comment CRUD + optimistic API for one post.
 */
export function useCommentActions(postId) {
  const [comments, dispatch] = useReducer(commentsReducer, []);
  // fetch, optimistic add, rollback...
  return { comments, addComment, likeComment, editComment, deleteComment, status };
}
```

### Pattern 2 — Compound `CommentSection` (design system style)

```javascript
<CommentSection postId="post-1">
  <CommentSection.List />
  <CommentSection.Composer />
</CommentSection>
```

Use when building a reusable library; overkill for one app.

### Pattern 3 — React Query / SWR cache

Server state in query cache; mutations invalidate or patch cache. Local UI state (edit mode) stays in components. **This is how production apps separate server vs UI state.**

### Pattern 4 — "Load more replies"

Instagram collapses deep threads. Paginate replies per parent:

```javascript
{comment.replyCount > comment.replies.length && (
  <button onClick={() => loadReplies(comment.id)}>View replies</button>
)}
```

### Pattern 5 — Accessibility bundle

- `aria-label` on icon buttons
- `role="article"` per comment with `aria-labelledby`
- Focus trap not needed for inline edit; **focus reply input** when opening reply form via `ref.focus()`

---

## 18. When to Use What — Decision Guide

### Decision flowchart

```
Start: comment feature needed
        │
        ▼
   Data from API?
    │         │
   yes        no (demo)
    │         │
    ▼         ▼
 React Query   useState + mock
 + flat model
        │
        ▼
 How many comments visible?
    │              │
  < 100          100+
    │              │
    ▼              ▼
 Simple tree    Flat + virtualize
 + memo optional
        │
        ▼
 Mutation count > 4?
    │         │
   yes       no
    │         │
    ▼         ▼
 useReducer  useState
```

### Lookup table

| Situation | Recommendation | Reason |
|-----------|----------------|--------|
| Interview live code (45 min) | Nested mock + lifted state | Fastest to explain |
| Production app | Flat + React Query | Pagination, cache, sync |
| Reply form open state | Local `useState` | Isolates re-renders |
| Like/edit/delete | Lifted + reducer | One source of truth |
| Current user | Context if drilling > 3 levels | Cleaner props |
| 1000+ comments | `react-window` + flat | DOM node limit |

---

## 19. Common Pitfalls & How to Avoid Them

### Pitfall 1 — Index as key

```javascript
// BAD
{comments.map((c, i) => <CommentItem key={i} />)}

// GOOD
{comments.map((c) => <CommentItem key={c.id} />)}
```

**Failure mode:** Delete first comment → second comment reuses first comment's DOM → wrong like state flashes.

### Pitfall 2 — Mutating nested state

```javascript
// BAD
const handleLike = () => {
  comment.likedBy.push(userId);
  setComments(comments);
};

// GOOD
setComments((prev) => updateCommentById(prev, id, (c) => toggleLike(c, userId)));
```

### Pitfall 3 — Stale closure in rapid clicks

```javascript
// BAD
setComments([...comments, newComment]);

// GOOD
setComments((prev) => [...prev, newComment]);
```

### Pitfall 4 — Editing state not reset on prop change

```javascript
// GOOD — sync draft when comment updates from server
useEffect(() => {
  setDraft(comment.text);
}, [comment.text]);
```

### Pitfall 5 — No empty trim validation

Whitespace comments degrade feed quality and waste API calls.

### Pitfall 6 — Optimistic update without temp id tracking

Can't rollback or replace with server id — duplicate or ghost rows.

### Pitfall 7 — Security: rendering raw HTML

```javascript
// BAD — XSS if text contains <script>
<div dangerouslySetInnerHTML={{ __html: comment.text }} />

// GOOD — React escapes text by default
<span>{comment.text}</span>
```

### Pitfall 8 — Ignoring concurrent edit

Show `updatedAt` or "edited" label; optionally refetch on window focus.

---

## 20. Final Recap — Full Flow Walkthrough

### End-to-end user journey

```
1. User opens post
      → CommentSection mounts → useComments fetches → skeleton

2. Fetch completes
      → CommentList renders tree from state

3. User types new comment
      → CommentForm controlled state → validation → submit enabled

4. User posts
      → optimistic insert → API → replace temp id OR rollback

5. User likes a reply
      → onLike(id) → reducer LIKED → only memoized rows reconcile

6. User replies
      → local showReplyForm → onAddComment(text, parentId) → nested append

7. User edits own comment
      → local isEditing → onEdit → updatedAt set

8. User deletes comment
      → confirm → deleteCommentById → empty state if last root

9. User scrolls 500 comments
      → virtualized list + flat data + load-more cursors
```

### Final component + state map

```
CommentSection
  state: comments[], status (or useReducer)
  hooks: useComments / useCommentActions

CommentList          props: comments, handlers (pass-through)
CommentItem          local: isEditing, draft, showReplyForm
CommentForm          local: text, touched, validation error
LikeButton           stateless — derived isLiked from props
EmptyState           stateless
CommentSkeleton      stateless
```

### Files you should have after completing all steps

```
src/features/comments/
  CommentSection.jsx
  CommentList.jsx
  CommentItem.jsx
  CommentForm.jsx
  LikeButton.jsx
  EmptyState.jsx
  CommentSkeleton.jsx
  commentsReducer.js
  commentUtils.js
  validateComment.js
  buildCommentTree.js
  mockData.js
  useComments.js
```

---

## 21. Interview Tips — Explaining the Solution Clearly

### The 90-second opening (memorize this structure)

1. **Clarify scope** — "Frontend only; I'll mock API delays."
2. **Component sketch** — Section → List → Item (recursive) → Form.
3. **Data model** — "Flat with `parentId` in production; nested for demo clarity."
4. **State placement** — "Comments lifted; edit/reply UI local."
5. **Mutations** — "Immutable tree updates or reducer actions."
6. **Polish** — "Validation, empty/loading, optimistic posts, memo if profiled."

### Questions interviewers ask — short answers

| Question | Strong answer |
|----------|---------------|
| Where do you put state? | Shared tree in ancestor; ephemeral UI local |
| Nested vs flat? | Flat for API/pagination; derive tree with useMemo |
| useState vs useReducer? | Reducer when 4+ action types; easier to test |
| How do keys work? | Stable ids; never index on dynamic lists |
| Performance? | Profile first; memo Item + useCallback; virtualize at scale |
| Optimistic UI failure? | Temp id, rollback, toast error |
| How prevent XSS? | Never dangerouslySetInnerHTML user text |
| Auth for edit/delete? | UI hides actions; server enforces |

### Whiteboard order

```
1. Draw component boxes
2. Write Comment type on board
3. Write one handler: onAddComment(text, parentId?)
4. Walk through recursive render
5. Mention validation + loading last (shows you prioritize core flow)
```

### What separates mid vs senior answers

| Mid | Senior |
|-----|--------|
| "I'd use useState" | "useState until mutations grow, then reducer" |
| "Put everything in Redux" | "Server state in React Query; UI state local" |
| "React.memo everywhere" | "Profile, then memo boundaries" |
| "Delete the comment" | "Soft delete, subtree policy, confirm UX" |
| Code first | Requirements + data model first |

---

## Summary Cheatsheet

| Topic | Default choice | Key property | When to change |
|-------|----------------|--------------|----------------|
| Data shape | Flat + `parentId` | O(1) record update | Small demo → nested OK |
| State owner | `CommentSection` | Single source of truth | Extract custom hook |
| Reply/edit UI | Local state | Limits re-renders | — |
| Mutations | `useReducer` | Testable actions | ≤2 mutations → useState |
| Keys | `comment.id` | Stable identity | Never index |
| Validation | Shared `validateComment()` | DRY rules | Server always wins |
| Async | status enum + skeleton | Clear UX | Suspense if RSC |
| Likes | Derive from `likedBy[]` | One truth | Don't store `isLiked` |
| Performance | Ship simple, profile | Avoid premature memo | 100+ → memo + virtualize |
| Optimistic post | temp id + rollback | Feels instant | Required for mobile UX |

**Default learning path:** Steps 1 → 12 in order, nested data first, then refactor Step 6 flat model mentally for the "production version" story in interviews.

**One-line interview close:**

> "I'd build a composable comment tree with lifted immutable state, local ephemeral UI, centralized validation, explicit loading/empty states, and flat normalized data behind a memoized tree builder when connecting to a real API."
