require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const express = require('express');

// 1. إعداد سيرفر الويب عشان Render ما يقفل البوت
const app = express();
app.get('/', (req, res) => res.send('🎵 Music Bot is Online and Running!'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Web server is ready for Render.'));

// 2. إعداد البوت بصلاحيات الدخول للرومات الصوتية وقراءة الرسائل
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 3. إعداد نظام الموسيقى الاحترافي
const player = new Player(client);
player.extractors.loadMulti(DefaultExtractors);

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// 4. الأوامر النصية (تثبيت اللوحة + تشغيل أغنية)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // أمر إرسال لوحة التحكم الفخمة
    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🎵 واجهة التحكم بالموسيقى')
            .setDescription('استخدم الأزرار بالأسفل للتحكم بالصوتيات.\n\nلتشغيل مقطع جديد اكتب:\n`!play <اسم الأغنية أو الرابط>`')
            .setColor('#2F3136')
            .setImage('https://i.imgur.com/8QWv1x9.gif'); // تقدر تغير الرابط بصورة بانر لسيرفرك

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pause_resume').setEmoji('⏯️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [row1] });
    }

    // أمر تشغيل الموسيقى
    if (message.content.startsWith('!play ')) {
        const query = message.content.replace('!play ', '');
        const channel = message.member.voice.channel;

        if (!channel) return message.reply('❌ لازم تدخل روم صوتي أول!');

        await message.reply(`🔍 جاري البحث عن: **${query}**...`);

        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: message // حفظ بيانات الرسالة للتحديثات
                }
            });
            message.channel.send(`🎶 تم التشغيل: **${track.title}**`);
        } catch (e) {
            console.log(e);
            message.channel.send('❌ صار خطأ أو ما لقيت المقطع.');
        }
    }
});

// 5. نظام التفاعل مع الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const queue = player.nodes.get(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
        return interaction.reply({ content: '❌ ما فيه شيء شغال حالياً!', ephemeral: true });
    }

    // التحقق من أن العضو في نفس الروم الصوتي للبوت
    if (interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
        return interaction.reply({ content: '❌ لازم تكون معي في نفس الروم الصوتي!', ephemeral: true });
    }

    switch (interaction.customId) {
        case 'pause_resume':
            queue.node.setPaused(!queue.node.isPaused());
            await interaction.reply({ content: queue.node.isPaused() ? '⏸️ تم الإيقاف المؤقت' : '▶️ تم استكمال التشغيل', ephemeral: true });
            break;
        case 'skip':
            queue.node.skip();
            await interaction.reply({ content: '⏭️ تم تخطي المقطع!', ephemeral: true });
            break;
        case 'stop':
            queue.delete();
            await interaction.reply({ content: '⏹️ تم إيقاف الموسيقى ومسح الطابور.', ephemeral: true });
            break;
        case 'loop':
            const currentMode = queue.repeatMode;
            // تبديل بين تكرار المقطع (1) وإيقاف التكرار (0)
            queue.setRepeatMode(currentMode === 0 ? 1 : 0);
            await interaction.reply({ content: currentMode === 0 ? '🔁 تم تفعيل تكرار المقطع' : '▶️ تم إيقاف التكرار', ephemeral: true });
            break;
    }
});

// تشغيل البوت عبر التوكن (من متغيرات البيئة في Render)
client.login(process.env.TOKEN);
