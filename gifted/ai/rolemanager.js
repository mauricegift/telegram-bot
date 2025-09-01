const { getUserRole, setUserRole, getLocalizedText, generateRoleKeyboard, aiRoles } = require('../ai/roles');

let roleManager = async (m, { Gifted, text, command }) => {
    const userId = m.from.id;
    const currentRole = getUserRole(userId);
    
    if (command === 'role' && !text) {
        // Show current role and available options
        const roleList = Object.entries(aiRoles).map(([key, role]) => 
            `${key === currentRole.name.toLowerCase() ? '👉 ' : ''}${role.name}: ${role.description}`
        ).join('\n');
        
        const message = `🤖 *AI Role Management*\n\n` +
                       `${getLocalizedText(userId, 'current_role')}: *${currentRole.name}*\n\n` +
                       `${getLocalizedText(userId, 'select_role')}\n\n` +
                       `Available Roles:\n${roleList}`;
        
        const keyboard = generateRoleKeyboard();
        
        await Gifted.reply({ 
            text: message, 
            parse_mode: 'Markdown' 
        }, keyboard, m);
        return;
    }
    
    if (command === 'setrole') {
        const roleKey = text.toLowerCase();
        
        if (!aiRoles[roleKey]) {
            const availableRoles = Object.keys(aiRoles).join(', ');
            await Gifted.reply({ 
                text: `❌ Invalid role. Available roles: ${availableRoles}`, 
                parse_mode: 'Markdown' 
            }, m);
            return;
        }
        
        const success = setUserRole(userId, roleKey);
        if (success) {
            const newRole = getUserRole(userId);
            const message = `✅ ${getLocalizedText(userId, 'role_changed')}\n\n` +
                           `New Role: *${newRole.name}*\n` +
                           `Description: ${newRole.description}\n\n` +
                           `*System Prompt Updated:*\n${newRole.systemPrompt}`;
            
            await Gifted.reply({ 
                text: message, 
                parse_mode: 'Markdown' 
            }, m);
        } else {
            await Gifted.reply({ 
                text: '❌ Failed to update role', 
                parse_mode: 'Markdown' 
            }, m);
        }
        return;
    }
};

// Handle callback for role selection
roleManager.callback = async (m, { Gifted, data }) => {
    const userId = m.from.id;
    const roleKey = data;
    
    if (!aiRoles[roleKey]) {
        await Gifted.answerCallbackQuery(m.id, { text: '❌ Invalid role' });
        return;
    }
    
    const success = setUserRole(userId, roleKey);
    if (success) {
        const newRole = getUserRole(userId);
        const message = `✅ ${getLocalizedText(userId, 'role_changed')}\n\n` +
                       `New Role: *${newRole.name}*\n` +
                       `Description: ${newRole.description}\n\n` +
                       `*Capabilities:*\n• ${newRole.capabilities.join('\n• ')}`;
        
        await Gifted.editMessageText(message, {
            chat_id: m.chat.id,
            message_id: m.message_id,
            parse_mode: 'Markdown'
        });
    }
};

roleManager.command = ['role', 'setrole', 'roles'];
roleManager.desc = 'Manage AI assistant roles and personalities';
roleManager.category = ['ai', 'settings'];

module.exports = roleManager;