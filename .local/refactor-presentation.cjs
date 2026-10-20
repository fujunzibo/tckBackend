const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../frontend/node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const front = path.join(root, 'frontend');
const read = p => fs.readFileSync(path.join(front, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, text) => fs.writeFileSync(path.join(front, p), text);
const text = {};
const replacements = {
  'features/connect.tsx': {
    '使用本地配置的演示管理员账号登录。': 'adminLoginDescription',
    '无需钱包或签名。新账号获得 1,000 SSC 与 3 张演示票券，均不可提现。': 'loginDescription',
    '创建新的演示身份（不删除旧记录）': 'newIdentity',
  },
  'features/fighters.tsx': {
    '每次创建消耗 1 张演示票券': 'fighterCost',
    '演示生成失败与自动返券': 'fighterFailure',
    '当前角色与赛果为模拟生成，角色不是 NFT。失败终态会返还演示票券。': 'fighterNotice',
    '模拟对战正在进行，离开页面后仍可恢复结果。': 'fightProgress',
  },
  'features/member.tsx': {
    '演示票券用于创建角色。失败后自动返还，购买功能暂未开放。': 'ticketDescription',
    '分享专属链接。好友完成任务后，计为有效邀请。当前不提供现金分佣。': 'invitationDescription',
    '当前演示环境 · 累计榜单 · 不含历史或自动参与': 'leaderboardDescription',
    '当前为演示身份，未绑定真实钱包。': 'identityDescription',
    '模拟持仓': 'holdingLabel',
    '演示成长规则；真实持仓权益尚未接入。': 'membershipDescription',
  },
  'features/home.tsx': {
    '演示对局已完成': 'homeRounds',
    '演示探索者': 'homeMembers',
    '赋予角色个性与战斗风格，在模拟竞技场中开启第一场 AI 对战。': 'homeFighters',
  },
  'features/games.tsx': {
    '选择正面或反面，开启第一场演示对局。': 'featuredGameDescription',
    '选择正面或反面，获取有效期 60 秒的演示报价。': 'gameRuleQuote',
    '模拟抛掷，两种结果机会相同；结果由演示服务生成。': 'gameRuleRandom',
    '选中时返还参与费用的 2 倍，未选中返还 0。SSC 无现金价值。': 'gameRulePayout',
  },
  'features/admin.tsx': {
    '这里展示当前演示实例的实际记录。先创建用户并参与游戏，再审核任务、核对奖励与审计日志。': 'adminOverviewDescription',
    '从演示资金池划拨预算。已预留的奖励继续使用原额度。': 'budgetDescription',
    '历史数据尚未导入。原始 SQL 与用户资料不会被自动导入本地演示。': 'legacyDescription',
  },
  'ui/primitives.tsx': {
    '功能尚未开放。当前演示不连接真实钱包、支付或自动资金操作。': 'unavailableDescription',
  },
};
for (const [file, mapping] of Object.entries(replacements)) {
  const name = 'app/' + file;
  let code = read(name);
  const ast = ts.createSourceFile(name, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'line' && node.arguments.length === 4) {
      const args = node.arguments.map(a => ts.isStringLiteral(a) ? a.text : undefined);
      const key = mapping[args[0]];
      if (key) {
        text[key] = Object.fromEntries(['zh','en','ja','ko'].map((locale,i) => [locale,args[i]]));
        edits.push([node.getStart(ast),node.end,`t("${key}")`]);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (edits.length !== Object.keys(mapping).length) throw new Error('Missing text in '+file);
  for (const [start,end,value] of edits.sort((a,b)=>b[0]-a[0])) code=code.slice(0,start)+value+code.slice(end);
  write(name,code);
}
let copy=read('app/lib/copy.ts');
const ast=ts.createSourceFile('copy.ts',copy,ts.ScriptTarget.Latest,true);
const removals=[];
function visitCopy(node) {
  if(ts.isPropertyAssignment(node) && ['login','demo','preview','signInDesc'].includes(node.name.getText(ast)) && ts.isArrayLiteralExpression(node.initializer)) {
    const key=node.name.getText(ast);
    text[key === 'demo' ? 'environment' : key]=Object.fromEntries(['zh','en','ja','ko'].map((locale,i)=>[locale,node.initializer.elements[i].text]));
    let end=node.end;
    if(copy[end]===',') end++;
    removals.push([node.getFullStart(),end]);
  }
  ts.forEachChild(node,visitCopy);
}
visitCopy(ast);
if(removals.length!==4) throw new Error('Copy keys missing');
for(const [start,end] of removals.sort((a,b)=>b[0]-a[0])) copy=copy.slice(0,start)+copy.slice(end);
copy=copy.replace('import { useI18n } from "../i18n";', 'import { useI18n } from "../i18n";\nimport { useSite } from "../site";');
copy=copy.replace('const { locale } = useI18n();','const { locale } = useI18n();\n  const config = useSite();');
copy=copy.replace('t: (key: Word | string) => (key in words ? words[key as Word][index] : key),','t: (key: Word | string) => config.text[key]?.[locale] ?? (key in words ? words[key as Word][index] : key),');
write('app/lib/copy.ts',copy);
text.demo_credit={zh:'初始演示资产',en:'Initial demo assets',ja:'初期デモ資産',ko:'초기 데모 자산'};
text.explorer={zh:'演示探索者',en:'Demo explorer',ja:'デモ参加者',ko:'데모 참가자'};
const content=`// Public presentation data shared by the NestJS API and the optional local Mock adapter.\n// Browser components receive this exclusively through GET /public/config.\nexport type PublicCopy = Record<"zh" | "en" | "ja" | "ko", string>;\nexport const publicText: Record<string, PublicCopy> = ${JSON.stringify(text,null,2)};\n\nexport const modeLabels: Record<string, PublicCopy> = {\n  demo: { zh: "演示环境", en: "Demo environment", ja: "デモ環境", ko: "데모 환경" },\n  testnet: { zh: "测试网络", en: "Test network", ja: "テストネット", ko: "테스트 네트워크" },\n  live: { zh: "正式环境", en: "Live", ja: "本番環境", ko: "운영 환경" },\n};\n\ninterface CatalogItem { id: string; slug: string; name: string; kind: string; chainId: string; assetId: string; entryId: string; mode: string; }\nexport function publicPresentation(games: CatalogItem[], platformMode = "demo") {\n  const distinct = (key: keyof CatalogItem) => [...new Set(games.map(g => g[key]))];\n  const chainNames: Record<string, string> = { "demo-ethereum": "Ethereum", "demo-base": "Base" };\n  const entryNames: Record<string, string> = { "tck-originals": "TCK Originals", "partner-lab": "Partner Lab" };\n  return {\n    platformMode,\n    text: { ...publicText, environment: modeLabels[platformMode] },\n    modes: distinct("mode").map(id => ({ id, label: modeLabels[id] })),\n    chains: distinct("chainId").map(id => ({ id, name: chainNames[id] ?? id })),\n    gameKinds: distinct("kind").map(id => ({ id, name: games.find(g => g.kind === id)!.name })),\n    gameAssets: distinct("assetId"),\n    entries: distinct("entryId").map(id => ({ id, name: entryNames[id] ?? id })),\n    catalog: games.map(({id,slug,name,mode}) => ({id,slug,name,mode})),\n    fighterCreation: { amountAtomic: "1", assetId: "TICKET" },\n  };\n}\n`;
fs.writeFileSync(path.join(root,'backend/src/public-presentation.ts'),content);
console.log('Moved '+Object.keys(text).length+' business text entries into the API.');
