(function(root){
 function measure(label,settle,required,failure){let enabled=false;const events=[];try{events.push(`${label}: configure; output ON`);enabled=true;events.push(`settle ${settle} ms (required ${required})`);if(settle<required)throw Error('read attempted before settling');if(failure)throw Error('injected meter failure');events.push('read succeeded');return {ok:true,events};}catch(e){events.push('FAILED: '+e.message);return {ok:false,events};}finally{enabled=false;events.push('output OFF');}}
 function experiment(changed,failure){const required=changed?300:100;const duplicated=[measure('Procedure A',required,required,failure),measure('Procedure B',100,required,failure)];const station=label=>measure(label,required,required,failure);return {duplicated,facade:[station('Caller A through station'),station('Caller B through station')]};}
 if(typeof module!=='undefined')module.exports={experiment};
 if(typeof document==='undefined')return;
 function run(){const result=experiment(document.getElementById('changed').checked,document.getElementById('failure').checked);const count=items=>items.filter(x=>x.ok).length;document.getElementById('summary').textContent=`Duplicated sequence: ${count(result.duplicated)}/2 successful · Facade: ${count(result.facade)}/2 successful`;document.getElementById('output').textContent=['DUPLICATED POLICY',...result.duplicated.map(x=>x.events.join('\n')),'\nSHARED POLICY',...result.facade.map(x=>x.events.join('\n'))].join('\n\n');}
 document.getElementById('run').onclick=run;run();
})(globalThis);
