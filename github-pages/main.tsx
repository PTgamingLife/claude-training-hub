/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CSSProperties } from "react";
import type { Session } from "@supabase/supabase-js";
import { lessonUnits, questions as claudeQuestions } from "../app/course-data";
import { claudeCodeQuestions, claudeCodeUnits } from "../app/claude-code-data";
import { skillCategories, skills } from "./skill-data";
import { oauthRedirectUrl, supabase } from "./supabase";
import "../app/globals.css";
import "./pages.css";

type Progress = {
  course_id: string;
  completed_unit_ids: string[];
  quiz_score: number;
  passed: boolean;
};

type HonorRow = {
  display_name: string;
  avatar_url: string | null;
  completed_courses: number;
};

const emptyProgress = (courseId: string): Progress => ({
  course_id: courseId,
  completed_unit_ids: [],
  quiz_score: 0,
  passed: false,
});

const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

function go(path = "/") {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const update = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

function Login() {
  const [error, setError] = useState("");
  const login = async () => {
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: oauthRedirectUrl },
    });
    if (authError) setError("目前無法開啟 Google 登入，請稍後再試。");
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <div>
          <a className="brand login-brand" href="#/">
            <b>C</b><span>Claude 新同事訓練所</span>
          </a>
          <p className="eyebrow">FREE LEARNING SPACE</p>
          <h1>登入後，開始你的<br /><span>AI 協作課程</span></h1>
          <p>這是一個免費課程網站。使用 Google 登入後，學習進度與測驗成績會安全保存在你的帳號中。</p>
          <button className="primary google-login" onClick={login}>
            <span>G</span> 使用 Google 登入
          </button>
          {error && <small className="auth-error">{error}</small>}
          <small>完成一節才會解鎖下一節；通過兩門課後可進入密技空間。</small>
        </div>
        <div className="login-mascot">
          <img src={asset("/images/hero-premium.webp")} alt="人類與 AI 工作夥伴一起規劃工作" />
        </div>
      </section>
    </main>
  );
}

async function loadProgress() {
  const { data, error } = await supabase
    .from("claude_course_progress")
    .select("course_id,completed_unit_ids,quiz_score,passed");
  if (error) throw error;
  const rows = (data ?? []) as Progress[];
  return {
    first: rows.find((row) => row.course_id === "claude-01") ?? emptyProgress("claude-01"),
    second: rows.find((row) => row.course_id === "claude-code") ?? emptyProgress("claude-code"),
  };
}

function Dashboard({ session }: { session: Session }) {
  const [progress, setProgress] = useState({
    first: emptyProgress("claude-01"),
    second: emptyProgress("claude-code"),
  });
  const [board, setBoard] = useState<HonorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session.user;
  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "學員";

  useEffect(() => {
    let active = true;
    const prepareDashboard = async () => {
      await supabase.from("claude_course_profiles").upsert({
        user_id: user.id,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
      await supabase.rpc("claude_course_claim_legacy_progress");
      return Promise.all([loadProgress(), supabase.rpc("claude_course_honor_roll")]);
    };
    prepareDashboard().then(([p, honor]) => {
      if (!active) return;
      setProgress(p);
      if (!honor.error) setBoard((honor.data ?? []) as HonorRow[]);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [displayName, user.id, user.user_metadata?.avatar_url]);

  const passedCount = Number(progress.first.passed) + Number(progress.second.passed);
  const courses = [
    {id:"claude-01",n:"01",t:"認識 Claude：從新同事到工作夥伴",d:"完整了解 Claude、提示詞、Projects、Artifacts、Skills、研究模式與 AI Fluency。",m:"6 單元 · 35 分鐘 · 8 題測驗",status:"OPEN",construction:false,available:true,p:progress.first},
    {id:"claude-code",n:"02",t:"Claude Code：把 AI 變成行動代理人",d:"從 Agentic Loop、安全權限與黃金工作流，一路學會 Context、CLAUDE.md、Skills、MCP、Hooks 與 Git 協作。",m:"7 單元 · 60–75 分鐘 · 8 題測驗",status:progress.first.passed?"OPEN":"LOCKED",construction:false,available:progress.first.passed,p:progress.second},
    {id:"prompt-practice",n:"03",t:"提示詞實戰：把需求一次說清楚",d:"用角色、任務與規則，把模糊想法變成可驗收的工作指令。",m:"即將完成",status:"即將完成",construction:false,available:false,p:null},
    {id:"projects",n:"04",t:"Projects：建立你的 AI 知識庫",d:"打造不必每次重新交代的專屬工作空間。",m:"施工中",status:"施工中",construction:true,available:false,p:null},
    {id:"artifacts-skills",n:"05",t:"Artifacts 與 Skills：把成果做出來",d:"從內容、網頁原型到可重複使用的自動化流程。",m:"施工中",status:"施工中",construction:true,available:false,p:null},
    {id:"research",n:"06",t:"Research：高品質研究與引用查核",d:"定義範圍、交叉驗證，讀懂引用可信度。",m:"施工中",status:"施工中",construction:true,available:false,p:null},
    {id:"ai-fluency",n:"07",t:"AI Fluency：成為會判斷的協作者",d:"練習委派、描述、辨識與勤勉。",m:"施工中",status:"施工中",construction:true,available:false,p:null},
  ];

  if (loading) return <main className="loading">✦<p>載入學習進度…</p></main>;
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#/"><b>C</b><span>Claude 新同事訓練所</span></a>
        <nav><a href="#catalog">總目錄</a><a href="#record">學習紀錄</a><a href="#honor">榮譽榜</a><a href="#secret">密技空間</a></nav>
        <div className="user"><b>{displayName}</b> · <button onClick={() => supabase.auth.signOut()}>登出</button></div>
      </header>
      <section className="catalog-hero">
        <div>
          <p className="eyebrow">✦ AI 協作學習地圖</p>
          <h1>一步一步，<br />把 AI 變成你的<span>好同事</span></h1>
          <p>這不是工具說明書，而是一條可以完成的免費學習路線。每一節都要完成，才會解鎖下一節；完成整堂課後再挑戰測驗。</p>
          <div className="stats"><span><strong>02</strong>完整階段課程</span><span><strong>13</strong>完整教學單元</span><span><strong>75%</strong>測驗門檻</span></div>
        </div>
        <figure className="hero-visual"><img src={asset("/images/hero-premium.webp")} alt="人類與 AI 工作夥伴共同分析資料" /><figcaption><span>FREE AI COURSE</span><b>開始一段更聰明的協作關係</b></figcaption></figure>
      </section>
      <section className="catalog" id="catalog">
        <div className="section-head"><div><p className="eyebrow">COURSE CATALOG</p><h2>課程總目錄</h2></div><p>第一堂通過後會解鎖 Claude Code。每堂課內必須依序完成所有單元，才能進入測驗。</p></div>
        <div className="course-grid">
          {courses.map((course) => (
            <article className={`${course.available ? "open" : "locked"} ${course.construction ? "under-construction" : ""}`} key={course.n}>
              <div className="card-no">COURSE {course.n}<span>{course.status}</span></div>
              {course.construction && <div className="construction-sticker" aria-label="課程施工中"><span>👷</span><i>🚧</i><b>正在準備更好的內容</b></div>}
              <h3>{course.t}</h3><p>{course.d}</p><p>{course.m}</p>
              {course.available ? (
                <button onClick={() => go(`/courses/${course.id}`)}>
                  {course.id === "claude-01" && course.p?.passed ? "完美通過　按下複習" : course.p?.completed_unit_ids.length ? "繼續上課 →" : `進入第 ${Number(course.n)} 堂課 →`}
                </button>
              ) : <button disabled>{course.construction ? "施工中" : course.id === "prompt-practice" ? "即將完成" : "通過第一堂後解鎖"}</button>}
            </article>
          ))}
        </div>
      </section>
      <section className="record" id="record">
        <div><p className="eyebrow">YOUR LEARNING RECORD</p><h2>你的學習紀錄</h2><p>{progress.second.passed?`第二堂 Claude Code 已通過，最高 ${progress.second.quiz_score}/8 分。`:progress.first.passed?`第一堂已通過；Claude Code 已完成 ${progress.second.completed_unit_ids.length}/7 節。`:`第一堂課已完成 ${progress.first.completed_unit_ids.length}/6 節；完成六節後即可參加測驗。`}</p></div>
        <div><strong>{passedCount}</strong><span>已通過課程</span></div>
      </section>
      <section className="honor" id="honor">
        <div className="section-head"><div><p className="eyebrow">HONOR ROLL</p><h2>學習榮譽榜</h2></div><p>通過測驗後自動登榜，顯示每位學員已通過的課程數。</p></div>
        {board.length ? <div className="honor-list">{board.map((row, i) => <div key={`${row.display_name}-${i}`}><b>{String(i+1).padStart(2,"0")}</b><span>{row.display_name}</span><em>通過 {row.completed_courses} 門課</em></div>)}</div> : <p className="empty-board">第一位通過的學員，會成為榮譽榜開榜者 ✦</p>}
      </section>
      <section className={`secret-entry ${passedCount === 2 ? "unlocked" : "locked-secret"}`} id="secret">
        <div className="secret-mark" aria-hidden="true">{passedCount === 2 ? "✦" : "🔒"}</div>
        <div><p className="eyebrow">BONUS ROOM</p><h2>密技空間</h2><p>{passedCount === 2 ? "你已完成兩門課，完整 Skill Finder 已為你開放。" : "完成第一堂與第二堂課後，解鎖精選 Claude Skills 搜尋器。"}</p></div>
        {passedCount === 2 ? <button onClick={() => go("/secret")}>進入密技空間 →</button> : <button disabled>通過 2 門課後解鎖</button>}
      </section>
      <footer><span>Claude 新同事訓練所</span><span>免費學習 · 完成一小步，勝過收藏十堂課。</span></footer>
    </main>
  );
}

function Celebration({ score, second, onClose }: { score: number; second: boolean; onClose: () => void }) {
  return <div className="celebration" role="dialog" aria-modal="true" aria-label="完成課程">
    <div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{"--i":i} as CSSProperties}/>)}</div>
    <section className={`celebration-card ${second ? "stage-two" : ""}`}>
      <button className="celebration-close" onClick={onClose} aria-label="關閉完成動畫">×</button>
      <div className="celebration-glow" aria-hidden="true"><span>{second ? "⌘" : "★"}</span></div>
      <p>{second ? "ALL COURSES COMPLETE" : "STAGE 01 COMPLETE"}</p>
      <h2>恭喜你!!<br />完成{second ? "第二" : "第一"}階段!!</h2>
      <div className="celebration-score"><strong>{score}/8</strong><span>{second ? "目前所有課程皆已通過" : "第一堂課測驗通過"}</span></div>
      <p className="celebration-copy">{second ? "你已經不只是會問 AI，而是開始學會管理一位 AI 行動代理人。" : "你已完成六個單元，也證明自己掌握了與 Claude 協作的核心方法。"}</p>
      {second && <a className="instagram-follow" href="https://www.instagram.com/ailifeu/" target="_blank" rel="noopener noreferrer"><span>更多 AI 變現方法</span><strong>想要找到更多AI變現的方法<br />歡迎追蹤 <b>@ailifeu</b></strong><i>追蹤 IG →</i></a>}
      <div className="celebration-actions"><button className="primary" onClick={onClose}>查看完成成績</button><button className="text-action" onClick={() => go("/")}>回到課程總目錄 →</button></div>
    </section>
  </div>;
}

function Course({ session, courseId }: { session: Session; courseId: "claude-01" | "claude-code" }) {
  const second = courseId === "claude-code";
  const units = second ? claudeCodeUnits : lessonUnits;
  const questions = second ? claudeCodeQuestions : claudeQuestions;
  const totalUnits = units.length;
  const [progress, setProgress] = useState(emptyProgress(courseId));
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const score = useMemo(() => questions.reduce((sum, q, i) => sum + (answers[i] === q.ok ? 1 : 0), 0), [answers, questions]);
  const unit = units[current];
  const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "學員";

  useEffect(() => {
    loadProgress().then(({ first, second: secondProgress }) => {
      if (courseId === "claude-code" && !first.passed) {
        setLocked(true);
        return;
      }
      const value = courseId === "claude-code" ? secondProgress : first;
      setProgress(value);
      setCurrent(Math.min(value.completed_unit_ids.length, totalUnits - 1));
    }).finally(() => setLoading(false));
  }, [courseId, totalUnits]);

  const save = async (next: Progress) => {
    const completedCount = Math.min(next.completed_unit_ids.length, progress.completed_unit_ids.length + 1, totalUnits);
    const safe: Progress = {
      course_id: courseId,
      completed_unit_ids: units.slice(0, completedCount).map((item) => item.n),
      quiz_score: Math.max(progress.quiz_score, next.quiz_score),
      passed: Boolean(next.passed && completedCount === totalUnits && next.quiz_score >= 6),
    };
    const { error } = await supabase.from("claude_course_progress").upsert({
      user_id: session.user.id,
      ...safe,
      completed_at: safe.passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    if (!error) setProgress(safe);
    return !error;
  };

  const next = async () => {
    if (current < progress.completed_unit_ids.length) {
      setCurrent(Math.min(totalUnits - 1, current + 1));
      window.scrollTo(0, 0);
      return;
    }
    const nextIds = units.slice(0, Math.min(totalUnits, progress.completed_unit_ids.length + 1)).map((item) => item.n);
    if (await save({ ...progress, completed_unit_ids: nextIds })) {
      if (nextIds.length < totalUnits) setCurrent(nextIds.length);
      window.scrollTo(0, 0);
    }
  };

  const submit = async () => {
    setResult(score);
    if (score >= 6) {
      await save({ ...progress, quiz_score: score, passed: true });
      setCelebrate(true);
    }
  };

  if (loading) return <main className="loading">✦<p>載入學習進度…</p></main>;
  if (locked) return <main className="locked-course"><section><span>🔒</span><p>COURSE 02</p><h1>Claude Code 尚未解鎖</h1><p>請先完成第一堂課的六個單元並通過測驗，才能開始第二階段。</p><button className="primary" onClick={() => go("/courses/claude-01")}>回到第一堂課 →</button></section></main>;
  return <main>
    <header className="course-header"><a className="brand" href="#/"><b>C</b><span>Claude 新同事訓練所</span></a><button className="text-action" onClick={() => go("/")}>← 回總目錄</button><span>嗨，{displayName}</span></header>
    <section className={`player-top ${second ? "code-course" : ""}`}><div><p>COURSE {second ? "02 · CLAUDE CODE" : "01"}</p><h1>{second ? "把 AI 從聊天助手變成行動代理人" : "認識 Claude：從新同事到工作夥伴"}</h1></div><div className="progress"><span>{progress.completed_unit_ids.length}/{totalUnits} 單元完成</span><i><b style={{width:`${progress.completed_unit_ids.length/totalUnits*100}%`}}/></i></div></section>
    <div className="player"><aside><p>課程單元</p>{units.map((item, i) => {const unlocked = i <= progress.completed_unit_ids.length; const done = i < progress.completed_unit_ids.length; return <button key={item.n} disabled={!unlocked} className={current===i?"active":done?"done":""} onClick={() => unlocked && setCurrent(i)}><span>{done?"✓":unlocked?item.n:"🔒"}</span><div><small>{item.tag}</small>{item.title}</div></button>})}<div className={progress.completed_unit_ids.length===totalUnits?"quiz-link ready":"quiz-link"}>{progress.completed_unit_ids.length===totalUnits?"🏆":"🔒"} 課後測驗</div></aside>
      <section className="stage"><div className="stage-meta">單元 {unit.n} / {String(totalUnits).padStart(2,"0")}　<span>{unit.tag}</span></div><h2>{unit.title}</h2><p className="intro">{unit.intro}</p>
        <figure><img src={asset(unit.image)} alt={unit.alt} width="1672" height="941" loading={current===0?"eager":"lazy"} /><figcaption>{second?"CLAUDE CODE · ":""}LESSON {unit.n} · {unit.tag}</figcaption></figure>
        <div className="body-copy">{unit.body.map((text)=><p key={text}>{text}</p>)}</div>
        <div className="points">{unit.items.map(([title, description],i)=><article key={title}><b>0{i+1}</b><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
        <div className="practice">✎ <p><b>動手試試看</b><br />{unit.practice}</p></div><div className="tip">💡 <p><b>教練提醒</b><br />{unit.tip}</p></div>
        <div className="next"><div><small>{current<totalUnits-1?"完成後解鎖":"完成後解鎖測驗"}</small><b>{current<totalUnits-1?units[current+1]?.title:`第${second?"二":"一"}堂課課後測驗`}</b></div><button onClick={next}>{current<progress.completed_unit_ids.length?"前往下一節 →":current<totalUnits-1?"完成本節，解鎖下一節 →":"完成最後一節 →"}</button></div>
        {progress.completed_unit_ids.length===totalUnits && <section className="exam"><span>🏆</span><h2>課後測驗已解鎖</h2><p>共 8 題，答對 6 題即通過第{second?"二":"一"}堂課。</p><button className="primary" onClick={() => setQuiz(true)}>{progress.passed?`重新挑戰 · 最高 ${progress.quiz_score}/8`:"開始測驗 →"}</button></section>}
        {quiz && progress.completed_unit_ids.length===totalUnits && <section className="quiz"><h2>選出最好的答案</h2><p>已作答 {Object.keys(answers).length} / 8</p>{questions.map((question,i)=><fieldset key={question.q}><legend><span>{i+1}</span>{question.q}</legend>{question.a.map((answer,j)=><label key={answer}><input type="radio" name={`q${i}`} onChange={() => setAnswers(value=>({...value,[i]:j}))}/>{answer}</label>)}</fieldset>)}<button className="primary" disabled={Object.keys(answers).length<8} onClick={submit}>交卷看成績</button>{result!==null && <div className={score>=6?"result pass":"result fail"}><h2>{score}/8</h2><b>{score>=6?`恭喜你!! 完成第${second?"二":"一"}階段!!`:"再複習一次吧"}</b>{score>=6 && <button className="replay-celebration" onClick={() => setCelebrate(true)}>看看你的成果</button>}</div>}</section>}
      </section>
    </div>
    {celebrate && <Celebration score={score} second={second} onClose={() => setCelebrate(false)} />}
  </main>;
}

function formatStars(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(value);
}

function SecretRoom() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  useEffect(() => {
    loadProgress().then(({ first, second }) => setUnlocked(first.passed && second.passed)).catch(() => setUnlocked(false));
  }, []);
  const filtered = useMemo(() => skills.filter((skill) => {
    const categoryMatch = active.length === 0 || skill.c.some((category) => active.includes(category));
    const haystack = `${skill.n} ${skill.d} ${skill.r} ${skill.c.map((category) => skillCategories[category]).join(" ")}`.toLowerCase();
    return categoryMatch && query.trim().toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
  }), [active, query]);
  if (unlocked === null) return <main className="loading">✦<p>確認密技空間資格…</p></main>;
  if (!unlocked) return <main className="locked-course"><section><span>🔒</span><p>BONUS ROOM</p><h1>密技空間尚未解鎖</h1><p>完整通過第一堂與第二堂課後，這裡會自動開放。</p><button className="primary" onClick={() => go("/")}>回到課程總目錄 →</button></section></main>;
  return <main className="secret-page">
    <header className="course-header"><a className="brand" href="#/"><b>C</b><span>Claude 新同事訓練所</span></a><button className="text-action" onClick={() => go("/")}>← 回總目錄</button><span>密技空間已解鎖</span></header>
    <section className="secret-hero"><div><p className="eyebrow">BONUS ROOM · CURATED SKILL LIBRARY</p><h1>找到適合你的<br /><span>Claude Skill</span></h1><p>精選 {skills.length} 個 Claude Skills，保留完整搜尋、分類與 GitHub 連結，並改造成訓練所一致的米白輕鬆風格。</p></div><div className="secret-mascot" aria-hidden="true"><span>🔎</span><b>SKILL<br />FINDER</b></div></section>
    <section className="skill-tool">
      <div className="skill-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="搜尋 Skill 名稱、介紹、標籤…例如：測試、PDF、MCP" /></div>
      <div className="skill-chips"><button className={active.length===0?"active":""} onClick={() => setActive([])}>全部</button>{Object.entries(skillCategories).map(([key,label])=><button className={active.includes(key)?"active":""} key={key} onClick={() => setActive((current) => current.includes(key)?current.filter((item)=>item!==key):[...current,key])}>{label}</button>)}</div>
      <p>顯示 {filtered.length} / {skills.length} 個 Skills</p>
    </section>
    <section className="skill-grid">{filtered.map((skill, i) => <article className="skill-card" key={skill.u}>
      <div className="skill-index">{String(i+1).padStart(2,"0")}</div>
      <h2>{skill.n}{skill.o && <span>官方</span>}</h2><p>{skill.d}</p>
      <div className="skill-tags">{skill.c.map((category)=><span key={category}>{skillCategories[category]}</span>)}</div>
      <div className="skill-meta"><code>{skill.r}</code><b>★ {formatStars(skill.s)}</b></div>
      <a href={skill.u} target="_blank" rel="noopener noreferrer">前往 GitHub →</a>
    </article>)}</section>
    {filtered.length === 0 && <div className="skill-empty"><span>☁</span><p>找不到符合的 Skill，換個關鍵字或取消篩選試試。</p></div>}
    <footer><span>資料為人工策展，更新於 2026-07。</span><span>安裝社群 Skill 前，請先閱讀原始碼並確認來源可信。</span></footer>
  </main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const route = useHashRoute();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <main className="loading">✦<p>準備課程空間…</p></main>;
  if (!session) return <Login />;
  if (route === "/courses/claude-01") return <Course session={session} courseId="claude-01" />;
  if (route === "/courses/claude-code") return <Course session={session} courseId="claude-code" />;
  if (route === "/secret") return <SecretRoom />;
  return <Dashboard session={session} />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
