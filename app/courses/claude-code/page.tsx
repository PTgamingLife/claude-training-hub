import{requireChatGPTUser}from"../../chatgpt-auth";
import CourseClient from"./course-client";
export const dynamic="force-dynamic";
export default async function Page(){const u=await requireChatGPTUser("/courses/claude-code");return <CourseClient displayName={u.displayName}/>}
