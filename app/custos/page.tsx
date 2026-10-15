import {protectPage} from '../lib/auth';
export const dynamic='force-dynamic';
import CostPage from './cost-page';
export const metadata={title:'Custos e preços • Gataria'};
export default async function Page(){await protectPage();return <CostPage/>}
