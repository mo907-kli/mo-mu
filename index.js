const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');

// إعداد سيرفر الويب البسيط عشان Render ما يقفل البوت
const app = express();
app.get('/', (req, res) => res.send('Music Bot is Online!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready for Render.'));

// إعداد البوت
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// إنشاء لوحة التحكم الاحترافية للموسيقى
client.on('messageCreate', async message => {
    if (message.content === '!setup-music') {
        const embed = new EmbedBuilder()
            .setTitle('🎵 واجهة التحكم بالموسيقى')
            .setDescription('استخدم الأزرار بالأسفل للتحكم بالصوتيات في الروم الصوتي.\n\nالخيارات المتاحة:\n▶️ تشغيل / إيقاف\n⏭️ تخطي المقطع\n⏹️ إيقاف وخروج\n🔁 تكرار المقطع\n🔊 رفع/خفض الصوت')
            .setColor('#2F3136') // لون داكن فخم يشبه الصورة
            .setImage('رابط_صورة_جميلة_للبانر_هنا_إن_وجدت');

        // الصف الأول من الأزرار
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('play_pause').setEmoji('⏯️').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Success)
            );

        // الصف الثاني من الأزرار (للصوت وإعدادات إضافية)
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('vol_down').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('vol_up').setEmoji('🔊').setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// هنا تستقبل ضغطات الأزرار وتربطها بمكتبة الموسيقى اللي بتستخدمها
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    // مثال لرد فعل الزر
    if (interaction.customId === 'play_pause') {
        await interaction.reply({ content: 'تم تغيير حالة التشغيل!', ephemeral: true });
        // هنا تحط كود تشغيل/إيقاف الموسيقى
    }
});

client.login(process.env.TOKEN);
