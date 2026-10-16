import {protectPage} from '../lib/auth';import WithdrawalsPage from './withdrawals-page';export const dynamic='force-dynamic';export const metadata={title:'Lucros e retiradas • Gataria'};
export default async function Page(){await protectPage(true);return <WithdrawalsPage/>}
