(function(root,factory){
  const view=factory();
  if(typeof module==='object'&&module.exports)module.exports=view;
  if(root)root.KruaPayrollDetails=view;
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  const dayNames=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const n=value=>Number(value)||0;
  const money=value=>n(value).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})+' บาท';
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function dayInfo(key){
    const date=new Date(String(key)+'T00:00:00Z'),day=date.getUTCDay();
    return Number.isNaN(day)?{className:'',label:String(key||'—')}:{className:'day'+day,label:dayNames[day]+' · '+String(key)};
  }
  function timeBadge(value,direction,worked){
    if(!value)return worked?'<span class="timeBadge timeMissing">ไม่มีเวลา'+(direction==='in'?'เข้า':'ออก')+'</span>':'—';
    return '<span class="timeBadge '+(direction==='in'?'timeIn':direction==='out'?'timeOut':'reviewBadge')+'">'+esc(value)+'</span>';
  }
  function dailyRows(rows){return rows.map(row=>{
    const day=dayInfo(row.date),review=Boolean(row.worked&&(!row.inTime||!row.outTime||row.shift==='UNKNOWN'));
    const shift=row.shift==='NIGHT'?'<span class="stateBadge nightBadge">กะดึก</span>':row.shift==='DAY'?'<span class="stateBadge dayShift">กะกลางวัน</span>':row.worked?'<span class="stateBadge reviewBadge">ไม่ระบุกะ</span>':'ไม่มีวันทำงาน';
    const overnight=row.shift==='NIGHT'&&row.inTime&&row.outTime&&row.outTime<row.inTime?'<span class="nextDay">ออกวันถัดไป</span>':'';
    const cells=[
      '<span class="dayBadge">'+esc(day.label)+'</span>'+(review?'<span class="nextDay">⚠ ต้องตรวจข้อมูล</span>':''),shift,
      timeBadge(row.inTime,'in',row.worked),timeBadge(row.outTime,'out',row.worked)+overnight,
      esc(money(row.baseWage)),esc(n(row.lateMinutes)),
      '<span class="amountDeduct">'+esc(money(row.lateDeduction))+'</span>',
      '<span class="amountAdd">'+esc(money(row.nightAllowance))+'</span>',esc(n(row.otPaidHours)),
      '<span class="amountAdd">'+esc(money(row.otPay))+'</span>',esc(n(row.otBeforeMinutes)+' / '+n(row.otAfterMinutes)),
      '<strong>'+esc(money(row.dayNet))+'</strong>',esc(row.note||'—')
    ];
    return '<tr class="dayRow '+day.className+(review?' reviewRow':'')+'">'+cells.map((cell,index)=>'<td class="'+(index===12?'noteCell':index>=4?'moneyCell':'')+'">'+cell+'</td>').join('')+'</tr>';
  }).join('')||'<tr><td colspan="13">ไม่มีรายละเอียดวันทำงาน</td></tr>';}
  function scanRows(scans){return scans.map(scan=>{
    const day=dayInfo(scan.date),action=String(scan.action||''),upper=action.toUpperCase();
    const isIn=upper==='IN'||action.indexOf('เข้างาน')>=0,isOut=upper==='OUT'||action.indexOf('เลิกงาน')>=0||action.indexOf('ออกงาน')>=0;
    const label=isIn?'เข้างาน':isOut?'ออกงาน':action||'—';
    return '<tr class="dayRow '+day.className+'"><td><span class="dayBadge">'+esc(day.label)+'</span></td><td>'+timeBadge(scan.time,isIn?'in':isOut?'out':'neutral',false)+'</td><td><span class="stateBadge '+(isIn?'timeIn':isOut?'timeOut':'reviewBadge')+'">'+esc(label)+'</span></td><td>'+esc(scan.status||'—')+'</td><td class="noteCell">'+esc(scan.note||'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="5">ไม่พบรายการสแกนในช่วงตรวจของรอบนี้</td></tr>';}
  function financialRows(result){
    const methods={PER_WORKDAY:'ต่อวันทำงาน',PER_NIGHT_SHIFT:'ต่อกะดึก',FIXED:'คงที่ต่อรอบ'};
    const items=(result.recurringItems||[]).map(item=>({name:item.name,type:item.type,method:methods[item.method]||item.method||'ต่อรอบ',quantity:item.quantity,rate:item.amount,total:item.total,note:item.note}));
    (result.adjustments||[]).forEach(item=>items.push({name:item.name,type:item.type,method:'ปรับยอด · '+(item.effectiveDate||'รอบนี้'),quantity:1,rate:item.amount,total:item.amount,note:item.note}));
    return items.map(item=>{
      const deduction=String(item.type).toUpperCase()==='DEDUCTION',cls=deduction?'amountDeduct':'amountAdd';
      return '<tr><td>'+esc(item.name||'ไม่ระบุชื่อ')+'</td><td><span class="stateBadge '+(deduction?'reviewBadge':'timeIn')+'">'+(deduction?'เงินหัก':'เงินเพิ่ม')+'</span></td><td>'+esc(item.method)+'</td><td>'+esc(item.quantity==null?'—':item.quantity)+'</td><td class="moneyCell">'+esc(money(item.rate))+'</td><td class="moneyCell '+cls+'">'+(deduction?'−':'+')+esc(money(item.total))+'</td><td class="noteCell">'+esc(item.note||'—')+'</td></tr>';
    }).join('')||'<tr><td colspan="7">ไม่มีรายการเงินเพิ่มหรือเงินหักเพิ่มเติมของรอบนี้</td></tr>';
  }
  function metric(label,value,foot,cls){return '<div class="metric '+(cls||'')+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(foot||'')+'</small></div>';}
  function summaryHtml(result){
    const t=result.totals||{},employee=result.employee||{},rows=result.rows||[];
    const missing=rows.filter(row=>row.worked&&(!row.inTime||!row.outTime)).length;
    const added=n(t.nightAllowance)+n(t.otPay)+n(t.recurringEarnings)+n(t.adjustmentEarnings);
    return '<div class="summaryGrid">'+[
      metric('ค่าแรงรายวัน',money(employee.dailyWage),'ฐานค่าแรงสำหรับ Payroll / OT'),
      metric('วันทำงาน',n(t.workedDays)+' วัน','จาก '+rows.length+' วันในรอบ'),
      metric('กะดึก / OT',n(t.nightShifts)+' กะ / '+n(t.otHours)+' ชม.','นับตามวันที่เข้ากะ'),
      metric('ข้อมูลไม่ครบ',missing+' วัน','ไม่มีเวลาเข้า / ออก ต้องตรวจสอบ'),
      metric('ค่าแรงปกติ',money(t.baseWage),'ไม่รวมเงินเพิ่ม'),
      metric('เงินเพิ่มทั้งหมด',money(added),'ค่ากะดึก + OT + รายการเพิ่ม','add'),
      metric('เงินหักทั้งหมด',money(t.totalDeductions),'หักสาย + รายการหัก','deduct'),
      metric('ยอดสุทธิปัจจุบัน',money(t.net),'ยอดคำนวณ ไม่ใช่หลักฐานการจ่าย','net')
    ].join('')+'</div>';
  }
  function breakdownHtml(t){
    const line=(label,value,cls)=>'<div><dt>'+esc(label)+'</dt><dd class="'+(cls||'')+'">'+esc(money(value))+'</dd></div>';
    return '<div class="breakdown"><dl>'+line('ค่าแรงปกติ',t.baseWage)+line('ค่ากะดึก',t.nightAllowance,'amountAdd')+line('เงิน OT',t.otPay,'amountAdd')+line('เงินเพิ่มประจำ',t.recurringEarnings,'amountAdd')+line('เงินเพิ่มปรับยอด',t.adjustmentEarnings,'amountAdd')+line('รวมก่อนหัก',t.gross)+'</dl><dl>'+line('หักสาย',t.lateDeduction,'amountDeduct')+line('เงินหักประจำ',t.recurringDeductions,'amountDeduct')+line('เงินหักปรับยอด',t.adjustmentDeductions,'amountDeduct')+line('เงินหักรวม',t.totalDeductions,'amountDeduct')+line('ยอดสุทธิ',t.net)+'</dl></div><p class="balanceLine">รวมก่อนหัก '+esc(money(t.gross))+' − เงินหักรวม '+esc(money(t.totalDeductions))+' = สุทธิ '+esc(money(t.net))+'</p>';
  }
  function render(result,document){
    document.getElementById('summary').innerHTML=summaryHtml(result);
    document.getElementById('financialBreakdown').innerHTML=breakdownHtml(result.totals||{});
    document.getElementById('financialRows').innerHTML=financialRows(result);
    document.getElementById('dailyRows').innerHTML=dailyRows(result.rows||[]);
    document.getElementById('scanRows').innerHTML=scanRows(result.attendance||[]);
  }
  return{render,dayInfo,timeBadge,dailyRows,scanRows,financialRows,summaryHtml,breakdownHtml};
});
