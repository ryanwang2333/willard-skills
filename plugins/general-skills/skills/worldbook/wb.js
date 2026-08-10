#!/usr/bin/env node
// wb.js —— 通用 SillyTavern 世界书(worldbook JSON)管理 CLI
// 用法: node wb.js <命令> <世界书文件> [选项]
// 命令:
//   list     列出所有条目 (uid / comment / keys / 常驻 / 字数)
//   show     显示单条完整内容 (按 uid 或关键词)
//   search   按关键词/正文搜索条目
//   stats    统计: 条数、常驻/触发分布、token 估算、重复 key
//   audit    质量审查: 结构问题、单字泛词、空/重复 key、无标签包裹
//   validate ST 格式校验 + 关键字段合理性
//   add      新增条目 (--uid --comment --keys --content --constant --position --order --depth)
//   edit     修改条目 (--comment --keys --content --constant --position --order --depth)
//   delete   删除条目
//   backup   备份副本 (默认 <文件>.bak-<时间>)
const fs = require('fs');
const path = require('path');

const [,, cmd, file, ...rest] = process.argv;

if (!cmd || !file || !['list','show','search','stats','audit','validate','add','edit','delete','backup'].includes(cmd)) {
  console.log(require('fs').readFileSync(__filename, 'utf8').split('// wb.js')[1].split('const fs')[0]);
  process.exit(1);
}
if (!fs.existsSync(file)) { console.error('❌ 文件不存在:', file); process.exit(1); }

let wb;
try { wb = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (e) { console.error('❌ 无法解析 JSON:', e.message); process.exit(1); }

const entries = Object.values(wb.entries || {});
if (!entries.length) { console.error('❌ 不是合法的 worldbook JSON（缺 entries）'); process.exit(1); }

// ---- 工具 ----
function arg(name, def) {
  const i = rest.indexOf('--' + name);
  return i >= 0 && rest[i + 1] !== undefined ? rest[i + 1] : def;
}
function argArr(name) {
  const v = arg(name, '');
  return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
}
function sortByOrder(es) { return [...es].sort((a, b) => (a.order || 0) - (b.order || 0)); }
function normKeys(k) { return (Array.isArray(k) ? k : []).map(x => String(x).trim()).filter(Boolean); }
function estTokens(s) { return Math.ceil(Number(s) / 1.5); }
function keyLabel(e) { return normKeys(e.keys).join(' / '); }

// 通用极高频词（易误触发，audit 会标出，供判断）
const FREQ_WORDS = ['人类','世界','大陆','魔法','等级','技能','经验值','神','恶魔','天使','魔王','勇者','国王','王子','公主','英雄','战争','国家','城市','传说'];

// ---- 命令实现 ----
if (cmd === 'list') {
  sortByOrder(entries).forEach(e => {
    console.log(`[${e.uid}]${e.constant ? ' 🔵常驻' : '   '} ${e.comment || ''} | ${normKeys(e.keys).slice(0, 6).join('/')} | ${(e.content || '').length}B`);
  });
  console.log(`\n共 ${entries.length} 条`);
}

else if (cmd === 'show') {
  const q = rest[0];
  const e = entries.find(x => x.uid === q) || entries.find(x => normKeys(x.keys).includes(q)) || entries.find(x => (x.comment || '').includes(q));
  if (!e) { console.error('❌ 未找到:', q); process.exit(1); }
  console.log(`[${e.uid}] ${e.comment || ''}`);
  console.log(`keys: ${keyLabel(e)}`);
  console.log(`constant=${e.constant} position=${e.position} depth=${e.depth} order=${e.order} probability=${e.probability}`);
  console.log('--- content ---');
  console.log(e.content || '(空)');
}

else if (cmd === 'search') {
  const q = rest[0];
  const hits = entries.filter(e =>
    normKeys(e.keys).some(k => k.includes(q)) ||
    (e.content || '').includes(q) || (e.comment || '').includes(q));
  if (!hits.length) { console.log('无匹配'); process.exit(0); }
  hits.forEach(e => console.log(`[${e.uid}] ${e.comment || ''} | keys: ${keyLabel(e).slice(0, 60)}`));
}

else if (cmd === 'stats') {
  const consts = entries.filter(e => e.constant);
  const keysAll = entries.flatMap(e => normKeys(e.keys));
  const dup = [...new Set(keysAll.filter((k, i) => keysAll.indexOf(k) !== i))];
  const totalChars = entries.reduce((s, e) => s + (e.content || '').length, 0);
  console.log('世界书:', wb.name || '(未命名)');
  console.log('条目数:', entries.length);
  console.log('蓝灯常驻:', consts.length, '条 →', consts.map(e => e.uid).join(',') || '无');
  console.log('绿灯触发:', entries.length - consts.length, '条');
  console.log('总内容:', totalChars, '字符 ≈', estTokens(totalChars), 'token（ST 预算走全局设置，文件内 token_budget 字段 ST 不读' + (wb.token_budget ? `，本文件设 ${wb.token_budget}` : '') + '）');
  console.log('recursive:', wb.recursive_scanning, '| 扫描深度走全局 world_info_depth' + (wb.scan_depth !== undefined ? `（文件内 scan_depth=${wb.scan_depth}，ST 不读）` : ''));
  console.log('重复关键词:', dup.length ? dup.join(', ') : '无');
  console.log('空 keys 条目:', entries.filter(e => !normKeys(e.keys).length).map(e => e.uid).join(',') || '无');
  console.log('空 content 条目:', entries.filter(e => !(e.content || '').trim()).map(e => e.uid).join(',') || '无');
}

else if (cmd === 'audit') {
  const problems = [];
  entries.forEach(e => {
    const keys = normKeys(e.keys);
    if (!keys.length) problems.push(`[${e.uid}] ${e.comment} — 无触发关键词`);
    keys.forEach(k => {
      if (k.length <= 1) problems.push(`[${e.uid}] ${e.comment} — 单字关键词「${k}」易误触发，建议删或用复合词`);
      if (FREQ_WORDS.includes(k)) problems.push(`[${e.uid}] ${e.comment} — 高频泛词「${k}」可能过度触发，建议删`);
    });
    if (!(e.content || '').trim()) problems.push(`[${e.uid}] ${e.comment} — 正文为空`);
    if (e.constant && e.position === undefined) problems.push(`[${e.uid}] ${e.comment} — 常驻条目缺 position`);
  });
  const keysAll = entries.flatMap(e => normKeys(e.keys));
  const dup = [...new Set(keysAll.filter((k, i) => keysAll.indexOf(k) !== i))];
  if (dup.length) problems.push(`跨条目重复关键词: ${dup.join(', ')}`);
  const noTag = entries.filter(e => !/<[一-鿿A-Za-z0-9_-]+_id\d+>/.test(e.content || ''));
  if (noTag.length) problems.push(`无标签包裹的条目(${noTag.length}): ${noTag.map(e => e.uid).join(', ')}（如需按「标签规范」可加 <世界观_idN>）`);
  // 注：不做基于 token_budget 的「全部内容是否超预算」检查——ST 不读顶层 token_budget，
  // 实际预算由全局 world_info_budget(%上下文)+world_info_budget_cap 决定，与文件内容量无直接对应关系。
  if (problems.length) { problems.forEach(p => console.log('•', p)); console.log(`\n共 ${problems.length} 项`); }
  else console.log('✓ 未发现客观结构问题（语义质量需由 Claude 再读一遍）');
}

else if (cmd === 'validate') {
  const errs = [];
  if (!wb.name) errs.push('缺 name');
  // 注：顶层 scan_depth / token_budget 不是必填——ST 运行时忽略它们（深度走全局 world_info_depth，
  // 预算走全局 world_info_budget；per-entry 可经 extensions.scan_depth 覆盖）。故不校验其存在。
  if (typeof wb.entries !== 'object') errs.push('缺 entries 对象');
  entries.forEach(e => {
    if (!e.uid) errs.push('有条目缺 uid');
    if (!Array.isArray(e.keys)) errs.push(`[${e.uid}] keys 不是数组`);
    if (typeof e.content !== 'string') errs.push(`[${e.uid}] content 缺失`);
    if (![true, false].includes(e.constant)) errs.push(`[${e.uid}] constant 缺失`);
  });
  // 校验 ST 标准条目的必填字段
  const sample = entries[0];
  const required = ['uid', 'keys', 'content', 'comment', 'constant', 'position', 'depth', 'order', 'probability', 'useProbability'];
  const missing = required.filter(f => sample[f] === undefined);
  if (missing.length) errs.push(`字段缺省(取默认): ${missing.join(', ')}`);
  if (errs.length) { errs.forEach(e => console.log('✗', e)); console.log('\n校验未通过'); process.exit(1); }
  console.log('✓ ST 格式校验通过，', entries.length, '条，可导入');
}

else if (cmd === 'add') {
  const uid = arg('uid', String(entries.length + 1).padStart(3, '0'));
  const keys = argArr('keys');
  const content = arg('content', '');
  if (!keys.length) { console.error('❌ 至少给一个 --keys'); process.exit(1); }
  if (!content) { console.error('❌ 缺少 --content'); process.exit(1); }
  if (wb.entries[uid]) { console.error(`❌ uid ${uid} 已存在，用 edit 或换 --uid`); process.exit(1); }
  wb.entries[uid] = {
    uid,
    keys,
    content,
    comment: arg('comment', ''),
    constant: arg('constant', 'true') === 'true',
    position: Number(arg('position', 0)),
    depth: Number(arg('depth', 4)),
    order: Number(arg('order', 100)),
    probability: 100,
    useProbability: true,
    excludeRecursion: false,
    disable: false,
    role: 0,
    selectiveLogic: 0,
    group: '',
    addMemo: false,
    delayUntilRecursion: false,
    insertionOrder: 0,
    enabled: true,
    internallyDisabled: false,
  };
  fs.writeFileSync(file, JSON.stringify(wb, null, 2), 'utf8');
  console.log(`✓ 已新增 [${uid}] ${arg('comment', '')}`);
}

else if (cmd === 'edit') {
  const uid = rest[0];
  const e = entries.find(x => x.uid === uid);
  if (!e) { console.error('❌ 未找到 uid:', uid); process.exit(1); }
  const fields = ['comment', 'content', 'constant', 'position', 'order', 'depth'];
  let changed = [];
  fields.forEach(f => {
    const v = arg(f);
    if (v !== undefined) {
      if (f === 'constant') e[f] = v === 'true';
      else if (f === 'position' || f === 'order' || f === 'depth') e[f] = Number(v);
      else e[f] = v; // comment / content 保留字符串
      changed.push(f);
    }
  });
  const ks = argArr('keys');
  if (arg('keys') !== undefined) { e.keys = ks; changed.push('keys'); }
  if (!changed.length) { console.error('❌ 未指定要改的字段 (--comment/--keys/--content/--constant/--position/--order/--depth)'); process.exit(1); }
  fs.writeFileSync(file, JSON.stringify(wb, null, 2), 'utf8');
  console.log(`✓ 已修改 [${uid}] 字段: ${changed.join(', ')}`);
}

else if (cmd === 'delete') {
  const uid = rest[0];
  if (!wb.entries[uid]) { console.error('❌ 未找到 uid:', uid); process.exit(1); }
  delete wb.entries[uid];
  fs.writeFileSync(file, JSON.stringify(wb, null, 2), 'utf8');
  console.log(`✓ 已删除 [${uid}]`);
}

else if (cmd === 'backup') {
  const out = arg('out') || file + '.bak';
  fs.writeFileSync(out, fs.readFileSync(file));
  console.log('✓ 备份 →', out);
}
