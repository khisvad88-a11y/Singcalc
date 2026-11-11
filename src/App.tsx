
import { useState, useRef, useEffect, createContext, useContext } from "react";

const T={bg0:"#0F1117",bg1:"#181C25",bg2:"#1E2332",bg3:"#252A3A",border:"#2C3348",borderLight:"#353D56",text:"#E8EAF0",textSub:"#7C85A0",textMuted:"#4A5268",accent:"#4F7EF7",accentDim:"#1E2D5A",accentHover:"#6B95FF",green:"#2ECC8F",greenDim:"#0D3526",amber:"#F5A623",amberDim:"#3A2800",red:"#E05C5C",redDim:"#3A1515",purple:"#9B7FF5",purpleDim:"#261E48"};
const css=`*{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg0};color:${T.text};font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif}input,select{outline:none;font-family:inherit}input:focus,select:focus{border-color:${T.accent}!important;box-shadow:0 0 0 3px ${T.accentDim}}button{font-family:inherit;cursor:pointer}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${T.bg1}}::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}.hov:hover{background:${T.bg3}!important}.pri:hover{background:${T.accentHover}!important}.sec:hover{border-color:${T.borderLight}!important;background:${T.bg3}!important}.del:hover{background:${T.redDim}!important;color:${T.red}!important}.tab-b:hover{color:${T.text}!important}`;

const DEFAULT_FRESA=[
  {id:"f1",group:"ПЭТ",material:"ПЭТ 1–2 мм",rate:17.28},
  {id:"f2",group:"ПЭТ",material:"ПЭТ 3–4 мм",rate:22.68},
  {id:"f3",group:"Полистирол",material:"Полистирол 1–3 мм",rate:17.28},
  {id:"f4",group:"Полистирол",material:"Полистирол 3–4 мм",rate:22.68},
  {id:"f5",group:"ПВХ",material:"ПВХ вспен. 2–3 мм",rate:13.77},
  {id:"f6",group:"ПВХ",material:"ПВХ вспен. 4–6 мм",rate:17.28},
  {id:"f7",group:"ПВХ",material:"ПВХ вспен. 8–10 мм",rate:22.68},
  {id:"f8",group:"ПВХ",material:"ПВХ вспен. 19–24 мм",rate:26.73},
  {id:"f9",group:"Композит",material:"Композит/Дибонд 3–4 мм",rate:26.73},
  {id:"f10",group:"Акрил",material:"Акрил 1–2 мм",rate:17.28},
  {id:"f11",group:"Акрил",material:"Акрил 3–4 мм",rate:19.58},
  {id:"f12",group:"Акрил",material:"Акрил 5–6 мм",rate:24.30},
  {id:"f13",group:"Акрил",material:"Акрил 8–12 мм",rate:30.24},
  {id:"f14",group:"Акрил",material:"Акрил 15 мм",rate:38.07},
  {id:"f15",group:"Акрил",material:"Акрил 20–25 мм",rate:48.60},
  {id:"f16",group:"Поликарбонат",material:"Поликарбонат 3–4 мм",rate:19.58},
  {id:"f17",group:"Поликарбонат",material:"Поликарбонат 5–6 мм",rate:24.30},
  {id:"f18",group:"Поликарбонат",material:"Поликарбонат 8–10 мм",rate:30.24},
  {id:"f19",group:"Фанера",material:"Фанера 3–6 мм",rate:18.09},
  {id:"f20",group:"Фанера",material:"Фанера 12–18 мм",rate:32.40},
  {id:"f21",group:"МДФ",material:"МДФ 3–6 мм",rate:17.28},
  {id:"f22",group:"МДФ",material:"МДФ 12–19 мм",rate:24.30},
  {id:"f23",group:"МДФ",material:"МДФ 22–30 мм",rate:35.10},
];

const DEFAULT_PLOTTER_OPS=[
  {id:"pl1",name:"Резка",unit:"м²",rate:100},
  {id:"pl2",name:"Монтажка",unit:"м²",rate:200},
  {id:"pl3",name:"Выборка",unit:"м²",rate:150},
];

// ── Привязка количества к параметрам позиции ────────────────────────────────
const BINDS=[
  {key:"",label:"Вручную",field:null},
  {key:"area",label:"Площадь",field:"area"},
  {key:"perimeter",label:"Периметр",field:"perimeter"},
  {key:"neonPerimeter",label:"Периметр неона",field:"neonPerimeter"},
  {key:"diodes",label:"Кол-во диодов",field:"diodes"},
  {key:"letters",label:"Кол-во букв",field:"letters"},
  {key:"elements",label:"Кол-во элементов",field:"elements"},
];
const BindContext=createContext(BINDS);
const bindLabel=(k,binds=BINDS)=>binds.find(b=>b.key===k)?.label||k;
const bindVal=(pos,bind)=>bind?(Number(pos[bind])||0):0;
const effQty=(pos,row)=>row.bind?bindVal(pos,row.bind):(Number(row.qty)||0);

// ── Формат времени: минуты → «1 ч. 30 мин.» ──────────────────────────────────
const fmtDur=min=>{
  const total=Math.round(Number(min)||0);
  const h=Math.floor(total/60);
  const m=total%60;
  if(h>0&&m>0)return `${h} ч. ${m} мин.`;
  if(h>0)return `${h} ч.`;
  return `${m} мин.`;
};

// ── Формула для длины фрезеровки: сумма коэффициент × параметр позиции ──────
const calcFormula=(pos,formula)=>Object.entries(formula||{}).reduce((sum,[key,value])=>sum+(Number(value)||0)*bindVal(pos,key),0);
const fresaMeters=(pos,f)=>f.formula?calcFormula(pos,f.formula):(Number(f.meters)||0);
const formulaText=(formula,binds=BINDS)=>Object.entries(formula||{}).filter(([,value])=>Number(value)).map(([key,value])=>`${value} × ${bindLabel(key,binds).toLowerCase()}`).join(" + ")||"0";

const defaultMaterials=[
  {id:20,category:"Листовой",name:"АКП GROSSBOND 3мм",unit:"м²",price:1450,supplier:""},
  {id:3,category:"Листовой",name:"Акрил молочный 3мм",unit:"м²",price:2400,supplier:""},
  {id:4,category:"Листовой",name:"Акрил прозрачный 3мм",unit:"м²",price:2200,supplier:""},
  {id:12,category:"Листовой",name:"Акрил литой молочный 5мм",unit:"м²",price:3800,supplier:""},
  {id:30,category:"Листовой",name:"Вспененный ПВХ ZENOPLAN 3мм",unit:"м²",price:680,supplier:""},
  {id:5,category:"LED",name:"LED модуль Infinilite BASIC 12V",unit:"шт",price:22,supplier:""},
  {id:40,category:"LED",name:"LED модуль Infinilite CLASSIC 12V",unit:"шт",price:28,supplier:""},
  {id:6,category:"LED",name:"LED лента 60 диод/м 12V",unit:"м",price:320,supplier:""},
  {id:43,category:"LED",name:"LED-неон гибкий Infinilite 12V",unit:"м",price:680,supplier:""},
  {id:10,category:"Электрика",name:"Блок питания 12V 60W IP67",unit:"шт",price:950,supplier:""},
  {id:50,category:"Клейкие ленты",name:"3M VHB GPH110 1.1мм",unit:"м",price:185,supplier:""},
  {id:7,category:"Плёнка",name:"Виниловая плёнка самоклеящаяся",unit:"м²",price:650,supplier:""},
  {id:11,category:"Прочее",name:"Баннерная ткань 440г/м²",unit:"м²",price:480,supplier:""},
  {id:8,category:"Крепёж",name:"Дистанционный держатель 25мм",unit:"шт",price:45,supplier:""},
  {id:60,category:"Листовой",name:"ПВХ 5 мм",unit:"м²",price:0,supplier:""},
  {id:61,category:"Листовой",name:"ПВХ 8 мм",unit:"м²",price:0,supplier:""},
  {id:62,category:"Листовой",name:"Поликарбонат прозрачный 3 мм",unit:"м²",price:0,supplier:""},
  {id:63,category:"Листовой",name:"Поликарбонат прозрачный 5 мм",unit:"м²",price:0,supplier:""},
  {id:64,category:"Листовой",name:"Поликарбонат прозрачный 6 мм",unit:"м²",price:0,supplier:""},
  {id:65,category:"Листовой",name:"Акрил 6 мм",unit:"м²",price:0,supplier:""},
  {id:70,category:"Профильная труба",name:"Труба профильная стальная 25×25×1 мм",unit:"м",price:0,supplier:""},
  {id:71,category:"Профильная труба",name:"Труба профильная алюминиевая 25×25×1 мм",unit:"м",price:0,supplier:""},
  {id:72,category:"Прочее",name:"Алюминиевый борт для объёмных букв",unit:"м",price:0,supplier:""},
];

// Норма времени хранится в минутах на единицу
const defaultNorms=[
  {id:3,category:"Производство",operation:"Гибка металла",unit:"м пог.",minutes:30,bind:""},
  {id:4,category:"Производство",operation:"Сварка металла",unit:"м пог.",minutes:48,bind:""},
  {id:5,category:"Производство",operation:"Монтаж LED модулей",unit:"100 шт",minutes:120,bind:""},
  {id:6,category:"Производство",operation:"Покраска порошковая",unit:"м²",minutes:48,bind:""},
  {id:7,category:"Производство",operation:"Оклейка плёнкой",unit:"м²",minutes:36,bind:""},
  {id:8,category:"Производство",operation:"Сборка короба",unit:"шт",minutes:150,bind:""},
  {id:9,category:"Производство",operation:"Натяжка баннера",unit:"м²",minutes:24,bind:""},
  {id:10,category:"Производство",operation:"Пайка проводов",unit:"шт",minutes:18,bind:""},
  {id:11,category:"Производство",operation:"Сборка объёмных букв",unit:"шт",minutes:90,bind:""},
  {id:12,category:"Производство",operation:"Монтаж LED-неона",unit:"м",minutes:30,bind:""},
  {id:13,category:"Производство",operation:"Склейка борта (алюм)",unit:"м.п.",minutes:0,bind:"perimeter"},
  {id:14,category:"Производство",operation:"Склейка борта (ПВХ)",unit:"м.п.",minutes:0,bind:"perimeter"},
  {id:15,category:"Производство",operation:"Склейка борта (акрил)",unit:"м.п.",minutes:0,bind:"perimeter"},
  {id:16,category:"Производство",operation:"Установка диода",unit:"шт",minutes:0,bind:"diodes"},
  {id:17,category:"Производство",operation:"Установка на раму",unit:"шт",minutes:0,bind:"letters"},
  {id:18,category:"Производство",operation:"Оклейка лица",unit:"м²",minutes:0,bind:"area"},
  {id:19,category:"Производство",operation:"Оклейка борта",unit:"м.п.",minutes:0,bind:"perimeter"},
  {id:20,category:"Производство",operation:"Укладка неона",unit:"м.п.",minutes:0,bind:"neonPerimeter"},
  {id:21,category:"Производство",operation:"Коммутация неона",unit:"шт",minutes:0,bind:"elements"},
];

const defaultSignTypes=[
  {id:1,name:"Объемные буквы (клееные)",color:"accent",description:"Прямое свечение: молочный акрил на лице, борт подобрать отдельно, задник из ПВХ и LED-модули",
    materials:[{matId:3,qty:1,note:"лицевая часть — молочный акрил",bind:"area"},{matId:30,qty:1,note:"задняя стенка — ПВХ",bind:"area"},{matId:5,qty:50,note:"подсветка — количество модулей вручную",bind:""},{matId:10,qty:1,note:"блок питания — мощность подобрать по LED-нагрузке",bind:""}],
    norms:[{normId:4,qty:1},{normId:5,qty:1},{normId:11,qty:1}],
    plotterOps:[],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {id:2,name:"Объёмные буквы (без подсветки)",color:"purple",description:"Буквы без подсветки. Лицо и борт подобрать отдельно: металлические листы удалены из справочника",
    materials:[{matId:8,qty:4,note:"крепёж"}],
    norms:[{normId:3,qty:1},{normId:4,qty:1},{normId:6,qty:1}],
    plotterOps:[],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {id:3,name:"Лайтбокс",color:"amber",description:"Световой короб: молочное акриловое лицо, корпус подобрать отдельно, задник из ПВХ, LED-модули",
    materials:[{matId:3,qty:1,note:"лицевая часть — молочный акрил",bind:"area"},{matId:30,qty:1,note:"задняя стенка — ПВХ",bind:"area"},{matId:5,qty:50,note:"подсветка — количество модулей вручную",bind:""},{matId:10,qty:1,note:"блок питания — мощность подобрать по LED-нагрузке",bind:""}],
    norms:[{normId:8,qty:1},{normId:5,qty:1}],
    plotterOps:[{opId:"pl1",qty:1}],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {id:4,name:"Баннер",color:"green",description:"Баннер на ткани с люверсами",
    materials:[{matId:11,qty:1,note:"лицевая часть",bind:"area"}],
    norms:[{normId:9,qty:1}],
    plotterOps:[{opId:"pl1",qty:1}],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {id:5,name:"Фасадная (композит)",color:"green",description:"Алюминиевый композит с аппликацией",
    materials:[{matId:20,qty:1,note:"лицевая часть",bind:"area"},{matId:7,qty:1,note:"плёнка",bind:"area"},{matId:8,qty:6,note:"крепёж"}],
    norms:[{normId:7,qty:1}],
    plotterOps:[{opId:"pl2",qty:1}],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {id:6,name:"Объемные буквы (ЖА)",color:"amber",description:"Акрил, борт и задник считаются модулем ЖА; LED-модули и блок питания добавлены отдельно",
    materials:[{matId:5,qty:50,note:"подсветка — количество модулей вручную",bind:""},{matId:10,qty:1,note:"блок питания — мощность подобрать по LED-нагрузке",bind:""}],norms:[],plotterOps:[],fresas:[],useJA:true,jaDefaults:{board_height:60}},
  {id:7,isNeon:true,name:"Неоновая вывеска",color:"accent",description:"LED-неон на прозрачном акриле 3 мм. Фрезеровка по тарифу акрила 3–4 мм: 2 × периметр неона + периметр. Толщину основы подобрать по габаритам",
    materials:[
      {matId:4,qty:1,note:"основа — прозрачный акрил 3 мм",bind:"area"},
      {matId:43,qty:1,note:"LED-неон",bind:"neonPerimeter"},
      {matId:10,qty:1,note:"блок питания"},
      {matId:8,qty:4,note:"крепёж"},
    ],
    norms:[{normId:20,qty:1},{normId:21,qty:1},{normId:10,qty:1}],
    plotterOps:[],
    fresas:[{priceId:"f11",meters:"",formula:{neonPerimeter:2,perimeter:1}}],
    useJA:false,jaDefaults:{board_height:60}},
  {id:8,name:"Рама",color:"purple",description:"Рама из стальной или алюминиевой трубы 25×25×1 мм. Укажите расход трубы с учётом перемычек; работы и крепёж добавляются отдельно",
    materials:[{matId:70,qty:0,note:"Рама — расход трубы, м",bind:"",frame:true}],
    norms:[],plotterOps:[],fresas:[],useJA:false,jaDefaults:{board_height:60}},
  {"id":9,"name":"Табличка","color":"green","description":"Табличка из ПВХ 5 мм с плёночной аппликацией и дистанционным крепежом","materials":[{"matId":60,"qty":1,"note":"лицевая часть","bind":"area"},{"matId":7,"qty":1,"note":"плёнка","bind":"area"},{"matId":8,"qty":4,"note":"крепёж","bind":""}],"norms":[{"normId":7,"qty":1}],"plotterOps":[],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":10,"name":"Стенд","color":"green","description":"Основа из ПВХ 8 мм с аппликацией. Карманы, крепёж и раму добавьте по конструкции","materials":[{"matId":61,"qty":1,"note":"лицевая часть","bind":"area"},{"matId":7,"qty":1,"note":"плёнка","bind":"area"}],"norms":[{"normId":7,"qty":1}],"plotterOps":[],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":11,"name":"Композитный короб","color":"purple","description":"Гнутый короб из АКП с плёночной аппликацией. Расход композита включает развёртку бортов и задаётся вручную","materials":[{"matId":20,"qty":0,"note":"композит — развёртка короба, м²","bind":""},{"matId":7,"qty":1,"note":"плёнка","bind":"area"}],"norms":[{"normId":8,"qty":1},{"normId":7,"qty":1}],"plotterOps":[],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":12,"name":"Композитный короб (инкрустация)","color":"amber","description":"Короб из АКП с инкрустацией молочным акрилом и LED-подсветкой. Укажите расход развёртки и площадь акрила вручную","materials":[{"matId":20,"qty":0,"note":"композит — развёртка короба, м²","bind":""},{"matId":12,"qty":0,"note":"молочный акрил 5 мм — площадь инкрустации, м²","bind":""},{"matId":30,"qty":1,"note":"задняя стенка","bind":"area"},{"matId":5,"qty":50,"note":"LED-модули — количество подобрать по засветке","bind":""},{"matId":10,"qty":1,"note":"блок питания — мощность подобрать по LED-нагрузке","bind":""}],"norms":[{"normId":8,"qty":1}],"plotterOps":[],"fresas":[{"priceId":"f9","meters":"","formula":null},{"priceId":"f12","meters":"","formula":null}],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":13,"name":"Пленка","color":"green","description":"Плёночная аппликация: материал по площади. Площадь плоттерных операций задаётся отдельно","materials":[{"matId":7,"qty":1,"note":"плёнка","bind":"area"}],"norms":[{"normId":7,"qty":1}],"plotterOps":[{"opId":"pl1","qty":0},{"opId":"pl2","qty":0},{"opId":"pl3","qty":0}],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":14,"name":"Объемные буквы (ал.борт)","color":"accent","description":"Молочное акриловое лицо, алюминиевый борт и задник из ПВХ. Цену и высоту борта уточните в материалах","materials":[{"matId":3,"qty":1,"note":"лицевая часть","bind":"area"},{"matId":72,"qty":1,"note":"алюминиевый борт — по периметру","bind":"perimeter"},{"matId":30,"qty":1,"note":"задняя стенка","bind":"area"},{"matId":5,"qty":50,"note":"LED-модули — количество подобрать по засветке","bind":""},{"matId":10,"qty":1,"note":"блок питания — мощность подобрать по LED-нагрузке","bind":""}],"norms":[{"normId":13,"qty":1},{"normId":11,"qty":1}],"plotterOps":[],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},
  {"id":15,"name":"Объемные буквы (свет.борт)","color":"amber","description":"Светящиеся лицо и борт из молочного акрила, задник из ПВХ. Площадь полос борта задаётся вручную","materials":[{"matId":3,"qty":1,"note":"лицевая часть","bind":"area"},{"matId":3,"qty":0,"note":"световой борт — площадь полос акрила, м²","bind":""},{"matId":30,"qty":1,"note":"задняя стенка","bind":"area"},{"matId":5,"qty":50,"note":"LED-модули — количество подобрать по засветке","bind":""},{"matId":10,"qty":1,"note":"блок питания — мощность подобрать по LED-нагрузке","bind":""}],"norms":[{"normId":15,"qty":1},{"normId":11,"qty":1}],"plotterOps":[],"fresas":[],"useJA":false,"jaDefaults":{"board_height":60}},

];

const reorderSignTypes=(rows,fromId,toId)=>{
  const from=rows.findIndex(row=>String(row.id)===String(fromId));
  const to=rows.findIndex(row=>String(row.id)===String(toId));
  if(from<0||to<0||from===to)return rows;
  const next=[...rows];const [moved]=next.splice(from,1);next.splice(to,0,moved);return next;
};
const applySignTypeOrder=(rows,order)=>{
  if(!Array.isArray(order))return rows;
  const ids=[...new Set(order.map(String))];
  return [...ids.map(id=>rows.find(row=>String(row.id)===id)).filter(Boolean),...rows.filter(row=>!ids.includes(String(row.id)))];
};

const normalizeMaterialCategory=category=>["металл","пвх","композит","акрил","пэт"].includes((category||"").trim().toLowerCase())?"Листовой":(category||"Прочее").trim();
const CATS=["Листовой","Профильная труба","LED","Электрика","Клейкие ленты","Плёнка","Крепёж","Прочее"];
const TYPE_COLORS=["accent","green","amber","purple"];
const SPETSTEKHNIKA=[{key:"lift",label:"Автовышка",icon:"🚒",rate:3500,minHours:4},{key:"crane",label:"Кран",icon:"🏗",rate:6000,minHours:4},{key:"truck",label:"Самогруз",icon:"🚛",rate:2500,minHours:4}];
const positionInstallationCost=pos=>(Number(pos.mountCost)||0)*Math.max(0,Number(pos.qty)||0);
const profitabilityFactor=percent=>1/(1-Math.min(99.99,Math.max(0,Number(percent)||0))/100);
const billableHours=(hours,minHours)=>Math.max(Number(minHours)||0.5,Number(hours)||0);

const TABS=[{id:0,label:"Заказы",icon:"📋"},{id:1,label:"Типы вывесок",icon:"◈"},{id:2,label:"Материалы",icon:"⊞"},{id:3,label:"Нормативы",icon:"⏱"},{id:4,label:"Станки",icon:"⚙"},{id:5,label:"История",icon:"◷"},{id:6,label:"Работники",icon:"♙"}];
const CM={accent:{dot:T.accent,dim:T.accentDim,text:T.accent},green:{dot:T.green,dim:T.greenDim,text:T.green},amber:{dot:T.amber,dim:T.amberDim,text:T.amber},purple:{dot:T.purple,dim:T.purpleDim,text:T.purple}};
const CC={"Листовой":"green","Профильная труба":"purple","LED":"amber","Плёнка":"purple","Крепёж":"accent","Прочее":"purple","Производство":"accent","Монтаж":"green","Электрика":"amber","Клейкие ленты":"green"};

const uid=()=>String(Date.now()+Math.random());
const fmt=n=>Math.round(n||0).toLocaleString("ru-RU");
const fmt2=n=>(Math.round((n||0)*100)/100).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2});
const MAT_EX=[["Категория","Название","Единица","Цена","Поставщик"],["Листовой","Акрил молочный 3мм","м²","2400",""]].map(r=>r.join(";")).join("\n");
const FR_EX=[["Группа","Материал","Тариф руб/пог.м"],["Акрил","Акрил 3–4 мм","19.58"]].map(r=>r.join(";")).join("\n");
const dlCSV=(c,f)=>{const b=new Blob(["\uFEFF"+c],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=f;a.click();};
const parseCSV=t=>t.trim().split(/\r?\n/).filter(Boolean).slice(1).map(l=>l.split(/[;,\t]/));

const IS={height:38,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg2,color:T.text,fontSize:14,width:"100%"};
const SS={...IS,cursor:"pointer"};
const thS={textAlign:"left",padding:"6px 10px",fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600};
const tdS={padding:"9px 10px",borderBottom:`1px solid ${T.border}`};

function ImpBtn({onImport,label}){
  const r=useRef();
  return(<><input ref={r} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>onImport(ev.target.result);rd.readAsText(f,"utf-8");e.target.value="";}}/><button className="sec" onClick={()=>r.current.click()} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>⬆ {label}</button></>);
}

const Dot=({col="accent"})=>{const c=CM[col]||CM.accent;return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:c.dot,flexShrink:0}}/>;};
const Tag=({col="accent",children})=>{const c=CM[col]||CM.accent;return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:c.dim,color:c.text,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500}}><Dot col={col}/>{children}</span>;};
const F=({label,children,span})=>(<div style={{display:"flex",flexDirection:"column",gap:4,gridColumn:span?`span ${span}`:undefined}}>{label&&<label style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{label}</label>}{children}</div>);
const Inp=({label,value,onChange,type="text",min,step,placeholder,suffix,span,disabled})=>(<F label={label} span={span}><div style={{display:"flex",alignItems:"center",gap:6}}><input type={type} value={value} onChange={e=>onChange(e.target.value)} min={min} step={step} placeholder={placeholder} disabled={disabled} style={{...IS,flex:1,opacity:disabled?.5:1,background:disabled?T.bg1:T.bg2}}/>{suffix&&<span style={{fontSize:12,color:T.textMuted,whiteSpace:"nowrap"}}>{suffix}</span>}</div></F>);
const Sel=({label,value,onChange,options,span})=>(<F label={label} span={span}><select value={value} onChange={e=>onChange(e.target.value)} style={SS}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select></F>);
const Btn=({onClick,children,variant="pri",style={}})=>{const vs={pri:{border:"none",background:T.accent,color:"#fff"},sec:{border:`1px solid ${T.border}`,background:"none",color:T.textSub}};return <button className={variant} onClick={onClick} style={{height:38,padding:"0 18px",borderRadius:8,fontSize:13,fontWeight:600,...vs[variant],...style}}>{children}</button>;};
const XBtn=({onClick})=>(<button className="del" onClick={onClick} style={{height:30,width:30,borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>);
const Card=({children,style={},accent=false})=>(<div style={{background:T.bg1,border:`1px solid ${accent?T.accent:T.border}`,borderRadius:14,...style}}>{children}</div>);
const CH=({title,action})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:13,fontWeight:600}}>{title}</span>{action}</div>);
const MC=({label,value,sub,color})=>(<div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:5}}>{label}</div><div style={{fontSize:18,fontWeight:700,color:color||T.text}}>{value}</div>{sub&&<div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{sub}</div>}</div>);

const BindSel=({value,onChange})=>{const binds=useContext(BindContext);return (
  <select value={value||""} onChange={e=>onChange(e.target.value)} title="Привязка количества к параметрам позиции" style={{...SS,fontSize:12,color:value?T.accent:T.textSub,borderColor:value?T.accent:T.border}}>
    {binds.map(b=><option key={b.key} value={b.key}>{b.key?`⊡ ${b.label}`:b.label}</option>)}
  </select>
);};

const QtyInp=({pos,row,onChange})=>{
  const bound=!!row.bind;
  const shown=bound?bindVal(pos,row.bind):row.qty;
  return <input type="number" min="0" step="0.01" value={shown} onChange={e=>onChange(e.target.value)} disabled={bound} style={{...IS,fontSize:12,opacity:bound?.75:1,background:bound?T.bg0:T.bg2,borderColor:bound?T.accent:T.border}}/>;
};

// Ввод коэффициентов формулы: длина = Σ коэффициент × параметр позиции
const FormulaEdit=({formula,onChange})=>{const binds=useContext(BindContext);return (
  <div style={{padding:"8px 10px",background:T.bg0,borderRadius:8,border:`1px solid ${T.accent}`}}>
    <div style={{fontSize:10,color:T.textMuted,marginBottom:6}}>Длина реза = сумма (коэффициент × параметр позиции)</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:6}}>
      {binds.filter(b=>b.key).map(b=>(
        <div key={b.key} style={{display:"flex",flexDirection:"column",gap:2}}>
          <span style={{fontSize:9,color:T.textMuted,textTransform:"uppercase",letterSpacing:.4,minHeight:22}}>× {b.label}</span>
          <input type="number" step="0.1" value={formula[b.key]??""} onChange={e=>onChange({...formula,[b.key]:e.target.value})} placeholder="0" style={{...IS,height:30,fontSize:12,padding:"0 8px"}}/>
        </div>
      ))}
    </div>
  </div>
);};

// ── Сортировка и фильтры таблиц ──────────────────────────────────────────────
const sortRows=(rows,key,dir,getter)=>{
  if(!key)return rows;
  const arr=[...rows];
  arr.sort((a,b)=>{
    const va=getter(a,key);
    const vb=getter(b,key);
    if(typeof va==="number"&&typeof vb==="number")return dir==="asc"?va-vb:vb-va;
    return dir==="asc"?String(va).localeCompare(String(vb),"ru"):String(vb).localeCompare(String(va),"ru");
  });
  return arr;
};

const SortTh=({label,k,sort,setSort,align})=>{
  const active=sort.key===k;
  return(
    <th onClick={()=>setSort(s=>s.key===k?{key:k,dir:s.dir==="asc"?"desc":"asc"}:{key:k,dir:"asc"})} title="Сортировать" style={{...thS,cursor:"pointer",userSelect:"none",color:active?T.accent:T.textMuted,textAlign:align||"left"}}>
      {label} <span style={{opacity:active?1:.35}}>{active?(sort.dir==="asc"?"▲":"▼"):"↕"}</span>
    </th>
  );
};

const CatChips=({cats,value,onChange,counts})=>(
  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {["",...cats].map(c=>{
      const on=value===c;
      return(
        <button key={c||"all"} onClick={()=>onChange(c)} style={{height:26,padding:"0 10px",borderRadius:20,border:`1px solid ${on?T.accent:T.border}`,background:on?T.accentDim:"none",color:on?T.accent:T.textSub,fontSize:11,fontWeight:on?600:400}}>
          {c||"Все"}{counts?` · ${counts[c||"__all"]||0}`:""}
        </button>
      );
    })}
  </div>
);

// ── Жидкий акрил: конфиг и расчёт ────────────────────────────────────────────
const DEFAULT_JA_CONFIG={
  price_board:120,
  price_machine:150,
  price_backing:1665.43,
  price_operator:400,
  operator_norm:0.5555,
  density_acrylic:1500,
  acrylic_price_coeff:13.333333333333334,
  acrylic_thickness:4,
  backing_calc_mode:"area",
  operator_norm_mode:"per_letter",
};
const BOARD_HEIGHTS=[40,60,80,100];

function calcJA(params,cfg){
  const {area,board_height,letters_count,perimeter}=params;
  const price_acrylic=2*board_height*cfg.acrylic_price_coeff;
  const acrylic_consumption=area*(cfg.acrylic_thickness/1000)*cfg.density_acrylic;
  const cost_acrylic=acrylic_consumption*price_acrylic;
  const cost_board=perimeter*cfg.price_board;
  const cost_machine=perimeter*cfg.price_machine;
  const subtotal_acrilight=cost_acrylic+cost_board+cost_machine;
  const cost_backing=cfg.backing_calc_mode==="area"?area*cfg.price_backing:perimeter*cfg.price_backing;
  const operator_time=cfg.operator_norm_mode==="per_letter"?letters_count*cfg.operator_norm:perimeter*cfg.operator_norm;
  const cost_operator=operator_time*cfg.price_operator;
  const total=subtotal_acrilight+cost_backing+cost_operator;
  return {price_acrylic,acrylic_consumption,cost_acrylic,cost_board,cost_machine,subtotal_acrilight,cost_backing,operator_time,cost_operator,total};
}

// ── Позиции заказа ───────────────────────────────────────────────────────────
const isAreaKey=note=>["лицевая","задняя","основа"].some(k=>(note||"").toLowerCase().includes(k));

const buildPos=(st,norms)=>({
  id:uid(),
  signTypeId:st?.id||null,
  name:st?.name||"Новая позиция",
  isNeon:!!st?.isNeon,
  signTypeName:st?.name||"Новая позиция",
  signTypeColor:st?.color||"accent",
  qty:1,area:"",perimeter:"",diodes:"",letters:"",neonPerimeter:"",elements:"",
  mats:(st?.materials||[]).map(r=>({id:uid(),matId:r.matId,qty:r.qty,frame:!!r.frame,note:r.note||"",bind:r.bind??(isAreaKey(r.note)?"area":"")})),
  ops:(st?.norms||[]).map(r=>{
    const nd=(norms||[]).find(n=>n.id===Number(r.normId));
    return {id:uid(),normId:r.normId,qty:r.qty,bind:r.bind??(nd?.bind||"")};
  }),
  plotterOps:(st?.plotterOps||[]).map(r=>({id:uid(),opId:r.opId,qty:r.qty})),
  fresas:(st?.fresas||[]).map(r=>({id:uid(),priceId:r.priceId||"",meters:r.meters||"",formula:r.formula?{...r.formula}:null})),
  useJA:!!st?.useJA,
  ja:{board_height:st?.jaDefaults?.board_height||60},
  expanded:true,
});

const calcPos=(pos,materials,norms,hourRate,fresaPL,plotterOpsList,jaCfg)=>{
  const matUnit=pos.mats.reduce((s,r)=>{const m=materials.find(m=>m.id===Number(r.matId));return s+(m?m.price*effQty(pos,r):0);},0);
  // время сборки на 1 изделие, минуты
  const laborMin=pos.ops.reduce((s,r)=>{const n=norms.find(n=>n.id===Number(r.normId));return s+(n?(Number(n.minutes)||0)*effQty(pos,r):0);},0);
  const laborH=laborMin/60;
  const laborCost=laborH*Number(hourRate);
  const fresaCost=(pos.fresas||[]).reduce((s,f)=>{const p=(fresaPL||[]).find(x=>x.id===f.priceId);return s+(p?p.rate*fresaMeters(pos,f):0);},0);
  const plotterCost=(pos.plotterOps||[]).reduce((s,r)=>{const op=(plotterOpsList||[]).find(x=>x.id===r.opId);return s+(op?op.rate*(Number(r.qty)||0):0);},0);
  let jaRes=null;
  let jaCost=0;
  if(pos.useJA&&jaCfg){
    const a=Number(pos.area)||0;
    const p=Number(pos.perimeter)||0;
    const l=Number(pos.letters)||0;
    const b=Number((pos.ja||{}).board_height)||60;
    if(a>0&&p>0&&l>0){
      jaRes=calcJA({area:a,board_height:b,letters_count:l,perimeter:p},jaCfg);
      jaCost=jaRes.total;
    }
  }
  const unitCost=matUnit+laborCost+fresaCost+plotterCost+jaCost;
  return {matUnit,laborMin,laborH,laborCost,fresaCost,plotterCost,jaCost,jaRes,unitCost,total:unitCost*Number(pos.qty||1)};
};

// ── Станки внутри позиции ────────────────────────────────────────────────────
function PosStanki({pos,fresaPL,plotterOpsList,updPos}){
  const binds=useContext(BindContext);
  const fresaGroups=[...new Set(fresaPL.map(x=>x.group))];
  const addFresa=()=>updPos(p=>({...p,fresas:[...(p.fresas||[]),{id:uid(),priceId:fresaPL[0]?.id||"",meters:"",formula:null}]}));
  const delFresa=fid=>updPos(p=>({...p,fresas:(p.fresas||[]).filter(f=>f.id!==fid)}));
  const patchFresa=(fid,patch)=>updPos(p=>({...p,fresas:(p.fresas||[]).map(f=>f.id===fid?{...f,...patch}:f)}));
  const addPlotter=()=>updPos(p=>({...p,plotterOps:[...(p.plotterOps||[]),{id:uid(),opId:plotterOpsList[0]?.id||"",qty:""}]}));
  const delPlotter=rid=>updPos(p=>({...p,plotterOps:(p.plotterOps||[]).filter(r=>r.id!==rid)}));
  const updPlotter=(rid,field,val)=>updPos(p=>({...p,plotterOps:(p.plotterOps||[]).map(r=>r.id===rid?{...r,[field]:val}:r)}));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>⬡ Плоттер</span>
          <Btn variant="sec" onClick={addPlotter} style={{height:26,padding:"0 10px",fontSize:11}}>+ Добавить</Btn>
        </div>
        {(pos.plotterOps||[]).length===0&&<div style={{fontSize:12,color:T.textMuted}}>Нет операций плоттера</div>}
        {(pos.plotterOps||[]).map(r=>{
          const op=plotterOpsList.find(x=>x.id===r.opId);
          const total=(op?.rate||0)*(Number(r.qty)||0);
          return(
            <div key={r.id} style={{marginBottom:6}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 110px 90px 30px",gap:8,alignItems:"center"}}>
                <select value={r.opId} onChange={e=>updPlotter(r.id,"opId",e.target.value)} style={{...SS,fontSize:12}}>
                  {plotterOpsList.map(o=><option key={o.id} value={o.id}>{o.name} — {o.rate} ₽/{o.unit}</option>)}
                </select>
                <input type="number" min="0" step="0.01" value={r.qty} onChange={e=>updPlotter(r.id,"qty",e.target.value)} placeholder={`кол-во ${op?.unit||""}`} style={{...IS,fontSize:12}}/>
                <div style={{height:38,borderRadius:8,border:`1px solid ${T.border}`,background:T.bg0,display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"0 10px",fontWeight:700,color:total>0?T.accent:T.textMuted,fontSize:13}}>{total>0?`${fmt(total)} ₽`:"—"}</div>
                <XBtn onClick={()=>delPlotter(r.id)}/>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>⚙ Фреза ЧПУ</span>
          <Btn variant="sec" onClick={addFresa} style={{height:26,padding:"0 10px",fontSize:11}}>+ Добавить</Btn>
        </div>
        {(pos.fresas||[]).length===0&&<div style={{fontSize:12,color:T.textMuted}}>Нет позиций фрезеровки</div>}
        {(pos.fresas||[]).map(fr=>{
          const pr=fresaPL.find(x=>x.id===fr.priceId);
          const isF=!!fr.formula;
          const mtr=fresaMeters(pos,fr);
          const fTotal=(pr?.rate||0)*mtr;
          return(
            <div key={fr.id} style={{marginBottom:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 110px 90px 30px",gap:8,alignItems:"center"}}>
                <select value={fr.priceId} onChange={e=>patchFresa(fr.id,{priceId:e.target.value})} style={{...SS,fontSize:12}}>
                  {fresaGroups.map(g=>(
                    <optgroup key={g} label={g}>
                      {fresaPL.filter(x=>x.group===g).map(x=>(<option key={x.id} value={x.id}>{x.material} — {Number(x.rate).toFixed(2)} ₽/м</option>))}
                    </optgroup>
                  ))}
                </select>
                <input type="number" min="0" step="0.1" value={isF?Math.round(mtr*100)/100:fr.meters} disabled={isF} onChange={e=>patchFresa(fr.id,{meters:e.target.value})} placeholder="пог.м" style={{...IS,fontSize:12,opacity:isF?.75:1,background:isF?T.bg0:T.bg2,borderColor:isF?T.accent:T.border}}/>
                <button title="Переключить ввод длины: вручную или по формуле" onClick={()=>isF?patchFresa(fr.id,{formula:null,meters:String(Math.round(mtr*100)/100)}):patchFresa(fr.id,{formula:{}})} style={{height:38,borderRadius:8,border:`1px solid ${isF?T.accent:T.border}`,background:isF?T.accentDim:T.bg2,color:isF?T.accent:T.textSub,fontSize:12}}>{isF?"⊡ Формула":"Вручную"}</button>
                <div style={{height:38,borderRadius:8,border:`1px solid ${T.border}`,background:T.bg0,display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"0 10px",fontWeight:700,color:fTotal>0?T.amber:T.textMuted,fontSize:13}}>{fTotal>0?`${fmt(fTotal)} ₽`:"—"}</div>
                <XBtn onClick={()=>delFresa(fr.id)}/>
              </div>
              {isF&&<div style={{marginTop:6}}><FormulaEdit formula={fr.formula} onChange={f=>patchFresa(fr.id,{formula:f})}/></div>}
              {pr&&<div style={{fontSize:10,color:T.textMuted,marginTop:2,paddingLeft:2}}>{pr.group} · {Number(pr.rate).toFixed(2)} ₽/пог.м{isF?` · ${fmt2(mtr)} пог.м = ${formulaText(fr.formula,binds)}`:""}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Жидкий акрил внутри позиции ──────────────────────────────────────────────
function PosJA({pos,cost,updPos}){
  const ja=pos.ja||{};
  const bh=Number(ja.board_height)||60;
  const missing=[];
  if(!(Number(pos.area)>0))missing.push("площадь");
  if(!(Number(pos.perimeter)>0))missing.push("периметр");
  if(!(Number(pos.letters)>0))missing.push("кол-во букв");
  const res=cost.jaRes;
  const Row=({label,value,unit,bold,color})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:12,color:bold?T.text:T.textSub}}>{label}</span>
      <span style={{fontSize:12,fontWeight:bold?700:500,color:color||T.text}}>{value} <span style={{fontSize:10,color:T.textMuted}}>{unit}</span></span>
    </div>
  );
  return(
    <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${pos.useJA?T.amber:T.border}`,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pos.useJA?12:0}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>◉ Жидкий акрил</span>
        <Btn variant={pos.useJA?"pri":"sec"} onClick={()=>updPos(x=>({...x,useJA:!x.useJA}))} style={{height:26,padding:"0 10px",fontSize:11}}>{pos.useJA?"Включено ✓":"+ Добавить расчёт ЖА"}</Btn>
      </div>
      {pos.useJA&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <F label="Высота борта, мм">
            <div style={{display:"flex",gap:6,maxWidth:320}}>
              {BOARD_HEIGHTS.map(h=>(
                <button key={h} onClick={()=>updPos(x=>({...x,ja:{...(x.ja||{}),board_height:h}}))} style={{flex:1,height:38,borderRadius:8,border:`1px solid ${bh===h?T.amber:T.border}`,background:bh===h?T.amberDim:T.bg0,color:bh===h?T.amber:T.textSub,fontSize:13,fontWeight:bh===h?700:400}}>{h}</button>
              ))}
            </div>
          </F>
          <div style={{fontSize:11,color:T.textMuted}}>Площадь заливки, периметр и количество букв берутся из параметров позиции выше.</div>
          {missing.length>0&&(
            <div style={{padding:"8px 12px",borderRadius:8,background:T.amberDim,border:`1px solid ${T.amber}`,fontSize:12,color:T.amber}}>Для расчёта ЖА укажите: {missing.join(", ")}</div>
          )}
          {res&&(
            <div>
              <Row label={`Цена акрила (борт ${bh} мм)`} value={fmt2(res.price_acrylic)} unit="₽/кг"/>
              <Row label="Расход акрила" value={fmt2(res.acrylic_consumption)} unit="кг"/>
              <Row label="Стоимость акрила" value={fmt2(res.cost_acrylic)} unit="₽"/>
              <Row label="Борт" value={fmt2(res.cost_board)} unit="₽"/>
              <Row label="Станок" value={fmt2(res.cost_machine)} unit="₽"/>
              <Row label="Подытог Акрилайт" value={fmt2(res.subtotal_acrilight)} unit="₽" bold color={T.accent}/>
              <Row label="Задник" value={fmt2(res.cost_backing)} unit="₽"/>
              <Row label={`Оператор (${fmtDur(res.operator_time*60)})`} value={fmt2(res.cost_operator)} unit="₽"/>
              <Row label="Итого ЖА (на 1 шт)" value={fmt2(res.total)} unit="₽" bold color={T.green}/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const todayLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const employeeEarnings=entry=>entry.override!==""&&entry.override!=null?Number(entry.override)||0:(Number(entry.qty)||0)*(Number(entry.minutes)||0)*(Number(entry.rate)||0)/60;
function PositionWork({pos,employees,norms,hourRate,updPos}){
  const entries=pos.employeeWork||[];
  const add=kind=>{if(!employees.length)return;const op=kind==="production"?pos.ops?.[0]:null;const norm=norms.find(n=>Number(n.id)===Number(op?.normId));updPos(pos.id,p=>({...p,employeeWork:[...(p.employeeWork||[]),{id:uid(),employeeId:employees[0].id,kind,date:todayLocal(),normId:norm?.id??"",operation:norm?.operation||"",unit:norm?.unit||"шт",qty:op?effQty(pos,op):0,minutes:norm?.minutes||0,rate:hourRate,override:""}]}));};
  const patch=(id,fields)=>updPos(pos.id,p=>({...p,employeeWork:(p.employeeWork||[]).map(e=>e.id===id?{...e,...fields}:e)}));
  return <div style={{padding:12,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",alignItems:"center"}}><b style={{fontSize:12}}>Работники и выполненные работы</b><div style={{display:"flex",gap:6}}><Btn variant="sec" style={{height:28,fontSize:11,padding:"0 8px"}} onClick={()=>add("production")}>+ Изготовление</Btn><Btn variant="sec" style={{height:28,fontSize:11,padding:"0 8px"}} onClick={()=>add("installation")}>+ Монтаж</Btn></div></div>
    {!employees.length&&<div style={{fontSize:12,color:T.amber,marginTop:8}}>Сначала добавьте работника во вкладке «Работники».</div>}
    {entries.map(entry=><div key={entry.id} style={{marginTop:10,padding:10,background:T.bg1,borderRadius:7}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><b style={{fontSize:12}}>{entry.kind==="production"?"Изготовление":"Монтаж"} · {fmt(employeeEarnings(entry))} ₽</b><XBtn onClick={()=>updPos(pos.id,p=>({...p,employeeWork:(p.employeeWork||[]).filter(e=>e.id!==entry.id)}))}/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:8}}>
        <Sel label="Работник" value={entry.employeeId} onChange={v=>patch(entry.id,{employeeId:v})} options={employees.map(e=>({value:e.id,label:e.name}))}/>
        <Inp label="Дата работы" type="date" value={entry.date} onChange={v=>patch(entry.id,{date:v})}/>
        {entry.kind==="production"&&<Sel label="Норматив" value={entry.normId} onChange={v=>{const n=norms.find(x=>String(x.id)===v);const op=pos.ops?.find(x=>String(x.normId)===v);patch(entry.id,{normId:v,operation:n?.operation||"",unit:n?.unit||"шт",minutes:n?.minutes||0,qty:op?effQty(pos,op):0});}} options={[{value:"",label:"Выберите норматив"},...norms.map(n=>({value:n.id,label:n.operation}))]}/>}
        {entry.kind==="production"&&<Inp label={`Выполнено, ${entry.unit}`} type="number" min="0" step="0.01" value={entry.qty} onChange={v=>patch(entry.id,{qty:v})}/>}
        {entry.kind==="production"&&<Inp label="Норматив, мин/ед." type="number" min="0" step="0.01" value={entry.minutes} onChange={v=>patch(entry.id,{minutes:v})}/>}
        {entry.kind==="production"&&<Inp label="Ставка, ₽/ч" type="number" min="0" step="0.01" value={entry.rate} onChange={v=>patch(entry.id,{rate:v})}/>}
        <Inp label="Начисление вручную, ₽" type="number" min="0" step="0.01" placeholder={entry.kind==="installation"?"Укажите сумму":"По нормативу"} value={entry.override} onChange={v=>patch(entry.id,{override:v})}/>
      </div><div style={{fontSize:11,color:T.textSub,marginTop:8}}>{entry.kind==="production"?"Расчёт: выполненный объём × минуты / 60 × ставка. Пустое поле ручного начисления включает расчёт по нормативу.":"Для монтажа укажите сумму начисления вручную."} Добавляйте отдельные записи для разных работников и дат.</div>
    </div>)}
  </div>;
}

// ── OrderEditor ──────────────────────────────────────────────────────────────
function OrderEditor({employees,specEquipment,order,signTypes,materials,norms,hourRate,fresaPL,plotterOpsList,jaCfg,onSave,onCancel}){
  const binds=useContext(BindContext);
  const [name,setName]=useState(order?.name||"");
  const [client,setClient]=useState(order?.client||"");
  const [date,setDate]=useState(order?.date||new Date().toLocaleDateString("ru-RU"));
  const [markup,setMarkup]=useState(order?.markup??30);
  const [positions,setPositions]=useState(order?.positions||[]);
  const [mountCost,setMountCost]=useState(order?.mount?.cost||"");
  const [deliveryH,setDeliveryH]=useState(order?.mount?.deliveryH||"");
  const specRates=Object.fromEntries(specEquipment.map(st=>[st.key,st.rate]));
  const [specJobs,setSpecJobs]=useState(order?.mount?.specJobs||{lift:[],crane:[],truck:[]});
  const [showModal,setShowModal]=useState(false);
  const [newPositionName,setNewPositionName]=useState("");

  const updPos=(id,fn)=>setPositions(p=>p.map(x=>x.id===id?fn(x):x));
  const addPos=st=>{const pos=buildPos(st,norms);setPositions(p=>[{...pos,name:newPositionName.trim()||pos.name,expanded:true},...p.map(existing=>({...existing,expanded:false}))]);setNewPositionName("");setShowModal(false);};
  const delPos=id=>setPositions(p=>p.filter(x=>x.id!==id));
  const toggleExp=id=>updPos(id,x=>({...x,expanded:!x.expanded}));
  const setField=(pid,field,v)=>updPos(pid,x=>({...x,[field]:v}));

  const frameMaterials=materials.filter(m=>m.category==="Профильная труба");
  const addFrame=id=>{if(!frameMaterials.length)return;updPos(id,x=>({...x,mats:[...x.mats,{id:uid(),matId:frameMaterials[0]?.id,qty:0,note:"Рама — расход трубы, м",bind:"",frame:true}]}));};
  const addMat=id=>updPos(id,x=>({...x,mats:[...x.mats,{id:uid(),matId:materials[0]?.id,qty:1,note:"",bind:""}]}));
  const delMat=(pid,mid)=>updPos(pid,x=>({...x,mats:x.mats.filter(m=>m.id!==mid)}));
  const updMat=(pid,mid,f,v)=>updPos(pid,x=>({...x,mats:x.mats.map(m=>m.id===mid?{...m,[f]:v}:m)}));

  const addOp=id=>updPos(id,x=>({...x,ops:[...x.ops,{id:uid(),normId:norms[0]?.id,qty:1,bind:norms[0]?.bind||""}]}));
  const delOp=(pid,oid)=>updPos(pid,x=>({...x,ops:x.ops.filter(o=>o.id!==oid)}));
  const updOp=(pid,oid,f,v)=>updPos(pid,x=>({...x,ops:x.ops.map(o=>o.id===oid?{...o,[f]:v}:o)}));
  const updOpNorm=(pid,oid,normId)=>{
    const nd=norms.find(n=>n.id===Number(normId));
    updPos(pid,x=>({...x,ops:x.ops.map(o=>o.id===oid?{...o,normId,bind:nd?.bind||""}:o)}));
  };

  const specTotal=key=>(specJobs[key]||[]).reduce((s,j)=>s+billableHours(j.hours,specEquipment.find(st=>st.key===key)?.minHours)*specRates[key],0);
  const deliveryTotal=(Number(deliveryH)||0)*1750;
  const positionMountTotal=positions.reduce((sum,pos)=>sum+positionInstallationCost(pos),0);
  const mountTotal=(Number(mountCost)||0)+positionMountTotal+deliveryTotal+specEquipment.reduce((s,st)=>s+specTotal(st.key),0);
  const calcs=positions.map(pos=>calcPos(pos,materials,norms,hourRate,fresaPL,plotterOpsList,jaCfg));
  const allPosCost=calcs.reduce((s,c)=>s+c.total,0);
  const allLaborMin=positions.reduce((s,pos,i)=>s+calcs[i].laborMin*Number(pos.qty||1),0);
  const grandTotal=(allPosCost+mountTotal)*profitabilityFactor(markup);

  // Сводный перечень материалов по всем позициям (с учётом количества изделий)
  const matTotals=(()=>{
    const map={};
    positions.forEach((pos,pi)=>{
      const q=Number(pos.qty||1);
      pos.mats.forEach(r=>{
        const m=materials.find(x=>x.id===Number(r.matId));
        if(!m)return;
        const qty=effQty(pos,r)*q;
        if(qty<=0)return;
        if(!map[m.id])map[m.id]={m,qty:0,pos:[]};
        map[m.id].qty+=qty;
        if(!map[m.id].pos.includes(pi+1))map[m.id].pos.push(pi+1);
      });
    });
    return Object.values(map).sort((a,b)=>a.m.category.localeCompare(b.m.category,"ru")||a.m.name.localeCompare(b.m.name,"ru"));
  })();
  const matTotalCost=matTotals.reduce((s,x)=>s+x.m.price*x.qty,0);
  const exportMatTotals=()=>{
    const rows=[["Категория","Материал","Ед.","Кол-во","Цена, ₽","Стоимость, ₽","Позиции"],...matTotals.map(x=>[x.m.category,x.m.name,x.m.unit,Math.round(x.qty*100)/100,x.m.price,Math.round(x.m.price*x.qty*100)/100,x.pos.join(", ")])];
    dlCSV(rows.map(r=>r.join(";")).join("\n"),`materials_${(name||"order").replace(/\s+/g,"_")}.csv`);
  };

  const doSave=()=>onSave({id:order?.id||uid(),name:name||"Заказ",client,date,markup:Number(markup),pricingMode:"profitability",positions,positionPrices:calcs.map(c=>({unitCost:c.unitCost,total:c.total})),equipmentLabels:Object.fromEntries(specEquipment.map(st=>[st.key,st.label])),mount:{cost:mountCost,deliveryH,specRates,specJobs:Object.fromEntries(specEquipment.map(st=>[st.key,(specJobs[st.key]||[]).map(j=>({...j,hours:billableHours(j.hours,st.minHours)}))]))},allPosCost:Math.round(allPosCost),laborMin:Math.round(allLaborMin),mountTotal:Math.round(mountTotal),grandTotal:Math.round(grandTotal),savedAt:new Date().toLocaleDateString("ru-RU")});

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <Btn variant="sec" onClick={onCancel} style={{height:34,padding:"0 12px",fontSize:12}}>← Назад</Btn>
        <div style={{fontSize:16,fontWeight:700,flex:1}}>{name||"Новый заказ"}</div>
        <Btn onClick={doSave}>Сохранить заказ</Btn>
      </div>

      <Card>
        <CH title="Реквизиты заказа"/>
        <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 120px",gap:14}}>
          <Inp label="Название" value={name} onChange={setName} placeholder="Вывеска для кафе..." span={2}/>
          <Inp label="Клиент" value={client} onChange={setClient} placeholder="ООО Ромашка"/>
          <Inp label="Дата" value={date} onChange={setDate}/>
        </div>
      </Card>

      <Card>
        <CH title={`Позиции (${positions.length})`} action={<Btn onClick={()=>{setNewPositionName("");setShowModal(true);}} style={{height:30,padding:"0 12px",fontSize:12}}>+ Добавить позицию</Btn>}/>
        <div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:10}}>
          {positions.length===0&&<div style={{fontSize:13,color:T.textMuted,padding:"8px 0"}}>Нажмите «Добавить позицию» чтобы начать</div>}
          {positions.map((pos,pi)=>{
            const c=CM[pos.signTypeColor]||CM.accent;
            const cost=calcs[pi];
            const isNeon=pos.isNeon||Number(pos.signTypeId)===7||/неон/i.test(pos.signTypeName||"");
            return(
              <div key={pos.id} style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:T.bg2,cursor:"pointer"}} onClick={()=>toggleExp(pos.id)}>
                  <div style={{width:28,height:28,borderRadius:8,background:c.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:c.dot,flexShrink:0}}>◈</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{pi+1}. {pos.name||pos.signTypeName}</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                      <span>{pos.qty} шт</span>
                      {pos.area&&<span>{pos.area} м²</span>}
                      {pos.perimeter&&<span>периметр {pos.perimeter} м</span>}
                      {!isNeon&&pos.letters&&<span>{pos.letters} букв</span>}
                      {cost.laborMin>0&&<span style={{color:T.green}}>⏱ сборка {fmtDur(cost.laborMin)}</span>}
                      {(pos.plotterOps||[]).length>0&&<span style={{color:T.accent}}>⬡ плоттер</span>}
                      {(pos.fresas||[]).length>0&&<span style={{color:T.amber}}>⚙ фреза</span>}
                      {pos.useJA&&<span style={{color:T.amber}}>◉ ЖА</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",marginRight:8}}>
                    <div style={{fontSize:15,fontWeight:700,color:T.green}}>{fmt(cost.total)} ₽</div>
                    <div style={{fontSize:10,color:T.textMuted}}>{fmt(cost.unitCost)} ₽ × {pos.qty} шт</div>
                  </div>
                  <span style={{color:T.textMuted,fontSize:14,transform:pos.expanded?"rotate(180deg)":"none",transition:"transform .2s"}}>⌃</span>
                  <XBtn onClick={e=>{e.stopPropagation();delPos(pos.id);}}/>
                </div>

                {pos.expanded&&(
                  <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <Inp label="Название позиции" value={pos.name??pos.signTypeName} onChange={v=>setField(pos.id,"name",v)} placeholder="Введите название позиции"/>
                      <div style={{display:"grid",gridTemplateColumns:isNeon?"80px 1fr 1fr 1fr":"80px 1fr 1fr 1fr 1fr",gap:12,alignItems:"end"}}>
                        <Inp label="Кол-во" value={pos.qty} onChange={v=>setField(pos.id,"qty",v)} type="number" min="1"/>
                        <Inp label={bindLabel("area",binds)} value={pos.area} onChange={v=>setField(pos.id,"area",v)} type="number" min="0" step="0.01" suffix={binds.find(b=>b.key==="area")?.unit??"м²"}/>
                        <Inp label={bindLabel("perimeter",binds)} value={pos.perimeter} onChange={v=>setField(pos.id,"perimeter",v)} type="number" min="0" step="0.01" suffix={binds.find(b=>b.key==="perimeter")?.unit??"м.п."}/>
                        {!isNeon&&<Inp label={bindLabel("diodes",binds)} value={pos.diodes} onChange={v=>setField(pos.id,"diodes",v)} type="number" min="0" suffix={binds.find(b=>b.key==="diodes")?.unit??"шт"}/>}
                        <div style={{background:T.bg0,borderRadius:10,border:`1px solid ${T.border}`,padding:"8px 12px"}}>
                          <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>Стоим. ед.</div>
                          <div style={{fontSize:16,fontWeight:700,color:T.accent}}>{fmt(cost.unitCost)} ₽</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:isNeon?"1fr 1fr":"1fr 1fr 1fr",gap:12}}>
                        {!isNeon&&<Inp label={bindLabel("letters",binds)} value={pos.letters||""} onChange={v=>setField(pos.id,"letters",v)} type="number" min="0" suffix={binds.find(b=>b.key==="letters")?.unit??"шт"}/>}
                        <Inp label={bindLabel("neonPerimeter",binds)} value={pos.neonPerimeter||""} onChange={v=>setField(pos.id,"neonPerimeter",v)} type="number" min="0" step="0.01" suffix={binds.find(b=>b.key==="neonPerimeter")?.unit??"м.п."}/>
                        <Inp label={bindLabel("elements",binds)} value={pos.elements||""} onChange={v=>setField(pos.id,"elements",v)} type="number" min="0" suffix={binds.find(b=>b.key==="elements")?.unit??"шт"}/>
                      </div>
                      {binds.some(b=>b.key.startsWith("custom_"))&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>{binds.filter(b=>b.key.startsWith("custom_")).map(b=><Inp key={b.key} label={b.label} value={pos[b.key]??""} onChange={v=>setField(pos.id,b.key,v)} type="number" min="0" step="0.01" suffix={b.unit}/>)}</div>}
                      <div style={{fontSize:11,color:T.textMuted}}>Эти параметры подставляются в строки материалов, операций и формулы фрезеровки с привязкой ⊡.</div>
                    </div>

                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>Материалы</span>
                        <Btn variant="sec" onClick={()=>addMat(pos.id)} style={{height:26,padding:"0 10px",fontSize:11}}>+ Добавить</Btn>
                      </div>
                      {pos.mats.filter(m=>!m.frame).length===0&&<div style={{fontSize:12,color:T.textMuted}}>Нет материалов</div>}
                      {pos.mats.filter(m=>!m.frame).map(m=>(
                        <div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 150px 110px 30px",gap:8,marginBottom:6,alignItems:"center"}}>
                          <select value={m.matId} onChange={e=>updMat(pos.id,m.id,"matId",e.target.value)} style={{...SS,fontSize:12}}>
                            {materials.map(x=><option key={x.id} value={x.id}>{x.name} — {x.price.toLocaleString("ru-RU")} ₽/{x.unit}</option>)}
                          </select>
                          <QtyInp pos={pos} row={m} onChange={v=>updMat(pos.id,m.id,"qty",v)}/>
                          <BindSel value={m.bind} onChange={v=>updMat(pos.id,m.id,"bind",v)}/>
                          <input value={m.note||""} onChange={e=>updMat(pos.id,m.id,"note",e.target.value)} placeholder="примечание" style={{...IS,fontSize:12}}/>
                          <XBtn onClick={()=>delMat(pos.id,m.id)}/>
                        </div>
                      ))}
                    </div>

                    <div style={{padding:12,background:T.bg2,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600}}>Рама в составе позиции</span>
                        <Btn variant="sec" onClick={()=>addFrame(pos.id)} disabled={!frameMaterials.length} style={{height:26,padding:"0 10px",fontSize:11}}>+ Добавить раму</Btn>
                      </div>
                      {pos.mats.filter(m=>m.frame).map(m=>{
                        const material=materials.find(x=>x.id===Number(m.matId));
                        return <div key={m.id} style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",marginBottom:8}}>
                          <div style={{flex:"1 1 260px"}}><Sel label="Труба" value={m.matId} onChange={v=>updMat(pos.id,m.id,"matId",v)} options={frameMaterials.map(x=>({value:x.id,label:`${x.name} — ${fmt(x.price)} ₽/м`}))}/></div>
                          <div style={{width:120}}><F label="Расход трубы, м"><QtyInp pos={pos} row={m} onChange={v=>updMat(pos.id,m.id,"qty",Math.max(0,Number(v)||0))}/></F></div>
                          <span style={{fontSize:13,color:T.accent,paddingBottom:10}}>{fmt((material?.price||0)*effQty(pos,m))} ₽</span>
                          <XBtn onClick={()=>delMat(pos.id,m.id)}/>
                        </div>;
                      })}
                      <div style={{fontSize:11,color:T.textSub}}>Расход на одно изделие: внешний контур и перемычки. Стоимость трубы входит в материалы позиции и умножается на количество изделий. Работы и крепёж добавьте отдельно.</div>
                      {pos.mats.some(m=>m.frame&&!Number(materials.find(x=>x.id===Number(m.matId))?.price))&&<div style={{fontSize:11,color:T.amber,marginTop:6}}>Заполните цену трубы в справочнике материалов — сейчас 0 ₽/м.</div>}
                    </div>

                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>Операции (ручные)</span>
                        <Btn variant="sec" onClick={()=>addOp(pos.id)} style={{height:26,padding:"0 10px",fontSize:11}}>+ Добавить</Btn>
                      </div>
                      {pos.ops.length===0&&<div style={{fontSize:12,color:T.textMuted}}>Нет операций</div>}
                      {pos.ops.map(op=>{
                        const nd=norms.find(n=>n.id===Number(op.normId));
                        const opMin=nd?(Number(nd.minutes)||0)*effQty(pos,op):0;
                        return(
                          <div key={op.id} style={{marginBottom:6}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 150px 30px",gap:8,alignItems:"center"}}>
                              <select value={op.normId} onChange={e=>updOpNorm(pos.id,op.id,e.target.value)} style={{...SS,fontSize:12}}>
                                {norms.map(n=><option key={n.id} value={n.id}>{n.operation} ({n.minutes} мин/{n.unit})</option>)}
                              </select>
                              <QtyInp pos={pos} row={op} onChange={v=>updOp(pos.id,op.id,"qty",v)}/>
                              <BindSel value={op.bind} onChange={v=>updOp(pos.id,op.id,"bind",v)}/>
                              <XBtn onClick={()=>delOp(pos.id,op.id)}/>
                            </div>
                            {nd&&Number(nd.minutes)===0&&<div style={{fontSize:10,color:T.amber,marginTop:2,paddingLeft:2}}>Норма времени не задана. Заполните на вкладке «Нормативы»</div>}
                            {nd&&Number(nd.minutes)>0&&<div style={{fontSize:10,color:T.textMuted,marginTop:2,paddingLeft:2}}>Время: {fmtDur(opMin)}</div>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 14px"}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:12}}>Станки</div>
                      <PosStanki pos={pos} fresaPL={fresaPL} plotterOpsList={plotterOpsList} updPos={fn=>updPos(pos.id,fn)}/>
                    </div>

                    <PosJA pos={pos} cost={cost} updPos={fn=>updPos(pos.id,fn)}/>

                    <PositionWork pos={pos} employees={employees} norms={norms} hourRate={hourRate} updPos={updPos}/>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                      <MC label="Материалы" value={`${fmt(cost.matUnit)} ₽`}/>
                      <MC label="Время сборки" value={fmtDur(cost.laborMin)} sub={Number(pos.qty)>1?`всего ${fmtDur(cost.laborMin*Number(pos.qty))}`:undefined} color={cost.laborMin>0?T.green:T.textMuted}/>
                      <MC label="ФОТ" value={`${fmt(cost.laborCost)} ₽`}/>
                      <MC label="Плоттер" value={cost.plotterCost>0?`${fmt(cost.plotterCost)} ₽`:"—"} color={cost.plotterCost>0?T.accent:T.textMuted}/>
                      <MC label="Фреза ЧПУ" value={cost.fresaCost>0?`${fmt(cost.fresaCost)} ₽`:"—"} color={cost.fresaCost>0?T.amber:T.textMuted}/>
                      {pos.useJA&&<MC label="Жидкий акрил" value={cost.jaCost>0?`${fmt(cost.jaCost)} ₽`:"—"} color={cost.jaCost>0?T.amber:T.textMuted}/>}
                      <MC label={`Итого (×${pos.qty})`} value={`${fmt(cost.total)} ₽`} color={T.green}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:T.textSub}}>Чтобы сохранить весь заказ, нажмите «Сохранить заказ».</span>
                      <Btn onClick={()=>updPos(pos.id,x=>({...x,expanded:false}))} style={{height:32,padding:"0 14px",fontSize:12}}>Сохранить позицию</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CH title="🔧 Монтаж и доставка"/>
        <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",fontWeight:600,letterSpacing:.8}}>Монтаж по позициям</div>
              {positions.length===0&&<div style={{fontSize:12,color:T.textMuted}}>Добавьте позицию заказа</div>}
              {positions.map((pos,i)=><div key={pos.id} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,flex:1}}>{i+1}. {pos.name||pos.signTypeName} <span style={{color:T.textMuted}}>· {pos.qty} шт</span></span><input aria-label={`Стоимость монтажа за штуку: ${pos.name||pos.signTypeName}`} type="number" min="0" step="0.01" value={pos.mountCost??""} onChange={e=>setField(pos.id,"mountCost",e.target.value)} placeholder="0" style={{...IS,width:110,height:32,fontSize:12}}/><span style={{fontSize:12,color:T.textSub,whiteSpace:"nowrap"}}>₽/шт</span><span style={{fontSize:12,fontWeight:600,minWidth:82,textAlign:"right",whiteSpace:"nowrap"}}>{fmt(positionInstallationCost(pos))} ₽</span></div>)}
              {Number(mountCost)>0&&<Inp label="Ранее указанная общая стоимость монтажа" value={mountCost} onChange={setMountCost} type="number" min="0" suffix="₽"/>}
              <div style={{fontSize:11,color:T.textSub}}>Укажите цену за 1 шт. Справа — сумма за все изделия позиции, до рентабельности.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Inp label="Доставка, часов" value={deliveryH} onChange={setDeliveryH} type="number" min="0" step="0.5" suffix="ч"/>
              <div style={{background:T.bg2,borderRadius:8,border:`1px solid ${T.border}`,padding:"8px 12px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>1 750 ₽/ч</div>
                <div style={{fontSize:16,fontWeight:700,color:deliveryTotal?T.accent:T.textMuted}}>{fmt(deliveryTotal)} ₽</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:10}}>Спецтехника</div>
            <div style={{display:"flex",flexDirection:"row",flexWrap:"nowrap",gap:6,overflowX:"auto",paddingBottom:3}}>
              {specEquipment.map(st=>(
                <div key={st.key} style={{display:"flex",alignItems:"center",gap:5,flex:"1 0 auto",minHeight:30,padding:"3px 8px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`,overflowX:"auto",whiteSpace:"nowrap"}}>
                  <span title={`${fmt(st.rate)} ₽/ч · минимум ${st.minHours} ч`} style={{fontSize:12,fontWeight:600,flexShrink:0}}><span style={{fontSize:12}}>{st.icon}</span> {st.label}</span>
                  <button aria-label={`Добавить ${st.label}`} title="Добавить выезд" className="sec" onClick={()=>setSpecJobs(p=>({...p,[st.key]:[...(p[st.key]||[]),{id:uid(),hours:st.minHours}]}))} style={{height:22,width:22,flexShrink:0,padding:0,borderRadius:4,border:`1px solid ${T.border}`,background:T.bg1,color:T.accent,fontSize:15,lineHeight:"20px"}}>+</button>
                  {(specJobs[st.key]||[]).map((j,i)=>(
                    <div key={j.id} style={{display:"inline-flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <input aria-label={`${st.label}, выезд ${i+1}, часов`} title={`Выезд ${i+1}, минимум ${st.minHours} ч`} type="number" min={st.minHours} step="0.5" value={billableHours(j.hours,st.minHours)} onChange={e=>setSpecJobs(p=>({...p,[st.key]:p[st.key].map(x=>x.id===j.id?{...x,hours:billableHours(e.target.value,st.minHours)}:x)}))} style={{...IS,height:22,width:48,padding:"0 5px",fontSize:11}}/>
                      <span style={{fontSize:11,color:T.textSub}}>ч</span>
                      <button aria-label={`Удалить выезд ${i+1}: ${st.label}`} className="del" onClick={()=>setSpecJobs(p=>({...p,[st.key]:p[st.key].filter(x=>x.id!==j.id)}))} style={{height:20,width:20,padding:0,border:"none",borderRadius:4,background:"none",color:T.textMuted,fontSize:14}}>×</button>
                    </div>
                  ))}
                  {specTotal(st.key)>0&&<span style={{marginLeft:"auto",fontSize:12,fontWeight:600,color:specTotal(st.key)>0?T.accent:T.textMuted,flexShrink:0}}>{fmt(specTotal(st.key))} ₽</span>}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
            <div><div style={{fontSize:13,fontWeight:600}}>Итого монтаж и доставка</div><div style={{fontSize:11,color:T.textSub,marginTop:3}}>Монтажные работы + доставка + спецтехника · до рентабельности</div></div>
            <strong aria-live="polite" style={{fontSize:20,color:T.green,whiteSpace:"nowrap"}}>{fmt(mountTotal)} ₽</strong>
          </div>
        </div>
      </Card>

      <Card>
        <CH title={`Итоговый перечень материалов (${matTotals.length})`} action={matTotals.length>0&&(
          <button className="sec" onClick={exportMatTotals} style={{height:30,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>⬇ Экспорт CSV</button>
        )}/>
        <div style={{padding:"8px 18px 14px",overflowX:"auto"}}>
          {matTotals.length===0?(
            <div style={{fontSize:13,color:T.textMuted,padding:"10px 0"}}>Материалы появятся здесь, когда в позициях будут добавлены материалы с ненулевым количеством.</div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  <th style={thS}>Категория</th>
                  <th style={thS}>Материал</th>
                  <th style={{...thS,textAlign:"right"}}>Кол-во</th>
                  <th style={{...thS,textAlign:"right"}}>Цена за ед.</th>
                  <th style={{...thS,textAlign:"right"}}>Стоимость</th>
                  <th style={thS}>В позициях</th>
                </tr>
              </thead>
              <tbody>
                {matTotals.map(x=>(
                  <tr key={x.m.id} className="hov" style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={tdS}><Tag col={CC[x.m.category]||"accent"}>{x.m.category}</Tag></td>
                    <td style={tdS}>{x.m.name}</td>
                    <td style={{...tdS,textAlign:"right",fontWeight:700,color:T.green,whiteSpace:"nowrap"}}>{fmt2(x.qty)} <span style={{fontSize:11,color:T.textMuted,fontWeight:400}}>{x.m.unit}</span></td>
                    <td style={{...tdS,textAlign:"right",color:T.textSub,whiteSpace:"nowrap"}}>{x.m.price.toLocaleString("ru-RU")} ₽</td>
                    <td style={{...tdS,textAlign:"right",fontWeight:600,color:T.accent,whiteSpace:"nowrap"}}>{fmt(x.m.price*x.qty)} ₽</td>
                    <td style={{...tdS,color:T.textMuted,fontSize:12}}>{x.pos.length>1?`поз. ${x.pos.join(", ")}`:`поз. ${x.pos[0]}`}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{padding:"10px 10px 0",textAlign:"right",fontSize:12,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>Итого по материалам</td>
                  <td style={{padding:"10px 10px 0",textAlign:"right",fontSize:15,fontWeight:700,color:T.green,whiteSpace:"nowrap"}}>{fmt(matTotalCost)} ₽</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card accent={grandTotal>0}>
        <CH title="Итого по заказу"/>
        <div style={{padding:"16px 18px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 110px 1fr",gap:12,marginBottom:14,alignItems:"end"}}>
            <MC label="Позиции" value={`${fmt(allPosCost)} ₽`} sub={`${positions.length} поз.`}/>
            <MC label="Время сборки" value={fmtDur(allLaborMin)} color={allLaborMin>0?T.green:T.textMuted}/>
            <MC label="Монтаж и доставка" value={`${fmt(mountTotal)} ₽`}/>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>Рентабельность</label>
              <div style={{display:"flex",alignItems:"center",gap:8,height:38}}>
                <input aria-label="Рентабельность, %" type="number" min="0" max="99.99" step="0.01" value={markup} onChange={e=>setMarkup(e.target.value===""?"":Math.min(99.99,Math.max(0,Number(e.target.value)||0)))} style={{...IS,width:75,height:38,textAlign:"right",color:T.accent,fontWeight:700}}/>
                <span style={{fontSize:15,color:T.accent}}>%</span>
              </div>
            </div>
            <MC label="Итого клиенту" value={`${fmt(grandTotal)} ₽`} color={T.green}/>
          </div>
          <Btn onClick={doSave} style={{height:42,fontSize:14,width:"100%"}}>Сохранить заказ ↗</Btn>
        </div>
      </Card>

      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setShowModal(false)}>
          <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:16,padding:"20px 24px",width:520,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Добавление позиции</div>
            <div style={{marginBottom:16}}><Inp label="Название позиции" value={newPositionName} onChange={setNewPositionName} placeholder="Например: Неон для витрины"/></div>
            <div style={{fontSize:12,color:T.textSub,marginBottom:10}}>Выберите тип вывески. Если название не заполнено, используем название типа.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {signTypes.map(st=>{const c=CM[st.color]||CM.accent;return(
                <button key={st.id} onClick={()=>addPos(st)} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg2,cursor:"pointer",textAlign:"left"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{width:8,height:8,borderRadius:"50%",background:c.dot,display:"inline-block"}}/><span style={{fontSize:13,fontWeight:600,color:T.text}}>{st.name}</span></div>
                  <div style={{fontSize:11,color:T.textMuted}}>{st.description}</div>
                </button>
              );})}
            </div>
            <Btn variant="sec" onClick={()=>addPos(null)} style={{width:"100%"}}>+ Пустая позиция (без шаблона)</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Модуль «Жидкий акрил» (вкладка Станки) ───────────────────────────────────
function LiquidAcrylicModule({cfg,setCfg}){
  const [area,setArea]=useState("");
  const [boardH,setBoardH]=useState(60);
  const [letters,setLetters]=useState("");
  const [perimeter,setPerimeter]=useState("");
  const [showCfg,setShowCfg]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  const updCfg=(k,v)=>setCfg(p=>({...p,[k]:v}));

  const calculate=()=>{
    setError("");
    const a=Number(area),b=Number(boardH),l=Number(letters),p=Number(perimeter);
    if(!a||a<=0)return setError("Введите площадь заливки (м²)");
    if(!l||l<=0)return setError("Введите количество букв");
    if(!p||p<=0)return setError("Введите периметр всех элементов (м.п.)");
    if(!BOARD_HEIGHTS.includes(b))return setError("Высота борта: 40, 60, 80 или 100 мм");
    setResult(calcJA({area:a,board_height:b,letters_count:l,perimeter:p},cfg));
  };

  const Row=({label,value,unit,color,bold})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:13,color:bold?T.text:T.textSub}}>{label}</span>
      <span style={{fontSize:13,fontWeight:bold?700:500,color:color||(bold?T.green:T.text)}}>{value} <span style={{fontSize:11,color:T.textMuted}}>{unit}</span></span>
    </div>
  );

  return(
    <Card>
      <CH title="◉ Жидкий акрил" action={
        <button className="sec" onClick={()=>setShowCfg(p=>!p)} style={{height:30,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:showCfg?T.bg3:"none",color:T.textSub,fontSize:12}}>{showCfg?"Скрыть настройки ▲":"Цены и нормы ▼"}</button>
      }/>
      <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{fontSize:12,color:T.textMuted,padding:"10px 14px",background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`}}>
          Цены и нормы отсюда используются и в расчёте ЖА внутри позиций заказа. Включить ЖА в позиции можно через тип вывески «Буквы ЖА» или кнопкой «Добавить расчёт ЖА».
        </div>

        {showCfg&&(
          <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:12,fontWeight:600,color:T.textSub}}>Цены и нормы (меняются редко)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <Inp label="Цена борта, ₽/м.п." value={cfg.price_board} onChange={v=>updCfg("price_board",Number(v))} type="number" min="0"/>
              <Inp label="Цена станка, ₽/м.п." value={cfg.price_machine} onChange={v=>updCfg("price_machine",Number(v))} type="number" min="0"/>
              <Inp label="Цена задника" value={cfg.price_backing} onChange={v=>updCfg("price_backing",Number(v))} type="number" min="0"/>
              <Inp label="Цена оператора, ₽/ч" value={cfg.price_operator} onChange={v=>updCfg("price_operator",Number(v))} type="number" min="0"/>
              <Inp label="Норма оператора, ч" value={cfg.operator_norm} onChange={v=>updCfg("operator_norm",Number(v))} type="number" min="0" step="0.01"/>
              <Inp label="Толщина акрила, мм" value={cfg.acrylic_thickness} onChange={v=>updCfg("acrylic_thickness",Number(v))} type="number" min="1"/>
              <Inp label="Плотность акрила, кг/м³" value={cfg.density_acrylic} onChange={v=>updCfg("density_acrylic",Number(v))} type="number" min="0"/>
              <Inp label="Коэф. цены акрила" value={cfg.acrylic_price_coeff} onChange={v=>updCfg("acrylic_price_coeff",Number(v))} type="number" min="0" step="0.0001"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <F label="Расчёт задника">
                <div style={{display:"flex",gap:8}}>
                  {[["area","По площади (м²)"],["perimeter","По периметру (м.п.)"]].map(([v,l])=>(
                    <button key={v} onClick={()=>updCfg("backing_calc_mode",v)} style={{flex:1,height:34,borderRadius:8,border:`1px solid ${cfg.backing_calc_mode===v?T.accent:T.border}`,background:cfg.backing_calc_mode===v?T.accentDim:"none",color:cfg.backing_calc_mode===v?T.accent:T.textSub,fontSize:12,fontWeight:cfg.backing_calc_mode===v?600:400}}>{l}</button>
                  ))}
                </div>
              </F>
              <F label="Норма оператора">
                <div style={{display:"flex",gap:8}}>
                  {[["per_letter","На букву (ч/шт)"],["per_meter","На метр (ч/м.п.)"]].map(([v,l])=>(
                    <button key={v} onClick={()=>updCfg("operator_norm_mode",v)} style={{flex:1,height:34,borderRadius:8,border:`1px solid ${cfg.operator_norm_mode===v?T.accent:T.border}`,background:cfg.operator_norm_mode===v?T.accentDim:"none",color:cfg.operator_norm_mode===v?T.accent:T.textSub,fontSize:12,fontWeight:cfg.operator_norm_mode===v?600:400}}>{l}</button>
                  ))}
                </div>
              </F>
            </div>
            <button onClick={()=>setCfg(DEFAULT_JA_CONFIG)} style={{alignSelf:"flex-start",height:26,padding:"0 12px",fontSize:11,borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,cursor:"pointer"}}>↺ Сбросить к умолчаниям</button>
          </div>
        )}

        <div>
          <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:10}}>Быстрый расчёт</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
            <Inp label="Площадь заливки" value={area} onChange={setArea} type="number" min="0" step="0.001" suffix="м²" placeholder="0.269"/>
            <F label="Высота борта">
              <div style={{display:"flex",gap:6}}>
                {BOARD_HEIGHTS.map(h=>(
                  <button key={h} onClick={()=>setBoardH(h)} style={{flex:1,height:38,borderRadius:8,border:`1px solid ${boardH===h?T.accent:T.border}`,background:boardH===h?T.accentDim:T.bg2,color:boardH===h?T.accent:T.textSub,fontSize:13,fontWeight:boardH===h?700:400}}>{h}</button>
                ))}
              </div>
              <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>мм · цена акрила: {fmt2(2*boardH*cfg.acrylic_price_coeff)} ₽/кг</div>
            </F>
            <Inp label="Кол-во букв" value={letters} onChange={setLetters} type="number" min="1" suffix="шт" placeholder="6"/>
            <Inp label="Периметр элементов" value={perimeter} onChange={setPerimeter} type="number" min="0" step="0.01" suffix="м.п." placeholder="8"/>
          </div>
        </div>

        {error&&<div style={{padding:"10px 14px",borderRadius:8,background:T.redDim,border:`1px solid ${T.red}`,fontSize:13,color:T.red}}>{error}</div>}

        <Btn onClick={calculate} style={{height:42,fontSize:14}}>Рассчитать →</Btn>

        {result&&(
          <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`,padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Результат расчёта</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:6}}>Акрилайт</div>
              <Row label={`Цена акрила (борт ${boardH} мм)`} value={fmt2(result.price_acrylic)} unit="₽/кг"/>
              <Row label="Расход акрила" value={fmt2(result.acrylic_consumption)} unit="кг"/>
              <Row label="Стоимость акрила" value={fmt2(result.cost_acrylic)} unit="₽"/>
              <Row label={`Борт (${perimeter} м.п. × ${cfg.price_board} ₽)`} value={fmt2(result.cost_board)} unit="₽"/>
              <Row label={`Станок (${perimeter} м.п. × ${cfg.price_machine} ₽)`} value={fmt2(result.cost_machine)} unit="₽"/>
              <Row label="Подытог Акрилайт" value={fmt2(result.subtotal_acrilight)} unit="₽" bold color={T.accent}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:6}}>Задник и оператор</div>
              <Row label="Стоимость задника" value={fmt2(result.cost_backing)} unit="₽"/>
              <Row label="Время оператора" value={fmtDur(result.operator_time*60)} unit=""/>
              <Row label={`Стоимость оператора (× ${cfg.price_operator} ₽/ч)`} value={fmt2(result.cost_operator)} unit="₽"/>
            </div>
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:15,fontWeight:700}}>ИТОГО</span>
              <span style={{fontSize:22,fontWeight:700,color:T.green}}>{fmt2(result.total)} ₽</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Редактор типа вывески ────────────────────────────────────────────────────
function SignTypeEditor({st,materials,norms,fresaPL,plotterOpsList,onSave,onCancel}){
  const binds=useContext(BindContext);
  const [form,setForm]=useState({name:st?.name||"",description:st?.description||"",color:st?.color||"accent"});
  const [stMats,setStMats]=useState(st?.materials||[]);
  const [stNorms,setStNorms]=useState(st?.norms||[]);
  const [stPlotter,setStPlotter]=useState(st?.plotterOps||[]);
  const [stFresas,setStFresas]=useState(st?.fresas||[]);
  const [useJA,setUseJA]=useState(!!st?.useJA);
  const [jaBoard,setJaBoard]=useState(st?.jaDefaults?.board_height||60);
  const fresaGroups=[...new Set(fresaPL.map(x=>x.group))];
  const patchFresaRow=(i,patch)=>setStFresas(p=>p.map((x,idx)=>idx===i?{...x,...patch}:x));

  return(
    <Card>
      <CH title={st?"Редактирование типа":"Новый тип вывески"}/>
      <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Inp label="Название" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Объёмные буквы..."/>
          <Sel label="Цвет" value={form.color} onChange={v=>setForm(p=>({...p,color:v}))} options={TYPE_COLORS.map(c=>({value:c,label:{accent:"Синий",green:"Зелёный",amber:"Жёлтый",purple:"Фиолетовый"}[c]}))}/>
          <Inp label="Описание" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} span={2}/>
        </div>

        <div>
          <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:8}}>Материалы</div>
          {stMats.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px 150px 110px 30px",gap:8,marginBottom:6,alignItems:"center"}}>
              <select value={r.matId} onChange={e=>setStMats(p=>p.map((x,idx)=>idx===i?{...x,matId:Number(e.target.value)}:x))} style={{...SS,fontSize:12}}>{materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <input type="number" value={r.qty} onChange={e=>setStMats(p=>p.map((x,idx)=>idx===i?{...x,qty:e.target.value}:x))} style={{...IS,fontSize:12}}/>
              <BindSel value={r.bind} onChange={v=>setStMats(p=>p.map((x,idx)=>idx===i?{...x,bind:v}:x))}/>
              <input value={r.note||""} onChange={e=>setStMats(p=>p.map((x,idx)=>idx===i?{...x,note:e.target.value}:x))} placeholder="примечание" style={{...IS,fontSize:12}}/>
              <XBtn onClick={()=>setStMats(p=>p.filter((_,idx)=>idx!==i))}/>
            </div>
          ))}
          <Btn variant="sec" onClick={()=>setStMats(p=>[...p,{matId:materials[0]?.id,qty:1,note:"",bind:""}])} style={{height:28,padding:"0 10px",fontSize:11}}>+ Материал</Btn>
          <Btn variant="sec" onClick={()=>{const pipe=materials.find(m=>m.category==="Профильная труба");if(pipe)setStMats(p=>[...p,{matId:pipe.id,qty:0,note:"Рама — расход трубы, м",bind:"",frame:true}]);}} style={{height:28,padding:"0 10px",fontSize:11,marginLeft:8}}>+ Рама в составе вывески</Btn>
        </div>

        <div>
          <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:8}}>Операции (ручные)</div>
          {stNorms.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 30px",gap:8,marginBottom:6,alignItems:"center"}}>
              <select value={r.normId} onChange={e=>setStNorms(p=>p.map((x,idx)=>idx===i?{normId:Number(e.target.value),qty:x.qty}:x))} style={{...SS,fontSize:12}}>{norms.map(n=><option key={n.id} value={n.id}>{n.operation}{n.bind?` · ⊡ ${bindLabel(n.bind,binds)}`:""}</option>)}</select>
              <input type="number" value={r.qty} onChange={e=>setStNorms(p=>p.map((x,idx)=>idx===i?{...x,qty:e.target.value}:x))} style={{...IS,fontSize:12}}/>
              <XBtn onClick={()=>setStNorms(p=>p.filter((_,idx)=>idx!==i))}/>
            </div>
          ))}
          <Btn variant="sec" onClick={()=>setStNorms(p=>[...p,{normId:norms[0]?.id,qty:1}])} style={{height:28,padding:"0 10px",fontSize:11}}>+ Операция</Btn>
          <div style={{fontSize:11,color:T.textMuted,marginTop:6}}>Привязка операции к параметрам позиции берётся из справочника нормативов.</div>
        </div>

        <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 14px"}}>
          <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:10}}>Станки (шаблон)</div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:6,textTransform:"uppercase",letterSpacing:.7,fontWeight:600}}>⬡ Плоттер</div>
          {stPlotter.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px 30px",gap:8,marginBottom:6,alignItems:"center"}}>
              <select value={r.opId} onChange={e=>setStPlotter(p=>p.map((x,idx)=>idx===i?{...x,opId:e.target.value}:x))} style={{...SS,fontSize:12}}>
                {plotterOpsList.map(op=><option key={op.id} value={op.id}>{op.name} ({op.rate} ₽/{op.unit})</option>)}
              </select>
              <input type="number" value={r.qty} onChange={e=>setStPlotter(p=>p.map((x,idx)=>idx===i?{...x,qty:e.target.value}:x))} placeholder="кол-во" style={{...IS,fontSize:12}}/>
              <XBtn onClick={()=>setStPlotter(p=>p.filter((_,idx)=>idx!==i))}/>
            </div>
          ))}
          <Btn variant="sec" onClick={()=>setStPlotter(p=>[...p,{opId:plotterOpsList[0]?.id||"",qty:1}])} style={{height:26,padding:"0 10px",fontSize:11,marginBottom:12}}>+ Операция плоттера</Btn>

          <div style={{fontSize:11,color:T.textMuted,marginBottom:6,textTransform:"uppercase",letterSpacing:.7,fontWeight:600}}>⚙ Фреза ЧПУ</div>
          {stFresas.map((r,i)=>{
            const isF=!!r.formula;
            return(
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 90px 110px 30px",gap:8,alignItems:"center"}}>
                  <select value={r.priceId} onChange={e=>patchFresaRow(i,{priceId:e.target.value})} style={{...SS,fontSize:12}}>
                    {fresaGroups.map(g=>(
                      <optgroup key={g} label={g}>
                        {fresaPL.filter(x=>x.group===g).map(x=><option key={x.id} value={x.id}>{x.material} — {Number(x.rate).toFixed(2)} ₽/м</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input type="number" value={isF?"":(r.meters||"")} disabled={isF} onChange={e=>patchFresaRow(i,{meters:e.target.value})} placeholder={isF?"формула":"пог.м"} style={{...IS,fontSize:12,opacity:isF?.6:1,background:isF?T.bg0:T.bg2}}/>
                  <button title="Переключить ввод длины: вручную или по формуле" onClick={()=>patchFresaRow(i,{formula:isF?null:{}})} style={{height:38,borderRadius:8,border:`1px solid ${isF?T.accent:T.border}`,background:isF?T.accentDim:T.bg2,color:isF?T.accent:T.textSub,fontSize:12}}>{isF?"⊡ Формула":"Вручную"}</button>
                  <XBtn onClick={()=>setStFresas(p=>p.filter((_,idx)=>idx!==i))}/>
                </div>
                {isF&&<div style={{marginTop:6}}><FormulaEdit formula={r.formula} onChange={f=>patchFresaRow(i,{formula:f})}/></div>}
                {isF&&<div style={{fontSize:10,color:T.textMuted,marginTop:3,paddingLeft:2}}>Длина реза = {formulaText(r.formula,binds)}</div>}
              </div>
            );
          })}
          <Btn variant="sec" onClick={()=>setStFresas(p=>[...p,{priceId:fresaPL[0]?.id||"",meters:"",formula:null}])} style={{height:26,padding:"0 10px",fontSize:11}}>+ Фреза</Btn>
        </div>

        <div style={{background:T.bg2,borderRadius:10,border:`1px solid ${useJA?T.amber:T.border}`,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:useJA?12:0}}>
            <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>◉ Жидкий акрил</span>
            <Btn variant={useJA?"pri":"sec"} onClick={()=>setUseJA(p=>!p)} style={{height:26,padding:"0 10px",fontSize:11}}>{useJA?"Модуль ЖА включён ✓":"+ Подключить модуль ЖА"}</Btn>
          </div>
          {useJA&&(
            <div>
              <F label="Высота борта по умолчанию, мм">
                <div style={{display:"flex",gap:6,maxWidth:320}}>
                  {BOARD_HEIGHTS.map(h=>(
                    <button key={h} onClick={()=>setJaBoard(h)} style={{flex:1,height:38,borderRadius:8,border:`1px solid ${jaBoard===h?T.amber:T.border}`,background:jaBoard===h?T.amberDim:T.bg0,color:jaBoard===h?T.amber:T.textSub,fontSize:13,fontWeight:jaBoard===h?700:400}}>{h}</button>
                  ))}
                </div>
              </F>
              <div style={{fontSize:11,color:T.textMuted,marginTop:8}}>В позиции заказа расчёт ЖА возьмёт площадь, периметр и количество букв из параметров позиции.</div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,borderTop:`1px solid ${T.border}`,paddingTop:14}}>
          <Btn onClick={()=>onSave({...form,materials:stMats,norms:stNorms,plotterOps:stPlotter,fresas:stFresas,useJA,jaDefaults:{board_height:jaBoard}})}>Сохранить</Btn>
          <Btn variant="sec" onClick={onCancel}>Отмена</Btn>
        </div>
      </div>
    </Card>
  );
}

// ── Форма добавления операции плоттера ───────────────────────────────────────
function PlotterAddForm({onAdd}){
  const [n,setN]=useState("");
  const [u,setU]=useState("м²");
  const [r,setR]=useState("");
  const add=()=>{if(!n||!r)return;onAdd({name:n,unit:u,rate:Number(r)});setN("");setU("м²");setR("");};
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 100px 110px 38px",gap:10,padding:"12px 14px",background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`}}>
      <Inp label="Название" value={n} onChange={setN} placeholder="Новая операция"/>
      <Inp label="Единица" value={u} onChange={setU} placeholder="м²"/>
      <Inp label="Тариф ₽" value={r} onChange={setR} type="number" min="0"/>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:"transparent"}}>.</label>
        <button className="pri" onClick={add} style={{height:38,borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:18,fontWeight:700}}>+</button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
const EMPTY_NORM={category:"Производство",operation:"",unit:"шт",minutes:"",bind:""};

export default function App(){
  const [binds,setBinds]=useState(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem("signcalc.parameters"));
      if(!Array.isArray(saved))return BINDS;
      const builtins=BINDS.map(b=>({...b,...saved.find(x=>x.key===b.key),key:b.key,field:b.field}));
      const custom=saved.filter((b,i)=>/^custom_[a-z0-9_]+$/.test(b.key)&&b.field===b.key&&saved.findIndex(x=>x.key===b.key)===i);
      return [...builtins,...custom];
    }catch{return BINDS;}
  });
  const [parameterName,setParameterName]=useState("");
  const [parameterUnit,setParameterUnit]=useState("");
  useEffect(()=>{try{localStorage.setItem("signcalc.parameters",JSON.stringify(binds));}catch{}},[binds]);
  const parameterUnits={area:"м²",perimeter:"м.п.",neonPerimeter:"м.п.",diodes:"шт",letters:"шт",elements:"шт"};
  const addParameter=()=>{if(!parameterName.trim())return;const key="custom_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);setBinds(rows=>[...rows,{key,field:key,label:parameterName.trim(),unit:parameterUnit.trim()}]);setParameterName("");setParameterUnit("");};
  const [tab,setTab]=useState(0);
  const [specEquipment,setSpecEquipment]=useState(()=>{
    try {const saved=JSON.parse(localStorage.getItem("signcalc.specEquipment"));
      return SPETSTEKHNIKA.map(st=>{const row=saved?.find(x=>x.key===st.key);return row?{...st,label:row.label||st.label,rate:Math.max(0,Number(row.rate)||0),minHours:Math.max(0.5,Number(row.minHours)||4)}:st;});
    } catch {return SPETSTEKHNIKA;}
  });
  useEffect(()=>{try{localStorage.setItem("signcalc.specEquipment",JSON.stringify(specEquipment));}catch{}},[specEquipment]);
  const updateSpec=(key,field,value)=>setSpecEquipment(rows=>rows.map(st=>st.key===key?{...st,[field]:field==="label"?value:Math.max(field==="minHours"?0.5:0,Number(value)||0)}:st));
  const [materials,setMaterials]=useState(defaultMaterials);
  const [norms,setNorms]=useState(defaultNorms);
  const [signTypes,setSignTypes]=useState(()=>{try{return applySignTypeOrder(defaultSignTypes,JSON.parse(localStorage.getItem("signcalc.signTypeOrder")));}catch{return defaultSignTypes;}});
  const draggedType=useRef(null);
  const [dropType,setDropType]=useState(null);
  useEffect(()=>{try{localStorage.setItem("signcalc.signTypeOrder",JSON.stringify(signTypes.map(st=>st.id)));}catch{}},[signTypes]);
  const moveType=(id,delta)=>setSignTypes(rows=>{const index=rows.findIndex(st=>st.id===id);return index<0||index+delta<0||index+delta>=rows.length?rows:reorderSignTypes(rows,id,rows[index+delta].id);});
  const [hourRate,setHourRate]=useState(850);
  const [savedOrders,setSavedOrders]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [employeeName,setEmployeeName]=useState("");
  const [employeeRole,setEmployeeRole]=useState("");
  const [reportFrom,setReportFrom]=useState(()=>todayLocal().slice(0,8)+"01");
  const [reportTo,setReportTo]=useState(todayLocal);
  const reportEntries=savedOrders.flatMap(o=>(o.positions||[]).flatMap(p=>(p.employeeWork||[]).map(e=>({...e,orderName:o.name,positionName:p.name||p.signTypeName})))).filter(e=>e.date>=reportFrom&&e.date<=reportTo);
  const [editingOrder,setEditingOrder]=useState(null);
  const [viewingOrder,setViewingOrder]=useState(null);
  const [matForm,setMatForm]=useState({category:CATS[0],name:"",unit:"м²",price:"",supplier:""});
  const [editMatId,setEditMatId]=useState(null);
  const [normForm,setNormForm]=useState(EMPTY_NORM);
  const [editNormId,setEditNormId]=useState(null);
  const [editStId,setEditStId]=useState(null);
  const [plotterOpsList,setPlotterOpsList]=useState(DEFAULT_PLOTTER_OPS);
  const [fresaPL,setFresaPL]=useState(DEFAULT_FRESA);
  const [fresaEditId,setFresaEditId]=useState(null);
  const [fresaForm,setFresaForm]=useState({group:"",material:"",rate:""});
  const [fresaFilter,setFresaFilter]=useState("");
  const [jaCfg,setJaCfg]=useState(DEFAULT_JA_CONFIG);

  // Фильтры и сортировка: материалы
  const [matCat,setMatCat]=useState("");
  const [matQ,setMatQ]=useState("");
  const [matSort,setMatSort]=useState({key:"",dir:"asc"});
  const matCats=[...new Set(materials.map(m=>m.category))];
  const matCounts=materials.reduce((a,m)=>{a[m.category]=(a[m.category]||0)+1;return a;},{__all:materials.length});
  const matRows=sortRows(
    materials.filter(m=>(!matCat||m.category===matCat)&&(!matQ||(m.name+" "+m.supplier).toLowerCase().includes(matQ.toLowerCase()))),
    matSort.key,matSort.dir,
    (m,k)=>k==="price"?Number(m.price):(m[k]||"")
  );

  // Фильтры и сортировка: нормативы
  const [normCat,setNormCat]=useState("");
  const [normQ,setNormQ]=useState("");
  const [normZeroOnly,setNormZeroOnly]=useState(false);
  const [normSort,setNormSort]=useState({key:"",dir:"asc"});
  const normCats=[...new Set(norms.map(n=>n.category))];
  const normCounts=norms.reduce((a,n)=>{a[n.category]=(a[n.category]||0)+1;return a;},{__all:norms.length});
  const normRows=sortRows(
    norms.filter(n=>(!normCat||n.category===normCat)&&(!normZeroOnly||Number(n.minutes)===0)&&(!normQ||n.operation.toLowerCase().includes(normQ.toLowerCase()))),
    normSort.key,normSort.dir,
    (n,k)=>(k==="minutes"||k==="cost")?Number(n.minutes):(k==="bind"?bindLabel(n.bind,binds):(n[k]||""))
  );

  const saveMat=()=>{if(!matForm.name||matForm.price==="")return;if(editMatId){setMaterials(p=>p.map(m=>m.id===editMatId?{...m,...matForm,price:Number(matForm.price)}:m));setEditMatId(null);}else setMaterials(p=>[...p,{...matForm,id:uid(),price:Number(matForm.price)}]);setMatForm({category:CATS[0],name:"",unit:"м²",price:"",supplier:""});};
  const saveNorm=()=>{
    if(!normForm.operation||normForm.minutes==="")return;
    const data={...normForm,minutes:Number(normForm.minutes)};
    if(editNormId){setNorms(p=>p.map(n=>n.id===editNormId?{...n,...data}:n));setEditNormId(null);}
    else setNorms(p=>[...p,{...data,id:Date.now()+Math.floor(Math.random()*1000)}]);
    setNormForm(EMPTY_NORM);
  };
  const saveFresa=()=>{if(!fresaForm.material||!fresaForm.rate)return;if(fresaEditId){setFresaPL(p=>p.map(r=>r.id===fresaEditId?{...r,...fresaForm,rate:Number(fresaForm.rate)}:r));setFresaEditId(null);}else setFresaPL(p=>[...p,{id:uid(),...fresaForm,rate:Number(fresaForm.rate)}]);setFresaForm({group:"",material:"",rate:""});};
  const cancelFresa=()=>{setFresaEditId(null);setFresaForm({group:"",material:"",rate:""});};

  const fresaGroups=[...new Set(fresaPL.map(r=>r.group))];
  const fresaFiltered=fresaFilter?fresaPL.filter(r=>r.material.toLowerCase().includes(fresaFilter.toLowerCase())||r.group.toLowerCase().includes(fresaFilter.toLowerCase())):fresaPL;
  const fresaRows=fresaFilter?fresaFiltered:(()=>{const out=[];fresaGroups.forEach(g=>{const rows=fresaPL.filter(r=>r.group===g);rows.forEach((r,i)=>out.push({...r,_first:i===0,_span:rows.length}));});return out;})();

  const editingST=editStId==="new"?null:signTypes.find(s=>s.id===editStId);
  const zeroNorms=norms.filter(n=>Number(n.minutes)===0).length;

  return(
    <BindContext.Provider value={binds}>
      <style>{css+`.parameter-settings input{height:28px!important;font-size:12px!important;padding:0 8px!important}.parameter-settings label{font-size:9px!important;letter-spacing:.3px!important}.parameter-settings summary:hover{color:${T.text}!important}`}</style>
      <div style={{minHeight:"100vh",background:T.bg0,paddingBottom:40}}>
        <div style={{background:T.bg1,borderBottom:`1px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>◈</div>
              <span style={{fontSize:15,fontWeight:700,letterSpacing:-.3}}>SignCalc <small style={{fontSize:10,color:T.textSub}}>v1.18</small></span>
            </div>
            <div style={{display:"flex"}}>
              {TABS.map(t=>(
                <button key={t.id} className="tab-b" onClick={()=>{setTab(t.id);setEditingOrder(null);setViewingOrder(null);setEditStId(null);}} style={{padding:"0 13px",height:54,border:"none",background:"none",fontSize:12,cursor:"pointer",color:tab===t.id?T.text:T.textMuted,fontWeight:tab===t.id?600:400,borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",display:"flex",alignItems:"center",gap:5}}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{maxWidth:980,margin:"0 auto",padding:"22px 20px"}}>

          {/* ЗАКАЗЫ */}
          {tab===0&&!editingOrder&&!viewingOrder&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontSize:18,fontWeight:700}}>Заказы</div><div style={{fontSize:12,color:T.textMuted,marginTop:2}}>{savedOrders.length} заказов</div></div>
                <Btn onClick={()=>setEditingOrder({})}>+ Новый заказ</Btn>
              </div>
              {savedOrders.length===0?(
                <div style={{background:T.bg1,border:`1px dashed ${T.border}`,borderRadius:14,padding:"48px 24px",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:12}}>📋</div>
                  <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Заказов пока нет</div>
                  <div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>Создайте первый заказ с несколькими позициями</div>
                  <Btn onClick={()=>setEditingOrder({})}>+ Создать заказ</Btn>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {savedOrders.map(o=>(
                    <div key={o.id} className="hov" style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setViewingOrder(o)}>
                      <div style={{width:40,height:40,borderRadius:10,background:T.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📋</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{o.name}</div>
                        <div style={{fontSize:12,color:T.textMuted,display:"flex",gap:12,flexWrap:"wrap"}}>
                          {o.client&&<span>👤 {o.client}</span>}
                          <span>📅 {o.savedAt}</span>
                          <span>📦 {o.positions?.length||0} позиций</span>
                          {o.laborMin>0&&<span>⏱ сборка {fmtDur(o.laborMin)}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:700,color:T.green}}>{fmt(o.grandTotal)} ₽</div>
                        <div style={{fontSize:11,color:T.textMuted}}>{o.pricingMode==="profitability"?"рентабельность":"наценка"} {o.markup}%</div>
                      </div>
                      <Btn variant="sec" onClick={e=>{e.stopPropagation();setSavedOrders(p=>p.filter(x=>x.id!==o.id));}} style={{height:30,padding:"0 10px",fontSize:11,color:T.red}}>Удалить</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab===0&&viewingOrder&&(()=>{
            const order=viewingOrder;
            const factor=order.pricingMode==="profitability"?profitabilityFactor(order.markup):1+(Number(order.markup)||0)/100;
            const jobs=order.mount?.specJobs||{};
            const specRows=Object.entries(jobs).map(([key,items])=>({key,hours:(items||[]).reduce((sum,j)=>sum+(Number(j.hours)||0),0),rate:Number(order.mount?.specRates?.[key])||0})).filter(row=>row.hours>0);
            return <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div><div style={{fontSize:18,fontWeight:700}}>{order.name}</div>{order.client&&<div style={{fontSize:12,color:T.textSub,marginTop:4}}>{order.client}</div>}</div>
                <div style={{display:"flex",gap:8}}><Btn variant="sec" onClick={()=>setViewingOrder(null)}>← К заказам</Btn><Btn onClick={()=>{setEditingOrder(order);setViewingOrder(null);}}>Редактировать</Btn></div>
              </div>
              <Card><CH title="Позиции заказа"/><div style={{padding:"12px 18px",overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr>{["Позиция","Количество","Цена за единицу","Стоимость"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>{(order.positions||[]).map((pos,i)=>{const saved=order.positionPrices?.[i];const calculated=saved||calcPos(pos,materials,norms,hourRate,fresaPL,plotterOpsList,jaCfg);return <tr key={pos.id} style={{borderTop:`1px solid ${T.border}`}}><td style={tdS}>{pos.name||pos.signTypeName}</td><td style={tdS}>{pos.qty} шт</td><td style={tdS}>{fmt(calculated.unitCost*factor)} ₽</td><td style={{...tdS,fontWeight:600}}>{fmt(calculated.total*factor)} ₽</td></tr>;})}</tbody>
              </table><div style={{fontSize:11,color:T.textSub,marginTop:10}}>Цены рассчитаны с учётом {order.pricingMode==="profitability"?"рентабельности":"наценки"} {order.markup}%.</div></div></Card>
              <Card><CH title="Монтаж и спецтехника"/><div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:8,fontSize:13}}>
                {(order.positions||[]).map((pos,i)=><div key={pos.id} style={{display:"flex",justifyContent:"space-between",gap:10}}><span>Монтаж: {pos.name||pos.signTypeName} · {pos.qty} шт × {fmt((Number(pos.mountCost)||0)*factor)} ₽/шт</span><b>{fmt(positionInstallationCost(pos)*factor)} ₽</b></div>)}
                {Number(order.mount?.cost)>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span>Ранее указанная общая стоимость монтажа</span><b>{fmt(Number(order.mount.cost)*factor)} ₽</b></div>}
                <div style={{display:"flex",justifyContent:"space-between"}}><span>Доставка</span><b>{fmt((Number(order.mount?.deliveryH)||0)*1750*factor)} ₽</b></div>
                {specRows.length===0?<div style={{color:T.textMuted}}>Спецтехника не добавлена</div>:specRows.map(row=><div key={row.key} style={{display:"flex",justifyContent:"space-between",gap:10}}><span>{order.equipmentLabels?.[row.key]||specEquipment.find(st=>st.key===row.key)?.label||row.key} · {row.hours} ч</span><b>{fmt(row.hours*row.rate*factor)} ₽</b></div>)}
                <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${T.border}`,paddingTop:10}}><span>Итого монтаж, доставка и спецтехника</span><b>{fmt(order.mountTotal*factor)} ₽</b></div>
              </div></Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}><b>Общая стоимость</b><b style={{fontSize:22,color:T.green}}>{fmt(order.grandTotal)} ₽</b></div>
            </div>;
          })()}
          {tab===0&&editingOrder&&(
            <OrderEditor employees={employees} specEquipment={specEquipment} order={editingOrder?.id?editingOrder:null} signTypes={signTypes} materials={materials} norms={norms} hourRate={hourRate} fresaPL={fresaPL} plotterOpsList={plotterOpsList} jaCfg={jaCfg}
              onSave={o=>{setSavedOrders(p=>{const i=p.findIndex(x=>x.id===o.id);return i>=0?p.map(x=>x.id===o.id?o:x):[o,...p];});setEditingOrder(null);}}
              onCancel={()=>setEditingOrder(null)}/>
          )}

          {/* ТИПЫ ВЫВЕСОК */}
          {tab===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {!editStId&&<div style={{padding:12,background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.textSub}}>Состав шаблонов проверен · v1.2. Расход борта, крепёж, мощность питания и толщина основы уточняются по конструкции. Баннерная печать и люверсы добавляются отдельно по смете.</div>}
              {!editStId&&<div style={{fontSize:12,color:T.textSub}}>Перетаскивайте карточки за ⠿ или меняйте порядок кнопками ← →. Порядок сохраняется в этом браузере и используется при добавлении позиции.</div>}
              {!editStId?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
                  {signTypes.map((st,index)=>{const c=CM[st.color]||CM.accent;return(
                    <div key={st.id} className="hov" onDragOver={e=>{if(draggedType.current!==null){e.preventDefault();e.dataTransfer.dropEffect="move";setDropType(st.id);}}} onDrop={e=>{e.preventDefault();if(draggedType.current!==null)setSignTypes(rows=>reorderSignTypes(rows,draggedType.current,st.id));draggedType.current=null;setDropType(null);}} style={{background:T.bg1,border:`1px solid ${dropType===st.id?T.accent:T.border}`,boxShadow:dropType===st.id?`0 0 0 2px ${T.accentDim}`:"none",borderRadius:14,padding:"16px 18px",position:"relative"}}>
                      <div style={{position:"absolute",right:12,top:12,display:"flex",gap:4}}>
                        <button aria-label={`Перетащить: ${st.name}`} title="Перетащите карточку на новое место" draggable onDragStart={e=>{draggedType.current=st.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(st.id));}} onDragEnd={()=>{draggedType.current=null;setDropType(null);}} style={{height:26,width:26,padding:0,border:`1px solid ${T.border}`,borderRadius:5,background:T.bg2,color:T.textSub,cursor:"grab",fontSize:17}}>⠿</button>
                        <button aria-label={`Переместить раньше: ${st.name}`} title="Переместить раньше" disabled={index===0} onClick={()=>moveType(st.id,-1)} style={{height:26,width:26,padding:0,border:`1px solid ${T.border}`,borderRadius:5,background:T.bg2,color:T.textSub,opacity:index===0?.3:1}}>←</button>
                        <button aria-label={`Переместить позже: ${st.name}`} title="Переместить позже" disabled={index===signTypes.length-1} onClick={()=>moveType(st.id,1)} style={{height:26,width:26,padding:0,border:`1px solid ${T.border}`,borderRadius:5,background:T.bg2,color:T.textSub,opacity:index===signTypes.length-1?.3:1}}>→</button>
                      </div>
                      <div style={{width:32,height:32,borderRadius:8,background:c.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:c.dot,marginBottom:10}}>◈</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:5}}>{st.name}</div>
                      <div style={{fontSize:11,color:T.textMuted,marginBottom:8,minHeight:28}}>{st.description}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        {st.materials.length>0&&<Tag col="accent">{st.materials.length} матер.</Tag>}
                        {(st.norms||[]).length>0&&<Tag col="green">{st.norms.length} опер.</Tag>}
                        {(st.plotterOps||[]).length>0&&<Tag col="accent">⬡ плоттер</Tag>}
                        {(st.fresas||[]).length>0&&<Tag col="amber">⚙ фреза</Tag>}
                        {st.useJA&&<Tag col="amber">◉ жидкий акрил</Tag>}
                      </div>
                      <div style={{fontSize:11,color:T.textSub,marginBottom:12,lineHeight:1.6}}>
                        {st.materials.map((r,i)=><div key={i}>• {materials.find(m=>m.id===Number(r.matId))?.name||"Материал удалён"}{r.note?` — ${r.note}`:""}</div>)}
                        {st.useJA&&<div>• Акрил, борт и задник — в модуле ЖА</div>}
                      </div>
                      <div style={{display:"flex",gap:6,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                        <Btn onClick={()=>setEditStId(st.id)} style={{height:28,fontSize:11,flex:1,padding:"0 10px"}}>Редактировать</Btn>
                        <button className="del" onClick={()=>setSignTypes(p=>p.filter(s=>s.id!==st.id))} style={{height:28,width:28,borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                      </div>
                    </div>
                  );})}
                  <button onClick={()=>setEditStId("new")} style={{background:"none",border:`1px dashed ${T.border}`,borderRadius:14,padding:"16px",color:T.textMuted,fontSize:13,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,minHeight:140}}>
                    <span style={{fontSize:26}}>+</span>Новый тип
                  </button>
                </div>
              ):(
                <SignTypeEditor key={editStId} st={editingST} materials={materials} norms={norms} fresaPL={fresaPL} plotterOpsList={plotterOpsList}
                  onSave={data=>{if(editStId==="new")setSignTypes(p=>[...p,{...data,id:uid()}]);else setSignTypes(p=>p.map(s=>s.id===editStId?{...s,...data}:s));setEditStId(null);}}
                  onCancel={()=>setEditStId(null)}/>
              )}
              <details className="parameter-settings" style={{maxWidth:580}}>
                <summary style={{cursor:"pointer",fontSize:12,fontWeight:600,color:T.textSub,padding:"8px 12px",border:`1px solid ${T.border}`,borderRadius:7,background:T.bg1,width:"fit-content"}}>Параметры позиций</summary>
                <div style={{padding:"10px 12px",marginTop:6,background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:11,color:T.textSub}}>Названия используются в привязках материалов, операций, формулах и параметрах заказа. Изменение названия сохраняет существующие связи. Настройки сохраняются в этом браузере.</div>
                  {binds.map(b=><div key={b.key||"manual"} style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:8}}>
                    <Inp label={b.key?"Название параметра":"Без привязки"} value={b.label} onChange={v=>setBinds(rows=>rows.map(x=>x.key===b.key?{...x,label:v}:x))}/>
                    {b.key?<Inp label="Единица" value={b.unit??parameterUnits[b.key]??""} onChange={v=>setBinds(rows=>rows.map(x=>x.key===b.key?{...x,unit:v}:x))}/>:<span style={{fontSize:11,color:T.textMuted,alignSelf:"center"}}>Количество вручную</span>}
                  </div>)}
                  <div style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",borderTop:`1px solid ${T.border}`,paddingTop:8}}>
                    <div style={{flex:"1 1 200px"}}><Inp label="Новый параметр" value={parameterName} onChange={setParameterName} placeholder="Например: длина трубы"/></div>
                    <div style={{width:90}}><Inp label="Единица" value={parameterUnit} onChange={setParameterUnit} placeholder="м"/></div>
                    <Btn onClick={addParameter} style={{height:28,fontSize:11,padding:"0 10px"}}>+ Добавить</Btn>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* МАТЕРИАЛЫ */}
          {tab===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Card>
                <CH title={editMatId?"Редактировать":"Добавить материал"}/>
                <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
                  <Sel label="Категория" value={matForm.category} onChange={v=>setMatForm(p=>({...p,category:v}))} options={CATS}/>
                  <Inp label="Название" value={matForm.name} onChange={v=>setMatForm(p=>({...p,name:v}))} span={2}/>
                  <Inp label="Цена ₽" value={matForm.price} onChange={v=>setMatForm(p=>({...p,price:v}))} type="number" min="0"/>
                  <Inp label="Единица" value={matForm.unit} onChange={v=>setMatForm(p=>({...p,unit:v}))}/>
                  <Inp label="Поставщик" value={matForm.supplier} onChange={v=>setMatForm(p=>({...p,supplier:v}))} span={2}/>
                  <div style={{display:"flex",gap:8,alignItems:"end"}}>
                    <Btn onClick={saveMat} style={{flex:1}}>{editMatId?"Сохранить":"Добавить"}</Btn>
                    {editMatId&&<Btn variant="sec" onClick={()=>{setEditMatId(null);setMatForm({category:CATS[0],name:"",unit:"м²",price:"",supplier:""});}}>✕</Btn>}
                  </div>
                </div>
              </Card>
              <Card>
                <CH title={`База материалов (${materials.length})`} action={
                  <div style={{display:"flex",gap:8}}>
                    <ImpBtn label="Импорт CSV" onImport={text=>{const rows=parseCSV(text);const imp=rows.map(r=>({id:uid(),category:normalizeMaterialCategory(r[0]),name:r[1]?.trim()||"",unit:r[2]?.trim()||"шт",price:Number(r[3]?.replace(",","."))||0,supplier:r[4]?.trim()||""})).filter(r=>r.name);if(imp.length)setMaterials(p=>[...p,...imp]);}}/>
                    <button className="sec" onClick={()=>{const rows=[["Категория","Название","Единица","Цена","Поставщик"],...materials.map(m=>[m.category,m.name,m.unit,m.price,m.supplier])];dlCSV(rows.map(r=>r.join(";")).join("\n"),"materials.csv");}} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>⬇ Экспорт</button>
                    <button className="sec" onClick={()=>dlCSV(MAT_EX,"materials_template.csv")} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>📄 Шаблон</button>
                  </div>
                }/>
                <div style={{padding:"12px 18px 12px",overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th colSpan={6} style={{padding:"4px 0 12px",fontWeight:400,textAlign:"left"}}>
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <CatChips cats={matCats} value={matCat} onChange={setMatCat} counts={matCounts}/>
                            <div style={{display:"flex",gap:10,alignItems:"center"}}>
                              <input value={matQ} onChange={e=>setMatQ(e.target.value)} placeholder="Поиск по названию или поставщику..." style={{...IS,height:32,fontSize:12,maxWidth:340}}/>
                              <span style={{fontSize:12,color:T.textMuted,textTransform:"none",letterSpacing:0}}>Показано {matRows.length} из {materials.length}</span>
                              {(matCat||matQ||matSort.key)&&<button onClick={()=>{setMatCat("");setMatQ("");setMatSort({key:"",dir:"asc"});}} style={{height:26,padding:"0 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:11}}>Сбросить</button>}
                            </div>
                          </div>
                        </th>
                      </tr>
                      <tr style={{borderBottom:`1px solid ${T.border}`}}>
                        <SortTh label="Категория" k="category" sort={matSort} setSort={setMatSort}/>
                        <SortTh label="Наименование" k="name" sort={matSort} setSort={setMatSort}/>
                        <SortTh label="Цена" k="price" sort={matSort} setSort={setMatSort}/>
                        <SortTh label="Ед." k="unit" sort={matSort} setSort={setMatSort}/>
                        <SortTh label="Поставщик" k="supplier" sort={matSort} setSort={setMatSort}/>
                        <th style={thS}></th>
                      </tr>
                    </thead>
                    <tbody>{matRows.length===0&&(<tr><td colSpan={6} style={{...tdS,color:T.textMuted,textAlign:"center"}}>Ничего не найдено</td></tr>)}{matRows.map(m=>(
                      <tr key={m.id} className="hov" style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={tdS}><Tag col={CC[m.category]||"accent"}>{m.category}</Tag></td>
                        <td style={tdS}>{m.name}</td>
                        <td style={{...tdS,fontWeight:600,color:T.accent}}>{m.price.toLocaleString("ru-RU")} ₽</td>
                        <td style={{...tdS,color:T.textMuted}}>{m.unit}</td>
                        <td style={{...tdS,color:T.textMuted}}>{m.supplier}</td>
                        <td style={{...tdS,whiteSpace:"nowrap"}}>
                          <Btn variant="sec" onClick={()=>{setMatForm({category:m.category,name:m.name,unit:m.unit,price:m.price,supplier:m.supplier});setEditMatId(m.id);}} style={{height:26,padding:"0 8px",fontSize:11,marginRight:4}}>Ред.</Btn>
                          <button className="del" onClick={()=>setMaterials(p=>p.filter(x=>x.id!==m.id))} style={{height:26,width:26,borderRadius:5,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:13}}>×</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* НОРМАТИВЫ */}
          {tab===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Card><CH title="Ставка часа (ручной труд)"/><div style={{padding:"14px 18px",maxWidth:240}}><Inp value={hourRate} onChange={setHourRate} type="number" min="0" suffix="₽/ч"/></div></Card>
              {zeroNorms>0&&(
                <div style={{padding:"10px 14px",borderRadius:10,background:T.amberDim,border:`1px solid ${T.amber}`,fontSize:12,color:T.amber}}>
                  У {zeroNorms} операций норма времени не задана (0 мин.), поэтому они пока не влияют на стоимость. Нажмите «Ред.» в строке и укажите норму в минутах.
                </div>
              )}
              <Card>
                <CH title={editNormId?"Редактировать операцию":"Добавить операцию"}/>
                <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
                  <Inp label="Категория" value={normForm.category} onChange={v=>setNormForm(p=>({...p,category:v}))}/>
                  <Inp label="Операция" value={normForm.operation} onChange={v=>setNormForm(p=>({...p,operation:v}))} span={2}/>
                  <Inp label="Норма на ед., мин" value={normForm.minutes} onChange={v=>setNormForm(p=>({...p,minutes:v}))} type="number" min="0" step="1" suffix="мин"/>
                  <Inp label="Единица" value={normForm.unit} onChange={v=>setNormForm(p=>({...p,unit:v}))}/>
                  <Sel label="Привязка количества" value={normForm.bind} onChange={v=>setNormForm(p=>({...p,bind:v}))} options={binds.map(b=>({value:b.key,label:b.key?`⊡ ${b.label}`:"Вручную"}))} span={2}/>
                  <div style={{display:"flex",gap:8,alignItems:"end"}}>
                    <Btn onClick={saveNorm} style={{flex:1}}>{editNormId?"Сохранить":"Добавить"}</Btn>
                    {editNormId&&<Btn variant="sec" onClick={()=>{setEditNormId(null);setNormForm(EMPTY_NORM);}}>✕</Btn>}
                  </div>
                </div>
              </Card>
              <Card>
                <CH title={`Операции (${norms.length})`}/>
                <div style={{padding:"12px 18px 12px",overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th colSpan={7} style={{padding:"4px 0 12px",fontWeight:400,textAlign:"left"}}>
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                              <CatChips cats={normCats} value={normCat} onChange={setNormCat} counts={normCounts}/>
                              <button onClick={()=>setNormZeroOnly(p=>!p)} style={{height:26,padding:"0 10px",borderRadius:20,border:`1px solid ${normZeroOnly?T.amber:T.border}`,background:normZeroOnly?T.amberDim:"none",color:normZeroOnly?T.amber:T.textSub,fontSize:11,fontWeight:normZeroOnly?600:400}}>Без нормы · {zeroNorms}</button>
                            </div>
                            <div style={{display:"flex",gap:10,alignItems:"center"}}>
                              <input value={normQ} onChange={e=>setNormQ(e.target.value)} placeholder="Поиск по названию операции..." style={{...IS,height:32,fontSize:12,maxWidth:340}}/>
                              <span style={{fontSize:12,color:T.textMuted,textTransform:"none",letterSpacing:0}}>Показано {normRows.length} из {norms.length}</span>
                              {(normCat||normQ||normZeroOnly||normSort.key)&&<button onClick={()=>{setNormCat("");setNormQ("");setNormZeroOnly(false);setNormSort({key:"",dir:"asc"});}} style={{height:26,padding:"0 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:11}}>Сбросить</button>}
                            </div>
                          </div>
                        </th>
                      </tr>
                      <tr style={{borderBottom:`1px solid ${T.border}`}}>
                        <SortTh label="Категория" k="category" sort={normSort} setSort={setNormSort}/>
                        <SortTh label="Операция" k="operation" sort={normSort} setSort={setNormSort}/>
                        <SortTh label="Норма" k="minutes" sort={normSort} setSort={setNormSort}/>
                        <SortTh label="Единица" k="unit" sort={normSort} setSort={setNormSort}/>
                        <SortTh label="Привязка" k="bind" sort={normSort} setSort={setNormSort}/>
                        <SortTh label="Стоимость/ед." k="cost" sort={normSort} setSort={setNormSort}/>
                        <th style={thS}></th>
                      </tr>
                    </thead>
                    <tbody>{normRows.length===0&&(<tr><td colSpan={7} style={{...tdS,color:T.textMuted,textAlign:"center"}}>Ничего не найдено</td></tr>)}{normRows.map(n=>(
                      <tr key={n.id} className="hov" style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={tdS}><Tag col={CC[n.category]||"accent"}>{n.category}</Tag></td>
                        <td style={tdS}>{n.operation}</td>
                        <td style={{...tdS,fontWeight:600}}>{Number(n.minutes)>0?<span>{n.minutes} мин{Number(n.minutes)>=60&&<span style={{color:T.textMuted,fontWeight:400,fontSize:11}}> · {fmtDur(n.minutes)}</span>}</span>:<span style={{color:T.amber,fontWeight:500,fontSize:12}}>не задана</span>}</td>
                        <td style={{...tdS,color:T.textMuted}}>{n.unit}</td>
                        <td style={tdS}>{n.bind?<Tag col="accent">⊡ {bindLabel(n.bind,binds)}</Tag>:<span style={{color:T.textMuted}}>—</span>}</td>
                        <td style={{...tdS,color:T.accent,fontWeight:600}}>{Math.round((Number(n.minutes)||0)/60*Number(hourRate)).toLocaleString("ru-RU")} ₽/{n.unit}</td>
                        <td style={{...tdS,whiteSpace:"nowrap"}}>
                          <Btn variant="sec" onClick={()=>{setNormForm({category:n.category,operation:n.operation,unit:n.unit,minutes:n.minutes,bind:n.bind||""});setEditNormId(n.id);window.scrollTo&&window.scrollTo(0,0);}} style={{height:26,padding:"0 8px",fontSize:11,marginRight:4}}>Ред.</Btn>
                          <button className="del" onClick={()=>setNorms(p=>p.filter(x=>x.id!==n.id))} style={{height:26,width:26,borderRadius:5,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:13}}>×</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* СТАНКИ */}
          {tab===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Card>
                <CH title="Спецтехника — Тарифы и минимальный заказ"/>
                <div style={{padding:"14px 18px"}}>
                  <div style={{fontSize:12,color:T.textSub,marginBottom:14}}>Минимальные часы автоматически подставляются при добавлении выезда. Настройки сохраняются в этом браузере.</div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {specEquipment.map(st=><div key={st.key} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                      <Inp label={`${st.icon} Название`} value={st.label} onChange={v=>updateSpec(st.key,"label",v)}/>
                      <Inp label="Стоимость часа, ₽" type="number" min="0" step="100" value={st.rate} onChange={v=>updateSpec(st.key,"rate",v)}/>
                      <Inp label="Минимальный заказ, ч" type="number" min="0.5" step="0.5" value={st.minHours} onChange={v=>updateSpec(st.key,"minHours",v)}/>
                    </div>)}
                  </div>
                </div>
              </Card>
              <Card>
                <CH title="⬡ Плоттер — Операции и тарифы"/>
                <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{fontSize:12,color:T.textMuted,padding:"10px 14px",background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`}}>
                    Операции плоттера используются в типах вывесок и позициях заказа для расчёта себестоимости.
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Операция","Единица","Тариф, ₽/ед.",""].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                    <tbody>{plotterOpsList.map(op=>(
                      <tr key={op.id} className="hov" style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={tdS}>{op.name}</td>
                        <td style={{...tdS,color:T.textMuted}}>{op.unit}</td>
                        <td style={tdS}>
                          <input type="number" min="0" value={op.rate} onChange={e=>setPlotterOpsList(p=>p.map(x=>x.id===op.id?{...x,rate:Number(e.target.value)}:x))} style={{...IS,width:100,height:30,fontSize:13,textAlign:"right",color:T.accent,fontWeight:700,background:T.bg0}}/>
                          <span style={{fontSize:12,color:T.textMuted,marginLeft:6}}>₽</span>
                        </td>
                        <td style={{...tdS,whiteSpace:"nowrap"}}>
                          <button className="del" onClick={()=>setPlotterOpsList(p=>p.filter(x=>x.id!==op.id))} style={{height:26,width:26,borderRadius:5,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:13}}>×</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                  <PlotterAddForm onAdd={row=>setPlotterOpsList(p=>[...p,{id:uid(),...row}])}/>
                </div>
              </Card>

              <Card>
                <CH title="⚙ Фреза ЧПУ — Прайс-лист" action={
                  <div style={{display:"flex",gap:8}}>
                    <ImpBtn label="Импорт CSV" onImport={text=>{const rows=parseCSV(text);const imp=rows.map(r=>({id:uid(),group:r[0]?.trim()||"Прочее",material:r[1]?.trim()||"",rate:Number(r[2]?.replace(",","."))||0})).filter(r=>r.material&&r.rate);if(imp.length)setFresaPL(p=>[...p,...imp]);}}/>
                    <button className="sec" onClick={()=>{const rows=[["Группа","Материал","Тариф руб/пог.м"],...fresaPL.map(r=>[r.group,r.material,r.rate])];dlCSV(rows.map(r=>r.join(";")).join("\n"),"fresa_pricelist.csv");}} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>⬇ Экспорт</button>
                    <button className="sec" onClick={()=>dlCSV(FR_EX,"fresa_template.csv")} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12}}>📄 Шаблон</button>
                  </div>
                }/>
                <div style={{padding:"14px 18px"}}>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:14,padding:"10px 14px",background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`}}>
                    Тарифы <span style={{color:T.accent}}>poly-box.ru</span> · без НДС · мин. заказ 50 000 ₽. Используются в типах вывесок и позициях заказов.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 110px 38px",gap:10,marginBottom:14,padding:"12px 14px",background:T.bg2,borderRadius:10,border:`1px solid ${T.border}`}}>
                    <Inp label="Группа" value={fresaForm.group} onChange={v=>setFresaForm(p=>({...p,group:v}))} placeholder="Акрил"/>
                    <Inp label="Материал" value={fresaForm.material} onChange={v=>setFresaForm(p=>({...p,material:v}))} placeholder="Акрил 3–4 мм"/>
                    <Inp label="₽/пог.м" value={fresaForm.rate} onChange={v=>setFresaForm(p=>({...p,rate:v}))} type="number" min="0" step="0.01"/>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:11,color:"transparent"}}>.</label>
                      <button className="pri" onClick={saveFresa} style={{height:38,borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:18,fontWeight:700}}>{fresaEditId?"✓":"+"}</button>
                    </div>
                    {fresaEditId&&<button className="sec" onClick={cancelFresa} style={{gridColumn:"span 4",height:30,borderRadius:8,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:12}}>Отмена</button>}
                  </div>
                  <div style={{position:"relative",marginBottom:12}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted,fontSize:14,pointerEvents:"none"}}>🔍</span>
                    <input value={fresaFilter} onChange={e=>setFresaFilter(e.target.value)} placeholder="Поиск..." style={{...IS,paddingLeft:36}}/>
                    {fresaFilter&&<button onClick={()=>setFresaFilter("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",color:T.textMuted,fontSize:18,cursor:"pointer"}}>×</button>}
                  </div>
                  <div style={{borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden",maxHeight:460,overflowY:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead style={{position:"sticky",top:0,zIndex:2}}>
                        <tr style={{background:T.bg3}}>
                          <th style={{...thS,width:120}}>Группа</th>
                          <th style={thS}>Материал</th>
                          <th style={{...thS,width:150,textAlign:"right"}}>Тариф, ₽/пог.м</th>
                          <th style={{...thS,width:70}}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fresaRows.map(r=>{
                          const editing=fresaEditId===r.id;
                          return(
                            <tr key={r.id} className="hov" style={{borderBottom:`1px solid ${T.border}`,background:editing?T.accentDim:undefined}}>
                              {!fresaFilter&&r._first&&<td rowSpan={r._span} style={{...tdS,verticalAlign:"middle",borderRight:`1px solid ${T.border}`,background:T.bg2}}><Tag col="accent">{r.group}</Tag></td>}
                              {fresaFilter&&<td style={{...tdS,borderRight:`1px solid ${T.border}`,background:T.bg2}}><Tag col="accent">{r.group}</Tag></td>}
                              <td style={tdS}>{editing?<input autoFocus value={fresaForm.material} onChange={e=>setFresaForm(p=>({...p,material:e.target.value}))} style={{...IS,height:30,fontSize:12}}/>:r.material}</td>
                              <td style={{...tdS,textAlign:"right"}}>
                                {editing?(
                                  <div style={{display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center"}}>
                                    <input type="number" step="0.01" value={fresaForm.rate} onChange={e=>setFresaForm(p=>({...p,rate:e.target.value}))} style={{...IS,height:30,width:88,textAlign:"right",fontWeight:700,color:T.amber}}/>
                                    <button onClick={saveFresa} style={{height:30,padding:"0 8px",borderRadius:6,border:"none",background:T.green,color:"#fff",fontWeight:700,fontSize:13,flexShrink:0}}>✓</button>
                                    <button onClick={cancelFresa} style={{height:30,padding:"0 6px",borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:13}}>✕</button>
                                  </div>
                                ):<b style={{color:T.amber}}>{Number(r.rate).toFixed(2)} ₽</b>}
                              </td>
                              <td style={{...tdS,textAlign:"center"}}>
                                {!editing&&(
                                  <>
                                    <button className="sec" onClick={()=>{setFresaEditId(r.id);setFresaForm({group:r.group,material:r.material,rate:r.rate});}} style={{height:24,padding:"0 7px",borderRadius:5,border:`1px solid ${T.border}`,background:"none",color:T.textSub,fontSize:12,marginRight:4}}>✎</button>
                                    <button className="del" onClick={()=>setFresaPL(p=>p.filter(x=>x.id!==r.id))} style={{height:24,width:24,borderRadius:5,border:`1px solid ${T.border}`,background:"none",color:T.textMuted,fontSize:13,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>×</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,fontSize:12,color:T.textMuted}}>
                    <span>Позиций: <b style={{color:T.text}}>{fresaPL.length}</b>{fresaFilter&&<span> · найдено: <b style={{color:T.accent}}>{fresaFiltered.length}</b></span>}</span>
                    <button className="sec" onClick={()=>{if(window.confirm("Сбросить к значениям по умолчанию?"))setFresaPL(DEFAULT_FRESA);}} style={{height:24,padding:"0 10px",fontSize:11,borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textMuted}}>↺ Сбросить</button>
                  </div>
                </div>
              </Card>

              <LiquidAcrylicModule cfg={jaCfg} setCfg={setJaCfg}/>
            </div>
          )}

          {tab===6&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{padding:12,border:`1px solid ${T.amber}`,borderRadius:8,color:T.amber,fontSize:12}}>Проверочная версия: работники, заказы и начисления хранятся только до перезагрузки страницы.</div>
            <Card><CH title="Работники"/><div style={{padding:16,display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}><div style={{flex:"1 1 220px"}}><Inp label="ФИО" value={employeeName} onChange={setEmployeeName}/></div><div style={{flex:"1 1 180px"}}><Inp label="Должность" value={employeeRole} onChange={setEmployeeRole}/></div><Btn onClick={()=>{if(employeeName.trim()){setEmployees(p=>[...p,{id:uid(),name:employeeName.trim(),role:employeeRole.trim()}]);setEmployeeName("");setEmployeeRole("");}}}>+ Добавить</Btn></div>
              <div style={{padding:"0 16px 16px"}}>{employees.map(e=><div key={e.id} style={{padding:"8px 0",borderTop:`1px solid ${T.border}`,fontSize:13}}><b>{e.name}</b> <span style={{color:T.textSub}}>· {e.role||"Должность не указана"}</span></div>)}{!employees.length&&<span style={{fontSize:12,color:T.textMuted}}>Работников пока нет</span>}</div>
            </Card>
            <Card><CH title="Начисления за период"/><div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Inp label="С" type="date" value={reportFrom} onChange={setReportFrom}/><Inp label="По" type="date" value={reportTo} onChange={setReportTo}/></div>
              <div style={{fontSize:11,color:T.textSub}}>Можно выбрать день, неделю, месяц или любой другой период. Отображаются записи из сохранённых заказов.</div>
              {employees.map(e=>{const rows=reportEntries.filter(r=>String(r.employeeId)===String(e.id));return <div key={e.id} style={{padding:12,background:T.bg2,borderRadius:8}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{e.name}</b><b style={{color:T.green}}>{fmt(rows.reduce((sum,r)=>sum+employeeEarnings(r),0))} ₽</b></div>{rows.map(r=><div key={r.id} style={{fontSize:11,color:T.textSub,marginTop:6}}>{r.date} · {r.orderName} / {r.positionName} · {r.kind==="installation"?"Монтаж":r.operation||"Изготовление"} · {fmt(employeeEarnings(r))} ₽</div>)}</div>;})}
            </div></Card>
          </div>}

          {/* ИСТОРИЯ */}
          {tab===5&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:16,fontWeight:700}}>История заказов</div>
              {savedOrders.length===0?<div style={{color:T.textMuted,fontSize:14,padding:"40px 0",textAlign:"center"}}>Сохранённых заказов нет</div>
              :savedOrders.map(o=>(
                <div key={o.id} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"13px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{fontSize:14,fontWeight:700}}>{o.name}</span>{o.client&&<span style={{fontSize:12,color:T.textMuted,marginLeft:10}}>· {o.client}</span>}</div>
                    <span style={{fontSize:12,color:T.textMuted}}>{o.savedAt}</span>
                  </div>
                  <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
                    <MC label="Позиций" value={o.positions?.length||0}/>
                    <MC label="Время сборки" value={fmtDur(o.laborMin||0)} color={o.laborMin>0?T.green:T.textMuted}/>
                    <MC label="Материалы + ФОТ + станки" value={`${fmt(o.allPosCost)} ₽`}/>
                    <MC label="Монтаж" value={`${fmt(o.mountTotal)} ₽`}/>
                    <MC label="Итого клиенту" value={`${fmt(o.grandTotal)} ₽`} color={T.green}/>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </BindContext.Provider>
  );
}
