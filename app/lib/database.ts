import {Pool, type PoolClient} from 'pg';
const globalDb=globalThis as unknown as {gatariaPool?:Pool};
export function pool(){if(!process.env.DATABASE_URL)throw Error('Configure DATABASE_URL para conectar o banco.');return globalDb.gatariaPool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:15000});}
function convert(sql:string){let index=0;return sql.replace(/\?/g,()=>'$'+(++index));}
class Statement {
 constructor(private client:PoolClient,public sql:string,public values:any[]=[]){}
 bind(...values:any[]){return new Statement(this.client,this.sql,values)}
 async all(){const r=await this.client.query(convert(this.sql),this.values);return {results:r.rows}}
 async first(){return (await this.all()).results[0]??null}
 async run(){const r=await this.client.query(convert(this.sql),this.values);return {meta:{changes:r.rowCount??0}}}
}
export class Database {
 constructor(public client:PoolClient){}
 prepare(sql:string){return new Statement(this.client,sql)}
 async batch(statements:Statement[]){const result=[];for(const statement of statements)result.push(await statement.run());return result}
}
/** A operação inteira usa o mesmo cliente. SERIALIZABLE protege saldos e revisões concorrentes. */
export async function withDatabase<T>(fn:(db:Database)=>Promise<T>):Promise<T>{for(let attempt=0;attempt<3;attempt++){const client=await pool().connect();try{await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');const result=await fn(new Database(client));await client.query('COMMIT');return result}catch(e:any){await client.query('ROLLBACK').catch(()=>{});if(e.code==='40001'&&attempt<2)continue;throw e}finally{client.release()}}throw Error('Não foi possível concluir a transação.');}
