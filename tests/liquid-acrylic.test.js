import test from 'node:test';
import assert from 'node:assert/strict';
import {calcJA,DEFAULT_JA_CONFIG,jaFormulaRows} from '../src/liquid-acrylic.js';
import {readFileSync} from 'node:fs';

const params={area:0.269,board_height:60,letters_count:6,perimeter:8};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('default settings preserve the previous liquid acrylic estimate',()=>{
  const r=calcJA(params,DEFAULT_JA_CONFIG);
  near(r.price_acrylic,1600);
  near(r.acrylic_consumption,1.614);
  near(r.cost_acrylic,2582.4);
  near(r.cost_board,960);
  near(r.cost_machine,1200);
  near(r.cost_backing,448.00067);
  near(r.cost_operator,1333.2);
  near(r.total,6523.60067);
});

test('all coefficient changes affect their intended components',()=>{
  const cfg={...DEFAULT_JA_CONFIG,acrylic_price_multiplier:3,acrylic_price_coeff:10,
    acrylic_thickness:5,density_acrylic:1200,price_board:80,price_machine:95,
    price_backing:300,price_operator:500,operator_norm:0.25};
  const r=calcJA(params,cfg);
  near(r.price_acrylic,1800);
  near(r.acrylic_consumption,1.614);
  near(r.cost_acrylic,2905.2);
  near(r.cost_board,640);near(r.cost_machine,760);
  near(r.cost_backing,80.7);near(r.cost_operator,750);
  near(r.total,5135.9);
});

test('perimeter modes use metres and do not depend on letter count',()=>{
  const cfg={...DEFAULT_JA_CONFIG,backing_calc_mode:'perimeter',operator_norm_mode:'per_meter'};
  const r=calcJA({...params,letters_count:0},cfg);
  near(r.cost_backing,13323.44);near(r.operator_time,4.444);near(r.cost_operator,1777.6);
  const rows=jaFormulaRows({...params,letters_count:0},cfg);
  assert.equal(rows.find(row=>row.label==='Задник').formula,'P × тариф задника');
  assert.equal(rows.find(row=>row.label==='Время оператора').formula,'P × норма оператора');
});

test('zero tariffs are respected and older configs keep multiplier two',()=>{
  const legacy={...DEFAULT_JA_CONFIG};delete legacy.acrylic_price_multiplier;
  near(calcJA(params,legacy).total,6523.60067);
  const zero={...DEFAULT_JA_CONFIG,acrylic_price_multiplier:0,price_board:0,price_machine:0,price_backing:0,price_operator:0};
  near(calcJA(params,zero).total,0);
});

test('formula breakdown agrees with the calculator after editing and resetting',()=>{
  for(const cfg of [DEFAULT_JA_CONFIG,{...DEFAULT_JA_CONFIG,acrylic_price_multiplier:5},DEFAULT_JA_CONFIG]){
    const r=calcJA(params,cfg), rows=jaFormulaRows(params,cfg);
    assert.equal(rows.length,10);
    assert.deepEqual(rows.map(row=>row.value),Object.values(r));
    assert.ok(rows.every(row=>row.formula&&row.numbers&&row.unit));
  }
});

test('order estimates use the same coefficients and multiply by product quantity',()=>{
  const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  const start=source.indexOf('const calcPos=');
  const end=source.indexOf('// ── Станки внутри позиции',start);
  const calcPos=new Function('calcJA',source.slice(start,end)+'return calcPos;')(calcJA);
  const pos={...params,area:params.area,perimeter:params.perimeter,letters:params.letters_count,
    qty:3,mats:[],ops:[],fresas:[],plotterOps:[],useJA:true,ja:{board_height:60}};
  const cfg={...DEFAULT_JA_CONFIG,acrylic_price_multiplier:3};
  near(calcPos(pos,[],[],850,[],[],cfg).total,calcJA(params,cfg).total*3);
  const metreCfg={...cfg,operator_norm_mode:'per_meter'};
  const noLetters={...pos,letters:''};
  near(calcPos(noLetters,[],[],850,[],[],metreCfg).total,calcJA({...params,letters_count:0},metreCfg).total*3);
});
