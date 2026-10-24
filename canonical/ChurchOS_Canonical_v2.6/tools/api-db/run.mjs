import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
mkdirSync('/evidence',{recursive:true});
// A previous run must not supply stale PASS evidence after a failed unit test.
const resultPath='/evidence/api-db-result.json';if(existsSync(resultPath))unlinkSync(resultPath);
const summary={artifact:'ChurchOS_Canonical_v2.6',runtime:'INCOMPLETE',stages:[]};
for(const [command,args] of [['npm',['test']],['node',['dist/integration/verify.js']]]){
 const r=spawnSync(command,args,{stdio:'inherit',timeout:180000});
 const exit=r.status??1;summary.stages.push({command:[command,...args],exit_code:exit});
 writeFileSync('/evidence/launcher-result.json',JSON.stringify(summary,null,2)+'\n');
 if(exit!==0)process.exit(exit);
}
if(!existsSync(resultPath)||JSON.parse(readFileSync(resultPath,'utf8')).runtime!=='PASS')process.exit(1);
summary.runtime='PASS';writeFileSync('/evidence/launcher-result.json',JSON.stringify(summary,null,2)+'\n');
console.log('API_DB_VERIFICATION_PASS');
