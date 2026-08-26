const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

// منع السكربت من الانهيار عند حدوث أي خطأ
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// قراءة متغيرات البيئة مع التأكد من وجودها
const apiId = process.env.API_ID ? parseInt(process.env.API_ID) : 30347057;
const apiHash = process.env.API_HASH || "811b8717802652f382f7d6c874d02aeb";
const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID ? parseInt(process.env.ADMIN_ID) : 6491999046;

// التحقق من التوكن الأساسي للبوت
if (!botToken) {
    console.error("❌ خطأ حرج: متغير BOT_TOKEN غير موجود في إعدادات Railway (Variables)!");
    process.exit(1);
}

console.log(`جاري تشغيل السكربت باستخدام API_ID: ${apiId} و ADMIN_ID: ${adminId}`);

const botClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
const userClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });

let userState = { step: 0, phone: "", phoneCodeHash: "" };

async function main() {
    try {
        await botClient.start({ botAuthToken: botToken });
        console.log("🤖 Bot is running on Railway successfully!");
    } catch (err) {
        console.error("Failed to start bot client:", err);
        return;
    }

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
        console.error("Error sending startup message to admin:", e.message);
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
                    await userClient.invoke(
                        new Api.auth.SignIn({
                            phoneNumber: userState.phone,
                            phoneCodeHash: userState.phoneCodeHash,
                            phoneCode: code,
                        })
                    );

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
