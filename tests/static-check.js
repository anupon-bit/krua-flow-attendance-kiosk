'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
for(const file of ['workspace.html','workforce.html','apply.html','activity.html','portal.html','manager.html']){
  const html=fs.readFileSync(file,'utf8');
  const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
  scripts.forEach((source,index)=>new vm.Script(source,{filename:file+'#inline-'+(index+1)}));
}
console.log('inline script syntax: pass');
