import "@/app/globals.css";
import "@/styles/theme.css"; // your file

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg">
          {children}
        </div>
      </div>
  );
}