const { gmd } = require('../gift');

gmd({
    pattern: "demote",
    aliases: ["removeadmin", "unadmin"],
    react: "😈",
    category: "group",
    description: "Demote a user from admin",
    adminonly: true,
    grouponly: true,
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("❌ Please reply to the user you want to demote.");
    }

    const targetUserId = messageReply.from.id;
    const targetUserName = messageReply.from.first_name + (messageReply.from.last_name ? ' ' + messageReply.from.last_name : '');

    try {
        await Gifted.promoteChatMember(conText.chatId, targetUserId, {
            can_change_info: false,
            can_delete_messages: false,
            can_invite_users: false,
            can_restrict_members: false,
            can_pin_messages: false,
            can_promote_members: false,
            can_manage_chat: false,
            can_manage_video_chats: false,
            can_post_messages: false,
            can_edit_messages: false
        });

        await reply(`✅ Successfully demoted ${targetUserName} from admin!`);
    } catch (error) {
        console.error('Demote error:', error);
        if (error.response && error.response.statusCode === 400) {
            await reply("❌ I need admin permissions to demote users.");
        } else if (error.response && error.response.statusCode === 403) {
            await reply("❌ Cannot demote this user. They might not be an admin or I don't have sufficient permissions.");
        } else {
            await reply("❌ Failed to demote user. Make sure I have admin permissions.");
        }
    }
});

gmd({
    pattern: "promote",
    aliases: ["admin", "makeadmin"],
    react: "🏆",
    category: "group",
    description: "Promote a user to admin",
    adminonly: true,
    grouponly: true,
    cooldown: 5
},

async (msg, Gifted, conText) => {
    const { reply, messageReply } = conText;

    if (!messageReply) {
        return await reply("❌ Please reply to the user you want to promote.");
    }

    const targetUserId = messageReply.from.id;
    const targetUserName = messageReply.from.first_name + (messageReply.from.last_name ? ' ' + messageReply.from.last_name : '');

    try {
        await Gifted.promoteChatMember(conText.chatId, targetUserId, {
            can_change_info: true,
            can_delete_messages: true,
            can_invite_users: true,
            can_restrict_members: true,
            can_pin_messages: true,
            can_promote_members: false,
            can_manage_chat: true,
            can_manage_video_chats: true
        });

        await reply(`✅ Successfully promoted ${targetUserName} to admin!`);
    } catch (error) {
        console.error('Promote error:', error);
        if (error.response && error.response.statusCode === 400) {
            await reply("❌ I need admin permissions to promote users.");
        } else if (error.response && error.response.statusCode === 403) {
            await reply("❌ Cannot promote this user. They might already be an admin or I don't have sufficient permissions.");
        } else {
            await reply("❌ Failed to promote user. Make sure I have admin permissions.");
        }
    }
});
