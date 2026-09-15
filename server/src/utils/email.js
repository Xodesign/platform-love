import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.yandex.ru",
	port: parseInt(process.env.SMTP_PORT) || 465,
	secure: process.env.SMTP_SECURE === "true" || true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export async function sendEmail({ to, subject, text, html }) {
	if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
		console.log(`\n📧 [MOCK EMAIL] To: ${to}, Subject: ${subject}`);
		console.log(`   Text: ${text}\n`);
		return { success: true, mock: true };
	}

	try {
		const info = await transporter.sendMail({
			from: `"Platform Love" <${process.env.SMTP_USER}>`,
			to,
			subject,
			text,
			html: html || text,
		});

		console.log(`✅ Email отправлен: ${to} (ID: ${info.messageId})`);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("❌ Email error:", error.message);
		return { success: false, error: error.message };
	}
}

// Email шаблоны
export const emailTemplates = {
	welcome: (name) => ({
		subject: "Добро пожаловать в Platform Love!",
		text: `Привет, ${name}!\n\nДобро пожаловать в Platform Love!\n\nВаш аккаунт успешно создан. Начните знакомиться с интересными людьми!\n\nС уважением,\nКоманда Platform Love`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7B5EA7;">Добро пожаловать в Platform Love! 🎉</h1>
        <p>Привет, <strong>${name}</strong>!</p>
        <p>Рады приветствовать тебя в нашем приложении для знакомств.</p>
        <p>Начни знакомиться с интересными людьми прямо сейчас!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">С уважением,<br>Команда Platform Love</p>
      </div>
    `,
	}),

	verification: (name, code) => ({
		subject: "Код подтверждения Platform Love",
		text: `Привет, ${name}!\n\nВаш код подтверждения: ${code}\n\nВведите этот код для завершения регистрации.\n\nЕсли вы не запрашивали этот код, проигнорируйте сообщение.`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7B5EA7;">Подтверждение email</h1>
        <p>Привет, <strong>${name}</strong>!</p>
        <p>Ваш код подтверждения:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; margin: 20px 0;">
          <strong>${code}</strong>
        </div>
        <p>Введите этот код для завершения регистрации.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Если вы не запрашивали этот код, проигнорируйте сообщение.</p>
      </div>
    `,
	}),

	matchNotification: (name, matchedName) => ({
		subject: "Новый мэтч! 💕",
		text: `Привет, ${name}!\n\nВы понравились ${matchedName}! Это мэтч!\n\nНачните общение прямо сейчас.`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E91E63;">💕 Новый мэтч!</h1>
        <p>Привет, <strong>${name}</strong>!</p>
        <p><strong>${matchedName}</strong> оценил(а) тебя взаимно!</p>
        <p>Это отличная новость — начните общение прямо сейчас!</p>
      </div>
    `,
	}),

	passwordReset: (name, code) => ({
		subject: "Восстановление пароля Platform Love",
		text: `Привет, ${name}!\n\nКод для восстановления пароля: ${code}\n\nЕсли вы не запрашивали восстановление, проигнорируйте сообщение.`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7B5EA7;">Восстановление пароля</h1>
        <p>Привет, <strong>${name}</strong>!</p>
        <p>Ваш код для восстановления:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 20px 0;">
          <strong>${code}</strong>
        </div>
        <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 13px;">
            <strong>⚠️ Внимание!</strong> Это письмо может попасть в папку "Спам".
            <br>Если вы не видите письмо во входящих, проверьте папку "Спам" и пометьте как "Не спам".
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Если вы не запрашивали восстановление, проигнорируйте сообщение.</p>
      </div>
    `,
	}),
};
