const { 
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
    initializeAdminDb
} = require('./admin');

let adminPanel = async (m, { Gifted, text, command }) => {
    const userId = m.from.id;
    
    // Initialize admin database structures
    initializeAdminDb();
    
    if (!m.isOwner) {
        await Gifted.reply({ text: '❌ Admin access required!' }, m);
        return;
    }
    
    if (command === 'admin' && !text) {
        const message = `👨‍💼 *Admin Control Panel*\n\n` +
                       `Welcome to the enhanced admin panel. Select an option below to manage your bot:\n\n` +
                       `📊 Statistics - View bot usage statistics\n` +
                       `👥 Users - Manage users and permissions\n` +
                       `💬 Groups - Manage group settings\n` +
                       `📝 Commands - View command statistics\n` +
                       `📢 Broadcast - Send messages to users\n` +
                       `🎫 Tickets - Manage support tickets\n` +
                       `🔧 System - System information and tools\n` +
                       `📈 Analytics - Advanced analytics`;
        
        const keyboard = generateAdminMenu();
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, keyboard, m);
        return;
    }
    
    // Handle specific admin commands
    if (command === 'adminstats') {
        const stats = await getSystemStats();
        const message = formatSystemStats(stats);
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'adminusers') {
        const totalUsers = Object.keys(global.db.users).length;
        const recentUsers = Object.entries(global.db.users)
            .sort(([,a], [,b]) => (b.lastSeen || 0) - (a.lastSeen || 0))
            .slice(0, 10)
            .map(([id, user]) => `• ${user.username || 'Unknown'} (${id})`)
            .join('\n');
        
        const message = `👥 *User Management*\n\n` +
                       `Total Users: ${totalUsers}\n\n` +
                       `Recent Users:\n${recentUsers}\n\n` +
                       `Use: \`/userinfo <id>\` to get user details\n` +
                       `Use: \`/blockuser <id>\` to block/unblock\n` +
                       `Use: \`/premium <id>\` to set premium status`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'admingroups') {
        const totalGroups = Object.keys(global.db.groups).length;
        const recentGroups = Object.entries(global.db.groups)
            .sort(([,a], [,b]) => (b.lastActivity || 0) - (a.lastActivity || 0))
            .slice(0, 10)
            .map(([id, group]) => `• ${group.groupName || 'Unknown'} (${id})`)
            .join('\n');
        
        const message = `💬 *Group Management*\n\n` +
                       `Total Groups: ${totalGroups}\n\n` +
                       `Recent Groups:\n${recentGroups}\n\n` +
                       `Use: \`/groupinfo <id>\` to get group details\n` +
                       `Use: \`/togglegroup <id>\` to enable/disable`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'admincmds') {
        const topCommands = getTopCommands(10);
        const commandList = topCommands.map((cmd, index) => 
            `${index + 1}. *${cmd.command}* - ${cmd.total} uses (${cmd.today} today)`
        ).join('\n');
        
        const message = `📝 *Command Statistics*\n\n` +
                       `Top Commands:\n${commandList}`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'broadcast') {
        if (!text) {
            await Gifted.reply({ 
                text: '📢 *Broadcast System*\n\nUsage: `/broadcast <message>`\n\nThis will send a message to all users and groups.', 
                parse_mode: 'Markdown' 
            }, m);
            return;
        }
        
        const broadcastId = await createBroadcast(text, 'all', userId);
        
        await Gifted.reply({ 
            text: `📢 Broadcast created! ID: ${broadcastId}\n\nStarting broadcast...`, 
            parse_mode: 'Markdown' 
        }, m);
        
        // Execute broadcast
        const success = await executeBroadcast(Gifted, broadcastId);
        
        if (success) {
            const broadcast = global.db.broadcasts[broadcastId];
            await Gifted.reply({ 
                text: `✅ Broadcast completed!\n\n📊 Results:\n• Sent: ${broadcast.sent}\n• Failed: ${broadcast.failed}\n• Total: ${broadcast.total}`, 
                parse_mode: 'Markdown' 
            }, m);
        }
        return;
    }
    
    if (command === 'userinfo') {
        if (!text) {
            await Gifted.reply({ text: 'Usage: `/userinfo <user_id>`' }, m);
            return;
        }
        
        const userInfo = getUserInfo(text.trim());
        if (!userInfo) {
            await Gifted.reply({ text: '❌ User not found' }, m);
            return;
        }
        
        const message = `👤 *User Information*\n\n` +
                       `ID: \`${userInfo.id}\`\n` +
                       `Username: ${userInfo.username}\n` +
                       `Join Date: ${new Date(userInfo.joinDate).toLocaleString()}\n` +
                       `Last Seen: ${new Date(userInfo.lastSeen).toLocaleString()}\n` +
                       `Commands Used: ${userInfo.commandsUsed}\n` +
                       `Current Role: ${userInfo.currentRole}\n` +
                       `Language: ${userInfo.language}\n` +
                       `Blocked: ${userInfo.isBlocked ? '🔴 Yes' : '🟢 No'}\n` +
                       `Premium: ${userInfo.isPremium ? '⭐ Yes' : '❌ No'}`;
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'blockuser') {
        if (!text) {
            await Gifted.reply({ text: 'Usage: `/blockuser <user_id>`' }, m);
            return;
        }
        
        const targetUserId = text.trim();
        const userInfo = getUserInfo(targetUserId);
        
        if (!userInfo) {
            await Gifted.reply({ text: '❌ User not found' }, m);
            return;
        }
        
        const blocked = !userInfo.isBlocked;
        toggleUserBlock(targetUserId, blocked);
        
        await Gifted.reply({ 
            text: `${blocked ? '🔴' : '🟢'} User ${userInfo.username} (${targetUserId}) has been ${blocked ? 'blocked' : 'unblocked'}`, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
    
    if (command === 'premium') {
        const args = text.trim().split(' ');
        if (args.length < 1) {
            await Gifted.reply({ text: 'Usage: `/premium <user_id> [days]`' }, m);
            return;
        }
        
        const targetUserId = args[0];
        const days = args[1] ? parseInt(args[1]) : null;
        
        const userInfo = getUserInfo(targetUserId);
        if (!userInfo) {
            await Gifted.reply({ text: '❌ User not found' }, m);
            return;
        }
        
        const premium = !userInfo.isPremium;
        setUserPremium(targetUserId, premium, days);
        
        let message = `${premium ? '⭐' : '❌'} User ${userInfo.username} (${targetUserId}) premium status: ${premium ? 'ENABLED' : 'DISABLED'}`;
        if (premium && days) {
            message += `\nExpires in: ${days} days`;
        }
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, m);
        return;
    }
};

// Handle callback queries for admin panel
adminPanel.callback = async (m, { Gifted, data }) => {
    const userId = m.from.id;
    
    if (!global.ownerId.includes(userId)) {
        await Gifted.answerCallbackQuery(m.id, { text: '❌ Admin access required!' });
        return;
    }
    
    switch (data) {
        case 'adminstats':
            const stats = await getSystemStats();
            const message = formatSystemStats(stats);
            
            await Gifted.editMessageText(message, {
                chat_id: m.chat.id,
                message_id: m.message_id,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🔙 Back', callback_data: JSON.stringify({ feature: 'admin' }) }
                    ]]
                }
            });
            break;
            
        case 'closemenu':
            await Gifted.deleteMessage(m.chat.id, m.message_id);
            break;
            
        default:
            await Gifted.answerCallbackQuery(m.id, { text: 'Feature coming soon!' });
    }
};

adminPanel.command = ['admin', 'adminstats', 'adminusers', 'admingroups', 'admincmds', 'broadcast', 'userinfo', 'blockuser', 'premium'];
adminPanel.desc = 'Advanced admin control panel';
adminPanel.category = ['admin'];
adminPanel.settings = { owner: true };

module.exports = adminPanel;