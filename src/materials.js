export const isFilmMaterial=material=>material?.category==="Плёнка";
export const materialColor=(material,color)=>isFilmMaterial(material)?String(color??material.color??"").trim():"";
export const materialTitle=(material,color)=>{
  if(!material)return "Материал удалён";
  const selected=materialColor(material,color);
  return selected?`${material.name} · ${selected}`:material.name;
};
export function aggregateMaterials(positions,materials,quantity){
  const totals=new Map();
  positions.forEach((pos,index)=>{
    const count=Number(pos.qty||1);
    pos.mats.forEach(row=>{
      const material=materials.find(m=>m.id===Number(row.matId));
      if(!material)return;
      const qty=quantity(pos,row)*count;
      if(qty<=0)return;
      const color=materialColor(material,row.color);
      const key=JSON.stringify([material.id,color]);
      if(!totals.has(key))totals.set(key,{key,m:material,color,qty:0,pos:[]});
      const total=totals.get(key);total.qty+=qty;
      if(!total.pos.includes(index+1))total.pos.push(index+1);
    });
  });
  return [...totals.values()].sort((a,b)=>a.m.category.localeCompare(b.m.category,"ru")||materialTitle(a.m,a.color).localeCompare(materialTitle(b.m,b.color),"ru"));
}
