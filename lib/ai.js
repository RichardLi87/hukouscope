// OfferScope · DeepSeek AI 服务封装（CommonJS, 零第三方依赖）
// 所有模型名 / baseURL 都从环境变量读取，方便在不改代码的情况下调整。

const BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL_FAST = process.env.DEEPSEEK_MODEL_FAST || "deepseek-v4-flash"; // 免费初测 / 追问
const MODEL_PRO  = process.env.DEEPSEEK_MODEL_PRO  || "deepseek-v4-pro";   // 付费完整报告

const RULES = `你是 OfferScope 录取雷达的 AI 留学申请诊断引擎。严格遵守：
1. 只支持本科 / 硕士申请，只支持美国、英国、加拿大、澳洲、新加坡、中国香港。
2. 评分是"申请竞争力评分"，不是"录取概率"。
3. 禁止输出："保证录取""必录""稳录""100%""录取概率百分比""保录"等任何承诺录取或绝对化的词。
4. 不推销人工咨询、不做中介导流。
5. 语气专业、直接、克制，使用中文。
6. 只输出严格 JSON，不要 Markdown、不要解释性文字。`;

async function chat(messages, { model = MODEL_FAST, json = true, temperature = 0.4 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch(BASE.replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model, messages, temperature,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
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

// ---------- 1) AI 追问 ----------
async function followUp(payload) {
  const p = payload.profile || {};
  const lvl = p.applicationLevel || "本科";
  const focus = lvl === "本科"
    ? "高中成绩、课程体系、SAT/ACT、AP/IB/A-Level、语言、活动主线、奖项、公益、领导力、专业兴趣、ED/EA、文书主题、推荐信"
    : "本科院校、本科专业、GPA、核心课程、语言、GRE/GMAT、专业匹配、实习、科研、项目、工作经历、SOP/CV、推荐信、职业目标";
  const messages = [
    { role: "system", content: RULES },
    { role: "user", content:
`请根据用户已填信息，生成 2–3 个最关键的追问问题（${lvl}申请，重点围绕：${focus}）。
要求：最多 3 个；只问会显著影响判断、且用户尚未回答的问题；每题附一句"为什么问"；问题要短、具体、好回答。

用户信息：
${J(p)}

只输出如下 JSON：
{"questions":[{"question":"string","reason":"string","fieldKey":"string"}]}` },
  ];
  const out = await chat(messages, { model: MODEL_FAST });
  if (!out || !Array.isArray(out.questions)) throw new Error("BAD_SHAPE");
  return { questions: out.questions.slice(0, 3) };
}

// ---------- 2) 免费初测文案（分数与判断由规则引擎给定，模型只润色文案） ----------
async function freeResult(payload) {
  const p = payload.profile || {};
  const messages = [
    { role: "system", content: RULES },
    { role: "user", content:
`这是免费初测。规则引擎已算出综合分 ${payload.overall}/100，等级 ${payload.grade}，各目标学校初步判断如下：
${J(payload.verdicts || [])}

请基于用户信息与上述判断，写出克制、专业的免费初测文案。不要展开完整分析、不要给详细提升方案、不要编造新的分数或学校标签。

用户信息：
${J(p)}

只输出如下 JSON：
{"summary":"一段 2-3 句的初步判断","topRisks":["风险1","风险2","风险3"],"shortAdvice":"一句简短建议"}` },
  ];
  const out = await chat(messages, { model: MODEL_FAST });
  if (!out || typeof out.summary !== "string") throw new Error("BAD_SHAPE");
  return out;
}

// ---------- 3) 完整报告（分数/分层/结构由规则引擎给定；判断与文案尽量交给 AI 个性化生成） ----------
async function fullReport(payload) {
  const r = payload.report || {};
  const p = payload.profile || {};
  const dims = (r.scoreBreakdown || []).map((d) => d.dimension);
  const schools = (r.schools || []).map((s) => s.schoolName);
  const messages = [
    { role: "system", content: RULES },
    { role: "user", content:
`这是一份付费完整诊断报告。分数、五维权重、各校的"冲刺/匹配/保底"标签与整体结构已由规则引擎确定（见"报告上下文"），**请勿修改任何分数或学校标签**。你的任务：基于用户真实信息，为下列每一部分生成**具体、个性化、有依据**的中文判断与建议——要落到这名学生的实际背景上，不要写放之四海皆准的套话，不要承诺录取，不要使用百分比录取概率。

报告上下文（只读，含分数与标签）：
${J(r)}

用户完整背景与追问回答：
${J(p)}

请严格按以下 JSON 输出（dimension 必须用这些精确名称：${JSON.stringify(dims)}；schoolName 必须用这些精确名称：${JSON.stringify(schools)}）：
{
 "executiveSummary":{"oneSentenceConclusion":"string","mainOpportunity":"string","mainRisk":"string","recommendedStrategy":"string"},
 "scoreBreakdown":[{"dimension":"<精确名称>","analysis":"针对该生的具体分析","improvementAdvice":"可执行的提升建议"}],
 "schoolAnalysis":[{"schoolName":"<精确名称>","whyThisVerdict":"为什么是这个判断（结合该生背景与该校特点）","strengths":["该生申请此校的优势1","优势2"],"weaknesses":["申请此校的短板1","短板2"],"applicationAdvice":"针对此校的具体建议"}],
 "strengths":[{"title":"string","detail":"string"}],
 "weaknesses":[{"title":"string","detail":"string","priority":"高|中|低"}],
 "riskAnalysis":[{"risk":"string","severity":"高|中|低","explanation":"string","howToReduce":"string"}],
 "improvementPlan":{"next30Days":[{"task":"string","reason":"string","expectedImpact":"string"}],"next60Days":[{"task":"string","reason":"string","expectedImpact":"string"}],"next90Days":[{"task":"string","reason":"string","expectedImpact":"string"}]},
 "essayStrategy":{"mainNarrative":"string","whyMajor":"string","whySchool":"string"},
 "parentFriendlySummary":{"summary":"string","riskExplanation":"string","budgetAndDecisionAdvice":"string"},
 "recommendationAdvice":"string"
}` },
  ];
  const out = await chat(messages, { model: MODEL_PRO });
  if (!out || typeof out !== "object") throw new Error("BAD_SHAPE");
  return out;
}

module.exports = { chat, followUp, freeResult, fullReport, MODEL_FAST, MODEL_PRO, BASE };
