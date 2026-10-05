'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const page=fs.readFileSync('payroll-attendance.html','utf8'),backend=fs.readFileSync('apps-script/รหัส.js','utf8');
const script=[...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)][0][1];
function source(text,name){const start=text.indexOf('function '+name+'('),end=text.indexOf('\nfunction ',start+1);assert.ok(start>=0);return text.slice(start,end<0?text.length:end);}
const context=vm.createContext({});new vm.Script(source(page,'isApiResponseSource')).runInContext(context);
const sink={};sink.parent=sink;const inner={parent:sink},deep={parent:inner},unrelated={};unrelated.parent=unrelated;
assert.equal(context.isApiResponseSource(deep,sink),true);
assert.equal(context.isApiResponseSource(sink,sink),true);
assert.equal(context.isApiResponseSource(unrelated,sink),false);
assert.equal(context.isApiResponseSource({get parent(){throw Error('denied')}},sink),false);
const destinations=[];const top={postMessage:(message,origin)=>destinations.push([message,origin])};top.parent=top;
const middle={parent:top,postMessage:(message,origin)=>destinations.push([message,origin])};
const server=vm.createContext({HtmlService:{createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}}),XFrameOptionsMode:{ALLOWALL:'ALLOWALL'}}});
new vm.Script(source(backend,'apiPostMessageResponse_')).runInContext(server);
const html=server.apiPostMessageResponse_('test-request',{ok:true,data:{safe:'</script>'}},'https://example.test').html;
const bridge=html.match(/<script>([\s\S]*)<\/script>/)[1];
new vm.Script(bridge).runInContext(vm.createContext({parent:middle}));
assert.equal(destinations.length,2,'nested response must reach the application ancestor');
assert.ok(destinations.every(([,origin])=>origin==='https://example.test'),'targetOrigin must not widen to wildcard');

async function run(response,timeout=false){
  const elements={};for(const id of ['apiSink','retry','status','summary','dailySection','scanSection','employee','period','dailyRows','scanRows'])elements[id]={textContent:'',innerHTML:'',disabled:false,hidden:false};
  elements.apiSink.contentWindow=sink;
  const listeners={},timers=[];
  const document={getElementById:id=>elements[id],head:{appendChild(){}},body:{appendChild(){}},createElement(tag){return{children:[],style:{},appendChild(child){this.children.push(child);},remove(){},submit(){
    const payload=JSON.parse(this.children[0].value);
    if(!timeout)listeners.message({source:deep,data:{type:'KruaFlowApiResult',requestId:payload.requestId,result:response}});
  }}}};
  const browser=vm.createContext({document,window:{addEventListener:(type,handler)=>{listeners[type]=handler;},KRUA_FLOW_CONFIG:{API_URL:'https://script.google.com/macros/s/test/exec'}},
    location:{origin:'https://example.test',search:'?employeeId=E009&startDate=2026-10-01&endDate=2026-10-04&payDate=2026-10-06'},
    sessionStorage:{getItem:()=> 'test-token'},localStorage:{getItem:()=>null},URLSearchParams,crypto:{randomUUID:()=> 'test-id'},
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},console
  });
  new vm.Script(script).runInContext(browser);
  if(timeout){const deadline=timers.find(t=>t.ms===45000);assert.ok(deadline,'wait must be bounded to 45 seconds');deadline.fn();}
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(elements.retry.disabled,false,'button must recover after success, failure, or timeout');
  assert.equal(elements.apiSink.src,'about:blank','finished requests must stop iframe navigation');
  return elements;
}
(async()=>{
  const success=await run({ok:true,data:{employee:{id:'E009',name:'Test',dailyWage:400},totals:{workedDays:1,net:400},rows:[{date:'2026-10-01',shift:'DAY',inTime:'07:54',outTime:'20:18',baseWage:400,dayNet:400}],attendance:[{date:'2026-10-01',time:'07:54',action:'IN'}]}});
  assert.equal(success.status.textContent,'โหลดรายละเอียดแล้ว');assert.match(success.dailyRows.innerHTML,/07:54/);assert.equal(success.summary.hidden,false);
  const failure=await run({ok:false,error:'สิทธิ์ Admin หมดอายุ'});assert.match(failure.status.textContent,/สิทธิ์ Admin หมดอายุ/);
  const expired=await run(null,true);assert.match(expired.status.textContent,/45 วินาที/);
  console.log('payroll detail nested transport tests: pass');
})().catch(error=>{console.error(error);process.exitCode=1;});
