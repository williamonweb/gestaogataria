import SetupForm from './setup-form';import {withDatabase} from '../lib/database';import {redirect} from 'next/navigation';export const dynamic='force-dynamic';
export default async function Page(){const exists=await withDatabase(async db=>(await db.prepare('SELECT id FROM users LIMIT 1').all()).results.length>0).catch(()=>false);if(exists)redirect('/login');return <SetupForm/>}
