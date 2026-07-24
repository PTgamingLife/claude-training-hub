/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSignedInUser } from "./auth-client";
import {
  loadDashboard,
  signInWithGoogle,
  signOut,
  type HonorRow,
} from "./supabase";

const courses = [
  { id: "claude-01", n: "01", t: "認識 Claude：從新同事到工作夥伴", d: "完整了解 Claude、提示詞、Projects、Artifacts、Skills、研究模式與 AI Fluency。", m: "6 單元 · 35 分鐘 · 8 題測驗" },
  { id: "claude-code", n: "02", t: "Claude Code：把 AI 變成行動代理人", d: "從 Agentic Loop、安全權限與黃金工作流，一路學會 Context、CLAUDE.md、Skills、MCP、Hooks 與 Git 協作。", m: "7 單元 · 60–75 分鐘 · 8 題測驗" },
  { id: "prompt-practice", n: "03", t: "提示詞實戰：把需求一次說清楚", d: "用角色、任務與規則，把模糊想法變成可驗收的工作指令。", m: "規劃中" },
  { id: "projects", n: "04", t: "Projects：建立你的 AI 知識庫", d: "打造不必每次重新交代的專屬工作空間。", m: "規劃中" },
  { id: "artifacts-skills", n: "05", t: "Artifacts 與 Skills：把成果做出來", d: "從內容、網頁原型到可重複使用的自動化流程。", m: "規劃中" },
  { id: "research", n: "06", t: "Research：高品質研究與引用查核", d: "定義範圍、交叉驗證，讀懂引用可信度。", m: "規劃中" },
  { id: "ai-fluency", n: "07", t: "AI Fluency：成為會判斷的協作者", d: "練習委派、描述、辨識與勤勉。", m: "規劃中" },
];

type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
const empty = {
  first: { completedUnits: 0, passed: false, bestScore: 0 },
  second: { completedUnits: 0, passed: false, bestScore: 0 },
  board: [] as HonorRow[],
};

export default function Home() {
  const { user, loading: authLoading, displayName } = useSignedInUser();
  const [dashboard, setDashboard] = useState<Dashboard>(empty);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!user) {
      setDashboard(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || (user && loading)) {
    return <main className="loading">✦<p>載入你的學習空間…</p></main>;
  }

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div>
            <Link className="brand login-brand" href="/"><b>C</b><span>Claude 新同事訓練所</span></Link>
            <p className="eyebrow">PRIVATE LEARNING SPACE</p>
            <h1>登入後，開始你的<br /><span>AI 協作課程</span></h1>
            <p>課程與進度只提供給已登入學員。完成一節，才會解鎖下一節。</p>
            <button className="primary google-login" onClick={() => {
              setLoginError("");
              void signInWithGoogle().catch(() => setLoginError("Google 登入尚未完成設定，請稍後再試。"));
            }}>
              <span aria-hidden="true">G</span> 使用 Google 登入
            </button>
            {loginError && <small className="login-error">{loginError}</small>}
            <small>登入後會安全同步你的課程進度、成績與榮譽榜紀錄。</small>
          </div>
          <div className="login-mascot"><img src="/images/hero-premium.webp" alt="人類與 AI 工作夥伴一起分析報告與規劃工作" /></div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/"><b>C</b><span>Claude 新同事訓練所</span></Link>
        <nav><a href="#catalog">總目錄</a><a href="#record">學習紀錄</a><a href="#honor">榮譽榜</a></nav>
        <div className="user"><b>{displayName}</b> · <button onClick={() => void signOut()}>登出</button></div>
      </header>

      <section className="catalog-hero">
        <div>
          <p className="eyebrow">✦ AI 協作學習地圖</p>
          <h1>一步一步，<br />把 AI 變成你的<span>好同事</span></h1>
          <p>這不是工具說明書，而是一條可以完成的學習路線。每一節都要完成，才會解鎖下一節；完成整堂課後再挑戰測驗。</p>
          <div className="stats"><span><strong>02</strong>完整階段課程</span><span><strong>13</strong>完整教學單元</span><span><strong>75%</strong>測驗門檻</span></div>
        </div>
        <figure className="hero-visual"><img src="/images/hero-premium.webp" alt="人類與 AI 工作夥伴在高質感工作空間共同分析資料" /><figcaption><span>COURSE 01</span><b>開始一段更聰明的協作關係</b></figcaption></figure>
      </section>

      <section className="catalog" id="catalog">
        <div className="section-head"><div><p className="eyebrow">COURSE CATALOG</p><h2>課程總目錄</h2></div><p>第一堂通過後會解鎖 Claude Code。每堂課內也必須依序完成所有單元，才能進入測驗。</p></div>
        <div className="course-grid">{courses.map((course) => {
          const available = course.id === "claude-01" || (course.id === "claude-code" && dashboard.first.passed);
          const planned = !["claude-01", "claude-code"].includes(course.id);
          const progress = course.id === "claude-01" ? dashboard.first : dashboard.second;
          return (
            <article className={available ? "open" : "locked"} key={course.n}>
              <div className="card-no">COURSE {course.n}<span>{available ? "OPEN" : planned ? "PLANNED" : "LOCKED"}</span></div>
              <h3>{course.t}</h3><p>{course.d}</p><p>{course.m}</p>
              {available
                ? <Link href={`/courses/${course.id}`}>{progress.passed ? "完美通過　按下複習" : progress.completedUnits ? "繼續上課 →" : `進入第 ${Number(course.n)} 堂課 →`}</Link>
                : <button disabled>{planned ? "尚未開放" : "通過第一堂後解鎖"}</button>}
            </article>
          );
        })}</div>
      </section>

      <section className="record" id="record">
        <div><p className="eyebrow">YOUR LEARNING RECORD</p><h2>你的學習紀錄</h2><p>{dashboard.second.passed ? `第二堂 Claude Code 已通過，最高 ${dashboard.second.bestScore}/8 分。` : dashboard.first.passed ? `第一堂已通過；Claude Code 已完成 ${dashboard.second.completedUnits}/7 節。` : `第一堂課已完成 ${dashboard.first.completedUnits}/6 節；完成六節後即可參加測驗。`}</p></div>
        <div><strong>{Number(dashboard.first.passed) + Number(dashboard.second.passed)}</strong><span>已通過課程</span></div>
      </section>

      <section className="honor" id="honor">
        <div className="section-head"><div><p className="eyebrow">HONOR ROLL</p><h2>學習榮譽榜</h2></div><p>通過測驗後自動登榜，顯示每位學員已通過的課程數。</p></div>
        {dashboard.board.length
          ? <div className="honor-list">{dashboard.board.map((row, index) => <div key={`${row.display_name}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b><span>{row.display_name}</span><em>通過 {row.completed_courses} 門</em></div>)}</div>
          : <p className="empty-board">第一位通過的學員，會成為榮譽榜開榜者 ✦</p>}
      </section>
      <footer><span>Claude 新同事訓練所</span><span>完成一小步，勝過收藏十堂課。</span></footer>
    </main>
  );
}
