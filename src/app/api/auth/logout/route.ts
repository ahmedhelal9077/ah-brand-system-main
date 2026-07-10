import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("bag_session");
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Logging out...</title>
      </head>
      <body>
        <script>
          localStorage.removeItem('bag_session_token');
          window.location.href = '/login';
        </script>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
