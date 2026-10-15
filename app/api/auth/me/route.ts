import {withDatabase} from '../../../lib/database';import {requireUser,jsonError} from '../../../lib/auth';import {readSettings} from '../../../lib/settings';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await withDatabase(async db=>({user:await requireUser(db,false,true),settings:(await readSettings(db)).values})),{headers:{'Cache-Control':'no-store'}})}catch(e){return jsonError(e)}}
