const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

process.on('unhandledRejection', (reason) => console.error('Unhandled:', reason));
process.on('uncaughtException', (error) => console.error('Uncaught:', error));

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessionString = process.env.SESSION_STRING || "";

async function main() {
    if (!sessionString) {
        console.error("❌ خطأ: يجيب وضع SESSION_STRING في متغيرات Railway!");
        return;
    }

    console.log("جاري تسجيل الدخول باستخدام الجلسة المحفوظة...");
    
    // استخدام كود الجلسة الجاهز لتجنب حظر السيرفرات تماماً
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.connect();
    
    const me = await client.getMe();
    console.log(`🎉 تم تسجيل الدخول بنجاح إلى حساب: ${me.firstName} (@${me.username || 'لا يوجد معرف'})`);
}

main().catch(err => console.error("Fatal Error:", err));
