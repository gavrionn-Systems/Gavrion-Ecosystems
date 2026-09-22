export type Cell=string|number|null;
export type Sheet={name:string;rows:Cell[][];role?:'summary'|'detail'};

const xml=(value:string)=>value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;');

export function reportCsv(rows:Cell[][]){
  return '\uFEFF'+rows.map(row=>row.map(value=>{
    const text=String(value??'');
    // Prevent a user-supplied material name from becoming an Excel formula.
    const safe=typeof value==='string'&&/^[\s]*[=+@-]/.test(text)?"'"+text:text;
    return '"'+safe.replaceAll('"','""')+'"';
  }).join(',')).join('\r\n');
}

const encoder=new TextEncoder();
function crc(bytes:Uint8Array){let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0)}return (value^0xffffffff)>>>0}
function zip(files:Record<string,string>){
  const chunks:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
  for(const [path,content] of Object.entries(files)){
    const name=encoder.encode(path),data=encoder.encode(content),checksum=crc(data);
    const head=new Uint8Array(30+name.length),v=new DataView(head.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,checksum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);head.set(name,30);
    const record=new Uint8Array(46+name.length),c=new DataView(record.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,checksum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);record.set(name,46);
    chunks.push(head,data);central.push(record);offset+=head.length+data.length;
  }
  const length=central.reduce((sum,bytes)=>sum+bytes.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length,true);e.setUint16(10,central.length,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);
  const output=new Uint8Array(offset+length+22);let cursor=0;for(const chunk of [...chunks,...central,end]){output.set(chunk,cursor);cursor+=chunk.length}return output;
}

const column=(index:number)=>{let out='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out};
const safeSheetName=(name:string,index:number)=>xml((name.replace(/[\\/?*\[\]:]/g,' ').trim()||`Hoja ${index+1}`).slice(0,31));
const isTotalRow=(row:Cell[])=>String(row[0]??'').trim().toLocaleUpperCase('es')==='TOTAL';
const isSectionRow=(row:Cell[])=>{
  const values=row.filter(value=>value!==null&&String(value).trim()!=='');
  if(values.length!==1||typeof values[0]!=='string')return false;
  const text=values[0].trim();
  return text.length>0&&text===text.toLocaleUpperCase('es');
};
const widthOf=(value:Cell)=>{
  if(value===null)return 0;
  if(typeof value==='number')return Math.max(10,String(Math.abs(value)).length+5);
  return Math.max(...String(value).split(/\r?\n/).map(part=>part.length),0);
};
const sheetWidths=(sheet:Sheet,maxColumns:number)=>{
  if(sheet.role==='summary')return Array.from({length:maxColumns},(_,index)=>[30,36,18][index]??20);
  return Array.from({length:maxColumns},(_,index)=>{
    const widest=Math.max(0,...sheet.rows.map(row=>widthOf(row[index]??null)));
    return Math.min(38,Math.max(12,widest+2));
  });
};

// Styles: 0 base, 1 title, 2 table header, 3 text, 4 decimal,
// 5 total label, 6 total number, 7 section, 8 label, 9 metadata,
// 10 note, 11 integer.
const styles='<?xml version="1.0" encoding="UTF-8"?>'+
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;[Red](#,##0.00);-"/></numFmts>'+
  '<fonts count="3">'+
  '<font><sz val="10"/><name val="Arial"/><family val="2"/><color rgb="FF203B5D"/></font>'+
  '<font><b/><sz val="10"/><name val="Arial"/><family val="2"/><color rgb="FFFFFFFF"/></font>'+
  '<font><b/><sz val="10"/><name val="Arial"/><family val="2"/><color rgb="FF17365C"/></font>'+
  '</fonts>'+
  '<fills count="6">'+
  '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FF17365C"/><bgColor indexed="64"/></patternFill></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FFDDF2EA"/><bgColor indexed="64"/></patternFill></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FC"/><bgColor indexed="64"/></patternFill></fill>'+
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF7DF"/><bgColor indexed="64"/></patternFill></fill>'+
  '</fills>'+
  '<borders count="3">'+
  '<border><left/><right/><top/><bottom/><diagonal/></border>'+
  '<border><left/><right/><top/><bottom style="thin"><color rgb="FFDCE6F1"/></bottom><diagonal/></border>'+
  '<border><left style="thin"><color rgb="FFD1DCE8"/></left><right style="thin"><color rgb="FFD1DCE8"/></right><top style="thin"><color rgb="FFD1DCE8"/></top><bottom style="thin"><color rgb="FFD1DCE8"/></bottom><diagonal/></border>'+
  '</borders>'+
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
  '<cellXfs count="12">'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>'+
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'+
  '<xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'+
  '<xf numFmtId="164" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'+
  '<xf numFmtId="0" fontId="2" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'+
  '<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
  '<xf numFmtId="0" fontId="0" fillId="5" borderId="2" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'+
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'+
  '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>';

function cellStyle(sheet:Sheet,row:Cell[],rowIndex:number,columnIndex:number,cell:Cell){
  const summary=sheet.role==='summary';
  if(summary&&rowIndex===0)return 1;
  if(summary&&isSectionRow(row))return 7;
  if((sheet.role==='detail'&&rowIndex===0)||String(row[0]??'')==='Indicador')return 2;
  if(isTotalRow(row))return typeof cell==='number'?6:5;
  if(summary&&String(row[0]??'')==='Notas')return columnIndex===0?8:10;
  if(summary)return columnIndex===0?8:(typeof cell==='number'?4:9);
  if(typeof cell==='number')return columnIndex===0&&String(sheet.rows[0]?.[0]??'').toLocaleLowerCase('es').includes('posición')?11:4;
  return 3;
}

function worksheetXml(sheet:Sheet){
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const maxColumns=Math.max(1,...sheet.rows.map(row=>row.length));
  const lastColumn=column(maxColumns-1),lastRow=Math.max(1,sheet.rows.length);
  const widths=sheetWidths(sheet,maxColumns);
  const columns=widths.map((width,index)=>'<col min="'+(index+1)+'" max="'+(index+1)+'" width="'+width+'" customWidth="1"/>').join('');
  const rows=sheet.rows.map((row,rowIndex)=>{
    const section=sheet.role==='summary'&&isSectionRow(row),title=sheet.role==='summary'&&rowIndex===0;
    const padded=section||title?Array.from({length:maxColumns},(_,index)=>row[index]??null):row;
    const height=title?28:section?23:(sheet.role==='detail'&&rowIndex===0)?34:String(row[0]??'')==='Notas'?48:21;
    const cells=padded.map((cell,columnIndex)=>{
      const position=column(columnIndex)+(rowIndex+1),style=cellStyle(sheet,row,rowIndex,columnIndex,cell);
      if(cell===null||cell==='')return '<c r="'+position+'" s="'+style+'"/>';
      if(typeof cell==='number'&&Number.isFinite(cell))return '<c r="'+position+'" s="'+style+'"><v>'+cell+'</v></c>';
      return '<c r="'+position+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+xml(String(cell))+'</t></is></c>';
    }).join('');
    return '<row r="'+(rowIndex+1)+'" ht="'+height+'" customHeight="1">'+cells+'</row>';
  }).join('');
  const totalAtEnd=sheet.rows.length>1&&isTotalRow(sheet.rows[sheet.rows.length-1]);
  const filterEnd=sheet.rows.length-(totalAtEnd?1:0);
  const autoFilter=sheet.role==='detail'&&filterEnd>1?'<autoFilter ref="A1:'+lastColumn+filterEnd+'"/>':'';
  const pane=sheet.role==='detail'?'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>':'';
  return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="'+ns+'"><dimension ref="A1:'+lastColumn+lastRow+'"/><sheetViews><sheetView showGridLines="0" workbookViewId="0">'+pane+'</sheetView></sheetViews><sheetFormatPr defaultRowHeight="21"/><cols>'+columns+'</cols><sheetData>'+rows+'</sheetData>'+autoFilter+'<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
}

export function reportXlsx(sheets:Sheet[]){
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const styleRelationship=sheets.length+1;
  const files:Record<string,string>={
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,index)=>'<Override PartName="/xl/worksheets/sheet'+(index+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets>'+sheets.map((sheet,index)=>'<sheet name="'+safeSheetName(sheet.name,index)+'" sheetId="'+(index+1)+'" r:id="rId'+(index+1)+'"/>').join('')+'</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,index)=>'<Relationship Id="rId'+(index+1)+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+(index+1)+'.xml"/>').join('')+'<Relationship Id="rId'+styleRelationship+'" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':styles
  };
  sheets.forEach((sheet,index)=>{files['xl/worksheets/sheet'+(index+1)+'.xml']=worksheetXml(sheet)});
  return zip(files);
}

export function downloadReport(content:BlobPart,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
