import { Chat } from "@/components/chat"

export default function Home() {
    // In a real application, you would check server-side session
    // For this example, we'll redirect to login if no client-side auth is found
    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            if (!localStorage.getItem('isLoggedIn')) {
              window.location.href = '/login';
            }
          `,
                }}
            />
            <main className="flex min-h-screen flex-col">
                <Chat />
            </main>
        </>
    )
}

