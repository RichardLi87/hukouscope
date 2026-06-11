// HukouScope · DeepSeek AI 服务封装（CommonJS, 零第三方依赖）
const BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL_FAST = process.env.DEEPSEEK_MODEL_FAST || "deepseek-v4-flash";
const MODEL_PRO  = process.env.DEEPSEEK_MODEL_PRO  || "deepseek-v4-flash";

// 各城市落户逻辑要点（仅作常识参照，不构成官方口径；政策常变）
const CITY_GUIDE = {
  "上海":"居转户（持居住证+社保累计满7年+中级职称或2倍社保）、留学生落户（看院校与社保倍数）、应届生打分(72分)、重点机构人才引进；最看社保连续性与个税匹配。",
  "北京":"落户最难：积分落户年度名额极少、单位进京指标稀缺、人才引进门槛高；强单位背景是关键。",
  "深圳":"相对友好：核准类(本科+社保、年龄达标可直接核准)、积分入户、留学生落户；效率高。",
  "广州":"学历入户(本科+社保)、积分入户、留学生落户；门槛适中。",
  "杭州":"数字人才友好：本科+社保可落、研究生可先落后就业、留学生落户、积分落户。",
  "成都":"抢人友好：全日制大专+学历入户、积分入户、社保入户，门槛较低。",
  "苏州":"学历落户+社保落户+积分落户，门槛适中，紧邻上海。",
  "南京":"研究生可直接落、本科+社保、积分落户，对年轻人友好。",
  "武汉":"大学生之城：毕业生/学历落户、积分落户门槛较低。",
  "天津":"海河英才(学历型/资格型/技能型)+积分落户，叠加高考红利。"
};
function cityNote(p){const cs=(p&&p.cities)||[];if(!cs.length)return "";const lines=cs.filter(c=>CITY_GUIDE[c]).map(c=>`· ${c}：${CITY_GUIDE[c]}`).join("\n");return `\n用户考虑的城市及其落户逻辑要点（按各地正确规则判断，不要张冠李戴）：\n${lines}\n`;}

const RULES = `你是 HukouScope 落户雷达的 AI 落户竞争力诊断引擎。严格遵守：
1. 只做"落户竞争力/匹配度"诊断与信息参考，覆盖上海、北京、深圳、广州、杭州、成都、苏州、南京、武汉、天津。
2. 评分代表"竞争力/匹配度"，**不是**落户审批结果或成功率。
3. 禁止输出："保证落户""一定能落""包落户""稳落""100%""落户概率百分比"等承诺性或绝对化词语。
4. 必须审慎：体现"各地政策与名额经常调整、最终以当地公安/人社等官方为准"；这是信息参考，**不构成落户、法律或政策建议**。
5. 不推销代办、不做中介导流。
6. 语气专业、直接、克制、说人话，忌空洞排比与套话，使用简体中文。
7. **品牌口吻**：需要自称时用"落户雷达"，不要自称"AI""人工智能""作为AI""模型"。
8. 只输出严格 JSON，不要 Markdown、不要解释性文字。`;

async function chat(messages, { model = MODEL_FAST, json = true, temperature = 0.4 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 110000);
  try {
    const r = await fetch(BASE.replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model, messages, temperature, ...(json ? { response_format: { type: "json_object" } } : {}) }),
      signal: ctrl.signal,
    });
    if (!r.ok) { const txt = await r.text(); throw new Error("DeepSeek HTTP " + r.status + ": " + txt.slice(0, 300)); }
    const data = await r.json();
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    if (!json) return content;
    return JSON.parse(content);
  } finally { clearTimeout(t); }
}
const J = (o) => "```\n" + JSON.stringify(o, null, 1) + "\n```";

async function followUp(payload) {
  const p = payload.profile || {};
  const deep = !!payload.deep;
  const ask = deep
    ? `用户已付费、很认真，愿意为更准的报告多回答几个问题。请生成 4–6 个**更深入、更具体、按目标城市差异化**的追问。${cityNote(p)}
要点方向（挑最相关的问，不要泛泛）：社保/个税是否连续无断缴、累计月数；个税与社保基数是否匹配（上海居转户关键）；学历是否全日制、院校层次；是否有可用于落户的职称及专业是否对口；单位是否为重点机构/园区/有进京指标；是否有本地房产/大额纳税；孩子入学/高考的时间节点。每题短、具体、好回答，附一句"为什么问"。最多 6 个。`
    : `请根据用户已填的落户背景，生成 2–3 个最关键的追问。${cityNote(p)}
要求：最多 3 个；只问会显著影响落户竞争力、且用户尚未明确回答的（如社保连续性、是否有可用职称、单位性质）；每题附一句"为什么问"；问题短、具体、好回答。`;
  const messages = [{ role: "system", content: RULES }, { role: "user", content:
`${ask}

用户信息：
${J(p)}

只输出如下 JSON：
{"questions":[{"question":"string","reason":"string","fieldKey":"string"}]}` }];
  const out = await chat(messages, { model: MODEL_FAST });
  if (!out || !Array.isArray(out.questions)) throw new Error("BAD_SHAPE");
  return { questions: out.questions.slice(0, deep ? 6 : 3) };
}

async function freeResult(payload) {
  const p = payload.profile || {};
  const messages = [{ role: "system", content: RULES }, { role: "user", content:
`这是免费初测。规则引擎已算出综合落户竞争力 ${payload.overall}/100（${payload.grade} 档），各城市匹配度初步判断如下（分数为竞争力/匹配度，非审批结果）：
${J(payload.verdicts || [])}${cityNote(p)}

请基于用户信息与上述判断，写出克制、专业的免费初测文案。不要展开完整方案、不要编造新分数或城市、不要承诺落户。

用户信息：
${J(p)}

只输出如下 JSON：
{"summary":"一段 2-3 句的初步判断（点出最匹配城市与落户方式方向）","topRisks":["风险1","风险2","风险3"],"shortAdvice":"一句简短可执行建议"}` }];
  const out = await chat(messages, { model: MODEL_FAST });
  if (!out || typeof out.summary !== "string") throw new Error("BAD_SHAPE");
  return out;
}

async function fullReport(payload) {
  const r = payload.report || {};
  const p = payload.profile || {};
  const cities = (r.rows || []).slice(0, 3).map(x => x.name);
  const messages = [{ role: "system", content: RULES }, { role: "user", content:
`这是一份付费完整落户诊断报告。综合分、各城市匹配度与最优落户方式已由规则引擎给定（见"报告上下文"），**请勿修改任何分数或城市排名**。基于用户真实信息，为下列每部分生成具体、个性化、有依据的中文判断与方案。

${cityNote(p)}

硬性要求：
1. 逐城方案各不相同：结合每城真实落户逻辑(学历/社保年限/职称/年龄/单位/积分)与该用户的具体差距来写，严禁多城套用同一套话术。
2. 具体、带数字、可执行：尽量给"社保还差几年、需要什么职称、预计周期、要补什么材料"，数字用"约/参考"等审慎措辞。
3. 说人话，忌排比套话。
4. 审慎：政策会变、以官方为准；不得承诺落户、不得给百分比、不得出现"保证/包落户/稳落/100%"。

报告上下文（只读）：
${J(r)}

用户完整背景与追问回答：
${J(p)}

请严格按以下 JSON 输出（cityPlans 针对这些城市，名称精确匹配：${JSON.stringify(cities)}）：
{
 "profileScan":{"highlights":["这位申请人最值得说的加分项1(具体)","加分项2","加分项3"],"redFlags":["明显的硬伤/风险信号1(如学历不够、社保年限短、年龄偏大、无职称等)","硬伤2"]},
 "executiveSummary":{"oneSentenceConclusion":"string","bestCityWhy":"最大机会(哪个城市/方式，为什么)","mainRisk":"最大风险","recommendedStrategy":"建议策略(可双线并行)"},
 "comparisonInsight":"横向对比这几个城市：各自的门槛/速度/含金量，帮用户取舍",
 "factorAdvice":[{"factor":"学历|院校层次|年龄|社保年限|职称 / 技能|身份红利 之一","analysis":"针对该用户的分析","improvementAdvice":"可执行建议"}],
 "strengths":[{"title":"优势点","detail":"为什么是优势、落户里怎么用好"}],
 "weaknesses":[{"title":"短板点","detail":"影响与改法","priority":"高|中|低"}],
 "cityPlans":[{"city":"<精确城市名>","recommendedPath":"推荐落户方式","whyPath":"为什么走这条(结合该城逻辑与用户条件)","thresholds":"门槛对照(如 社保 4/7 年、本科达标等)","processingTime":"预计周期(如 满7年后约3-6个月)","keyRequirements":["关键门槛1","2"],"improvementToQualify":["要达标需做的具体动作1","2"],"timeline":["按阶段的时间线1","2"],"docChecklist":["材料1","2"],"risks":[{"severity":"高|中|低","risk":"string","howToReduce":"string"}]}],
 "familyPlan":"家庭/子女落户与上学时间测算建议",
 "actionPlan":{"next3Months":[{"task":"string","expectedImpact":"string"}],"next6Months":[{"task":"string"}],"next12Months":[{"task":"string"}]},
 "planB":"主线走不通时的备选",
 "friendlySummary":"一句话总结(通俗)"
}
profileScan.highlights 2–4 条、redFlags 1–3 条；strengths 2–4 条；weaknesses 2–4 条；factorAdvice 2–4 条；cityPlans 覆盖上面城市；keyRequirements/timeline/improvementToQualify 各 2–4 条。所有内容落到该用户真实背景,具体不重复。` }];
  let out;
  try { out = await chat(messages, { model: MODEL_PRO }); }
  catch (e) { console.error("[full-report] Pro 失败，改用 Fast：", (e && e.message) || e); out = await chat(messages, { model: MODEL_FAST }); }
  if (!out || typeof out !== "object") throw new Error("BAD_SHAPE");
  return out;
}

async function extractCorrections(payload) {
  const p = payload.profile || {};
  const messages = [{ role: "system", content: RULES }, { role: "user", content:
`用户先填了表单，又回答了追问。请找出追问里**明确更正或新补充**、会影响落户竞争力评估的结构化信息。
规则：只输出确实提到且与原填写不同或更准确的字段；不要臆造。
- education 必须是：["高中及以下","全日制大专","全日制本科","硕士","博士"] 之一。
- social 必须是：["未在目标城市缴纳","1 年以内","1–3 年","3–5 年","5–7 年","7 年以上"] 之一。
- title 必须是：["无","技能等级（中级工+）","初级职称","中级职称","高级职称"] 之一。

原始填写：
${J(p.fields || {})}

追问问题与回答：
${J({ questions: p.followUpQuestions || [], answers: p.followUpAnswers || {} })}

只输出如下 JSON（仅含需更正/补充的字段，可缺省）：
{"corrections":{"education":"","social":"","title":""}}` }];
  const out = await chat(messages, { model: MODEL_FAST });
  if (!out || typeof out !== "object") throw new Error("BAD_SHAPE");
  return (out.corrections && typeof out.corrections === "object") ? { corrections: out.corrections } : { corrections: {} };
}

module.exports = { chat, followUp, freeResult, fullReport, extractCorrections, MODEL_FAST, MODEL_PRO, BASE };
