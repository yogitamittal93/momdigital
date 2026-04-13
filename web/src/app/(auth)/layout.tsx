import "@/app/globals.css";
import "@/styles/theme.css"; // your file

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
         {children}
         </div>
         </div>
         </body>
    </html>
  );
}