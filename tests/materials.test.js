import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateMaterials,materialTitle,materialColor} from '../src/materials.js';

const materials=[{id:80,name:'Oracal 641',category:'Плёнка',color:'белая',price:100},{id:81,name:'Oracal 8500',category:'Плёнка',price:150},{id:30,name:'ПВХ',category:'Листовой',price:200}];
const qty=(pos,row)=>row.bind?Number(pos[row.bind])||0:Number(row.qty)||0;

test('same film in different colors stays on separate order lines',()=>{
  const totals=aggregateMaterials([
    {qty:2,mats:[{matId:80,color:'031 красный',qty:3},{matId:80,color:'070 чёрный',qty:1}]},
    {qty:1,mats:[{matId:80,color:'031 красный',bind:'area'}],area:4},
  ],materials,qty);
  assert.equal(totals.length,2);
  assert.equal(totals.find(t=>t.color==='031 красный').qty,10);
  assert.equal(totals.find(t=>t.color==='070 чёрный').qty,2);
  assert.deepEqual(totals.find(t=>t.color==='031 красный').pos,[1,2]);
  assert.notEqual(totals[0].key,totals[1].key);
  assert.equal(totals.reduce((sum,t)=>sum+t.qty*t.m.price,0),1200);
});

test('film color defaults can be overridden or cleared explicitly',()=>{
  assert.equal(materialTitle(materials[0]),'Oracal 641 · белая');
  assert.equal(materialTitle(materials[0],'  красная  '),'Oracal 641 · красная');
  assert.equal(materialTitle(materials[0],''),'Oracal 641');
  assert.equal(materialColor(materials[2],'красный'),'');
});

test('non-film materials and missing material references keep existing aggregation behavior',()=>{
  const totals=aggregateMaterials([{qty:3,mats:[{matId:30,qty:2,color:'x'},{matId:30,qty:1},{matId:999,qty:3}]}],materials,qty);
  assert.equal(totals.length,1);
  assert.equal(totals[0].qty,9);
  assert.equal(materialTitle(totals[0].m,totals[0].color),'ПВХ');
});
