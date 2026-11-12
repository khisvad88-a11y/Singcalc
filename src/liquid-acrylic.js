export const DEFAULT_JA_CONFIG={
  price_board:120,
  price_machine:150,
  price_backing:1665.43,
  price_operator:400,
  operator_norm:0.5555,
  density_acrylic:1500,
  acrylic_price_coeff:13.333333333333334,
  acrylic_price_multiplier:2,
  acrylic_thickness:4,
  backing_calc_mode:"area",
  operator_norm_mode:"per_letter",
};
export const BOARD_HEIGHTS=[40,60,80,100];

export function calcJA(params,config){
  const cfg={...DEFAULT_JA_CONFIG,...config};
  const {area,board_height,letters_count,perimeter}=params;
  const price_acrylic=cfg.acrylic_price_multiplier*board_height*cfg.acrylic_price_coeff;
  const acrylic_consumption=area*(cfg.acrylic_thickness/1000)*cfg.density_acrylic;
  const cost_acrylic=acrylic_consumption*price_acrylic;
  const cost_board=perimeter*cfg.price_board;
  const cost_machine=perimeter*cfg.price_machine;
  const subtotal_acrilight=cost_acrylic+cost_board+cost_machine;
  const cost_backing=(cfg.backing_calc_mode==="area"?area:perimeter)*cfg.price_backing;
  const operator_time=(cfg.operator_norm_mode==="per_letter"?letters_count:perimeter)*cfg.operator_norm;
  const cost_operator=operator_time*cfg.price_operator;
  const total=subtotal_acrilight+cost_backing+cost_operator;
  return {price_acrylic,acrylic_consumption,cost_acrylic,cost_board,cost_machine,subtotal_acrilight,cost_backing,operator_time,cost_operator,total};
}

// Display uses the same settings and unrounded results as the order calculator.
export function jaFormulaRows(params,config){
  const cfg={...DEFAULT_JA_CONFIG,...config};
  const r=calcJA(params,cfg);
  const num=n=>Number(n).toLocaleString("ru-RU",{maximumFractionDigits:8});
  const input=(key,symbol)=>Number(params[key])>0?num(params[key]):symbol;
  const S=input("area","S"),P=input("perimeter","P"),N=input("letters_count","N"),H=input("board_height","H");
  const b=cfg.backing_calc_mode==="area";
  const l=cfg.operator_norm_mode==="per_letter";
  return [
    {label:"Цена акрила",formula:"Множитель × H × коэффициент цены",numbers:`${num(cfg.acrylic_price_multiplier)} × ${H} × ${num(cfg.acrylic_price_coeff)}`,value:r.price_acrylic,unit:"₽/кг"},
    {label:"Масса акрила",formula:"S × (толщина / 1000) × плотность",numbers:`${S} × (${num(cfg.acrylic_thickness)} / 1000) × ${num(cfg.density_acrylic)}`,value:r.acrylic_consumption,unit:"кг"},
    {label:"Стоимость акрила",formula:"Масса акрила × цена акрила",numbers:`${num(r.acrylic_consumption)} × ${num(r.price_acrylic)}`,value:r.cost_acrylic,unit:"₽"},
    {label:"Борт",formula:"P × тариф борта",numbers:`${P} × ${num(cfg.price_board)}`,value:r.cost_board,unit:"₽"},
    {label:"Станок",formula:"P × тариф станка",numbers:`${P} × ${num(cfg.price_machine)}`,value:r.cost_machine,unit:"₽"},
    {label:"Подытог Акрилайт",formula:"Акрил + борт + станок",numbers:`${num(r.cost_acrylic)} + ${num(r.cost_board)} + ${num(r.cost_machine)}`,value:r.subtotal_acrilight,unit:"₽"},
    {label:"Задник",formula:`${b?"S":"P"} × тариф задника`,numbers:`${b?S:P} × ${num(cfg.price_backing)}`,value:r.cost_backing,unit:"₽"},
    {label:"Время оператора",formula:`${l?"N":"P"} × норма оператора`,numbers:`${l?N:P} × ${num(cfg.operator_norm)}`,value:r.operator_time,unit:"ч"},
    {label:"Работа оператора",formula:"Время оператора × ставка",numbers:`${num(r.operator_time)} × ${num(cfg.price_operator)}`,value:r.cost_operator,unit:"₽"},
    {label:"Итого ЖА",formula:"Акрилайт + задник + оператор",numbers:`${num(r.subtotal_acrilight)} + ${num(r.cost_backing)} + ${num(r.cost_operator)}`,value:r.total,unit:"₽"},
  ];
}
