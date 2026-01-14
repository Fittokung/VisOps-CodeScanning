import crypto from 'crypto';

// ต้องใส่ ENCRYPTION_KEY ใน .env ด้วย (ยาว 32 ตัวอักษร)
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || "your-32-char-random-string-must-be-very-secure"; 
const IV_LENGTH = 16;

// ถ้า Key ไม่ครบ 32 ตัว จะ Error
if (SECRET_KEY.length !== 32) {
  // ใส่ fallback ชั่วคราวกัน error ตอน dev (แต่ production ต้องแก้ .env นะ)
  console.warn(" Warning: ENCRYPTION_KEY is not 32 chars. Using fallback.");
}

export function encrypt(text: string): string {
  // ป้องกันกรณี text เป็น null/undefined
  if (!text) return "";
  
  // ใช้ key ที่มีความยาว 32 bytes (ถ้า secret key สั้นไป ให้ตัดหรือเติม)
  const keyBuffer = Buffer.alloc(32); 
  keyBuffer.write(SECRET_KEY);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return "";
  
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const keyBuffer = Buffer.alloc(32); 
    keyBuffer.write(SECRET_KEY);

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}