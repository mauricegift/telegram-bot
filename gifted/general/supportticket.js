const {
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
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES
} = require('./tickets');

const { isAdmin } = require('./admin');

// Store temporary ticket data during creation
let tempTicketData = {};

let supportTicket = async (m, { Gifted, text, command }) => {
    const userId = m.from.id;
    
    if (command === 'ticket' && !text) {
        // Show user's tickets
        const userTickets = getUserTickets(userId);
        
        if (userTickets.length === 0) {
            const message = `🎫 *Support Tickets*\n\n` +
                           `You don't have any support tickets yet.\n\n` +
                           `Use \`/createticket\` to create a new support ticket.`;
            
            await Gifted.reply({ 
                text: message, 
                parse_mode: 'Markdown' 
            }, m);
            return;
        }
        
        const ticketList = userTickets.slice(0, 10).map(ticket => {
            const status = Object.values(TICKET_STATUSES).find(s => s.value === ticket.status) || TICKET_STATUSES.OPEN;
            const priority = TICKET_PRIORITIES[ticket.priority?.toUpperCase()] || TICKET_PRIORITIES.MEDIUM;
            return `${status.emoji} *#${ticket.id}* - ${ticket.title}\n   ${priority.emoji} ${priority.name} | Updated: ${new Date(ticket.updatedAt).toLocaleDateString()}`;
        }).join('\n\n');
        
        const message = `🎫 *Your Support Tickets*\n\n${ticketList}\n\n` +
                       `Use \`/ticket <id>\` to view a specific ticket\n` +
                       `Use \`/createticket\` to create a new ticket`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'ticket' && text) {
        // Show specific ticket
        const ticketId = text.trim();
        const ticket = global.db.tickets[ticketId];
        
        if (!ticket) {
            await Gifted.reply({ text: '❌ Ticket not found' }, m);
            return;
        }
        
        if (ticket.userId !== userId && !isAdmin(userId)) {
            await Gifted.reply({ text: '❌ You can only view your own tickets' }, m);
            return;
        }
        
        const message = formatTicket(ticket, true);
        
        let keyboard = [];
        if (ticket.status !== TICKET_STATUSES.CLOSED.value) {
            keyboard.push([
                { text: '💬 Reply', callback_data: JSON.stringify({ feature: 'ticketreply', data: ticketId }) }
            ]);
            
            if (ticket.status !== TICKET_STATUSES.RESOLVED.value) {
                keyboard.push([
                    { text: '❌ Close Ticket', callback_data: JSON.stringify({ feature: 'ticketclose', data: ticketId }) }
                ]);
            }
        }
        
        // Admin controls
        if (isAdmin(userId)) {
            keyboard.push(...generateTicketManagementKeyboard(ticketId));
        }
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, keyboard, m);
        return;
    }
    
    if (command === 'createticket') {
        if (!text) {
            const message = `🎫 *Create Support Ticket*\n\n` +
                           `Please select a category for your support ticket:`;
            
            const keyboard = generateTicketCategoryKeyboard();
            
            await Gifted.reply({ 
                text: message, 
                parse_mode: 'Markdown' 
            }, keyboard, m);
            return;
        }
        
        // Direct ticket creation with text
        const parts = text.split('|').map(part => part.trim());
        if (parts.length < 2) {
            await Gifted.reply({ 
                text: '❌ Usage: `/createticket title | description`\n\nOr use `/createticket` without text to use the guided creation.', 
                parse_mode: 'Markdown' 
            }, m);
            return;
        }
        
        const [title, description] = parts;
        const result = createTicket(userId, title, description);
        
        if (!result.success) {
            await Gifted.reply({ text: `❌ ${result.error}` }, m);
            return;
        }
        
        const message = `✅ *Ticket Created Successfully!*\n\n` +
                       `Ticket ID: #${result.ticketId}\n` +
                       `Title: ${title}\n\n` +
                       `Your ticket has been submitted and will be reviewed by our support team.`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'tickets' && isAdmin(userId)) {
        // Admin: View all tickets
        const allTickets = getAllTickets(null, null, 15);
        
        if (allTickets.length === 0) {
            await Gifted.reply({ text: '📂 No tickets found' }, m);
            return;
        }
        
        const ticketList = allTickets.map(ticket => {
            const status = Object.values(TICKET_STATUSES).find(s => s.value === ticket.status) || TICKET_STATUSES.OPEN;
            const priority = TICKET_PRIORITIES[ticket.priority?.toUpperCase()] || TICKET_PRIORITIES.MEDIUM;
            return `${status.emoji}${priority.emoji} *#${ticket.id}* - ${ticket.title}\n   By: ${ticket.userId} | ${new Date(ticket.updatedAt).toLocaleDateString()}`;
        }).join('\n\n');
        
        const stats = getTicketStats();
        
        const message = `🎫 *All Support Tickets*\n\n` +
                       `📊 *Stats:* ${stats.open} Open | ${stats.inProgress} In Progress | ${stats.resolved} Resolved\n\n` +
                       `${ticketList}`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'ticketstats' && isAdmin(userId)) {
        const stats = getTicketStats();
        
        const categoryStats = Object.entries(stats.byCategory)
            .map(([cat, count]) => `• ${cat}: ${count}`)
            .join('\n');
            
        const priorityStats = Object.entries(stats.byPriority)
            .map(([pri, count]) => `• ${pri}: ${count}`)
            .join('\n');
        
        const message = `📊 *Ticket Statistics*\n\n` +
                       `*Overall Stats:*\n` +
                       `• Total Tickets: ${stats.total}\n` +
                       `• Open: ${stats.open}\n` +
                       `• In Progress: ${stats.inProgress}\n` +
                       `• Waiting for Response: ${stats.waiting}\n` +
                       `• Resolved: ${stats.resolved}\n` +
                       `• Closed: ${stats.closed}\n\n` +
                       `*By Category:*\n${categoryStats}\n\n` +
                       `*By Priority:*\n${priorityStats}`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
};

// Handle ticket-related callbacks
supportTicket.callback = async (m, { Gifted, data }) => {
    const userId = m.from.id;
    const [action, value] = data.split(':');
    
    switch (action) {
        case 'ticketcategory':
            // Store category selection and ask for title
            tempTicketData[userId] = { category: value };
            
            const category = Object.values(TICKET_CATEGORIES).find(c => c.value === value);
            const message = `${category.emoji} *${category.name}* selected!\n\n` +
                           `Please reply with your ticket title and description in this format:\n\n` +
                           `*Title*\n` +
                           `Your detailed description here...`;
            
            await Gifted.editMessageText(message, {
                chat_id: m.chat.id,
                message_id: m.message_id,
                parse_mode: 'Markdown'
            });
            break;
            
        case 'ticketstatus':
            if (!isAdmin(userId)) {
                await Gifted.answerCallbackQuery(m.id, { text: '❌ Admin access required!' });
                return;
            }
            
            const [ticketId, newStatus] = value.split(':');
            const result = updateTicketStatus(ticketId, newStatus, userId);
            
            if (result.success) {
                const ticket = global.db.tickets[ticketId];
                const updatedMessage = formatTicket(ticket, true);
                
                await Gifted.editMessageText(updatedMessage, {
                    chat_id: m.chat.id,
                    message_id: m.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: generateTicketManagementKeyboard(ticketId)
                    }
                });
                
                await Gifted.answerCallbackQuery(m.id, { text: `✅ Status updated to ${newStatus}` });
            } else {
                await Gifted.answerCallbackQuery(m.id, { text: `❌ ${result.error}` });
            }
            break;
            
        case 'ticketassign':
            if (!isAdmin(userId)) {
                await Gifted.answerCallbackQuery(m.id, { text: '❌ Admin access required!' });
                return;
            }
            
            const assignResult = assignTicket(value, userId, userId);
            
            if (assignResult.success) {
                await Gifted.answerCallbackQuery(m.id, { text: '✅ Ticket assigned to you' });
            } else {
                await Gifted.answerCallbackQuery(m.id, { text: `❌ ${assignResult.error}` });
            }
            break;
            
        default:
            await Gifted.answerCallbackQuery(m.id, { text: 'Feature coming soon!' });
    }
};

supportTicket.command = ['ticket', 'tickets', 'createticket', 'ticketstats'];
supportTicket.desc = 'Support ticket system for user assistance';
supportTicket.category = ['support', 'general'];

module.exports = supportTicket;