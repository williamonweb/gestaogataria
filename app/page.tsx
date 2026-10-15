import {protectPage} from './lib/auth';
export const dynamic='force-dynamic';
import Dashboard from './dashboard';
export default async function Page(){await protectPage();return <Dashboard/>}
