import SettingsPage from './settings-page';import {withDatabase} from '../lib/database';import {currentUser} from '../lib/auth';import {redirect} from 'next/navigation';export const dynamic='force-dynamic';
export default async function Page(){const user=await withDatabase(currentUser).catch(()=>null);if(!user)redirect('/login');return <SettingsPage user={user}/>}
