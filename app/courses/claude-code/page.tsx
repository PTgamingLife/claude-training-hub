"use client";
import Link from"next/link";
import{useSignedInUser}from"../../auth-client";
import CourseClient from"./course-client";
export default function Page(){const{user,loading,displayName}=useSignedInUser();if(loading)return <main className="loading">✦<p>載入學習進度…</p></main>;if(!user)return <main className="locked-course"><section><span>🔐</span><h1>請先使用 Google 登入</h1><p>登入後才能開始上課，學習進度也會安全同步。</p><Link className="primary" href="/">回到登入頁 →</Link></section></main>;return <CourseClient displayName={displayName}/>}
