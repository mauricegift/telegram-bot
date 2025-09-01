require('../../set');

/**
 * Support Ticket System
 * Allows users to create tickets and admins to manage them
 */

// Ticket priorities and statuses
const TICKET_PRIORITIES = {
    LOW: { name: 'Low', emoji: '🟢', value: 1 },
    MEDIUM: { name: 'Medium', emoji: '🟡', value: 2 },
    HIGH: { name: 'High', emoji: '🟠', value: 3 },
    URGENT: { name: 'Urgent', emoji: '🔴', value: 4 }
};

const TICKET_STATUSES = {
    OPEN: { name: 'Open', emoji: '📂', value: 'open' },
    IN_PROGRESS: { name: 'In Progress', emoji: '🔄', value: 'in_progress' },
    WAITING: { name: 'Waiting for Response', emoji: '⏳', value: 'waiting' },
    RESOLVED: { name: 'Resolved', emoji: '✅', value: 'resolved' },
    CLOSED: { name: 'Closed', emoji: '🔒', value: 'closed' }
};

const TICKET_CATEGORIES = {
    TECHNICAL: { name: 'Technical Issue', emoji: '🔧', value: 'technical' },
    FEATURE: { name: 'Feature Request', emoji: '💡', value: 'feature' },
    BUG: { name: 'Bug Report', emoji: '🐛', value: 'bug' },
    ACCOUNT: { name: 'Account Issue', emoji: '👤', value: 'account' },
    GENERAL: { name: 'General Support', emoji: '❓', value: 'general' },
    OTHER: { name: 'Other', emoji: '📝', value: 'other' }
};

// Initialize ticket system
function initializeTicketSystem() {
    if (!global.db.tickets) {
        global.db.tickets = {};
    }
    
    if (!global.db.ticketSettings) {
        global.db.ticketSettings = {
            nextTicketId: 1000,
            autoAssign: true,
            notifyAdmins: true,
            maxOpenTicketsPerUser: 5
        };
    }
}

// Generate unique ticket ID
function generateTicketId() {
    initializeTicketSystem();
    const ticketId = global.db.ticketSettings.nextTicketId++;
    return ticketId.toString();
}

// Create new support ticket
function createTicket(userId, title, description, category = 'general', priority = 'medium') {
    initializeTicketSystem();
    
    // Check if user has too many open tickets
    const userOpenTickets = Object.values(global.db.tickets).filter(
        ticket => ticket.userId === userId && 
                  ticket.status !== TICKET_STATUSES.RESOLVED.value && 
                  ticket.status !== TICKET_STATUSES.CLOSED.value
    );
    
    if (userOpenTickets.length >= global.db.ticketSettings.maxOpenTicketsPerUser) {
        return {
            success: false,
            error: `You have reached the maximum number of open tickets (${global.db.ticketSettings.maxOpenTicketsPerUser})`
        };
    }
    
    const ticketId = generateTicketId();
    const ticket = {
        id: ticketId,
        userId: userId,
        title: title,
        description: description,
        category: category,
        priority: priority,
        status: TICKET_STATUSES.OPEN.value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        assignedTo: null,
        messages: [],
        tags: []
    };
    
    global.db.tickets[ticketId] = ticket;
    
    return {
        success: true,
        ticket: ticket,
        ticketId: ticketId
    };
}

// Add message to ticket
function addTicketMessage(ticketId, userId, message, isAdmin = false) {
    const ticket = global.db.tickets[ticketId];
    if (!ticket) {
        return { success: false, error: 'Ticket not found' };
    }
    
    // Check if user can add message to this ticket
    if (!isAdmin && ticket.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
    }
    
    const messageObj = {
        id: Date.now().toString(),
        userId: userId,
        message: message,
        timestamp: Date.now(),
        isAdmin: isAdmin
    };
    
    ticket.messages.push(messageObj);
    ticket.updatedAt = Date.now();
    
    // Update status if admin responds
    if (isAdmin && ticket.status === TICKET_STATUSES.WAITING.value) {
        ticket.status = TICKET_STATUSES.IN_PROGRESS.value;
    } else if (!isAdmin && ticket.status === TICKET_STATUSES.IN_PROGRESS.value) {
        ticket.status = TICKET_STATUSES.WAITING.value;
    }
    
    return { success: true, message: messageObj };
}

// Update ticket status
function updateTicketStatus(ticketId, newStatus, adminId) {
    const ticket = global.db.tickets[ticketId];
    if (!ticket) {
        return { success: false, error: 'Ticket not found' };
    }
    
    if (!Object.values(TICKET_STATUSES).some(status => status.value === newStatus)) {
        return { success: false, error: 'Invalid status' };
    }
    
    const oldStatus = ticket.status;
    ticket.status = newStatus;
    ticket.updatedAt = Date.now();
    
    // Add status change message
    const statusMessage = {
        id: Date.now().toString(),
        userId: adminId,
        message: `Status changed from ${oldStatus} to ${newStatus}`,
        timestamp: Date.now(),
        isAdmin: true,
        isSystemMessage: true
    };
    
    ticket.messages.push(statusMessage);
    
    return { success: true, oldStatus, newStatus };
}

// Assign ticket to admin
function assignTicket(ticketId, adminId, assignedBy) {
    const ticket = global.db.tickets[ticketId];
    if (!ticket) {
        return { success: false, error: 'Ticket not found' };
    }
    
    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = adminId;
    ticket.updatedAt = Date.now();
    
    // Add assignment message
    const assignMessage = {
        id: Date.now().toString(),
        userId: assignedBy,
        message: `Ticket assigned to admin ${adminId}`,
        timestamp: Date.now(),
        isAdmin: true,
        isSystemMessage: true
    };
    
    ticket.messages.push(assignMessage);
    
    return { success: true, oldAssignee, newAssignee: adminId };
}

// Get user's tickets
function getUserTickets(userId, status = null) {
    return Object.values(global.db.tickets)
        .filter(ticket => {
            if (ticket.userId !== userId) return false;
            if (status && ticket.status !== status) return false;
            return true;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

// Get all tickets (admin view)
function getAllTickets(status = null, assignedTo = null, limit = 50) {
    return Object.values(global.db.tickets)
        .filter(ticket => {
            if (status && ticket.status !== status) return false;
            if (assignedTo && ticket.assignedTo !== assignedTo) return false;
            return true;
        })
        .sort((a, b) => {
            // Sort by priority first, then by update time
            const priorityDiff = TICKET_PRIORITIES[ticket.priority?.toUpperCase()]?.value || 1 
                                - TICKET_PRIORITIES[b.priority?.toUpperCase()]?.value || 1;
            if (priorityDiff !== 0) return priorityDiff;
            return b.updatedAt - a.updatedAt;
        })
        .slice(0, limit);
}

// Format ticket for display
function formatTicket(ticket, detailed = false) {
    const priority = TICKET_PRIORITIES[ticket.priority?.toUpperCase()] || TICKET_PRIORITIES.LOW;
    const status = Object.values(TICKET_STATUSES).find(s => s.value === ticket.status) || TICKET_STATUSES.OPEN;
    const category = Object.values(TICKET_CATEGORIES).find(c => c.value === ticket.category) || TICKET_CATEGORIES.GENERAL;
    
    let formatted = `🎫 *Ticket #${ticket.id}*\n`;
    formatted += `📝 *Title:* ${ticket.title}\n`;
    formatted += `${category.emoji} *Category:* ${category.name}\n`;
    formatted += `${priority.emoji} *Priority:* ${priority.name}\n`;
    formatted += `${status.emoji} *Status:* ${status.name}\n`;
    
    if (detailed) {
        formatted += `👤 *User:* ${ticket.userId}\n`;
        formatted += `📅 *Created:* ${new Date(ticket.createdAt).toLocaleString()}\n`;
        formatted += `🔄 *Updated:* ${new Date(ticket.updatedAt).toLocaleString()}\n`;
        
        if (ticket.assignedTo) {
            formatted += `👨‍💼 *Assigned to:* ${ticket.assignedTo}\n`;
        }
        
        formatted += `\n📄 *Description:*\n${ticket.description}\n`;
        
        if (ticket.messages.length > 0) {
            formatted += `\n💬 *Recent Messages:*\n`;
            const recentMessages = ticket.messages.slice(-3);
            recentMessages.forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString();
                const sender = msg.isAdmin ? '👨‍💼 Admin' : '👤 User';
                formatted += `${sender} (${time}): ${msg.message}\n`;
            });
        }
    }
    
    return formatted;
}

// Generate ticket creation keyboard
function generateTicketCategoryKeyboard() {
    const keyboard = [];
    const categories = Object.values(TICKET_CATEGORIES);
    
    // Create rows of 2 buttons each
    for (let i = 0; i < categories.length; i += 2) {
        const row = [];
        row.push({
            text: `${categories[i].emoji} ${categories[i].name}`,
            callback_data: JSON.stringify({ feature: 'ticketcategory', data: categories[i].value })
        });
        
        if (categories[i + 1]) {
            row.push({
                text: `${categories[i + 1].emoji} ${categories[i + 1].name}`,
                callback_data: JSON.stringify({ feature: 'ticketcategory', data: categories[i + 1].value })
            });
        }
        
        keyboard.push(row);
    }
    
    return keyboard;
}

// Generate priority selection keyboard
function generatePriorityKeyboard() {
    return [
        [
            { text: '🟢 Low', callback_data: JSON.stringify({ feature: 'ticketpriority', data: 'low' }) },
            { text: '🟡 Medium', callback_data: JSON.stringify({ feature: 'ticketpriority', data: 'medium' }) }
        ],
        [
            { text: '🟠 High', callback_data: JSON.stringify({ feature: 'ticketpriority', data: 'high' }) },
            { text: '🔴 Urgent', callback_data: JSON.stringify({ feature: 'ticketpriority', data: 'urgent' }) }
        ]
    ];
}

// Generate admin ticket management keyboard
function generateTicketManagementKeyboard(ticketId) {
    return [
        [
            { text: '✅ Resolve', callback_data: JSON.stringify({ feature: 'ticketstatus', data: `${ticketId}:resolved` }) },
            { text: '🔄 In Progress', callback_data: JSON.stringify({ feature: 'ticketstatus', data: `${ticketId}:in_progress` }) }
        ],
        [
            { text: '⏳ Waiting', callback_data: JSON.stringify({ feature: 'ticketstatus', data: `${ticketId}:waiting` }) },
            { text: '🔒 Close', callback_data: JSON.stringify({ feature: 'ticketstatus', data: `${ticketId}:closed` }) }
        ],
        [
            { text: '👨‍💼 Assign to Me', callback_data: JSON.stringify({ feature: 'ticketassign', data: ticketId }) },
            { text: '💬 Reply', callback_data: JSON.stringify({ feature: 'ticketreply', data: ticketId }) }
        ]
    ];
}

// Get ticket statistics
function getTicketStats() {
    initializeTicketSystem();
    
    const stats = {
        total: Object.keys(global.db.tickets).length,
        open: 0,
        inProgress: 0,
        waiting: 0,
        resolved: 0,
        closed: 0,
        byCategory: {},
        byPriority: {},
        avgResponseTime: 0
    };
    
    Object.values(global.db.tickets).forEach(ticket => {
        // Status counts
        stats[ticket.status.replace('_', '')]++;
        
        // Category counts
        stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;
        
        // Priority counts
        stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
    });
    
    return stats;
}

module.exports = {
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    TICKET_CATEGORIES,
    createTicket,
    addTicketMessage,
    updateTicketStatus,
    assignTicket,
    getUserTickets,
    getAllTickets,
    formatTicket,
    generateTicketCategoryKeyboard,
    generatePriorityKeyboard,
    generateTicketManagementKeyboard,
    getTicketStats,
    initializeTicketSystem
};