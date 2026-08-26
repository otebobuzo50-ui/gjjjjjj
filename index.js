const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

// بيانات الـ API والبوت الخاصة بك
const apiId = 30347057;
const apiHash = "811b8717802652f382f7d6c874d02aeb";
const botToken = "7744831171:AAEu-WjaRfZ3ez3vBRyPiKL6K0Q_Lc_l_mM";
const adminId = 6491999046;

// إنشاء عميل للبوت (للتواصل معك) وعميل للمستخدم (لتسجيل الدخول)
const botClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
const userClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });

let userState = { step: 0, phone: "", phoneCodeHash: "" };

async function main() {
    // تشغيل البوت عبر التوكن
    await botClient.start({ botAuthToken: botToken });
    console.log("🤖 البوت يعمل الآن على Railway بنجاح!");

    try {
        await botClient.sendMessage(adminId, { 
            message: "🤖 اشتغل السكربت على Railway بنجاح!\nأرسل /start لبدء تسجيل الدخول." 
        });
    } catch (e) {
        console.log("تعذر إرسال رسالة البداية للأدمن:", e.message);
    }

    // الاستماع لرسائلك أنت فقط (عبر admin_id)
    botClient.addEventHandler(async (event) => {
        const message = event.message;
        if (!message || message.chatId?.toString() !== adminId.toString()) return;

        const text = message.text;

        // الخطوة 0: البداية
        if (text === "/start") {
            userState.step = 1;
            await botClient.sendMessage(adminId, { 
                message: "أهلاً بك! أرسل رقم الهاتف لتسجيل الدخول (مع مفتاح الدولة، مثل +964 أو +1):" 
            });
            return;
        }

        // الخطوة 1: استلام الرقم وطلب الكود
        if (userState.step === 1) {
            userState.phone = text.trim();
            await botClient.sendMessage(adminId, { 
                message: `جاري طلب الكود للرقم ${userState.phone} ... يرجى الانتظار.` 
            });
            try {
                await userClient.connect();
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
                await botClient.sendMessage(adminId, { 
                    message: `❌ حدث خطأ:\n${err.message}\n\nأرسل /start للمحاولة مرة أخرى.` 
                });
                userState.step = 0;
            }
            return;
        }

        // الخطوة 2: استلام الكود وإتمام التسجيل
        if (userState.step === 2) {
            const code = text.replace("-", "").trim();
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
                // استخراج كود الجلسة لحفظه مستقبلاً
                const sessionString = userClient.session.save();
                
                await botClient.sendMessage(adminId, { 
                    message: `🎉 تم تسجيل الدخول بنجاح!\n\nأهلاً ${me.firstName}!\n\n🔑 كود الجلسة الخاص بك (String Session):\n\`${sessionString}\`\n\nاحتفظ بهذا الكود لتتمكن من استخدام الحساب مباشرة مستقبلاً دون الحاجة لكود.` 
                });
                userState.step = 0;
            } catch (err) {
                await botClient.sendMessage(adminId, { 
                    message: `❌ الكود غير صحيح أو حدث خطأ:\n${err.message}\n\nأرسل الكود ثانية أو /start للبدء من جديد.` 
                });
            }
        }
    });
}

main().catch(console.error);
