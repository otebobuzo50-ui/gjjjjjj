const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

// منع السكربت من الانهيار والانطفاء عند حدوث أي خطأ مفاجئ
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// قراءة البيانات من متغيرات البيئة في Railway
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;
const adminId = parseInt(process.env.ADMIN_ID);

const botClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
const userClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });

let userState = { step: 0, phone: "", phoneCodeHash: "" };

async function main() {
    // تشغيل البوت
    await botClient.start({ botAuthToken: botToken });
    console.log("🤖 Bot is running on Railway!");

    // الاتصال بعميل المستخدم مسبقاً عند الإقلاع لتجنب مشاكل الاتصال
    try {
        await userClient.connect();
        console.log("UserClient connected successfully!");
    } catch (e) {
        console.error("UserClient connection error:", e);
    }

    try {
        await botClient.sendMessage(adminId, { 
            message: "🤖 تم تشغيل السكربت بنجاح على Railway واستقرار الاتصال!\nأرسل /start لبدء تسجيل الدخول." 
        });
    } catch (e) {
        console.error("Error sending startup message:", e.message);
    }

    botClient.addEventHandler(async (event) => {
        try {
            const message = event.message;
            if (!message || !message.chatId || message.chatId.toString() !== adminId.toString()) return;

            const text = message.text ? message.text.trim() : "";

            if (text === "/start") {
                userState.step = 1;
                await botClient.sendMessage(adminId, { 
                    message: "أهلاً بك! أرسل رقم الهاتف لتسجيل الدخول (مع مفتاح الدولة، مثل +964 أو +1):" 
                });
                return;
            }

            if (userState.step === 1) {
                userState.phone = text;
                await botClient.sendMessage(adminId, { 
                    message: `جاري طلب الكود للرقم ${userState.phone} ... يرجى الانتظار.` 
                });
                
                try {
                    const res = await userClient.sendCode(
                        { apiId: apiId, apiHash: apiHash },
                        userState.phone
                    );
                    userState.phoneCodeHash = res.phoneCodeHash;
                    userState.step = 2;
                    await botClient.sendMessage(adminId, { 
                        message: "✅ تم إرسال الكود بنجاح!\n\n⚠️ أرسل الكود وبينه شارحة (-). مثلاً: 12-345" 
                    });
                } catch (err) {
                    console.error("SendCode Error:", err);
                    await botClient.sendMessage(adminId, { 
                        message: `❌ حدث خطأ أثناء إرسال الكود:\n\`${err.message || err}\`\n\nأرسل /start للمحاولة مرة أخرى.` 
                    });
                    userState.step = 0;
                }
                return;
            }

            if (userState.step === 2) {
                const code = text.replace(/-/g, "").trim();
                await botClient.sendMessage(adminId, { message: "جاري التحقق وتسجيل الدخول..." });
                
                try {
                    await userClient.signIn({
                        apiId: apiId,
                        apiHash: apiHash,
                    }, {
                        phoneNumber: userState.phone,
                        phoneCode: code,
                        phoneCodeHash: userState.phoneCodeHash,
                    });

                    const me = await userClient.getMe();
                    const sessionString = userClient.session.save();
                    
                    await botClient.sendMessage(adminId, { 
                        message: `🎉 تم تسجيل الدخول بنجاح!\n\nأهلاً ${me.firstName}!\n\n🔑 كود الجلسة الخاص بك (String Session):\n\`${sessionString}\`\n\nاحتفظ بهذا الكود لتتمكن من استخدام الحساب مباشرة مستقبلاً.` 
                    });
                    userState.step = 0;
                } catch (err) {
                    console.error("SignIn Error:", err);
                    await botClient.sendMessage(adminId, { 
                        message: `❌ الكود غير صحيح أو حدث خطأ:\n\`${err.message || err}\`\n\nأرسل الكود ثانية أو /start للبدء من جديد.` 
                    });
                }
            }
        } catch (handlerErr) {
            console.error("Handler Error:", handlerErr);
        }
    });
}

main().catch(err => console.error("Fatal Main Error:", err));
