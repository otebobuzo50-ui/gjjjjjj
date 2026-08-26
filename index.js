const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

// منع السكربت من الانهيار عند حدوث أي خطأ مفاجئ
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// قراءة متغيرات البيئة
const apiId = process.env.API_ID ? parseInt(process.env.API_ID) : 30347057;
const apiHash = process.env.API_HASH || "811b8717802652f382f7d6c874d02aeb";
const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID ? parseInt(process.env.ADMIN_ID) : 6491999046;

if (!botToken) {
    console.error("❌ خطأ حرج: متغير BOT_TOKEN غير موجود في إعدادات Railway (Variables)!");
    process.exit(1);
}

// ----------------------------------------------------
// قائمة البروكسيات (HTTP) واختيار واحد بشكل عشوائي
// ----------------------------------------------------
const proxyList = [
    "146.70.40.94:80:ifsnfjoz-US-1:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-2:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-3:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-4:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-5:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-6:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-7:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-8:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-9:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-10:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-11:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-12:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-13:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-14:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-15:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-16:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-17:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-18:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-19:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-20:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-21:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-22:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-23:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-24:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-25:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-26:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-27:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-28:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-29:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-30:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-31:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-32:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-33:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-34:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-35:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-36:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-37:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-38:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-39:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-40:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-41:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-42:4vs1im2idegn",
    "50.7.248.98:80:ifsnfjoz-US-43:4vs1im2idegn",
    "143.244.56.83:80:ifsnfjoz-US-44:4vs1im2idegn",
    "143.244.56.82:80:ifsnfjoz-US-45:4vs1im2idegn",
    "107.155.114.6:80:ifsnfjoz-US-46:4vs1im2idegn",
    "45.134.79.52:80:ifsnfjoz-US-47:4vs1im2idegn",
    "149.6.162.2:80:ifsnfjoz-US-48:4vs1im2idegn",
    "146.70.40.94:80:ifsnfjoz-US-49:4vs1im2idegn",
    "149.6.162.10:80:ifsnfjoz-US-50:4vs1im2idegn"
];

const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];
const [proxyIp, proxyPort, proxyUser, proxyPass] = randomProxy.split(":");

console.log(`تم اختيار البروكسي بنجاح: ${proxyIp}:${proxyPort}`);

const botClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });

// ربط البروكسي بعميل المستخدم (UserClient)
const userClient = new TelegramClient(new StringSession(""), apiId, apiHash, { 
    connectionRetries: 5,
    proxy: {
        ip: proxyIp,
        port: parseInt(proxyPort),
        httpProxy: true,
        username: proxyUser,
        password: proxyPass
    }
});

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
        console.log("UserClient connected via proxy successfully!");
    } catch (e) {
        console.error("UserClient connection error:", e);
    }

    try {
        await botClient.sendMessage(adminId, { 
            message: `🤖 تم تشغيل السكربت بنجاح على Railway عبر البروكسي (${proxyIp})!\nأرسل /start لبدء تسجيل الدخول.` 
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
                    message: `جاري طلب الكود للرقم ${userState.phone} عبر البروكسي ... يرجى الانتظار.` 
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
                        message: `❌ حدث خطأ أثناء إرسال الكود (البروكسي قد يكون بطيئاً أو محظوراً):\n\`${err.message || err}\`\n\nأرسل /start للمحاولة مرة أخرى (سيتم اختيار بروكسي جديد تلقائياً عند إعادة التشغيل).` 
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
