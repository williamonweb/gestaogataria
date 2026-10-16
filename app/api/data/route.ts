import {withDatabase} from '../../lib/database';
import {requireUser,safeMutation,jsonError,audit} from '../../lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';

import {maskPhone,maskDocument} from '../../lib/masks';
const reply=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});
const statuses=['Recebido','Arte / aprovação','Em produção','Pronto','Entregue','Cancelado'];
const methods=['Pix','Dinheiro','Cartão','Transferência'];
export async function GET(){try{return await withDatabase(async db=>{await requireUser(db);const [o,l,q]=await Promise.all([db.prepare('SELECT * FROM orders ORDER BY created DESC').all(),db.prepare('SELECT * FROM ledger ORDER BY date DESC, created DESC').all(),db.prepare('SELECT id,customer,number,total,order_id,created,updated,revision FROM quotes ORDER BY updated DESC').all()]);return reply({orders:o.results.map((x:any)=>({...x,items:JSON.parse(x.items)})),ledger:l.results,quotes:q.results});});}catch(e){return jsonError(e);}}
export async function POST(req:Request){try{safeMutation(req);const b=await req.json() as any;return await withDatabase(async db=>{const actor=await requireUser(db);
 const now=new Date().toISOString();const id=crypto.randomUUID();const localDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
 if(b.action==='order'){
 if(typeof b.customer!=='string'||!b.customer.trim()||b.customer.length>150)throw Error('Informe o nome do cliente.');
 if(!statuses.includes(b.status)||!Array.isArray(b.items)||!b.items.length||b.items.length>100)throw Error('Confira os itens e a etapa.');
 let total=0; for(const i of b.items){if(typeof i.name!=='string'||!i.name.trim()||!Number.isInteger(i.qty)||i.qty<1||i.qty>10000||!Number.isInteger(i.price)||i.price<1||i.price>100000000)throw Error('Confira nome, quantidade e preço dos produtos.'); total+=i.qty*i.price;}
 if(!Number.isSafeInteger(total)||total>100000000)throw Error('Valor total inválido.');
 if(b.due&&!/^\d{4}-\d{2}-\d{2}$/.test(b.due))throw Error('Prazo inválido.');
 const args=[b.customer.trim(),maskPhone(b.phone),maskDocument(b.document),JSON.stringify(b.items),total,b.status,String(b.due||''),String(b.notes||'').slice(0,5000)];
 if(b.id){const locked=await db.prepare('SELECT order_id FROM profit_distributions WHERE order_id=?').bind(b.id).first();if(locked)return reply({error:'Este pedido já teve a divisão do lucro liberada e está fechado para edição.'},409);const r=await db.prepare('UPDATE orders SET customer=?,phone=?,document=?,items=?,total=?,status=?,due=?,notes=?,revision=revision+1 WHERE id=? AND revision=? AND ? >= COALESCE((SELECT SUM(amount) FROM ledger WHERE order_id=?),0)').bind(...args,b.id,b.revision,total,b.id).run();if(!r.meta.changes)return reply({error:'Pedido atualizado em outra tela ou total menor que o já recebido. Recarregue e confira.'},409);}
 else {const paid=Number(b.paid||0);if(!Number.isInteger(paid)||paid<0||paid>total)throw Error('Recebimento inicial inválido.');if(paid&&!methods.includes(b.method))throw Error('Selecione a forma de pagamento.');const stmts=[db.prepare('INSERT INTO orders(id,customer,phone,document,items,total,status,due,notes,created) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,...args,now)];if(paid)stmts.push(db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,paid,'Recebimento inicial • '+b.customer,b.method,localDate,now));await db.batch(stmts);}
 }else if(b.action==='payment'){
 if(!Number.isInteger(b.amount)||b.amount<1||!methods.includes(b.method))throw Error('Confira o valor e a forma de pagamento.');
 const r=await db.prepare("INSERT INTO ledger(id,order_id,amount,description,method,date,created) SELECT ?,id,?, 'Recebimento • ' || customer,?,?,? FROM orders WHERE id=? AND status!='Cancelado' AND total-COALESCE((SELECT SUM(amount) FROM ledger WHERE order_id=?),0)>=?").bind(id,b.amount,b.method,localDate,now,b.orderId,b.orderId,b.amount).run();if(!r.meta.changes)throw Error('Valor acima do saldo, pedido cancelado ou inexistente.');
 }else if(b.action==='movement'){
 if(!Number.isInteger(b.amount)||b.amount===0||Math.abs(b.amount)>100000000||!String(b.description||'').trim()||!methods.includes(b.method)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date))throw Error('Confira os dados do lançamento.');
 await db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)').bind(id,null,b.amount,String(b.description).slice(0,300),b.method,b.date,now).run();
 }else throw Error('Ação inválida.');await audit(db,actor.id,'pedido/caixa: '+String(b.action));return reply({ok:true});
 });}catch(e){if(e instanceof Error&&!('code' in e)&&e.name!=='HttpError')return reply({error:e.message},400);return jsonError(e);}}
