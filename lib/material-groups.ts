export type MaterialGroup = {id:string;name:string;active:boolean};
export const defaultMaterialGroups:MaterialGroup[] = [
  {id:'ferrous',name:'Ferroso',active:true}, {id:'non-ferrous',name:'No Ferroso',active:true},
  {id:'plastic',name:'Plástico',active:true}, {id:'paper',name:'Papel',active:true},
  {id:'cardboard',name:'Cartón',active:true}, {id:'raee',name:'RAEE',active:true}, {id:'glass',name:'Vidrio',active:true},
];
export const defaultMaterialTypes = [
  {id:'mat-wrought-iron',name:'Hierro forjado',group_id:'ferrous'},
  {id:'mat-steel',name:'Acero',group_id:'ferrous'},
  ...['Aluminio','Cobre','Zinc','Estaño','Magnesio'].map((name,i)=>({id:`mat-non-ferrous-${i}`,name,group_id:'non-ferrous'})),
  {id:'mat-paper',name:'Papel',group_id:'paper'},
  {id:'mat-pet-clear',name:'Pet Claro',group_id:'plastic'},
  {id:'mat-pet-green',name:'Pet Verde',group_id:'plastic'},
  {id:'mat-batteries',name:'Baterías',group_id:'raee'},
  {id:'mat-glass',name:'Vidrio',group_id:'glass'},
];
const normalizeGroupKey = (value:string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('es')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-|-$/g,'');
const canonicalGroupKey = (value:string) => {
  const key=normalizeGroupKey(value);
  if(['ferrous','ferroso','ferrosos'].includes(key))return 'ferrous';
  if(['non-ferrous','nonferrous','no-ferroso','no-ferrosos','no-ferrous'].includes(key))return 'non-ferrous';
  if(['plastic','plastico','plasticos'].includes(key))return 'plastic';
  if(['paper','papel'].includes(key))return 'paper';
  if(['cardboard','carton'].includes(key))return 'cardboard';
  if(['raee','baterias','bateria','electronic-waste'].includes(key))return 'raee';
  if(['glass','vidrio'].includes(key))return 'glass';
  return key;
};
/** True when a material belongs to a configured group, including legacy IDs/names. */
export function materialBelongsToGroup(material:{name:string;group_id?:string|null}, group:{id:string;name:string}) {
  const inferred=materialGroupId({name:material.name});
  const materialKeys=[material.group_id??'', inferred, material.name].map(canonicalGroupKey).filter(Boolean);
  const groupKeys=[group.id, group.name, materialGroupId({name:group.name})].map(canonicalGroupKey).filter(Boolean);
  return materialKeys.some(key=>groupKeys.includes(key));
}
export function materialGroupId(material:{name:string;group_id?:string|null}) {
  if(material.group_id)return material.group_id;
  const name=material.name.toLocaleLowerCase('es');
  if(/hierro|acero|chatarra/.test(name))return 'ferrous';
  if(/aluminio|cobre|zinc|estaño|magnesio/.test(name))return 'non-ferrous';
  if(name.includes('cartón'))return 'cardboard';
  if(name.includes('papel'))return 'paper';
  if(name.includes('plást'))return 'plastic';
  if(name.includes('raee'))return 'raee';
  if(/pet|bater[ií]a|electr[oó]nic/.test(name))return name.includes('bater')?'raee':'plastic';
  if(name.includes('vidri'))return 'glass';
  return '';
}
export const weightUnitLabel = (unit:unknown) => unit==='ton'?'toneladas':String(unit??'');
