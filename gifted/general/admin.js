require('../../set');
const { fetchJson } = require('../../gift');

/**
 * Enhanced Admin Panel with comprehensive management features
 */

// Utility function to check if user is admin/owner
function isAdmin(userId) {
    return global.ownerId.includes(userId);
}

// Admin statistics and analytics
async function getSystemStats() {
    const stats = {
        users: {
            total: Object.keys(global.db.users).length,
            active: 0,
            newToday: 0
        },
        groups: {
            total: Object.keys(global.db.groups).length,
            active: 0
        },
        commands: {
            totalExecuted: global.db.stats ? global.db.stats.totalCommands || 0 : 0,
            todayExecuted: 0
        },
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: global.botVersion
        },
        features: {
            supportTickets: global.db.tickets ? Object.keys(global.db.tickets).length : 0,
            broadcasts: global.db.broadcasts ? Object.keys(global.db.broadcasts).length : 0
        }
    };

    const now = Date.now();
    const today = new Date().toDateString();

    // Count active users (used bot in last 24 hours)
    Object.values(global.db.users).forEach(user => {
        if (user.lastSeen && (now - user.lastSeen) < 24 * 60 * 60 * 1000) {
            stats.users.active++;
        }
        if (user.joinDate && new Date(user.joinDate).toDateString() === today) {
            stats.users.newToday++;
        }
    });

    // Count active groups
    Object.values(global.db.groups).forEach(group => {
        if (group.lastActivity && (now - group.lastActivity) < 24 * 60 * 60 * 1000) {
            stats.groups.active++;
        }
    });

    // Count today's commands
    if (global.db.commandStats) {
        Object.values(global.db.commandStats).forEach(cmdStats => {
            if (cmdStats.today) {
                stats.commands.todayExecuted += cmdStats.today;
            }
        });
    }

    return stats;
}

// Get top commands usage
function getTopCommands(limit = 10) {
    if (!global.db.commandStats) return [];
    
    return Object.entries(global.db.commandStats)
        .map(([cmd, stats]) => ({
            command: cmd,
            total: stats.total || 0,
            today: stats.today || 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

// Get user information for admin
function getUserInfo(userId) {
    const user = global.db.users[userId];
    if (!user) return null;
    
    return {
        id: userId,
        username: user.username || 'Unknown',
        joinDate: user.joinDate || 'Unknown',
        lastSeen: user.lastSeen || 'Never',
        commandsUsed: user.commandsUsed || 0,
        currentRole: user.aiRole || 'default',
        language: user.language || 'en',
        isBlocked: user.blocked || false,
        isPremium: user.premium || false
    };
}

// Block/unblock user
function toggleUserBlock(userId, blocked = true) {
    if (!global.db.users[userId]) {
        global.db.users[userId] = {};
    }
    
    global.db.users[userId].blocked = blocked;
    return true;
}

// Set user premium status
function setUserPremium(userId, premium = true, duration = null) {
    if (!global.db.users[userId]) {
        global.db.users[userId] = {};
    }
    
    global.db.users[userId].premium = premium;
    if (premium && duration) {
        global.db.users[userId].premiumExpiry = Date.now() + (duration * 24 * 60 * 60 * 1000);
    }
    
    return true;
}

// Get group information
function getGroupInfo(groupId) {
    const group = global.db.groups[groupId];
    if (!group) return null;
    
    return {
        id: groupId,
        name: group.groupName || 'Unknown',
        memberCount: group.memberCount || 0,
        lastActivity: group.lastActivity || 'Never',
        settings: group.settings || {},
        isEnabled: !group.disabled
    };
}

// Toggle group bot status
function toggleGroupStatus(groupId, enabled = true) {
    if (!global.db.groups[groupId]) {
        global.db.groups[groupId] = {};
    }
    
    global.db.groups[groupId].disabled = !enabled;
    return true;
}

// Generate admin panel main menu
function generateAdminMenu() {
    return [
        [
            { text: '📊 Statistics', callback_data: JSON.stringify({ feature: 'adminstats' }) },
            { text: '👥 Users', callback_data: JSON.stringify({ feature: 'adminusers' }) }
        ],
        [
            { text: '💬 Groups', callback_data: JSON.stringify({ feature: 'admingroups' }) },
            { text: '📝 Commands', callback_data: JSON.stringify({ feature: 'admincmds' }) }
        ],
        [
            { text: '📢 Broadcast', callback_data: JSON.stringify({ feature: 'adminbroadcast' }) },
            { text: '🎫 Tickets', callback_data: JSON.stringify({ feature: 'admintickets' }) }
        ],
        [
            { text: '🔧 System', callback_data: JSON.stringify({ feature: 'adminsystem' }) },
            { text: '📈 Analytics', callback_data: JSON.stringify({ feature: 'adminanalytics' }) }
        ],
        [
            { text: '❌ Close', callback_data: JSON.stringify({ feature: 'closemenu' }) }
        ]
    ];
}

// Format system stats for display
function formatSystemStats(stats) {
    const formatBytes = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };
    
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };
    
    return `📊 *System Statistics*

👥 *Users*:
   • Total: ${stats.users.total}
   • Active (24h): ${stats.users.active}
   • New Today: ${stats.users.newToday}

💬 *Groups*:
   • Total: ${stats.groups.total}
   • Active (24h): ${stats.groups.active}

⚡ *Commands*:
   • Total Executed: ${stats.commands.totalExecuted}
   • Today: ${stats.commands.todayExecuted}

🖥️ *System*:
   • Uptime: ${formatUptime(stats.system.uptime)}
   • Memory Used: ${formatBytes(stats.system.memory.used)}
   • Memory RSS: ${formatBytes(stats.system.memory.rss)}
   • Version: ${stats.system.version}

🎫 *Features*:
   • Support Tickets: ${stats.features.supportTickets}
   • Broadcasts Sent: ${stats.features.broadcasts}`;
}

// Admin broadcast system
async function createBroadcast(message, targetType = 'all', adminId) {
    const broadcastId = Date.now().toString();
    
    if (!global.db.broadcasts) {
        global.db.broadcasts = {};
    }
    
    global.db.broadcasts[broadcastId] = {
        id: broadcastId,
        message: message,
        targetType: targetType, // 'all', 'users', 'groups', 'premium'
        adminId: adminId,
        createdAt: Date.now(),
        status: 'pending',
        sent: 0,
        failed: 0,
        total: 0
    };
    
    return broadcastId;
}

// Execute broadcast
async function executeBroadcast(Gifted, broadcastId) {
    const broadcast = global.db.broadcasts[broadcastId];
    if (!broadcast || broadcast.status !== 'pending') {
        return false;
    }
    
    broadcast.status = 'sending';
    let targets = [];
    
    // Determine targets based on type
    switch (broadcast.targetType) {
        case 'users':
            targets = Object.keys(global.db.users).map(id => ({ type: 'user', id }));
            break;
        case 'groups':
            targets = Object.keys(global.db.groups).map(id => ({ type: 'group', id }));
            break;
        case 'premium':
            targets = Object.keys(global.db.users)
                .filter(id => global.db.users[id].premium)
                .map(id => ({ type: 'user', id }));
            break;
        default: // 'all'
            targets = [
                ...Object.keys(global.db.users).map(id => ({ type: 'user', id })),
                ...Object.keys(global.db.groups).map(id => ({ type: 'group', id }))
            ];
    }
    
    broadcast.total = targets.length;
    
    // Send broadcasts with delay to avoid rate limits
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        try {
            await Gifted.sendMessage(target.id, `📢 *Broadcast Message*\n\n${broadcast.message}`, {
                parse_mode: 'Markdown'
            });
            broadcast.sent++;
            
            // Small delay to avoid rate limits
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.log(`Failed to send broadcast to ${target.id}:`, error.message);
            broadcast.failed++;
        }
    }
    
    broadcast.status = 'completed';
    broadcast.completedAt = Date.now();
    
    return true;
}

// Get user search results
function searchUsers(query, limit = 10) {
    const results = [];
    const searchQuery = query.toLowerCase();
    
    Object.entries(global.db.users).forEach(([userId, userData]) => {
        if (results.length >= limit) return;
        
        const username = (userData.username || '').toLowerCase();
        const id = userId.toString();
        
        if (username.includes(searchQuery) || id.includes(searchQuery)) {
            results.push({
                id: userId,
                username: userData.username || 'Unknown',
                match: username.includes(searchQuery) ? 'username' : 'id'
            });
        }
    });
    
    return results;
}

// Initialize admin database structures
function initializeAdminDb() {
    if (!global.db.stats) {
        global.db.stats = {
            totalCommands: 0,
            startTime: Date.now()
        };
    }
    
    if (!global.db.commandStats) {
        global.db.commandStats = {};
    }
    
    if (!global.db.broadcasts) {
        global.db.broadcasts = {};
    }
    
    if (!global.db.tickets) {
        global.db.tickets = {};
    }
}

// Track command usage
function trackCommand(command, userId) {
    initializeAdminDb();
    
    // Update global stats
    global.db.stats.totalCommands++;
    
    // Update command-specific stats
    if (!global.db.commandStats[command]) {
        global.db.commandStats[command] = {
            total: 0,
            today: 0,
            lastUsed: null,
            users: new Set()
        };
    }
    
    const cmdStats = global.db.commandStats[command];
    cmdStats.total++;
    cmdStats.today = (cmdStats.today || 0) + 1;
    cmdStats.lastUsed = Date.now();
    
    if (cmdStats.users instanceof Set) {
        cmdStats.users.add(userId);
    } else {
        cmdStats.users = new Set([userId]);
    }
    
    // Update user stats
    if (!global.db.users[userId]) {
        global.db.users[userId] = {};
    }
    
    global.db.users[userId].commandsUsed = (global.db.users[userId].commandsUsed || 0) + 1;
    global.db.users[userId].lastSeen = Date.now();
}

module.exports = {
    isAdmin,
    getSystemStats,
    getTopCommands,
    getUserInfo,
    toggleUserBlock,
    setUserPremium,
    getGroupInfo,
    toggleGroupStatus,
    generateAdminMenu,
    formatSystemStats,
    createBroadcast,
    executeBroadcast,
    searchUsers,
    initializeAdminDb,
    trackCommand
};