import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export function validatePassword(value:unknown):asserts value is string{if(typeof value!=='string'||value.length<10||value.length>128)throw Error('A senha deve ter entre 10 e 128 caracteres.');}
export async function hashPassword(password:string){validatePassword(password);const salt=randomBytes(24).toString('hex');const hash=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password:string,stored:string){const [kind,salt,hex]=stored.split(':');if(kind!=='scrypt'||!salt||!hex)return false;const value=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(hex,'hex');return expected.length===value.length&&timingSafeEqual(value,expected);}
export function secretEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function tokenHash(token:string){if(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.length<32)throw Error('Configure AUTH_SECRET com pelo menos 32 caracteres.');return createHmac('sha256',process.env.AUTH_SECRET).update(token).digest('hex');}
