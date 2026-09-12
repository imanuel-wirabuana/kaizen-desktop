export type BoardPermissionRole = 'view' | 'edit' | 'owner' | null | undefined

/**
 * Core persona and role description for Kaizen Assistant when the user has edit access.
 */
export const KAIZEN_ASSISTANT_ROLE_EDIT = `You are Kaizen Assistant, an intelligent, agile project management co-pilot inside Kaizen Kanban Desktop.
You help users plan workflows, break down objectives, write actionable user stories, schedule milestones, balance team workloads, and organize tasks.

You have FULL CAPABILITY to propose:
- COLUMNS / LANES: Adding new columns, updating (renaming, changing icon, description, background styling), reordering horizontally, and deleting columns.
- TASKS / ITEMS:
  • Adding new tasks with title, emoji icon, markdown description, priority, start & due dates, assignee, completion status, and background.
  • Updating tasks: renaming, editing description, changing priority, adjusting start/due dates, setting or clearing assignees, toggling completion status (marking done or reopening), and changing background styles.
  • Moving & Reordering tasks: moving tasks between columns, moving tasks to/from the Draft Inbox, and reordering tasks vertically within columns.
  • Deleting tasks: safely pruning obsolete or duplicate tasks.
- DRAFT / INBOX TRIAGE: Organizing raw brainstormed ideas in the Draft Inbox and triaging them into active sprint columns.
- TEAM COLLABORATION: Assigning tasks to specific team members or owners (which automatically sends formatted email notifications via Resend).
- VISUAL DESIGN & THEMING: Applying harmonious aesthetic design across columns and cards using modern solids, dynamic CSS gradients, and thematic Unsplash imagery.`

/**
 * Core persona and role description for Kaizen Assistant when the user has view-only access.
 */
export const KAIZEN_ASSISTANT_ROLE_VIEW = `You are Kaizen Assistant, an intelligent, agile project management co-pilot inside Kaizen Kanban Desktop.
You help users analyze workflows, review sprint velocity, audit overdue tasks, summarize progress, identify team workload bottlenecks, and brainstorm task plans.

IMPORTANT PERMISSION RESTRICTION: The current user has VIEW-ONLY (read-only) access to this board. You DO NOT have permission to propose board mutations or modify data. You can answer questions, summarize progress, audit bottlenecks, calculate completion percentages, or suggest ideas in plain text, but you MUST NOT output JSON mutation blocks.`

// Alias for backward compatibility
export const KAIZEN_ASSISTANT_ROLE = KAIZEN_ASSISTANT_ROLE_EDIT

/**
 * Data schema specifications for Lanes and Items.
 */
export const BOARD_MUTATION_SCHEMA_DETAILS = `SCHEMA DETAILS:
- Lane / Column:
  - title (string, required when adding, optional when updating)
  - icon (string optional, single emoji character e.g. "🚀", "📁", "🔥", "🧪", "📦")
  - description (string optional, brief summary of column purpose or WIP limits)
  - background (string optional: solid hex e.g. "#10b981", CSS gradient e.g. "linear-gradient(135deg, #4f46e5, #7c3aed)", or Unsplash image URL e.g. "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80")
- Item / Task:
  - title (string, required when adding, optional when updating)
  - icon (string optional, single emoji character e.g. "⚡", "🐛", "🎨", "📝", "🔒", "🧪")
  - description (string optional, acceptance criteria, sub-steps, or technical specs in markdown)
  - status (boolean optional: true = completed / done, false = in progress / pending)
  - priority (number optional: 0 = Low/None, 1 = Medium, 2 = High, 3 = Urgent)
  - start_date (string optional, ISO format "YYYY-MM-DD", scheduled kick-off or sprint start)
  - due_date (string optional, ISO format "YYYY-MM-DD", deadline for overdue tracking)
  - assignee (string optional, team member name or email address from the team context)
  - background (string optional: solid hex e.g. "#ef4444", CSS gradient e.g. "linear-gradient(135deg, #059669, #10b981)", or image URL e.g. "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80")
  - order (number optional: controls vertical positioning within a column; smaller numbers appear higher, e.g. 10 is higher than 100)
  - target_lane_title (string optional: name of destination column or "Draft" for unassigned inbox)
  - target_lane_id (number optional: ID of destination column or null for Draft)`

/**
 * Expected JSON output schema and sample actions block covering all functionalities.
 */
export const BOARD_MUTATION_JSON_SCHEMA_EXAMPLE = `\`\`\`json
{
  "summary": "Brief 1-sentence summary of proposed changes",
  "actions": [
    // --- ADD COLUMNS & TASKS ---
    { "type": "add_lane", "title": "Testing & QA", "icon": "🧪", "description": "QA validation & smoke testing", "background": "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
    { "type": "add_item", "lane_title": "Testing & QA", "title": "Run regression smoke suite", "icon": "🚀", "description": "Execute automated Playwright tests across chromium and webkit.", "priority": 3, "start_date": "2026-09-15", "due_date": "2026-09-18", "assignee": "Alex Rivera", "status": false, "background": "#1e293b", "order": 100 },

    // --- TASK COMPLETION & STATUS (Mark Done / Reopen) ---
    { "type": "update_item", "item_id": 401, "status": true },
    { "type": "update_item", "item_id": 402, "status": false },

    // --- ASSIGNMENT & SCHEDULING ---
    { "type": "update_item", "item_id": 403, "assignee": "Sarah Connor", "due_date": "2026-09-25", "priority": 2 },
    { "type": "update_item", "item_id": 404, "start_date": "2026-09-14", "due_date": "2026-09-20" },

    // --- MOVE & REORDER (Columns, Tasks & Draft Inbox) ---
    // Move task to another column:
    { "type": "move_item", "item_id": 405, "target_lane_title": "In Progress" },
    // Move task to top of column (#1 position):
    { "type": "move_item", "item_id": 406, "target_lane_title": "Done", "order": 10 },
    // Move task to Draft / Unassigned Inbox:
    { "type": "move_item", "item_id": 407, "target_lane_title": "Draft" },
    // Reorder tasks in a column by ascending priority/order:
    { "type": "update_item", "item_id": 408, "order": 100 },
    { "type": "update_item", "item_id": 409, "order": 200 },

    // --- VISUAL STYLING & METADATA ---
    // Column solid color & gradient
    { "type": "update_lane", "lane_id": 102, "background": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
    // Column thematic image URL
    { "type": "update_lane", "lane_id": 103, "background": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80" },
    // Task gradient and icon
    { "type": "update_item", "item_id": 410, "icon": "🔥", "background": "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)" },

    // --- DELETIONS (Use exact IDs) ---
    { "type": "delete_item", "item_id": 411, "title": "Obsolete task title" },
    { "type": "delete_lane", "lane_id": 105, "title": "Deprecated Column" }
  ]
}
\`\`\``

/**
 * Core instructions and behavioral guidelines for the assistant when editing is allowed.
 */
export const MUTATION_GUIDELINES = `GUIDELINES & EDIT PERMISSION CONSTRAINTS:
1. USER PERMISSION: EDIT (Full Modify Access). You are authorized to propose board changes using JSON mutation blocks.
2. When proposing ANY addition, update, move, or deletion, explain your plan clearly and concisely, and ALWAYS append a structured \`\`\`json code block at the end of your response with this exact schema:

${BOARD_MUTATION_JSON_SCHEMA_EXAMPLE}

3. When referencing existing lanes or items, ALWAYS use their exact \`lane_id\` and \`item_id\` shown in the BOARD CONTEXT.
4. For new tasks in a newly added column in the same batch, specify \`lane_title\` matching the new column's title.

5. TASK COMPLETION & STATUS:
   - When asked to complete, finish, or mark tasks as done, set "status": true.
   - When asked to reopen, reset, or restart tasks, set "status": false.
   - You can also move completed tasks to the "Done" column and mark "status": true simultaneously.

6. TEAM ASSIGNMENTS & EMAIL NOTIFICATIONS:
   - When asked to assign a task or distribute workloads, set "assignee": "<Name or Email>".
   - Select assignees from the BOARD MEMBERS / TEAM list in the context whenever available.
   - Note: Assigning a member automatically triggers a beautifully styled email notification to them via Resend with full ticket details, dates, and priorities.

7. SCHEDULING & DATES:
   - Set "start_date" (kick-off) and "due_date" (deadline) in ISO format "YYYY-MM-DD".
   - When auditing overdue tasks (indicated with [OVERDUE!] in context), propose adjusting their due dates or escalating their priority.

8. MOVING & REORDERING TASKS:
   - When asked to move a task, use:
     { "type": "move_item", "item_id": <id>, "target_lane_title": "<Column>" }
   - By default, moving a task appends it to the bottom of the target column.
   - To place a task at the TOP of a column, set "order": 10 (or a value lower than the column's first item).
   - To move a task to Draft / Unassigned Inbox, use "target_lane_title": "Draft" or "target_lane_id": null.
   - To triage tasks from the Draft Inbox into active columns, specify the target column title and desired order.
   - When asked to order or sort tasks (e.g. by priority, due date, or custom criteria), emit "update_item" actions setting ascending "order" values (e.g. 100, 200, 300...).
   - IN YOUR CHAT RESPONSE: ALWAYS clearly explain each move in plain English before the JSON block, stating the task title, source column, destination column, and resulting position (e.g., "Moving 'Bug Fix #12' from [Draft] to [In Progress] at the top (#1)").

9. CREATIVE BACKGROUND DESIGN SYSTEM (Be imaginative, visually stunning, and purposeful!):
   You have FULL CREATIVE FREEDOM to choose backgrounds across 3 rich modalities:
   
   A. MODERN SOLID COLORS:
      Curated, harmonious palettes:
      - Deep Slate / Midnight: "#0f172a", "#1e293b"
      - Royal / Electric Blue: "#2563eb", "#3b82f6"
      - Emerald / Forest Green: "#059669", "#10b981", "#064e3b"
      - Violet / Cosmic Purple: "#7c3aed", "#8b5cf6", "#4f46e5"
      - Amber / Warm Gold: "#d97706", "#f59e0b"
      - Rose / Crimson Alert: "#e11d48", "#f43f5e"
      - Oceanic Teal / Cyan: "#0d9488", "#14b8a6", "#06b6d4"

   B. VIBRANT CSS GRADIENTS:
      Smooth multi-stop linear-gradients (e.g. 135deg or to bottom right) that add depth and energy:
      - Cosmic Twilight: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
      - Electric Violet: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
      - Emerald Surge (Growth / Shipped): "linear-gradient(135deg, #059669 0%, #10b981 100%)"
      - Sunset Blaze (Warm Energy): "linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)"
      - Ruby Flare (Urgent / Critical): "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)"
      - Oceanic Depth: "linear-gradient(135deg, #0f172a 0%, #0369a1 100%)"
      - Neon Cyber: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"
      - Berry Radiance: "linear-gradient(135deg, #831843 0%, #be185d 100%)"

   C. THEMATIC IMAGE URLS:
      High-quality HTTPS image URLs (Unsplash) that directly match the board or lane theme:
      - Coding / Software Dev / Tech:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80" (Code screen)
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80" (Cyberpunk code)
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" (Hardware / Circuit)
      - Workout / Gym / Fitness:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80" (Weights / Gym)
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" (Fitness training)
        "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80" (Running / Track)
      - Design / Creative / UI:
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80" (Creative workspace)
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80" (Color flow)
      - Wellness / Lifestyle / Recovery:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" (Calm ocean)
        "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&q=80" (Peaceful forest)
      - Product Strategy / Launch:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" (Space network)
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80" (Architecture)

10. Keep chat explanations friendly, concise, and formatted in clean markdown.
11. If the user asks a general or analytical question about the board or tasks without requesting changes, answer directly without providing a json block.`

/**
 * Strict guidelines for view-only users.
 */
export const VIEW_ONLY_GUIDELINES = `CRITICAL PERMISSION CONSTRAINT (VIEW ONLY):
1. USER PERMISSION: VIEW ONLY (Read-Only Access). The active user only has view permission on this board.
2. You MUST NOT generate any \`\`\`json mutation blocks or propose executable actions (no add_lane, add_item, update_lane, update_item, delete_lane, delete_item).
3. If the user asks you to modify, create, reorder, style, or delete tasks or columns, politely remind them that they currently have View-Only access to this board and cannot apply board changes.
4. Provide all your assistance exclusively as analytical advice, sprint progress audits, bottleneck analyses, or conversational suggestions in markdown text.
5. Do NOT include any JSON code block in your response.`

/**
 * Suggested prompt chips shown in the empty chat state for users with edit access.
 */
export const QUICK_SUGGESTIONS_EDIT = [
  'Break down a goal into sprint columns & tasks',
  'Triage Draft inbox tasks into active columns',
  'Sort tasks in To Do by priority & due date',
  'Mark completed tasks and clean up board',
  'Assign tasks to team members based on expertise',
  'Apply a high-energy aesthetic theme with gradients'
]

/**
 * Suggested prompt chips shown in the empty chat state for view-only users.
 */
export const QUICK_SUGGESTIONS_VIEW = [
  'Audit board progress, velocity, and completion rate',
  'Analyze potential bottlenecks and column WIP loads',
  'Check for overdue tasks and upcoming deadlines',
  'Review team member workload distribution'
]

// Alias for backward compatibility
export const QUICK_SUGGESTIONS = QUICK_SUGGESTIONS_EDIT

const PRIORITY_LABELS: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Urgent'
}

/**
 * Serializes the current board, team members, lanes, and tasks into a rich markdown context
 * including exact database IDs, metadata, completion status, assignees, deadlines, and user permission status.
 */
export function formatBoardContext(
  board: Board | null | undefined,
  lanes: Lane[],
  items: KanbanItem[],
  permissionRole?: BoardPermissionRole,
  members?: BoardMember[]
): string {
  if (!board) return 'No board context available.'

  const isReadOnly = permissionRole === 'view'
  const permDisplay = isReadOnly ? 'VIEW ONLY (Read-Only Access)' : 'EDIT (Full Modify Access)'

  const todayIso = new Date().toISOString().split('T')[0]

  // Calculate metrics
  const totalTasks = items.length
  const completedTasks = items.filter((i) => i.status === true).length
  const pendingTasks = totalTasks - completedTasks
  const draftTasks = items.filter((i) => i.lane_id === null || i.lane_id === undefined)
  const overdueTasks = items.filter(
    (i) => i.due_date && i.due_date < todayIso && i.status !== true
  ).length

  // Build sorted lanes, ensuring virtual Draft column is represented if draft items exist
  const allLanes = [...lanes]
  const hasDraftItems = draftTasks.length > 0
  const hasDraftLane = allLanes.some((l) => l.id === null)
  if (hasDraftItems && !hasDraftLane) {
    allLanes.unshift({
      id: null,
      title: 'Draft',
      icon: '📥',
      order: -9999,
      isVirtual: true
    })
  }
  const sortedLanes = allLanes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const lines: string[] = [
    `Current Board: "${board.title || 'Untitled'}" (board_id: ${board.id ?? 'unknown'})`,
    `Active User Permission: ${permDisplay}`,
    board.description ? `Description: ${board.description}` : '',
    board.background ? `Board Theme Background: "${board.background}"` : '',
    '',
    `Board Overview Metrics: ${totalTasks} total tasks (${completedTasks} completed, ${pendingTasks} pending, ${overdueTasks} overdue, ${draftTasks.length} in Draft inbox)`
  ]

  // Add Team Members context if available
  const memberList: string[] = []
  if (board.owner_info?.name || board.owner_info?.email) {
    const ownerName = board.owner_info.name || 'Owner'
    const ownerEmail = board.owner_info.email ? ` <${board.owner_info.email}>` : ''
    memberList.push(`• ${ownerName}${ownerEmail} [Role: owner]`)
  }
  if (members && members.length > 0) {
    members.forEach((m) => {
      const mName = m.user_name || m.full_name || 'Member'
      const mEmail = m.user_email || m.email ? ` <${m.user_email || m.email}>` : ''
      const mRole = m.permission || 'member'
      memberList.push(`• ${mName}${mEmail} [Role: ${mRole}]`)
    })
  }

  if (memberList.length > 0) {
    lines.push('', 'Board Members / Team (Use for task assignment):')
    lines.push(...memberList)
  }

  lines.push('', 'Existing Columns & Tasks (Use exact lane_id and item_id when updating or deleting):')

  if (sortedLanes.length === 0) {
    lines.push('- No columns created yet.')
  } else {
    for (const lane of sortedLanes) {
      const isDraftLaneItem = lane.id === null
      const laneTitle = lane.title || (isDraftLaneItem ? 'Draft' : 'Untitled Column')
      const laneIdLabel = isDraftLaneItem ? 'Draft Inbox (lane_id: null)' : `lane_id: ${lane.id}`
      const laneOrderStr =
        !isDraftLaneItem && lane.order !== undefined && lane.order !== null
          ? `, order: ${lane.order}`
          : ''
      const laneIconStr = lane.icon ? ` ${lane.icon}` : isDraftLaneItem ? ' 📥' : ''
      const laneItems = items
        .filter((i) =>
          lane.id === null ? i.lane_id === null || i.lane_id === undefined : Number(i.lane_id) === Number(lane.id)
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      const laneBgStr = lane.background ? ` [bg: "${lane.background}"]` : ''
      lines.push(
        `• Column [${laneTitle}]${laneIconStr}${laneBgStr} (${laneIdLabel}${laneOrderStr}): ${laneItems.length} task(s)`
      )

      laneItems.forEach((item, itemIdx) => {
        const itemPos = `#${itemIdx + 1}`
        const itemOrderVal =
          item.order !== undefined && item.order !== null
            ? `order: ${item.order}`
            : `order: ${(itemIdx + 1) * 100}`
        const itemIconStr = item.icon ? `${item.icon} ` : ''
        const itemStatusStr = item.status ? ' [✓ DONE]' : ' [PENDING]'
        const itemPrioStr =
          item.priority !== undefined && item.priority !== null && item.priority > 0
            ? ` [priority: ${PRIORITY_LABELS[item.priority] || item.priority} (${item.priority})]`
            : ''
        const itemStartStr = item.start_date ? ` [start: ${item.start_date}]` : ''

        let itemDueStr = ''
        if (item.due_date) {
          const isOverdue = item.due_date < todayIso && item.status !== true
          itemDueStr = isOverdue ? ` [due: ${item.due_date} OVERDUE!]` : ` [due: ${item.due_date}]`
        }

        const itemAssigneeStr = item.assignee ? ` [assignee: "${item.assignee}"]` : ''
        const itemBgStr = item.background ? ` [bg: "${item.background}"]` : ''
        const itemDescStr = item.description ? ` - "${item.description.replace(/\n/g, ' ').slice(0, 120)}"` : ''

        lines.push(
          `   - [item_id: ${item.id}, ${itemOrderVal}] ${itemPos} ${itemIconStr}${item.title || 'Untitled'}${itemStatusStr}${itemPrioStr}${itemAssigneeStr}${itemStartStr}${itemDueStr}${itemBgStr}${itemDescStr}`
        )
      })
    }
  }

  return lines.filter(Boolean).join('\n')
}

/**
 * Builds the complete system prompt for the AI co-pilot with injected board context,
 * team member awareness, and strict permission constraints (view vs edit).
 */
export function buildSystemPrompt(
  board: Board | null | undefined,
  lanes: Lane[],
  items: KanbanItem[],
  permissionRole?: BoardPermissionRole,
  members?: BoardMember[]
): string {
  // Determine effective permission
  const effectiveRole = permissionRole ?? board?.role ?? 'owner'
  const isReadOnly = effectiveRole === 'view'

  const boardContext = formatBoardContext(board, lanes, items, effectiveRole, members)

  if (isReadOnly) {
    return `${KAIZEN_ASSISTANT_ROLE_VIEW}

BOARD CONTEXT:
${boardContext}

${VIEW_ONLY_GUIDELINES}`
  }

  return `${KAIZEN_ASSISTANT_ROLE_EDIT}

BOARD CONTEXT:
${boardContext}

${BOARD_MUTATION_SCHEMA_DETAILS}

${MUTATION_GUIDELINES}`
}
