const RELEASES='https://github.com/fivsevn/umwelt/releases';
function compareVersions(a,b){
 const parse=value=>/^v?(\d+)\.(\d+)\.(\d+)(?:\+[\w.-]+)?$/.exec(value||'')?.slice(1).map(Number);
 const left=parse(a),right=parse(b);if(!left||!right)return null;
 for(let i=0;i<3;i++)if(left[i]!==right[i])return Math.sign(left[i]-right[i]);return 0;
}
async function checkRelease(current,request=fetch){
 const response=await request('https://api.github.com/repos/fivsevn/umwelt/releases/latest',{headers:{Accept:'application/vnd.github+json','User-Agent':'UMWELT-Desktop'},signal:AbortSignal.timeout(10000)});
 if(response.status===404)return {current,status:'unpublished',url:RELEASES};
 if(!response.ok)throw Error(`GitHub HTTP ${response.status}`);
 const release=await response.json();
 if(typeof release.tag_name!=='string'||release.draft||release.prerelease)throw Error('Invalid stable release');
 const compared=compareVersions(release.tag_name,current);
 return {current,latest:release.tag_name,status:compared===null?'unknown':compared>0?'available':compared===0?'current':'ahead',url:RELEASES+'/latest'};
}
module.exports={compareVersions,checkRelease};
